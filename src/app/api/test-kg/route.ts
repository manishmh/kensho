import { knowledgeGraph } from '@/lib/knowledgeGraph';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Knowledge Graph...');
    
    // Initialize the knowledge graph
    await knowledgeGraph.initialize();
    
    console.log('✅ Knowledge Graph initialized successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Knowledge Graph initialized and ready to use!',
      instructions: [
        '1. Complete user onboarding to create first nodes',
        '2. Check Neo4j Browser at your Aura instance URL',
        '3. Use the API endpoints to manage data',
        '4. View knowledge graph with: MATCH (n) RETURN n LIMIT 25'
      ]
    });
    
  } catch (error) {
    console.error('❌ Knowledge Graph test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize Knowledge Graph',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Check your Neo4j Aura instance is running',
        'Verify NEO4J_* environment variables are correct',
        'Ensure your IP is whitelisted in Neo4j Aura',
        'Check Neo4j Aura console for connection issues'
      ]
    }, { status: 500 });
  }
}

export async function POST() {
  // Same as GET for convenience
  return GET();
} 