import { db } from '@/lib/db';
import { LoginSchema } from '@/schemas';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await db.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return user;
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await db.user.findUnique({
        where: { id: token.sub },
      });

      if (!existingUser) return token;

      return token;
    },
  },
  events: {
    async signIn(message) {
      console.log('🎉 NextAuth signIn event:', message);
    },
    async signOut(message) {
      console.log('👋 NextAuth signOut event:', message);
    },
    async createUser(message) {
      console.log('👤 NextAuth createUser event:', message);
    },
    async session(message) {
      console.log('📝 NextAuth session event:', message);
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.AUTH_SECRET,
}); 