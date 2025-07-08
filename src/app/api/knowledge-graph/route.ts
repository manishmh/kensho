import { auth } from '@/auth/auth';
import { knowledgeGraph } from '@/lib/knowledgeGraph';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, data } = await req.json();

    switch (action) {
      case 'initialize':
        await knowledgeGraph.initialize();
        return NextResponse.json({ success: 'Knowledge graph initialized' });

      case 'sync_user':
        await knowledgeGraph.createOrUpdateUser(session.user.email, data);
        return NextResponse.json({ success: 'User data synced to knowledge graph' });

      case 'record_behavior':
        const { type, action: behaviorAction, context, metadata } = data;
        await knowledgeGraph.recordUserBehavior(
          session.user.email,
          type,
          behaviorAction,
          context,
          metadata
        );
        return NextResponse.json({ success: 'Behavior recorded' });

      case 'get_profile':
        const profile = await knowledgeGraph.getUserProfile(session.user.email);
        return NextResponse.json({ profile });

      case 'get_similar_users':
        const { limit = 10 } = data || {};
        const similarUsers = await knowledgeGraph.findSimilarUsers(session.user.email, limit);
        return NextResponse.json({ similarUsers });

      case 'get_context':
        const semanticContext = await knowledgeGraph.getSemanticContext(session.user.email);
        return NextResponse.json({ context: semanticContext });

      case 'add_restaurant':
        await knowledgeGraph.createRestaurantNode(data);
        return NextResponse.json({ success: 'Restaurant added to knowledge graph' });

      case 'cleanup':
        const { daysToKeep = 90 } = data || {};
        await knowledgeGraph.cleanupOldBehaviors(daysToKeep);
        return NextResponse.json({ success: 'Cleanup completed' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Knowledge Graph API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'profile':
        const profile = await knowledgeGraph.getUserProfile(session.user.email);
        return NextResponse.json({ profile });

      case 'context':
        const userContext = await knowledgeGraph.getSemanticContext(session.user.email);
        return NextResponse.json({ context: userContext });

      case 'similar_users':
        const limit = parseInt(searchParams.get('limit') || '10');
        const similarUsers = await knowledgeGraph.findSimilarUsers(session.user.email, limit);
        return NextResponse.json({ similarUsers });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Knowledge Graph API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 