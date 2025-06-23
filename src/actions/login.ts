'use server';

import { signIn } from '@/auth/auth';
import { db } from '@/lib/db';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { LoginSchema } from '@/schemas';
import { AuthError } from 'next-auth';
import * as z from 'zod';

export const login = async (values: z.infer<typeof LoginSchema>) => {
  try {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: 'Invalid fields' };
    }

    const { email, password } = validatedFields.data;

    const existingUser = await db.user.findUnique({ where: { email } });

    if (!existingUser || !existingUser.email || !existingUser.password) {
      return { error: 'Email does not exist!' };
    }

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
            return { error: 'Invalid credentials!' };
          default:
            return { error: 'Something went wrong!' };
        }
      }
      throw error;
    }

    return { success: 'Login successful!' };
  } catch {
    return { error: 'Something went wrong during login. Please try again.' };
  }
};
