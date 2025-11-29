import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { backup = true } = body;

  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);


    // Encontrar eventos antiguos
    const oldEvents = await prisma.events.findMany({
      where: {
        i_hour: {
          lt: oneMonthAgo
        }
      }
    });

    if (oldEvents.length === 0) {
      return {
        success: true,
        message: 'No hay eventos antiguos para eliminar',
        deleted_count: 0,
        backup: null
      };
    }

    let backupData = null;

    if (backup) {
      // Crear backup con los logs históricos
      const eventsWithLogs = await Promise.all(
        oldEvents.map(async (e) => {
          const logs = await prisma.turnLogs.findMany({
            where: { event_id: e.event_id }
          });

          return {
            event_id: e.event_id,
            event_name: e.event_name,
            location: e.location,
            i_hour: e.i_hour,
            f_hour: e.f_hour,
            students: logs.map(log => ({
              student_id: log.student_id,
              first_name: log.first_name,
              last_name: log.last_name,
              career: log.career,
              semester: log.semester
            }))
          };
        })
      );

      backupData = {
        backup_date: new Date().toISOString(),
        events: eventsWithLogs
      };

    }

    // Eliminar en orden correcto para respetar foreign keys
    const eventIds = oldEvents.map(e => e.event_id);

    const turnsDeleted = await prisma.turns.deleteMany({
      where: { event_id: { in: eventIds } }
    });

    const queuesDeleted = await prisma.queues.deleteMany({
      where: { event_id: { in: eventIds } }
    });

    const eventsDeleted = await prisma.events.deleteMany({
      where: {
        event_id: { in: eventIds }
      }
    });

    return {
      success: true,
      message: `Se eliminaron ${eventsDeleted.count} eventos antiguos`,
      deleted_count: eventsDeleted.count,
      backup: backupData
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Error al limpiar eventos antiguos: ' + error.message
    });
  }
});