import jwt from "jsonwebtoken";
import { getCookie } from "h3";
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const cookieToken = getCookie(event, 'crono_session') as string | undefined;
  const authHeader = (event.node.req.headers?.authorization || '') as string;
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = cookieToken || bearer;

  if (!token) throw createError({ statusCode: 401, message: 'Unauthorized' });

  try {
    const secret = process.env.SESSION_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as Record<string, any>;

    if (payload.userType === 'student' && payload.student_id) {
      const student = await prisma.students.findUnique({ where: { student_id: Number(payload.student_id) }, select: { student_id: true, first_name: true, last_name: true, career: true, semester: true } });
      if (!student) throw createError({ statusCode: 404, message: 'User not found' });
      return { success: true, data: { userType: 'student', ...student } };
    }

    if (payload.userType === 'admin' && payload.admin_id) {
      const admin = await prisma.admins.findUnique({ where: { admin_id: Number(payload.admin_id) }, select: { admin_id: true } });
      if (!admin) throw createError({ statusCode: 404, message: 'User not found' });
      return { success: true, data: { userType: 'admin', ...admin } };
    }

    throw createError({ statusCode: 400, message: 'Invalid token payload' });
  } catch (err) {
    throw createError({ statusCode: 401, message: 'Invalid session' });
  }
});
