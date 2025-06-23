'use server';

import { signIn } from '@/auth/auth';
import { db } from '@/lib/db';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { LoginSchema } from '@/schemas';
import { AuthError } from 'next-auth';
import * as z from 'zod';

export const login = async (values: z.infer<typeof LoginSchema>) => {
  console.log('🔐 Login attempt started:', { email: values.email });
  
  try {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
      console.log('❌ Validation failed:', validatedFields.error);
      return { error: 'Invalid fields' };
    }

    const { email, password } = validatedFields.data;
    console.log('✅ Fields validated successfully');

    console.log('🔍 Checking if user exists in database...');
    const existingUser = await db.user.findUnique({ where: { email } });

    if (!existingUser) {
      console.log('❌ User not found in database');
      return { error: 'Email does not exist!' };
    }

    if (!existingUser.email) {
      console.log('❌ User found but no email');
      return { error: 'Email does not exist!' };
    }

    if (!existingUser.password) {
      console.log('❌ User found but no password (OAuth user?)');
      return { error: 'Email does not exist!' };
    }

    console.log('✅ User found:', { 
      id: existingUser.id, 
      email: existingUser.email,
      hasPassword: !!existingUser.password 
    });

    console.log('🔑 Attempting to sign in with NextAuth...');
    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: DEFAULT_LOGIN_REDIRECT,
      });
      console.log('✅ NextAuth signIn completed successfully');
    } catch (error) {
      console.log('❌ NextAuth signIn failed:', error);
      
      if (error instanceof AuthError) {
        console.log('🔍 AuthError details:', {
          type: error.type,
          cause: error.cause,
          message: error.message
        });
        
        switch (error.type) {
          case 'CredentialsSignin':
            console.log('❌ Invalid credentials provided');
            return { error: 'Invalid credentials' };
          default:
            console.log('❌ Unknown auth error:', error.type);
            return { error: 'Something went wrong' };
        }
      }

      console.log('❌ Non-AuthError thrown during signIn:', error);
      throw error;
    }

    console.log('🎉 Login successful!');
    return { success: 'Logged in!' };
  } catch (error) {
    console.error('💥 Unexpected error in login action:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { error: 'Something went wrong during login. Please try again.' };
  }
};
