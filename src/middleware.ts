import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const isAuthPage = nextUrl.pathname.startsWith('/login');
  
  if (isAuthPage) {
    if (isAuthenticated) {
      if (req.auth?.user?.role === 'admin') {
        return Response.redirect(new URL('/admin/dashboard', nextUrl));
      }
      return Response.redirect(new URL('/employee/dashboard', nextUrl));
    }
    return null;
  }

  if (!isAuthenticated) {
    return Response.redirect(new URL('/login', nextUrl));
  }

  // Role based protection
  if (nextUrl.pathname.startsWith('/admin') && req.auth?.user?.role !== 'admin') {
    return Response.redirect(new URL('/employee/dashboard', nextUrl));
  }

  if (nextUrl.pathname.startsWith('/employee') && req.auth?.user?.role !== 'employee') {
    return Response.redirect(new URL('/admin/dashboard', nextUrl));
  }

  return null;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)'],
};
