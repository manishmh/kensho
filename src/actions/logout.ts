'use server';

import { signOut } from '@/auth/auth';
 
export const logout = async () => {
  try {
    await signOut({ redirectTo: '/' });
  } catch (error) {
    // Handle redirect errors (these are expected in NextAuth v5)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    throw error;
  }
}; 