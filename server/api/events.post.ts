import { eventSchema } from '~/schemas/EventSchema';
import prisma from '../utils/prisma';

function generateCode(len = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // avoid ambiguous chars
  let out = '';
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validation = eventSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos inválidos',
      data: validation.error.errors,
    });
  }

  const { event_name, location, day, i_hour, f_hour } = validation.data;

  // build data object and only include date fields when provided and valid
  const dataToCreate: any = {
    event_name,
    location,
    status: true,
    event_code: generateCode(8),
  };

  if (day) {
    const dayDt = new Date(day);
    if (Number.isFinite(dayDt.getTime())) dataToCreate.day = dayDt;
  }
  if (i_hour) {
    const iDt = new Date(i_hour);
    if (Number.isFinite(iDt.getTime())) dataToCreate.i_hour = iDt;
  }
  if (f_hour) {
    const fDt = new Date(f_hour);
    if (Number.isFinite(fDt.getTime())) dataToCreate.f_hour = fDt;
  }

  const created = await prisma.events.create({ data: dataToCreate });

  return { event: created };
});
