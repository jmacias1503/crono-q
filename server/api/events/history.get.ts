import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const events = await prisma.events.findMany({
      orderBy: {
        i_hour: 'desc'
      }
    });

    // Para cada evento, obtener los logs de estudiantes registrados
    const eventsWithLogs = await Promise.all(
      events.map(async (e) => {
        const logs = await prisma.turnLogs.findMany({
          where: { event_id: e.event_id },
          orderBy: { fecha_registro: 'asc' }
        });

        return {
          event_id: e.event_id,
          event_name: e.event_name,
          location: e.location,
          day: e.day,
          i_hour: e.i_hour,
          f_hour: e.f_hour,
          event_code: e.event_code,
          status: e.status,
          total_registrations: logs.length, // Ahora cuenta desde TurnLogs
          students: logs.map(log => ({
            student_id: log.student_id,
            first_name: log.first_name,
            last_name: log.last_name,
            career: log.career,
            semester: log.semester,
            spot_number: null, // TurnLogs no tiene spot_number
            created_at: log.fecha_registro
          }))
        };
      })
    );

    return {
      success: true,
      events: eventsWithLogs
    };
  } catch (error) {
    console.error('Error fetching event history:', error);
    throw createError({
      statusCode: 500,
      message: 'Error al obtener el historial de eventos'
    });
  }
});