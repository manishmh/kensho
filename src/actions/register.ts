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
  console.log('📝 Registration attempt started:', { email: values.email, name: values.name });
  
  try {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
      console.log('❌ Registration validation failed:', validatedFields.error);
      return { error: 'Invalid fields' };
    }

    const { email, password, name } = validatedFields.data;
    console.log('✅ Registration fields validated successfully');

    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔍 Checking if user already exists...');
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.log('❌ User already exists with this email');
      return { error: 'Email already in use' };
    }

    console.log('👤 Creating new user in database...');
    // Create user in database
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    console.log('✅ User created successfully:', { id: newUser.id, email: newUser.email });

    // Send verification email (don't fail if this errors)
    console.log('📧 Attempting to send verification email...');
    try {
      const verificationToken = await generateVerificationToken(email);
      await sendVerificationEmail(verificationToken.email, verificationToken.token);
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Try to sign in the user automatically
    console.log('🔑 Attempting automatic sign-in after registration...');
    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: DEFAULT_LOGIN_REDIRECT,
      });
      console.log('✅ Automatic sign-in successful');
    } catch (error) {
      console.log('❌ Automatic sign-in failed:', error);
      
      if (error instanceof AuthError) {
        console.log('🔍 AuthError during auto sign-in:', {
          type: error.type,
          cause: error.cause,
          message: error.message
        });
        
        switch (error.type) {
          case 'CredentialsSignin':
            console.log('❌ Credentials signin failed during auto-login');
            return { error: 'Registration successful but failed to log in. Please try logging in manually.' };
          default:
            console.log('❌ Unknown auth error during auto-login:', error.type);
            return { error: 'Registration successful but something went wrong during login. Please try logging in manually.' };
        }
      }
      console.log('❌ Non-AuthError during auto sign-in:', error);
      throw error;
    }

    console.log('🎉 Registration and auto-login completed successfully!');
    return { success: 'Account created and logged in successfully!' };
  } catch (error) {
    console.error('💥 Unexpected error in registration:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { error: 'Something went wrong during registration. Please try again.' };
  }
}; 