import prisma from "../utils/prisma";

export default defineEventHandler(async (event) => {
  // return only active events (status = true) that haven't finished yet
  const now = new Date();
  // auto-disable events that have an end time earlier than now
  try {
    await prisma.events.updateMany({
      where: { status: true, f_hour: { lt: now } },
      data: { status: false },
    });
  } catch (e) {
    // non-fatal: log and continue to return events
    // eslint-disable-next-line no-console
    console.warn('Failed to auto-disable expired events:', e);
  }

  const eventsAll = await prisma.events.findMany({
    where: { status: true },
    orderBy: { i_hour: 'asc' },
  });

  // filter out events that already finished (when f_hour exists and is < now)
  const events = eventsAll.filter((e) => {
    if (!e.f_hour) return true;
    return e.f_hour >= now;
  });

  return { events };
});
