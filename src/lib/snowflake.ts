import snowflake from 'snowflake-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure Snowflake connection
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT!,
  username: process.env.SNOWFLAKE_USERNAME!,
  password: process.env.SNOWFLAKE_PASSWORD!,
  database: process.env.SNOWFLAKE_DATABASE || 'KENSHO_AI',
  schema: process.env.SNOWFLAKE_SCHEMA || 'RAG_SCHEMA',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  role: process.env.SNOWFLAKE_ROLE
});

// Promise wrapper for connection
const connectToSnowflake = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err);
        reject(err);
      } else {
        console.log('Successfully connected to Snowflake');
        resolve();
      }
    });
  });
};

// Promise wrapper for executing queries
const executeQuery = <T = any>(sqlText: string, binds?: any[]): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to execute query:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      }
    });
  });
};

// Initialize connection
let isConnected = false;
const ensureConnection = async () => {
  if (!isConnected) {
    await connectToSnowflake();
    isConnected = true;
  }
};

export interface ContextChunk {
  context_id: string;
  source_type: string;
  source_id: string;
  text_chunk: string;
  similarity_score?: number;
}

/**
 * Get relevant context chunks based on a query vector
 * @param userQuery The user's text query
 * @param userId Optional user ID to filter results
 * @param limit Number of results to return (default: 5)
 */
export async function getRelevantContext(
  userQuery: string,
  userId?: string,
  limit: number = 5
): Promise<ContextChunk[]> {
  await ensureConnection();
  
  // Build the query with optional user filtering
  let sqlText = `
    WITH query_embedding AS (
      SELECT SNOWFLAKE.CORTEX.EMBED_TEXT('e5-base-v2', ?) as embedding
    )
    SELECT 
      ac.context_id,
      ac.source_type,
      ac.source_id,
      ac.text_chunk,
      VECTOR_DISTANCE(ac.embedding, qe.embedding, 'COSINE') as similarity_score
    FROM agent_context ac, query_embedding qe
  `;
  
  const binds: any[] = [userQuery];
  
  // Add user filtering if userId is provided
  if (userId) {
    sqlText += `
      WHERE ac.source_type = 'user_pattern' AND ac.source_id = ?
      OR ac.source_type != 'user_pattern'
    `;
    binds.push(userId);
  }
  
  sqlText += `
    ORDER BY similarity_score ASC
    LIMIT ?
  `;
  binds.push(limit);
  
  const results = await executeQuery<ContextChunk>(sqlText, binds);
  return results;
}

/**
 * Update the embedding for an existing context
 * @param contextId The ID of the context to update
 * @param newText The new text chunk
 */
export async function updateContextEmbedding(
  contextId: string,
  newText: string
): Promise<void> {
  await ensureConnection();
  
  const sqlText = `
    UPDATE agent_context
    SET 
      text_chunk = ?,
      embedding = SNOWFLAKE.CORTEX.EMBED_TEXT('e5-base-v2', ?),
      updated_at = CURRENT_TIMESTAMP()
    WHERE context_id = ?
  `;
  
  await executeQuery(sqlText, [newText, newText, contextId]);
}

/**
 * Insert a new context with embedding
 * @param sourceType The type of source (e.g., 'restaurant', 'user_pattern')
 * @param sourceId The ID of the source record
 * @param textChunk The text to embed
 * @returns The ID of the created context
 */
export async function insertContextWithEmbedding(
  sourceType: string,
  sourceId: string,
  textChunk: string
): Promise<string> {
  await ensureConnection();
  
  const contextId = uuidv4();
  const sqlText = `
    INSERT INTO agent_context (context_id, source_type, source_id, text_chunk, embedding)
    VALUES (?, ?, ?, ?, SNOWFLAKE.CORTEX.EMBED_TEXT('e5-base-v2', ?))
  `;
  
  await executeQuery(sqlText, [contextId, sourceType, sourceId, textChunk, textChunk]);
  return contextId;
}

/**
 * Delete a context entry
 * @param contextId The ID of the context to delete
 */
export async function deleteContext(contextId: string): Promise<void> {
  await ensureConnection();
  
  const sqlText = 'DELETE FROM agent_context WHERE context_id = ?';
  await executeQuery(sqlText, [contextId]);
}

/**
 * Get all contexts for a specific source
 * @param sourceType The type of source
 * @param sourceId The ID of the source
 */
export async function getContextsBySource(
  sourceType: string,
  sourceId: string
): Promise<ContextChunk[]> {
  await ensureConnection();
  
  const sqlText = `
    SELECT context_id, source_type, source_id, text_chunk
    FROM agent_context
    WHERE source_type = ? AND source_id = ?
    ORDER BY created_at DESC
  `;
  
  const results = await executeQuery<ContextChunk>(sqlText, [sourceType, sourceId]);
  return results;
}

/**
 * Batch insert multiple contexts with embeddings
 * @param contexts Array of contexts to insert
 */
export async function batchInsertContexts(
  contexts: Array<{
    sourceType: string;
    sourceId: string;
    textChunk: string;
  }>
): Promise<string[]> {
  await ensureConnection();
  
  const contextIds: string[] = [];
  
  // Note: In a production environment, you might want to use Snowflake's COPY command
  // or batch insert for better performance
  for (const context of contexts) {
    const contextId = await insertContextWithEmbedding(
      context.sourceType,
      context.sourceId,
      context.textChunk
    );
    contextIds.push(contextId);
  }
  
  return contextIds;
}

// Export the connection for direct use if needed
export { connection, ensureConnection };
