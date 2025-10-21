//Endpoint para obtener todos los eventos de un estudiante
import prisma from "../../utils/prisma";
import { getQuery } from "h3";

export default defineEventHandler(async (event) => {
    const student_id = Number(getQuery(event).student_id);

    if (!student_id) {
        throw createError({
            statusCode: 400,
            message: "student_id es requerido",
        });
    }
    
    const turns = await prisma.turns.findMany({
        where: { student_id },
        include: { event: true }, //Cargamos los datos del evento asociado a cada turno
    });

    if (turns.length === 0) {
        throw createError({
            statusCode: 404,
            message: "No se encontraron turnos para el estudiante",
        });
    }

    return { turns };
})