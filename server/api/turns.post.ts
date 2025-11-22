import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  console.log('🟢 [TURNS CREATE] Endpoint /api/turns llamado');
  
  const body = (await readBody(event)) as { event_id?: number; event_code?: string } | null;
  console.log('📦 [TURNS CREATE] Body recibido:', JSON.stringify(body, null, 2));

  if (!body || (!body.event_id && !body.event_code)) {
    console.error('❌ [TURNS CREATE] Datos inválidos en body');
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: [
        { path: ['event_id|event_code'], message: 'Se requiere event_id numérico o event_code' },
      ],
    });
  }

  // derive authenticated student from middleware
  const ctxUser = (event.context as any)?.user;
  console.log('👤 [TURNS CREATE] Usuario del contexto:', ctxUser);
  
  if (!ctxUser || !ctxUser.student_id) {
    console.error('❌ [TURNS CREATE] Usuario no autenticado');
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const student_id = Number(ctxUser.student_id);
  console.log('✅ [TURNS CREATE] Student ID autenticado:', student_id);

  // check student exists
  const student = await prisma.students.findUnique({ where: { student_id } });
  if (!student) {
    console.error('❌ [TURNS CREATE] Estudiante no existe en BD:', student_id);
    throw createError({ statusCode: 404, message: 'Estudiante no encontrado' });
  }
  console.log('✅ [TURNS CREATE] Estudiante encontrado:', student.first_name, student.last_name);

  // resolve event by id or code
  let eventRow = null;
  if (typeof body.event_id === 'number') {
    console.log('🔍 [TURNS CREATE] Buscando evento por ID:', body.event_id);
    eventRow = await prisma.events.findUnique({ where: { event_id: body.event_id } });
  } else if (typeof body.event_code === 'string') {
    console.log('🔍 [TURNS CREATE] Buscando evento por código:', body.event_code);
    eventRow = await prisma.events.findFirst({ where: { event_code: body.event_code } });
  }

  if (!eventRow) {
    console.error('❌ [TURNS CREATE] Evento no encontrado');
    throw createError({ statusCode: 404, message: 'Evento no encontrado' });
  }
  console.log('✅ [TURNS CREATE] Evento encontrado:', eventRow.event_name);

  const event_id = eventRow.event_id;

  // Verificar si ya tiene turno
  const existingTurn = await prisma.turns.findFirst({
    where: { event_id, student_id }
  });
  
  if (existingTurn) {
    console.warn('⚠️ [TURNS CREATE] El estudiante ya tiene un turno para este evento');
    throw createError({ statusCode: 409, message: 'El estudiante ya tiene un turno para este evento' });
  }
  console.log('✅ [TURNS CREATE] No hay turno existente, procediendo a crear...');

  // find or create queue for event
  let queue = await prisma.queues.findFirst({ where: { event_id } });
  if (!queue) {
    console.log('🆕 [TURNS CREATE] Creando nueva cola para el evento');
    queue = await prisma.queues.create({ 
      data: { 
        current_spot: 0, 
        estimated_wait: 0, 
        event_id, 
        last_assigned_spot: 0 
      } 
    });
  }
  console.log('📊 [TURNS CREATE] Cola obtenida/creada. ID:', queue.queue_id, 'Último spot:', queue.last_assigned_spot);

  try {
    // Transaction: increment last_assigned_spot and create the turn with the assigned spot_number
    console.log('🚀 [TURNS CREATE] Iniciando transacción...');
    
    const [updatedQueue, createdTurn] = await prisma.$transaction([
      prisma.queues.update({
        where: { queue_id: queue.queue_id },
        data: { last_assigned_spot: { increment: 1 } },
      }),
      prisma.turns.create({
        data: {
          queue_id: queue.queue_id,
          event_id,
          student_id,
        },
      }),
    ]);

    console.log('✅ [TURNS CREATE] Transacción completada. Nuevo spot:', updatedQueue.last_assigned_spot);
    console.log('🎫 [TURNS CREATE] Turno creado con ID:', createdTurn.turn_id);

    const turnWithSpot = await prisma.turns.update({
      where: { turn_id: createdTurn.turn_id },
      data: { spot_number: updatedQueue.last_assigned_spot },
    });

    console.log('✅ [TURNS CREATE] Turno actualizado con spot_number:', turnWithSpot.spot_number);
    console.log('🎉 [TURNS CREATE] Proceso completado exitosamente');

    return { turn: turnWithSpot, student, event: eventRow };
  } catch (e: any) {
    console.error('🔥 [TURNS CREATE] Error en transacción:', e);
    
    if (e?.code === 'P2002') {
      console.error('❌ [TURNS CREATE] Violación de restricción única (P2002)');
      throw createError({ statusCode: 409, message: 'El estudiante ya tiene un turno para este evento' });
    }
    throw e;
  }
});