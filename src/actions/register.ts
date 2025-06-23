'use server';

import { signIn } from '@/auth/auth';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
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

    // Create user in database
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
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Try to sign in the user automatically
    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: DEFAULT_LOGIN_REDIRECT,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return { error: 'Registration successful but failed to log in. Please try logging in manually.' };
          default:
            return { error: 'Registration successful but something went wrong during login. Please try logging in manually.' };
        }
      }
      throw error;
    }

    return { success: 'Account created and logged in successfully!' };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong during registration. Please try again.' };
  }
}; 