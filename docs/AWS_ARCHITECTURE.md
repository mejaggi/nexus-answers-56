# AWS Architecture Guide

This document describes how to set up the AWS backend for this chatbot application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────────┐ │
│  │  useAwsAuth    │  │  useAwsChat    │  │  AWS Config                    │ │
│  │  (Login/Auth)  │  │  (Chat API)    │  │  (src/lib/aws/config.ts)       │ │
│  └───────┬────────┘  └───────┬────────┘  └────────────────────────────────┘ │
└──────────┼───────────────────┼──────────────────────────────────────────────┘
           │                   │
           ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AWS API Gateway                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ /auth/login      │  │ /chat            │  │ /analytics               │   │
│  │ /auth/signup     │  │                  │  │ (optional)               │   │
│  │ /auth/logout     │  │                  │  │                          │   │
│  │ /auth/refresh    │  │                  │  │                          │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘   │
└───────────┼─────────────────────┼─────────────────────────┼─────────────────┘
            │                     │                         │
            ▼                     ▼                         ▼
┌───────────────────┐  ┌────────────────────┐  ┌──────────────────────────────┐
│  Auth Lambda      │  │  Chat Lambda       │  │  Analytics Lambda            │
│  ┌─────────────┐  │  │  ┌──────────────┐  │  │  ┌────────────────────────┐  │
│  │ Validate    │  │  │  │ Parse Request│  │  │  │ Store analytics        │  │
│  │ credentials │  │  │  │              │  │  │  │ in RDS PostgreSQL      │  │
│  │             │  │  │  │ Call Bedrock │  │  │  │                        │  │
│  │ Generate    │  │  │  │              │  │  │  │ Query analytics        │  │
│  │ JWT token   │  │  │  │ RAG lookup   │  │  │  │ for dashboard          │  │
│  └──────┬──────┘  │  │  │ (optional)   │  │  │  └───────────┬────────────┘  │
│         │         │  │  └──────┬───────┘  │  │              │               │
└─────────┼─────────┘  └─────────┼──────────┘  └──────────────┼───────────────┘
          │                      │                            │
          ▼                      ▼                            ▼
┌─────────────────┐   ┌──────────────────┐   ┌────────────────────────────────┐
│ RDS PostgreSQL  │   │  AWS Bedrock     │   │        RDS PostgreSQL          │
│ (Users table)   │   │  (Claude/Titan)  │   │   (analytics, sessions)        │
└─────────────────┘   └──────────────────┘   └────────────────────────────────┘
```

## Environment Variables

Add these to your `.env` file or deployment configuration:

```bash
# AWS API Gateway Endpoints
VITE_AWS_CHAT_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/chat
VITE_AWS_AUTH_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/auth
VITE_AWS_ANALYTICS_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/analytics

# Optional: API Key for API Gateway
VITE_AWS_API_KEY=your-api-key-here

# AWS Region
VITE_AWS_REGION=us-east-1
```

## Lambda Function Contracts

### Auth Lambda

#### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here",
  "expiresIn": 3600,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "department": "HR",
    "roles": ["user"]
  }
}
```

#### POST /auth/signup
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "department": "HR"
}
```

**Response:** Same as login

#### POST /auth/refresh
**Request:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:** Same as login

### Chat Lambda

#### POST /chat
**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "What is the remote work policy?" }
  ],
  "department": "HR",
  "session_id": "session_123456_abc",
  "locale": "en_US",
  "user_query": "What is the remote work policy?"
}
```

**Response:**
```json
{
  "content": "The remote work policy allows...",
  "analytics": {
    "session_id": "session_123456_abc",
    "execution_time_ms": 1250,
    "invocation_count": 1,
    "input_tokens": 150,
    "output_tokens": 200,
    "total_tokens": 350,
    "model": "anthropic.claude-3-sonnet",
    "department": "HR",
    "timestamp": "2024-01-15T10:30:00Z",
    "locale": "en_US",
    "rag_mode": null
  },
  "sources": [
    {
      "title": "Remote Work Policy v2.0",
      "type": "document",
      "reference": "HR-POL-001"
    }
  ]
}
```

## AWS Lambda Examples

### Chat Lambda (Python)

```python
import json
import boto3
from datetime import datetime

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

def lambda_handler(event, context):
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        messages = body.get('messages', [])
        department = body.get('department', 'General')
        session_id = body.get('session_id', '')
        
        # Build prompt for Bedrock
        system_prompt = f"You are a helpful {department} assistant."
        
        # Call Bedrock (Claude example)
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 1024,
                'system': system_prompt,
                'messages': messages
            })
        )
        
        result = json.loads(response['body'].read())
        content = result['content'][0]['text']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'content': content,
                'analytics': {
                    'session_id': session_id,
                    'execution_time_ms': 0,
                    'input_tokens': result.get('usage', {}).get('input_tokens', 0),
                    'output_tokens': result.get('usage', {}).get('output_tokens', 0),
                    'total_tokens': result.get('usage', {}).get('input_tokens', 0) + result.get('usage', {}).get('output_tokens', 0),
                    'model': 'anthropic.claude-3-sonnet',
                    'department': department,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'invocation_count': 1,
                    'locale': body.get('locale', 'en_US'),
                    'rag_mode': None
                },
                'sources': []
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
```

### Auth Lambda (Python)

```python
import json
import jwt
import bcrypt
import psycopg2
import os
from datetime import datetime, timedelta

JWT_SECRET = os.environ['JWT_SECRET']
DB_HOST = os.environ['DB_HOST']
DB_NAME = os.environ['DB_NAME']
DB_USER = os.environ['DB_USER']
DB_PASSWORD = os.environ['DB_PASSWORD']

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def lambda_handler(event, context):
    path = event.get('path', '')
    body = json.loads(event.get('body', '{}'))
    
    if '/login' in path:
        return handle_login(body)
    elif '/signup' in path:
        return handle_signup(body)
    elif '/refresh' in path:
        return handle_refresh(body)
    else:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Not found'})}

def handle_login(body):
    email = body.get('email')
    password = body.get('password')
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id, email, name, department, password_hash FROM users WHERE email = %s', (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user or not bcrypt.checkpw(password.encode(), user[4].encode()):
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Invalid credentials'})
        }
    
    token = jwt.encode({
        'sub': user[0],
        'email': user[1],
        'exp': datetime.utcnow() + timedelta(hours=1)
    }, JWT_SECRET, algorithm='HS256')
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'token': token,
            'expiresIn': 3600,
            'user': {
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'department': user[3]
            }
        })
    }
```

## RDS PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    department VARCHAR(100),
    roles TEXT[] DEFAULT ARRAY['user'],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for analytics)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE chat_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) REFERENCES chat_sessions(session_id),
    execution_time_ms INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    model VARCHAR(100),
    department VARCHAR(100),
    locale VARCHAR(10),
    rag_mode VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_analytics_session ON chat_analytics(session_id);
CREATE INDEX idx_analytics_timestamp ON chat_analytics(timestamp);
CREATE INDEX idx_analytics_department ON chat_analytics(department);
```

## Switching Between Supabase and AWS

The codebase now supports both backends. To switch:

### Use AWS Backend (default now)
In `src/pages/Index.tsx`, use:
```typescript
import { useAwsChat } from "@/hooks/useAwsChat";
// ...
const { messages, isLoading, error, sendMessage, handleFeedback, analytics } = useAwsChat();
```

### Use Supabase Backend
```typescript
import { useChatWithAnalytics } from "@/hooks/useChatWithAnalytics";
// ...
const { messages, isLoading, error, sendMessage, handleFeedback, analytics } = useChatWithAnalytics();
```

Both hooks have the same interface, making switching seamless.

## Security Considerations

1. **API Gateway**: Enable API key authentication or IAM authorization
2. **JWT Tokens**: Use strong secrets, short expiration times
3. **CORS**: Restrict to your frontend domain in production
4. **RDS**: Use security groups, VPC, encrypted connections
5. **Secrets**: Store in AWS Secrets Manager, not environment variables
6. **Bedrock**: Use IAM roles with least privilege
