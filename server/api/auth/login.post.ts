import { loginSchema } from "~/schemas/LoginSchema";
import { authenticateStudent, authenticateAdmin } from "../../utils/auth";
import jwt from 'jsonwebtoken';
import { setCookie } from 'h3';

export default defineEventHandler(async (event) => {
  // 1. Leer y validar el body
  const body = await readBody(event);
  const validationResult = loginSchema.safeParse(body);

  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: "Datos inválidos",
      data: validationResult.error.errors,
    });
  }

  const credentials = validationResult.data;

  // 2. Autenticar según el tipo de usuario
  if (credentials.userType === "student") {
    const auth = await authenticateStudent(credentials);
    // sign session token and set httpOnly cookie
    try {
      const secret = process.env.SESSION_SECRET || 'dev-secret';
      const token = jwt.sign({ userType: 'student', student_id: auth.data.student_id }, secret, { expiresIn: '7d' });
      setCookie(event, 'crono_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch (e) {
      // ignore cookie set errors, still return auth
    }
    return auth;
  } else {
    const auth = await authenticateAdmin(credentials);
    try {
      const secret = process.env.SESSION_SECRET || 'dev-secret';
      const token = jwt.sign({ userType: 'admin', admin_id: auth.data.admin_id }, secret, { expiresIn: '7d' });
      setCookie(event, 'crono_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch (e) {}
    return auth;
  }
});