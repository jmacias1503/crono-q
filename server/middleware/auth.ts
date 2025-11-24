import { getCookie } from "h3";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  const url = event.node.req?.url || "";

  // Only protect API routes
  if (!url.startsWith('/api')) return;

  // Whitelist exact auth login/signup and public events/public
  if (
    url === '/api/auth/login' ||
    url === '/api/auth/signup' ||
    url.startsWith('/api/events') ||
    url.startsWith('/api/public')
  ) {
    return;
  }

  // Support cookie or Authorization header
  const cookieToken = getCookie(event, 'crono_session') as string | undefined;
  const authHeader = (event.node.req.headers?.authorization || '') as string;
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = cookieToken || bearer;

  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  try {
    const secret = process.env.SESSION_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as Record<string, any>;
    event.context.user = payload;
    return;
  } catch (err) {
    throw createError({ statusCode: 401, message: 'Invalid session' });
  }
});
