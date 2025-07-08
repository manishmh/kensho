# Real-Time Voice-Enabled AI Restaurant Recommendation System

This document describes the implementation of a RAG (Retrieval-Augmented Generation) powered AI restaurant recommendation agent using Snowflake as a vector database, Neo4j for knowledge graphs, and a placeholder LLM service.

## Architecture Overview

### Core Components

1. **Vector Database (Snowflake)**
   - Stores restaurant data and user context as vector embeddings
   - Uses Snowflake Cortex for embedding generation and similarity search
   - Optimized for fast retrieval with the `VECTOR_DISTANCE` function

2. **Knowledge Graph (Neo4j)**
   - Maintains user preferences, behaviors, and relationships
   - Generates natural language summaries of user patterns
   - Tracks dining history and preferences over time

3. **LLM Service (Placeholder)**
   - Currently returns mock responses based on query patterns
   - Ready for integration with Grok, Llama, or other LLMs
   - Includes structured data extraction capabilities

4. **Voice Interface**
   - Frontend simulation of voice recording
   - Text-to-speech for assistant responses
   - Ready for real speech-to-text integration

## Database Schema

### Snowflake Tables

```sql
-- Main context storage for RAG
agent_context (
    context_id VARCHAR(36) PRIMARY KEY,
    source_type VARCHAR(50),  -- 'restaurant', 'user_pattern'
    source_id VARCHAR(36),    -- FK to source table
    text_chunk TEXT,          -- Text for embedding
    embedding VECTOR(FLOAT, 768)  -- Vector embedding
)

-- Restaurant information
restaurants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    cuisine VARCHAR(100),
    address TEXT,
    rating DECIMAL(3,2),
    menu_summary_text TEXT
)

-- User profiles
users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    preferences_text TEXT
)
```

### Neo4j Graph Structure

- **Nodes**: User, Preference, Behavior, Restaurant, DietType, Location
- **Relationships**: HAS_PREFERENCE, PERFORMED, FOLLOWS_DIET, LIVES_IN
- **Indexes**: Text search, range queries, and geospatial lookups

## API Endpoints

### 1. Chat Endpoint - `/api/chat`
**Method**: POST  
**Purpose**: Main conversational interface for the AI agent

**Request Body**:
```json
{
  "userId": "string (optional)",
  "userQuery": "string",
  "sessionId": "string (optional)"
}
```

**Response**:
```json
{
  "response": "AI-generated response",
  "sessionId": "session_id",
  "contextUsed": 5,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Process Flow**:
1. Authenticate user
2. Retrieve user pattern summary from Neo4j
3. Perform vector similarity search in Snowflake
4. Build comprehensive prompt with context
5. Generate response using LLM
6. Log interaction for learning

### 2. Update Context Endpoint - `/api/update-context`
**Method**: POST  
**Purpose**: Update or create vector embeddings for context

**Request Body**:
```json
{
  "source_type": "restaurant|user_pattern",
  "source_id": "uuid",
  "new_text_chunk": "string",
  "context_id": "uuid (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "action": "created|updated",
  "context_id": "uuid",
  "message": "string"
}
```

## Frontend Components

### ChatInterface Component
- Real-time chat UI with message history
- Voice recording simulation
- Text-to-speech for responses
- Keyboard shortcuts (Ctrl+Enter to send)
- Loading states and error handling

### Chat Page Features
- Personalized recommendations display
- Example questions for guidance
- Feature highlights
- Responsive design

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```env
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your-account-identifier
SNOWFLAKE_USERNAME=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_DATABASE=KENSHO_AI
SNOWFLAKE_SCHEMA=RAG_SCHEMA
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_ROLE=ACCOUNTADMIN

# LLM Configuration
LLM_MODEL=grok-beta
LLM_API_KEY=your-api-key
```

### 2. Database Setup

#### Snowflake:
1. Create a Snowflake account
2. Run the SQL schema in `prisma/snowflake-schema.sql`
3. Enable Cortex functions for your account

#### Neo4j:
1. Use existing Neo4j Aura instance
2. Knowledge graph schema is auto-created on first run

### 3. Install Dependencies
```bash
npm install snowflake-sdk
```

### 4. Initialize Services
The system will automatically:
- Create Neo4j constraints and indexes
- Connect to Snowflake on first API call
- Initialize user profiles from onboarding data

## Usage Examples

### Creating Restaurant Context
```javascript
// Add restaurant to vector database
await insertContextWithEmbedding(
  'restaurant',
  'rest_123',
  'Bella Vista is an Italian restaurant featuring authentic pasta, wood-fired pizza, and outdoor seating. Located downtown with a 4.5 star rating.'
);
```

### Updating User Patterns
```javascript
// Update user preference context
await fetch('/api/update-context', {
  method: 'POST',
  body: JSON.stringify({
    source_type: 'user_pattern',
    source_id: 'user_123',
    new_text_chunk: 'User prefers Italian cuisine, often orders on weekends, enjoys outdoor dining'
  })
});
```

### Chat Interaction
```javascript
// Send chat message
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    userQuery: 'Find me a good Italian restaurant with outdoor seating',
    sessionId: 'session_123'
  })
});
```

## Performance Optimizations

1. **Vector Search**
   - Uses cosine similarity for relevance
   - Limits results to top 5 matches
   - Indexes on source_type and source_id

2. **Neo4j Queries**
   - Comprehensive indexes for fast lookups
   - Time-based filtering for recent behaviors
   - Efficient pattern aggregation

3. **Caching Strategy**
   - Connection pooling for both databases
   - Reusable database connections
   - Minimal query overhead

## Future Enhancements

1. **Real LLM Integration**
   - Replace placeholder with actual LLM API
   - Add streaming responses
   - Implement conversation memory

2. **Voice Features**
   - Integrate real speech-to-text
   - Add voice selection for TTS
   - Support multiple languages

3. **Advanced RAG**
   - Implement hybrid search (vector + keyword)
   - Add re-ranking algorithms
   - Include temporal context

4. **Background Processing**
   - Automated context updates
   - Batch embedding generation
   - Pattern analysis jobs

## Troubleshooting

### Common Issues

1. **Snowflake Connection Failed**
   - Verify account identifier format
   - Check warehouse is running
   - Ensure Cortex is enabled

2. **Vector Search Returns No Results**
   - Verify embeddings are created
   - Check text chunk quality
   - Adjust similarity threshold

3. **Neo4j Pattern Summary Empty**
   - Ensure user has completed onboarding
   - Check Neo4j connection
   - Verify user behaviors are logged

### Debug Mode
Enable detailed logging:
```javascript
// In your API routes
console.log('📨 Processing chat request for user:', user.email);
console.log('✅ Retrieved user pattern summary');
console.log(`✅ Retrieved ${relevantContexts.length} relevant context chunks`);
```

## Security Considerations

1. **Authentication Required**
   - All endpoints require user session
   - User isolation for queries
   - Rate limiting recommended

2. **Input Validation**
   - Query length limits (1000 chars)
   - Text chunk size limits (5000 chars)
   - SQL injection prevention

3. **Data Privacy**
   - User contexts isolated by ID
   - No cross-user data leakage
   - Secure credential storage

## Testing

### Manual Testing
1. Login to the application
2. Navigate to `/chat`
3. Try example queries
4. Verify responses are contextual

### API Testing
```bash
# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userQuery": "Italian restaurants", "userId": "test"}'

# Test context update
curl -X POST http://localhost:3000/api/update-context \
  -H "Content-Type: application/json" \
  -d '{"source_type": "restaurant", "source_id": "123", "new_text_chunk": "Test restaurant"}'
```

## Monitoring

Key metrics to track:
- Response time for vector searches
- LLM response latency
- Context retrieval accuracy
- User interaction patterns
- Error rates by endpoint

## Support

For issues or questions:
1. Check error logs in console
2. Verify environment variables
3. Test database connections
4. Review API response errors 