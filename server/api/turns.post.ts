import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { event_id?: number; event_code?: string } | null;

  if (!body || (!body.event_id && !body.event_code)) {
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
  if (!ctxUser || !ctxUser.student_id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const student_id = Number(ctxUser.student_id);

  // check student exists
  const student = await prisma.students.findUnique({ where: { student_id } });
  if (!student) throw createError({ statusCode: 404, message: 'Estudiante no encontrado' });

  // resolve event by id or code
  let eventRow = null;
  if (typeof body.event_id === 'number') {
    eventRow = await prisma.events.findUnique({ where: { event_id: body.event_id } });
  } else if (typeof body.event_code === 'string') {
    eventRow = await prisma.events.findFirst({ where: { event_code: body.event_code } });
  }

  if (!eventRow) throw createError({ statusCode: 404, message: 'Evento no encontrado' });

  const event_id = eventRow.event_id;

  // find or create queue for event
  let queue = await prisma.queues.findFirst({ where: { event_id } });
  if (!queue) {
    queue = await prisma.queues.create({ data: { current_spot: 0, estimated_wait: 0, event_id, last_assigned_spot: 0 } });
  }

  try {
    // Transaction: increment last_assigned_spot and create the turn with the assigned spot_number
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

    const turnWithSpot = await prisma.turns.update({
      where: { turn_id: createdTurn.turn_id },
      data: { spot_number: updatedQueue.last_assigned_spot },
    });

    return { turn: turnWithSpot, student, event: eventRow };
  } catch (e: any) {
    if (e?.code === 'P2002') {
      throw createError({ statusCode: 409, message: 'El estudiante ya tiene un turno para este evento' });
    }
    throw e;
  }
});
