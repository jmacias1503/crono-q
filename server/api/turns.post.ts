import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { student_id?: number; event_id?: number; event_code?: string } | null;

  if (!body || typeof body.student_id !== 'number' || (!body.event_id && !body.event_code)) {
    // return structured validation-like error in `data` for frontend compatibility
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: [
        { path: ['student_id'], message: 'student_id es requerido y debe ser un número' },
        { path: ['event_id|event_code'], message: 'Se requiere event_id numérico o event_code' },
      ],
    });
  }

  const { student_id } = body;

  // check student exists
  const student = await prisma.students.findUnique({ where: { student_id } });
  if (!student) throw createError({ statusCode: 404, message: 'Estudiante no encontrado' });

  // resolve event by id or code
  let eventRow = null;
  if (typeof body.event_id === 'number') {
    eventRow = await prisma.events.findUnique({ where: { event_id: body.event_id } });
  } else if (typeof body.event_code === 'string') {
    // use findFirst here because event_code was recently added and may not yet be reflected as a Unique in generated client types
    eventRow = await prisma.events.findFirst({ where: { event_code: body.event_code } });
  }

  if (!eventRow) throw createError({ statusCode: 404, message: 'Evento no encontrado' });

  const event_id = eventRow.event_id;

  // find or create queue for event
  let queue = await prisma.queues.findFirst({ where: { event_id } });
  if (!queue) {
    // With autoincrement queue_id we can create without specifying the id
    queue = await prisma.queues.create({ data: { current_spot: 0, estimated_wait: 0, event_id } });
  }

  // prevent duplicate turn for same student+event
  const existing = await prisma.turns.findFirst({ where: { event_id, student_id } });
  if (existing) throw createError({ statusCode: 409, message: 'El estudiante ya tiene un turno para este evento' });

  const created = await prisma.turns.create({ data: { queue_id: queue.queue_id, event_id, student_id } });

  return { turn: created, student };
});
