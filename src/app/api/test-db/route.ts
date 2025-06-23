import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic database connection
    const userCount = await db.user.count();
    console.log('✅ Database connection successful, user count:', userCount);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection working',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 