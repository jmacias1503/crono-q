import { eventSchema } from '~/schemas/EventSchema';
import prisma from '../utils/prisma';

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

  const created = await prisma.events.create({
    data: {
      event_name,
      location,
      day: new Date(day),
      i_hour: new Date(i_hour),
      f_hour: new Date(f_hour),
      status: true,
    },
  });

  return { event: created };
});
