-- Snowflake Database Schema for Voice-Enabled AI Restaurant Recommendation Agent
-- This schema uses Snowflake Cortex for vector embeddings and similarity search

-- Create database and schema
CREATE DATABASE IF NOT EXISTS KENSHO_AI;
USE DATABASE KENSHO_AI;
CREATE SCHEMA IF NOT EXISTS RAG_SCHEMA;
USE SCHEMA RAG_SCHEMA;

-- Table: restaurants
-- Stores restaurant data from SERP API
CREATE OR REPLACE TABLE restaurants (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID_STRING(),
    name VARCHAR(255) NOT NULL,
    cuisine VARCHAR(100),
    address TEXT,
    rating DECIMAL(3,2),
    menu_summary_text TEXT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Table: users
-- Stores basic user information and preferences
CREATE OR REPLACE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID_STRING(),
    name VARCHAR(255) NOT NULL,
    preferences_text TEXT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Table: agent_context
-- Main table for RAG model - stores all contextual data with vector embeddings
CREATE OR REPLACE TABLE agent_context (
    context_id VARCHAR(36) PRIMARY KEY DEFAULT UUID_STRING(),
    source_type VARCHAR(50) NOT NULL, -- 'restaurant', 'user_pattern', etc.
    source_id VARCHAR(36) NOT NULL, -- FK to the original table
    text_chunk TEXT NOT NULL, -- The text to be embedded
    embedding VECTOR(FLOAT, 768), -- Vector embedding using Cortex
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    -- Index for faster vector similarity searches
    INDEX idx_source_type (source_type),
    INDEX idx_source_id (source_id)
);

-- Create a view for easier querying of restaurant contexts
CREATE OR REPLACE VIEW restaurant_contexts AS
SELECT 
    ac.context_id,
    ac.text_chunk,
    ac.embedding,
    r.name as restaurant_name,
    r.cuisine,
    r.rating
FROM agent_context ac
JOIN restaurants r ON ac.source_id = r.id
WHERE ac.source_type = 'restaurant';

-- Create a view for user pattern contexts
CREATE OR REPLACE VIEW user_pattern_contexts AS
SELECT 
    ac.context_id,
    ac.text_chunk,
    ac.embedding,
    u.name as user_name,
    u.id as user_id
FROM agent_context ac
JOIN users u ON ac.source_id = u.id
WHERE ac.source_type = 'user_pattern';

-- Function to update embeddings (using Snowflake Cortex)
-- This is a placeholder for the actual implementation
CREATE OR REPLACE PROCEDURE update_context_embedding(
    p_context_id VARCHAR,
    p_new_text_chunk TEXT
)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
BEGIN
    UPDATE agent_context
    SET 
        text_chunk = p_new_text_chunk,
        embedding = SNOWFLAKE.CORTEX.EMBED_TEXT('e5-base-v2', p_new_text_chunk),
        updated_at = CURRENT_TIMESTAMP()
    WHERE context_id = p_context_id;
    
    RETURN 'Embedding updated successfully';
END;
$$;

-- Function to insert new context with embedding
CREATE OR REPLACE PROCEDURE insert_context_with_embedding(
    p_source_type VARCHAR,
    p_source_id VARCHAR,
    p_text_chunk TEXT
)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
DECLARE
    v_context_id VARCHAR;
BEGIN
    v_context_id := UUID_STRING();
    
    INSERT INTO agent_context (context_id, source_type, source_id, text_chunk, embedding)
    VALUES (
        v_context_id,
        p_source_type,
        p_source_id,
        p_text_chunk,
        SNOWFLAKE.CORTEX.EMBED_TEXT('e5-base-v2', p_text_chunk)
    );
    
    RETURN v_context_id;
END;
$$;

-- Sample query for vector similarity search
-- This shows how to find the most relevant contexts for a given query
/*
WITH query_embedding AS (
    SELECT SNOWFLAKE.CORTEX.EMBED_TEXT('e5-base-v2', 'Italian restaurants with outdoor seating') as embedding
)
SELECT 
    ac.context_id,
    ac.source_type,
    ac.text_chunk,
    VECTOR_DISTANCE(ac.embedding, qe.embedding, 'COSINE') as similarity_score
FROM agent_context ac, query_embedding qe
ORDER BY similarity_score ASC
LIMIT 5;
*/ 