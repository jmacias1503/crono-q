import prisma from '../../utils/prisma';
import { getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const paramsId = event.context?.params?.id;
  const query = getQuery(event) as Record<string, any>;
  const idRaw = paramsId ?? query.id;
  if (!idRaw) throw createError({ statusCode: 400, message: 'event id is required' });
  const id = parseInt(String(idRaw), 10);
  if (Number.isNaN(id)) throw createError({ statusCode: 400, message: 'invalid event id' });

  const ev = await prisma.events.findUnique({ where: { event_id: id } });
  if (!ev) throw createError({ statusCode: 404, message: 'Evento no encontrado' });

  return { event: ev };
});
