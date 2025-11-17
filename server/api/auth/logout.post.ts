import { setCookie } from 'h3';

export default defineEventHandler(async (event) => {
  // clear cookie
  setCookie(event, 'crono_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return { success: true };
});
