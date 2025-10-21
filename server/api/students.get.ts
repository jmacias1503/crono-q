import prisma from "../utils/prisma";

// Obtener todos los estudiantes
export default defineEventHandler (async (event) => {
    return {
        students: await prisma.students.findMany()
    }
})