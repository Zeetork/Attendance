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

  // Multi-Company Validation
  const activeCompanyId = req.cookies.get('activeCompanyId')?.value;
  const user = req.auth?.user;
  
  if (user && activeCompanyId) {
    const hasAccess = user.role === 'super_admin' || user.role === 'admin' || (user.companyIds && user.companyIds.includes(activeCompanyId)) || user.companyId === activeCompanyId;
    if (!hasAccess && !nextUrl.pathname.startsWith('/unauthorized')) {
      return Response.redirect(new URL('/unauthorized', nextUrl));
    }
  }

  // Role based protection
  const isAdmin = req.auth?.user?.role === 'admin' || req.auth?.user?.role === 'super_admin';
  if (nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    return Response.redirect(new URL('/employee/dashboard', nextUrl));
  }

  if (nextUrl.pathname.startsWith('/employee') && isAdmin) {
    return Response.redirect(new URL('/admin/dashboard', nextUrl));
  }

  return null;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)'],
};
