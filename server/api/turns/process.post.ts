import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  console.log('🔵 [PROCESS] Endpoint /api/turns/process llamado');
  
  const body = await readBody(event);
  console.log('📦 [PROCESS] Body recibido:', JSON.stringify(body, null, 2));
  
  const { student_id, event_id } = body;

  if (!student_id || !event_id) {
    console.error('❌ [PROCESS] Faltan datos:', { student_id, event_id });
    throw createError({ statusCode: 400, message: 'Faltan datos (student_id o event_id)' });
  }

  console.log('🔍 [PROCESS] Buscando turno para:', { 
    student_id: Number(student_id), 
    event_id: Number(event_id) 
  });

  // Buscar TODOS los turnos del estudiante para debug
  const allTurnsForStudent = await prisma.turns.findMany({
    where: { student_id: Number(student_id) },
    include: { event: true }
  });
  console.log(`📊 [PROCESS] Turnos que tiene este estudiante (${student_id}):`, 
    JSON.stringify(allTurnsForStudent, null, 2)
  );

  const turnToDelete = await prisma.turns.findFirst({
    where: {
      student_id: Number(student_id),
      event_id: Number(event_id),
    },
  });

  console.log('📋 [PROCESS] Turno encontrado para eliminar:', JSON.stringify(turnToDelete, null, 2));

  if (!turnToDelete) {
    console.warn('⚠️ [PROCESS] No se encontró turno');
    throw createError({ 
      statusCode: 404, 
      message: `Este estudiante (ID: ${student_id}) no está en la fila del evento (ID: ${event_id})` 
    });
  }

  if (turnToDelete.queue_id === null || turnToDelete.spot_number === null) {
    console.error('❌ [PROCESS] Datos nulos en turno:', { 
      queue_id: turnToDelete.queue_id, 
      spot_number: turnToDelete.spot_number 
    });
    throw createError({ 
      statusCode: 500, 
      message: 'Error de integridad: El turno encontrado no tiene cola o posición válida.' 
    });
  }

  console.log('🚀 [PROCESS] Iniciando transacción para eliminar turno y reordenar...');

  try {
    await prisma.$transaction([
      prisma.turns.delete({
        where: { turn_id: turnToDelete.turn_id },
      }),

      prisma.turns.updateMany({
        where: {
          queue_id: turnToDelete.queue_id,
          spot_number: { gt: turnToDelete.spot_number },
        },
        data: {
          spot_number: { decrement: 1 },
        },
      }),

      prisma.queues.update({
        where: { queue_id: turnToDelete.queue_id },
        data: {
          last_assigned_spot: { decrement: 1 },
        },
      }),
    ]);

    console.log('✅ [PROCESS] Transacción completada exitosamente');

    return { 
      success: true, 
      message: `Turno ${turnToDelete.spot_number} procesado y fila reordenada.` 
    };

  } catch (error: any) {
    console.error('🔥 [PROCESS] Error en transacción:', error);
    throw createError({ 
      statusCode: 500, 
      message: 'Error interno al reordenar la fila.' 
    });
  }
});