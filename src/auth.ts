import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from './lib/mongodb';
import User from './models/User';
import { authConfig } from './auth.config';

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

        if (!user || !user.isActive) {
          console.log('Login failed: user not found or not active');
          return null;
        }

        const isMatch = await bcrypt.compare(credentials.password as string, user.password);
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
});
