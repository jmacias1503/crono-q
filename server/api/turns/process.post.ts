import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  
  const body = await readBody(event);
  
  const { student_id, event_id } = body;

  if (!student_id || !event_id) {
    throw createError({ statusCode: 400, message: 'Faltan datos (student_id o event_id)' });
  }

  // Buscar TODOS los turnos del estudiante para debug
  const allTurnsForStudent = await prisma.turns.findMany({
    where: { student_id: Number(student_id) },
    include: { event: true }
  });

  const turnToDelete = await prisma.turns.findFirst({
    where: {
      student_id: Number(student_id),
      event_id: Number(event_id),
    },
  });


  if (!turnToDelete) {
    throw createError({ 
      statusCode: 404, 
      message: `Este estudiante (ID: ${student_id}) no está en la fila del evento (ID: ${event_id})` 
    });
  }

  if (turnToDelete.queue_id === null || turnToDelete.spot_number === null) {
    throw createError({ 
      statusCode: 500, 
      message: 'Error de integridad: El turno encontrado no tiene cola o posición válida.' 
    });
  }

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

    return { 
      success: true, 
      message: `Turno ${turnToDelete.spot_number} procesado y fila reordenada.` 
    };

  } catch (error: any) {
    throw createError({ 
      statusCode: 500, 
      message: 'Error interno al reordenar la fila.' 
    });
  }
});