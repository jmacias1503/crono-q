import { eventSchema } from '~/schemas/EventSchema';
import prisma from '../../utils/prisma';
import { getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const paramsId = event.context?.params?.id;
  const query = getQuery(event) as Record<string, any>;
  const idRaw = paramsId ?? query.id;
  if (!idRaw) throw createError({ statusCode: 400, message: 'event id is required' });
  const id = parseInt(String(idRaw), 10);
  if (Number.isNaN(id)) throw createError({ statusCode: 400, message: 'invalid event id' });

  const body = await readBody(event);
  const validation = eventSchema.safeParse(body);
  if (!validation.success) {
    throw createError({ statusCode: 400, message: 'Datos inválidos', data: validation.error.errors });
  }

  const { event_name, location, day, i_hour, f_hour } = validation.data;

  // validate dates
  const dayDt = new Date(day);
  const iDt = new Date(i_hour);
  const fDt = new Date(f_hour);
  const invalids: any[] = [];
  if (!Number.isFinite(dayDt.getTime())) invalids.push({ path: ['day'], message: 'Fecha inválida' });
  if (!Number.isFinite(iDt.getTime())) invalids.push({ path: ['i_hour'], message: 'Hora de inicio inválida' });
  if (!Number.isFinite(fDt.getTime())) invalids.push({ path: ['f_hour'], message: 'Hora de fin inválida' });
  if (invalids.length) throw createError({ statusCode: 400, message: 'Fechas inválidas', data: invalids });

  const updated = await prisma.events.update({
    where: { event_id: id },
    data: {
      event_name,
      location,
      day: dayDt,
      i_hour: iDt,
      f_hour: fDt,
    },
  });

  return { event: updated };
});
