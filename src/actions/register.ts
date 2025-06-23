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
  // Server-side logging
  console.log('📝 Registration attempt started:', { email: values.email, name: values.name });
  
  // Also log to help with debugging
  console.log('🔍 Environment check:', {
    hasDatabase: !!process.env.DATABASE_URL,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    nodeEnv: process.env.NODE_ENV
  });
  
  try {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
      console.log('❌ Registration validation failed:', validatedFields.error);
      return { 
        error: 'Invalid fields', 
        debug: 'Validation failed',
        details: validatedFields.error.issues 
      };
    }

    const { email, password, name } = validatedFields.data;
    console.log('✅ Registration fields validated successfully');

    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔍 Checking if user already exists...');
    
    // Test database connection
    try {
      const existingUser = await db.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        console.log('❌ User already exists with this email');
        return { 
          error: 'Email already in use',
          debug: 'User exists'
        };
      }
      console.log('✅ User does not exist, proceeding with creation');
    } catch (dbError) {
      console.error('❌ Database connection failed during user lookup:', dbError);
      return { 
        error: 'Database connection failed', 
        debug: 'DB lookup failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      };
    }

    console.log('👤 Creating new user in database...');
    // Create user in database
    let newUser;
    try {
      newUser = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });
      console.log('✅ User created successfully:', { id: newUser.id, email: newUser.email });
    } catch (createError) {
      console.error('❌ Failed to create user:', createError);
      return { 
        error: 'Failed to create user account', 
        debug: 'User creation failed',
        details: createError instanceof Error ? createError.message : 'Unknown create error'
      };
    }

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

    // Try to sign in the user automatically (without redirect)
    console.log('🔑 Attempting automatic sign-in after registration...');
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false, // Don't redirect automatically
      });
      console.log('✅ Automatic sign-in successful');
      
      // Return success with redirect flag for client-side handling
      return { 
        success: 'Account created and logged in successfully!',
        shouldRedirect: true,
        redirectTo: '/dashboard'
      };
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
            return { 
              success: 'Account created successfully but failed to log in automatically. Please try logging in manually.',
              shouldRedirect: true,
              redirectTo: '/login',
              debug: 'Auto-login credentials failed'
            };
          default:
            console.log('❌ Unknown auth error during auto-login:', error.type);
            return { 
              success: 'Account created successfully but something went wrong during automatic login. Please try logging in manually.',
              shouldRedirect: true,
              redirectTo: '/login',
              debug: `Auto-login auth error: ${error.type}`
            };
        }
      }
      
      // If it's a non-AuthError, it might be the redirect error we're trying to avoid
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        console.log('✅ Redirect error caught - this means login was successful but redirect was handled');
        return { 
          success: 'Account created and logged in successfully!',
          shouldRedirect: true,
          redirectTo: '/dashboard'
        };
      }
      
      console.log('❌ Unexpected error during auto sign-in:', error);
      return { 
        success: 'Account created successfully but automatic login failed. Please try logging in manually.',
        shouldRedirect: true,
        redirectTo: '/login',
        debug: 'Unexpected auto-login error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

  } catch (error) {
    console.error('💥 Unexpected error in registration:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return { 
      error: 'Something went wrong during registration. Please try again.',
      debug: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error type'
    };
  }
}; 