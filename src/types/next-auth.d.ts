import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      companyId?: string;
      companyIds?: string[];
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
    companyId?: string;
    companyIds?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    id?: string;
    companyId?: string;
    companyIds?: string[];
  }
}
