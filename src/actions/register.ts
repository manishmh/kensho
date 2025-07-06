'use server';

import { signIn } from '@/auth/auth';
import { db } from '@/lib/db';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { RegisterSchema } from '@/schemas';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import * as z from 'zod';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  console.log('🔄 Registration started for:', values.email);
  
  try {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
      console.log('❌ Validation failed:', validatedFields.error);
      return { error: 'Invalid fields' };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔍 Checking for existing user...');
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.log('❌ User already exists');
      return { error: 'Email already in use' };
    }

    console.log('👤 Creating new user...');
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    console.log('✅ User created successfully, attempting auto-login...');

    // Try to sign in the user automatically
    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: DEFAULT_LOGIN_REDIRECT || '/onboarding',
      });
      console.log('✅ Auto-login successful');
    } catch (error) {
      console.log('⚠️ Auto-login error:', error);
      
      if (error instanceof AuthError) {
        console.log('🔐 AuthError type:', error.type);
        switch (error.type) {
          case 'CredentialsSignin':
            return { 
              success: 'Account created successfully but failed to log in automatically. Please try logging in manually.',
              shouldRedirect: true,
              redirectTo: '/login'
            };
          default:
            return { 
              success: 'Account created successfully but something went wrong during automatic login. Please try logging in manually.',
              shouldRedirect: true,
              redirectTo: '/login'
            };
        }
      }
      
      // Handle redirect errors (these are expected in NextAuth v5)
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        console.log('🔄 NEXT_REDIRECT detected - this is expected for successful redirect');
        throw error;
      }
      
      console.log('❌ Unexpected auto-login error:', error);
      return { 
        success: 'Account created successfully but automatic login failed. Please try logging in manually.',
        shouldRedirect: true,
        redirectTo: '/login'
      };
    }

  } catch (error) {
    console.log('🚨 Outer catch block error:', error);
    
    // Allow NEXT_REDIRECT errors to propagate (these are expected for successful redirects)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      console.log('🔄 Propagating NEXT_REDIRECT error');
      throw error;
    }
    
    console.log('❌ Registration failed with error:', error);
    return { 
      error: 'Something went wrong during registration. Please try again.'
    };
  }
}; 