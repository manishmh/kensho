import { auth } from '@/auth/auth';
import { db } from '@/lib/db';
import { KnowledgeGraphService } from '@/lib/knowledgeGraph';
import { buildPromptWithContext, generateResponse, validateContent } from '@/lib/llm';
import { getRelevantContext } from '@/lib/snowflake';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ChatRequest {
  userId?: string;
  userQuery: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to identify the user
    const session = await auth();
    
    // Parse request body
    const body: ChatRequest = await request.json();
    const { userQuery, sessionId } = body;
    
    // Validate the query
    if (!validateContent(userQuery)) {
      return NextResponse.json(
        { error: 'Invalid query. Please provide a valid question.' },
        { status: 400 }
      );
    }
    
    // Get user ID from session or request
    const userId = session?.user?.id || body.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }
    
    // Get user email for knowledge graph lookup
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`📨 Processing chat request for user: ${user.email}`);
    
    // Step 1: Get user pattern summary from Neo4j
    const kgService = new KnowledgeGraphService();
    let userPatternSummary = '';
    
    try {
      userPatternSummary = await kgService.getUserPatternSummary(user.email);
      console.log('✅ Retrieved user pattern summary');
    } catch (error) {
      console.error('⚠️ Failed to get user pattern summary:', error);
      // Continue without user patterns if Neo4j fails
    }
    
    // Step 2: Perform vector similarity search in Snowflake
    let relevantContexts: string[] = [];
    
    try {
      const contextChunks = await getRelevantContext(userQuery, userId, 5);
      relevantContexts = contextChunks.map(chunk => chunk.text_chunk);
      console.log(`✅ Retrieved ${relevantContexts.length} relevant context chunks`);
    } catch (error) {
      console.error('⚠️ Failed to get relevant context from Snowflake:', error);
      // Continue without context if Snowflake fails
    }
    
    // Step 3: Build comprehensive prompt with all context
    const prompt = buildPromptWithContext(
      userQuery,
      relevantContexts,
      userPatternSummary
    );
    
    // Step 4: Generate response using LLM
    const llmResponse = await generateResponse(prompt);
    
    // Step 5: Log the interaction for future learning
    try {
      await kgService.recordUserBehavior(
        user.email,
        'interaction',
        'chat_query',
        userQuery,
        {
          sessionId,
          responseLength: llmResponse.length,
          contextUsed: relevantContexts.length
        }
      );
    } catch (error) {
      console.error('⚠️ Failed to record user behavior:', error);
      // Non-critical error, continue
    }
    
    // Return the response
    return NextResponse.json({
      response: llmResponse,
      sessionId: sessionId || `session_${Date.now()}`,
      contextUsed: relevantContexts.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 