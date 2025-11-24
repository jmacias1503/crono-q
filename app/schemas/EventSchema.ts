import { z } from "zod";

export const eventSchema = z.object({
  event_name: z
    .string()
    .min(1, { message: "El nombre del evento es requerido" })
    .max(100, { message: "El nombre del evento debe tener máximo 100 caracteres" }),
  location: z
    .string()
    .min(1, { message: "La ubicación es requerida" })
    .max(50, { message: "La ubicación debe tener máximo 50 caracteres" }),
  // Make date/time optional — events can be created without specifying them
  day: z.string().optional(),
  i_hour: z.string().optional(),
  f_hour: z.string().optional(),
});

export type EventForm = z.infer<typeof eventSchema>;