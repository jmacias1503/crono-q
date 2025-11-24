import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const user = (event.context as any)?.user;
  if (!user) throw createError({ statusCode: 401, message: "No autenticado" });

  const params = (event.context as any)?.params || {};

  // Extraer id correctamente (param name = "id"). Añadir fallback por si viene con otro nombre o desde la URL.
  const rawId =
    params.id ??
    params.turnId ??
    params.turn_id ??
    (() => {
      try {
        const url = (event.node?.req?.url as string) || '';
        const m = url.match(/\/api\/turns\/(\d+)(?:\/|$)/);
        return m ? m[1] : undefined;
      } catch {
        return undefined;
      }
    })();

  const turnId = Number(rawId);
  if (!turnId || Number.isNaN(turnId)) throw createError({ statusCode: 400, message: "turnId inválido" });

  const turn = await prisma.turns.findUnique({ where: { turn_id: turnId } });
  if (!turn) throw createError({ statusCode: 404, message: "Turno no encontrado" });

  const isOwner = user.userType === "student" && turn.student_id === user.student_id;
  const isAdmin = user.userType === "admin";
  if (!isOwner && !isAdmin) throw createError({ statusCode: 403, message: "No autorizado para cancelar este turno" });

  const spot = turn.spot_number;
  const queueId = turn.queue_id;

  try {
    if (typeof spot === "number" && queueId) {
      // Transaction: delete the turn, decrement subsequent spot_numbers,
      // and update Queues.last_assigned_spot to the current max (or 0).
      await prisma.$transaction(async (tx) => {
        // delete the turn
        await tx.turns.delete({ where: { turn_id: turnId } });

        // decrement spot_number for turns behind the removed one
        await tx.turns.updateMany({
          where: { queue_id: queueId, spot_number: { gt: spot } },
          data: { spot_number: { decrement: 1 } },
        });

        // recalculate max spot_number remaining in the queue and update queue metadata
        const agg = await tx.turns.aggregate({
          where: { queue_id: queueId },
          _max: { spot_number: true },
        });
        const newLast = agg._max?.spot_number ?? 0;
        await tx.queues.update({ where: { queue_id: queueId }, data: { last_assigned_spot: newLast } });
      });
      return { success: true, message: "Turno cancelado" };
    } else {
      // Fallback: simple delete
      await prisma.turns.delete({ where: { turn_id: turnId } });
      return { success: true, message: "Turno cancelado" };
    }
  } catch (err: any) {
    // Handle concurrency / not found during delete
    if (err?.code === "P2025") {
      throw createError({ statusCode: 404, message: "Turno no encontrado (concurrency)" });
    }
    throw createError({ statusCode: 500, message: "Error al cancelar turno" });
  }
});