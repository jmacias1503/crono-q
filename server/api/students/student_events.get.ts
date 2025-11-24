//Endpoint para obtener todos los eventos de un estudiante
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    // Prefer authenticated user from middleware
    const ctxUser = (event.context as any)?.user;
    let student_id: number | undefined;

    if (ctxUser && ctxUser.student_id) {
        student_id = Number(ctxUser.student_id);
    }

    // If not authenticated, return 401
    if (!student_id) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const turns = await prisma.turns.findMany({
        where: { student_id },
        include: { event: true },
    });

    // Return empty array when no turns found instead of 404 to avoid breaking SSR/page rendering
    return { turns: turns ?? [] };
});