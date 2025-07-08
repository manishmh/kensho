import { auth } from '@/auth/auth';
import { getContextsBySource, insertContextWithEmbedding, updateContextEmbedding } from '@/lib/snowflake';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface UpdateContextRequest {
  source_type: string;
  source_id: string;
  new_text_chunk: string;
  context_id?: string; // Optional - if provided, update existing context
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication - this endpoint should be protected
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body: UpdateContextRequest = await request.json();
    const { source_type, source_id, new_text_chunk, context_id } = body;
    
    // Validate required fields
    if (!source_type || !source_id || !new_text_chunk) {
      return NextResponse.json(
        { error: 'Missing required fields: source_type, source_id, and new_text_chunk are required' },
        { status: 400 }
      );
    }
    
    // Validate text chunk length
    if (new_text_chunk.length > 5000) {
      return NextResponse.json(
        { error: 'Text chunk exceeds maximum length of 5000 characters' },
        { status: 400 }
      );
    }
    
    console.log(`📝 Updating context for ${source_type}:${source_id}`);
    
    try {
      if (context_id) {
        // Update existing context
        await updateContextEmbedding(context_id, new_text_chunk);
        
        return NextResponse.json({
          success: true,
          action: 'updated',
          context_id,
          message: 'Context embedding updated successfully'
        });
      } else {
        // Check if context already exists for this source
        const existingContexts = await getContextsBySource(source_type, source_id);
        
        if (existingContexts.length > 0) {
          // Update the first existing context
          const existingContext = existingContexts[0];
          await updateContextEmbedding(existingContext.context_id, new_text_chunk);
          
          return NextResponse.json({
            success: true,
            action: 'updated',
            context_id: existingContext.context_id,
            message: 'Existing context embedding updated successfully'
          });
        } else {
          // Create new context
          const newContextId = await insertContextWithEmbedding(
            source_type,
            source_id,
            new_text_chunk
          );
          
          return NextResponse.json({
            success: true,
            action: 'created',
            context_id: newContextId,
            message: 'New context embedding created successfully'
          });
        }
      }
    } catch (error) {
      console.error('❌ Snowflake operation failed:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update context embedding',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error in update-context endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process update context request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve contexts for a specific source
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const source_type = searchParams.get('source_type');
    const source_id = searchParams.get('source_id');
    
    if (!source_type || !source_id) {
      return NextResponse.json(
        { error: 'Missing required query parameters: source_type and source_id' },
        { status: 400 }
      );
    }
    
    // Retrieve contexts
    const contexts = await getContextsBySource(source_type, source_id);
    
    return NextResponse.json({
      success: true,
      source_type,
      source_id,
      contexts,
      count: contexts.length
    });
    
  } catch (error) {
    console.error('❌ Error in get contexts endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve contexts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 