import PDFDocument from "pdfkit";
import { getRouterParam } from "h3";
import prisma from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, "id");
    const eventId = Number(idParam);
    if (!eventId || isNaN(eventId)) {
      throw createError({ statusCode: 400, message: "ID inválido" });
    }

    const logs = await prisma.turnLogs.findMany({
      where: { event_id: eventId },
      orderBy: { fecha_registro: "asc" },
    });

    const eventInfo = await prisma.events.findUnique({
      where: { event_id: eventId },
      select: { event_name: true, location: true, i_hour: true },
    });

    if (!eventInfo) {
      throw createError({ statusCode: 404, message: "Evento no encontrado" });
    }

    const filename = `${eventInfo.event_name.replace(/[^a-z0-9]/gi, "_")}_registros.pdf`;
    const res = event.node.res;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.statusCode = 200;

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(`Evento: ${eventInfo.event_name}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Ubicación: ${eventInfo.location}`, { align: "center" });
    doc.moveDown(1);

    // headers
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Expediente", 50, doc.y, { width: 80 });
    doc.text("Nombre", 140, doc.y, { width: 120 });
    doc.text("Apellido", 260, doc.y, { width: 120 });
    doc.text("Carrera", 380, doc.y, { width: 120 });
    doc.text("Semestre", 500, doc.y, { width: 60 });
    doc.moveDown(0.5);
    doc.font("Helvetica");

    let y = doc.y;
    for (const r of logs) {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      doc.fontSize(10);
      doc.text(String(r.student_id), 50, y, { width: 80 });
      doc.text(r.first_name, 140, y, { width: 120 });
      doc.text(r.last_name, 260, y, { width: 120 });
      doc.text(r.career, 380, y, { width: 120 });
      doc.text(String(r.semester), 500, y, { width: 60 });
      y += 18;
    }

    doc.end();

    // Esperar a que la respuesta se envíe
    await new Promise<void>((resolve, reject) => {
      res.on("finish", () => resolve());
      res.on("close", () => resolve());
      doc.on("error", (err) => reject(err));
    });

    return;
  } catch (err: any) {
    console.error("[export-pdf] error:", err);
    throw err;
  }
});