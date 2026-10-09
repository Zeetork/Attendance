import NextAuth, { CredentialsSignin } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from './lib/mongodb';
import User from './models/User';
import { authConfig } from './auth.config';

class InactiveAccountError extends CredentialsSignin {
  code = 'inactive_account';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await User.findOne({ email: credentials.email }, null, { bypassTenant: true }).select('+password');
        console.log('User found:', !!user, 'isActive:', user?.isActive);

        if (!user) {
          return null;
        }

        if (user.isActive === false) {
          console.log('Login failed: user account is deactivated');
          throw new InactiveAccountError();
        }

        const isMatch = await bcrypt.compare(credentials?.password as string, user.password as string);
        console.log('Password match:', isMatch);

        if (!isMatch) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId ? user.companyId.toString() : undefined,
          companyIds: user.companyIds ? user.companyIds.map((id: any) => id.toString()) : [],
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.companyId = user.companyId;
        token.companyIds = user.companyIds;
      }

      // Live verification: If employee has been marked inactive, invalidate token
      if (token?.id) {
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id, null, { bypassTenant: true }).select('isActive role');
          if (!dbUser || dbUser.isActive === false) {
            console.log(`[Auth] Deactivated user session detected for ${token.id}. Invalidating token.`);
            return null;
          }
        } catch (err) {
          console.error('[Auth] Error checking user active status in jwt callback:', err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token) {
        return null as any;
      }
      if (token) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.companyId = token.companyId as string | undefined;
        session.user.companyIds = (token.companyIds as string[]) || [];
      }
      return session;
    },
  },
});

