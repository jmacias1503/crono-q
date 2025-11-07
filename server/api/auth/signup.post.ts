import { registrationSchema } from "~/schemas/RegistrationSchema";
import { registerStudent } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validationResult = registrationSchema.safeParse(body);

  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: "Datos inválidos",
      data: validationResult.error.errors,
    });
  }

  return await registerStudent(validationResult.data);
});