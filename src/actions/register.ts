'use server';

import { signIn } from '@/auth/auth';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { RegisterSchema } from '@/schemas';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import * as z from 'zod';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  try {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: 'Invalid fields' };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return { error: 'Email already in use' };
    }

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Send verification email (don't fail if this errors)
    try {
      const verificationToken = await generateVerificationToken(email);
      await sendVerificationEmail(verificationToken.email, verificationToken.token);
    } catch {
      // Continue with registration even if email fails
    }

    // Try to sign in the user automatically
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      return { 
        success: 'Account created and logged in successfully!',
        shouldRedirect: true,
        redirectTo: '/dashboard'
      };
    } catch (error) {
      if (error instanceof AuthError) {
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
      
      // If it's a non-AuthError, it might be the redirect error we're trying to avoid
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        return { 
          success: 'Account created and logged in successfully!',
          shouldRedirect: true,
          redirectTo: '/dashboard'
        };
      }
      
      return { 
        success: 'Account created successfully but automatic login failed. Please try logging in manually.',
        shouldRedirect: true,
        redirectTo: '/login'
      };
    }

  } catch {
    return { 
      error: 'Something went wrong during registration. Please try again.'
    };
  }
}; 