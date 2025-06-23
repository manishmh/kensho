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
        console.log('🔐 NextAuth Credentials authorize called with:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        });

        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          console.log('❌ NextAuth validation failed:', validatedFields.error);
          return null;
        }

        console.log('✅ NextAuth fields validated');

        const { email, password } = validatedFields.data;

        console.log('🔍 NextAuth fetching user from database...');
        const user = await db.user.findUnique({ where: { email } });
        
        if (!user) {
          console.log('❌ NextAuth: User not found in database');
          return null;
        }

        if (!user.password) {
          console.log('❌ NextAuth: User found but no password');
          return null;
        }

        console.log('✅ NextAuth: User found, comparing passwords...');
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          console.log('❌ NextAuth: Password comparison failed');
          return null;
        }

        console.log('✅ NextAuth: Password match successful, returning user');
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔄 NextAuth JWT callback:', { 
        hasToken: !!token, 
        hasUser: !!user,
        userId: user?.id 
      });
      
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔄 NextAuth Session callback:', { 
        hasSession: !!session, 
        hasToken: !!token,
        tokenId: token?.id 
      });
      
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
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