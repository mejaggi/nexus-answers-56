# Migration Guide: AWS Lambda to Lovable Cloud Edge Functions

This guide provides step-by-step instructions for migrating from an AWS Lambda-based chatbot architecture to Lovable Cloud with direct LLM integration.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Frontend Migration](#phase-1-frontend-migration)
3. [Phase 2: Edge Function Setup](#phase-2-edge-function-setup)
4. [Phase 3: Database Migration](#phase-3-database-migration)
5. [Phase 4: Vector Database Migration](#phase-4-vector-database-migration)
6. [Phase 5: Document Storage Migration](#phase-5-document-storage-migration)
7. [Phase 6: LLM Integration](#phase-6-llm-integration)
8. [Phase 7: Authentication Setup](#phase-7-authentication-setup)
9. [Testing & Validation](#testing--validation)
10. [Rollback Plan](#rollback-plan)

---

## Architecture Overview

### Current Architecture (AWS)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CloudFront │───▶│ API Gateway │───▶│   Lambda    │───▶│   Bedrock   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                            │
                   ┌────────────────────────┼────────────────────────┐
                   ▼                        ▼                        ▼
            ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
            │  pgVector   │          │     S3      │          │  DynamoDB   │
            │  (Aurora)   │          │  (Documents)│          │  (Sessions) │
            └─────────────┘          └─────────────┘          └─────────────┘
```

### Target Architecture (Lovable Cloud)

```
┌─────────────┐    ┌─────────────────────────────────────────────────────┐
│   React     │    │              Lovable Cloud (Supabase)               │
│   Frontend  │───▶│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
└─────────────┘    │  │Edge Functions│  │  PostgreSQL │  │   Storage   │  │
                   │  │  (Deno)     │  │  + pgvector │  │   Buckets   │  │
                   │  └──────┬──────┘  └─────────────┘  └─────────────┘  │
                   └─────────┼───────────────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │   Lovable AI    │
                   │ (Gemini/OpenAI) │
                   └─────────────────┘
```

---

## Phase 1: Frontend Migration

### Step 1.1: Update API Client Configuration

**Before (AWS):**
```typescript
// src/api/client.ts
const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL;

export const chatApi = {
  sendMessage: async (message: string, conversationId: string) => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAwsCognitoToken()}`,
      },
      body: JSON.stringify({ message, conversationId }),
    });
    return response.json();
  },
};
```

**After (Lovable Cloud):**
```typescript
// src/api/client.ts
import { supabase } from '@/integrations/supabase/client';

export const chatApi = {
  sendMessage: async (
    message: string, 
    conversationId: string,
    onDelta: (text: string) => void
  ) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message, conversationId }),
      }
    );

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {}
        }
      }
    }
  },
};
```

### Step 1.2: Update Authentication Imports

**Before (Cognito):**
```typescript
// src/hooks/useAuth.ts
import { Auth } from 'aws-amplify';

export const useAuth = () => {
  const signIn = async (email: string, password: string) => {
    return await Auth.signIn(email, password);
  };
  
  const signOut = async () => {
    return await Auth.signOut();
  };
  
  const getCurrentUser = async () => {
    return await Auth.currentAuthenticatedUser();
  };
  
  return { signIn, signOut, getCurrentUser };
};
```

**After (Supabase Auth):**
```typescript
// src/hooks/useAuth.ts
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };
  
  return { signIn, signOut, getCurrentUser };
};
```

---

## Phase 2: Edge Function Setup

### Step 2.1: Create Main Chat Edge Function

Create the file `supabase/functions/chat/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, department } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    // Build messages array
    const systemPrompt = getSystemPrompt(department);
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: message,
    });

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    // Stream the response back
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getSystemPrompt(department?: string): string {
  const basePrompt = `You are a helpful AI assistant. Be concise and accurate.`;
  
  const departmentPrompts: Record<string, string> = {
    hr: 'You specialize in HR policies, benefits, and employee relations.',
    it: 'You specialize in IT support, troubleshooting, and technical guidance.',
    finance: 'You specialize in financial policies, expense reports, and budgeting.',
    legal: 'You specialize in legal compliance and company policies.',
  };
  
  return departmentPrompts[department || ''] 
    ? `${basePrompt} ${departmentPrompts[department!]}`
    : basePrompt;
}
```

### Step 2.2: Create RAG Edge Function (Vector Search)

Create `supabase/functions/rag-search/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, department, limit = 5 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // Search for similar documents using pgvector
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      filter_department: department || null,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ documents }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RAG search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  // Using Lovable AI for embeddings (or switch to OpenAI embeddings API)
  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}
```

### Step 2.3: Update config.toml

```toml
# supabase/config.toml
project_id = "your-project-id"

[functions.chat]
verify_jwt = true

[functions.rag-search]
verify_jwt = true

[functions.index-document]
verify_jwt = true
```

---

## Phase 3: Database Migration

### Step 3.1: Create Database Schema

Run these SQL migrations in Lovable Cloud:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (managed by Supabase Auth, but we can extend it)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT,
  role TEXT DEFAULT 'user',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  department TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  model TEXT,
  feedback TEXT CHECK (feedback IN ('like', 'dislike')),
  feedback_comment TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message sources (for RAG citations)
CREATE TABLE IF NOT EXISTS message_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  document_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_snippet TEXT,
  relevance_score FLOAT,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table (for RAG)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  department TEXT,
  document_type TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Step 3.2: Create Vector Search Function

```sql
-- Function for semantic search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  department TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.department,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE 
    (filter_department IS NULL OR d.department = filter_department)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Step 3.3: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- User profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Conversations: users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages: users can only access messages in their conversations
CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );

-- Documents: all authenticated users can read
CREATE POLICY "Authenticated users can view documents" ON documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- Analytics: users can only insert their own events
CREATE POLICY "Users can insert own analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Phase 4: Vector Database Migration

### Step 4.1: Export Data from Aurora pgVector

```python
# scripts/export_vectors.py
import psycopg2
import json
import os

# Connect to Aurora
conn = psycopg2.connect(
    host=os.environ['AURORA_HOST'],
    database=os.environ['AURORA_DB'],
    user=os.environ['AURORA_USER'],
    password=os.environ['AURORA_PASSWORD']
)

cursor = conn.cursor()

# Export documents with embeddings
cursor.execute("""
    SELECT id, title, content, department, embedding, metadata
    FROM documents
""")

documents = []
for row in cursor.fetchall():
    documents.append({
        'id': str(row[0]),
        'title': row[1],
        'content': row[2],
        'department': row[3],
        'embedding': list(row[4]),  # Convert vector to list
        'metadata': row[5]
    })

with open('documents_export.json', 'w') as f:
    json.dump(documents, f)

print(f"Exported {len(documents)} documents")
conn.close()
```

### Step 4.2: Import Data to Lovable Cloud

```typescript
// scripts/import_vectors.ts
import { createClient } from '@supabase/supabase-js';
import documentsData from './documents_export.json';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importDocuments() {
  const batchSize = 100;
  
  for (let i = 0; i < documentsData.length; i += batchSize) {
    const batch = documentsData.slice(i, i + batchSize);
    
    const { error } = await supabase.from('documents').upsert(
      batch.map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        department: doc.department,
        embedding: doc.embedding,
        metadata: doc.metadata,
      }))
    );
    
    if (error) {
      console.error(`Batch ${i / batchSize} failed:`, error);
    } else {
      console.log(`Imported batch ${i / batchSize + 1}`);
    }
  }
}

importDocuments();
```

---

## Phase 5: Document Storage Migration

### Step 5.1: Create Storage Bucket

```sql
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

### Step 5.2: S3 to Supabase Storage Migration Script

```typescript
// scripts/migrate_storage.ts
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const s3 = new S3Client({ region: 'us-east-1' });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateStorage() {
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: 'documents/',
  });
  
  const { Contents } = await s3.send(listCommand);
  
  for (const object of Contents || []) {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: object.Key,
    });
    
    const response = await s3.send(getCommand);
    const body = await response.Body?.transformToByteArray();
    
    if (body) {
      const { error } = await supabase.storage
        .from('documents')
        .upload(object.Key!, body, {
          contentType: response.ContentType,
          upsert: true,
        });
      
      if (error) {
        console.error(`Failed to upload ${object.Key}:`, error);
      } else {
        console.log(`Migrated: ${object.Key}`);
      }
    }
  }
}

migrateStorage();
```

---

## Phase 6: LLM Integration

### Step 6.1: Model Mapping

| AWS Bedrock Model | Lovable AI Equivalent |
|-------------------|----------------------|
| anthropic.claude-3-sonnet | google/gemini-2.5-flash |
| anthropic.claude-3-haiku | google/gemini-2.5-flash-lite |
| amazon.titan-embed-text-v1 | text-embedding-3-small |

### Step 6.2: Create Chat with RAG Edge Function

```typescript
// supabase/functions/chat-rag/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, department } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    // Step 1: Generate embedding for the query
    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: message,
      }),
    });
    
    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Step 2: Search for relevant documents
    const { data: relevantDocs } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5,
      filter_department: department || null,
    });

    // Step 3: Build context from documents
    const context = relevantDocs?.map((doc: any) => 
      `[Source: ${doc.title}]\n${doc.content}`
    ).join('\n\n---\n\n') || '';

    // Step 4: Fetch conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Step 5: Build prompt with RAG context
    const systemPrompt = `You are a helpful AI assistant. Use the following context to answer questions accurately. Always cite your sources.

CONTEXT:
${context}

If the context doesn't contain relevant information, say so and provide general guidance.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    // Step 6: Call LLM with streaming
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
      }),
    });

    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error) {
    console.error('Chat RAG error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Phase 7: Authentication Setup

### Step 7.1: Configure Auth in Lovable Cloud

1. Enable Email/Password authentication in Lovable Cloud settings
2. Configure OAuth providers if needed (Google, Microsoft)
3. Set up email templates for verification and password reset

### Step 7.2: Migrate User Sessions

```typescript
// Edge function to handle user migration
// supabase/functions/migrate-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, cognitoId, department, preferences } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', cognitoId)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'User already migrated', userId: existingUser.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user profile after they sign up
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        department,
        preferences,
        metadata: { cognitoId, migrated: true, migratedAt: new Date().toISOString() }
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: 'User migrated successfully', userId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Testing & Validation

### Validation Checklist

```markdown
## Pre-Migration Checklist
- [ ] All secrets configured in Lovable Cloud
- [ ] Database schema created and verified
- [ ] RLS policies tested
- [ ] Edge functions deployed and responding
- [ ] Storage buckets created with correct policies

## Data Migration Checklist
- [ ] Documents exported from Aurora
- [ ] Embeddings verified (dimension match: 1536)
- [ ] Documents imported to Lovable Cloud
- [ ] Vector search function tested
- [ ] Files migrated from S3 to Storage

## Functionality Testing
- [ ] User authentication works
- [ ] Chat messages stream correctly
- [ ] RAG search returns relevant results
- [ ] Conversation history persists
- [ ] Feedback submission works
- [ ] Analytics events are recorded

## Performance Validation
- [ ] Response latency < 500ms for first token
- [ ] Vector search < 100ms
- [ ] No rate limiting under normal load
```

### Test Script

```typescript
// scripts/test_migration.ts
async function testMigration() {
  const tests = [
    { name: 'Auth', fn: testAuth },
    { name: 'Chat', fn: testChat },
    { name: 'RAG Search', fn: testRagSearch },
    { name: 'Storage', fn: testStorage },
  ];
  
  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✅ ${test.name} passed`);
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
    }
  }
}

async function testAuth() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword',
  });
  if (error) throw error;
}

async function testChat() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello', conversationId: 'test' }),
  });
  if (!response.ok) throw new Error('Chat failed');
}

async function testRagSearch() {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: new Array(1536).fill(0),
    match_count: 1,
  });
  if (error) throw error;
}

async function testStorage() {
  const { data, error } = await supabase.storage
    .from('documents')
    .list();
  if (error) throw error;
}

testMigration();
```

---

## Rollback Plan

### If Migration Fails

1. **Keep AWS infrastructure running** during migration window
2. **DNS failover**: Point traffic back to CloudFront if needed
3. **Data sync**: Implement bidirectional sync during transition

```typescript
// Emergency rollback script
async function rollback() {
  // 1. Update frontend API URL back to AWS
  // 2. Verify AWS services are still operational
  // 3. Document what failed for debugging
  
  console.log('Rollback initiated');
  console.log('1. Update VITE_API_URL to AWS API Gateway');
  console.log('2. Verify Cognito auth is working');
  console.log('3. Check Lambda CloudWatch logs');
}
```

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Frontend | 2-3 days | None |
| Phase 2: Edge Functions | 3-4 days | Phase 1 |
| Phase 3: Database | 2-3 days | None |
| Phase 4: Vector DB | 1-2 days | Phase 3 |
| Phase 5: Storage | 1 day | Phase 3 |
| Phase 6: LLM Integration | 2-3 days | Phase 2 |
| Phase 7: Auth | 1-2 days | Phase 3 |
| Testing | 3-5 days | All phases |
| **Total** | **15-23 days** | |

---

## Support Resources

- [Lovable Cloud Documentation](https://docs.lovable.dev/features/cloud)
- [Lovable AI Documentation](https://docs.lovable.dev/features/ai)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
