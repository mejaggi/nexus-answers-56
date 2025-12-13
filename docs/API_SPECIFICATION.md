# Chatbot API Specification

## Base URL
```
https://<project-id>.supabase.co/functions/v1
```

---

## Authentication
All endpoints require a valid JWT token in the Authorization header unless marked as public.

```http
Authorization: Bearer <supabase-anon-key>
```

---

## Endpoints

### 1. Chat - Stream AI Response

**POST** `/chat`

Streams AI-generated responses using the Lovable AI Gateway.

#### Request
```typescript
interface ChatRequest {
  conversation_id?: string;  // Optional: existing conversation
  message: string;           // User's message (max 4000 chars)
  department?: string;       // Optional: context department
}
```

```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What is our leave policy?",
  "department": "HR"
}
```

#### Response (SSE Stream)
```typescript
// Each SSE event contains:
interface ChatStreamEvent {
  type: "content" | "sources" | "done" | "error";
  data: {
    content?: string;        // Token chunk
    sources?: Source[];      // Citation sources
    message_id?: string;     // Final message ID
    tokens_used?: number;    // Total tokens consumed
    error?: string;          // Error message if type=error
  };
}

interface Source {
  title: string;
  url: string;
}
```

```
data: {"type":"content","data":{"content":"Our leave"}}
data: {"type":"content","data":{"content":" policy includes"}}
data: {"type":"sources","data":{"sources":[{"title":"HR Handbook","url":"https://..."}]}}
data: {"type":"done","data":{"message_id":"...","tokens_used":245}}
```

#### Errors
| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_MESSAGE | Message is empty or exceeds 4000 chars |
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 429 | RATE_LIMITED | Too many requests, try again later |
| 402 | PAYMENT_REQUIRED | AI credits exhausted |
| 500 | AI_ERROR | Upstream AI gateway error |

---

### 2. Conversations

#### GET `/conversations`

List all conversations for the authenticated user.

#### Request Query Parameters
```typescript
interface ConversationsQuery {
  limit?: number;           // Default: 20, Max: 100
  offset?: number;          // Pagination offset
  department?: string;      // Filter by department
  status?: "active" | "archived";
}
```

#### Response
```typescript
interface ConversationsResponse {
  data: Conversation[];
  total: number;
  has_more: boolean;
}

interface Conversation {
  id: string;
  title: string;
  department: string;
  status: "active" | "archived";
  message_count: number;
  last_message_at: string;  // ISO 8601
  created_at: string;
}
```

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Leave Policy Query",
      "department": "HR",
      "status": "active",
      "message_count": 5,
      "last_message_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 42,
  "has_more": true
}
```

---

#### POST `/conversations`

Create a new conversation.

#### Request
```typescript
interface CreateConversationRequest {
  title?: string;           // Auto-generated if not provided
  department: string;
}
```

#### Response
```typescript
interface Conversation {
  id: string;
  title: string;
  department: string;
  status: "active";
  created_at: string;
}
```

---

### 3. Messages

#### GET `/messages`

Retrieve message history for a conversation.

#### Request Query Parameters
```typescript
interface MessagesQuery {
  conversation_id: string;  // Required
  limit?: number;           // Default: 50, Max: 200
  before?: string;          // Cursor for pagination (message ID)
}
```

#### Response
```typescript
interface MessagesResponse {
  data: Message[];
  has_more: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  tokens_used?: number;
  response_time_ms?: number;
  created_at: string;
}
```

```json
{
  "data": [
    {
      "id": "msg_001",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "What is our leave policy?",
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": "msg_002",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "assistant",
      "content": "Our leave policy includes...",
      "sources": [
        {"title": "HR Handbook", "url": "https://..."}
      ],
      "tokens_used": 245,
      "response_time_ms": 1250,
      "created_at": "2024-01-15T10:00:02Z"
    }
  ],
  "has_more": false
}
```

---

### 4. Feedback

#### POST `/feedback`

Submit user feedback for a message.

#### Request
```typescript
interface FeedbackRequest {
  message_id: string;
  rating: "positive" | "negative";
  comment?: string;         // Optional: max 500 chars
}
```

```json
{
  "message_id": "msg_002",
  "rating": "positive",
  "comment": "Very helpful response!"
}
```

#### Response
```typescript
interface FeedbackResponse {
  id: string;
  created_at: string;
}
```

---

### 5. Analytics - Usage Metrics

#### GET `/analytics/usage`

Retrieve usage and adoption metrics.

#### Request Query Parameters
```typescript
interface UsageAnalyticsQuery {
  start_date: string;       // ISO 8601 date
  end_date: string;         // ISO 8601 date
  granularity: "hourly" | "daily" | "weekly" | "monthly";
  department?: string;      // Filter by department
}
```

#### Response
```typescript
interface UsageAnalyticsResponse {
  summary: {
    total_messages: number;
    total_sessions: number;
    unique_users: number;
    avg_messages_per_session: number;
    repeat_user_rate: number;      // Percentage
  };
  time_series: UsageDataPoint[];
  channel_breakdown: ChannelData[];
  peak_hours: HourlyDistribution[];
}

interface UsageDataPoint {
  timestamp: string;
  messages: number;
  sessions: number;
  active_users: number;
}

interface ChannelData {
  channel: "web" | "teams" | "mobile" | "slack";
  percentage: number;
  message_count: number;
}

interface HourlyDistribution {
  hour: number;             // 0-23
  message_count: number;
  avg_response_time_ms: number;
}
```

---

### 6. Analytics - Cost Metrics

#### GET `/analytics/costs`

Retrieve cost and consumption metrics.

#### Request Query Parameters
```typescript
interface CostAnalyticsQuery {
  start_date: string;
  end_date: string;
  granularity: "daily" | "weekly" | "monthly";
}
```

#### Response
```typescript
interface CostAnalyticsResponse {
  summary: {
    total_tokens: number;
    total_cost: number;           // In USD
    cost_per_query: number;
    cost_per_user: number;
    token_efficiency: number;     // Tokens per resolved query
    budget_used_percentage: number;
  };
  time_series: CostDataPoint[];
  model_breakdown: ModelCost[];
}

interface CostDataPoint {
  timestamp: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

interface ModelCost {
  model: string;
  tokens: number;
  cost: number;
  percentage: number;
}
```

---

### 7. Analytics - Performance Metrics

#### GET `/analytics/performance`

Retrieve performance and reliability metrics.

#### Request Query Parameters
```typescript
interface PerformanceAnalyticsQuery {
  start_date: string;
  end_date: string;
  granularity: "hourly" | "daily";
}
```

#### Response
```typescript
interface PerformanceAnalyticsResponse {
  summary: {
    uptime_percentage: number;
    avg_response_time_ms: number;
    p50_response_time_ms: number;
    p95_response_time_ms: number;
    error_rate: number;           // Percentage
    fallback_rate: number;        // Percentage
    sla_breach_count: number;
  };
  time_series: PerformanceDataPoint[];
  error_breakdown: ErrorData[];
}

interface PerformanceDataPoint {
  timestamp: string;
  avg_latency_ms: number;
  p95_latency_ms: number;
  error_count: number;
  request_count: number;
}

interface ErrorData {
  error_type: string;
  count: number;
  percentage: number;
}
```

---

### 8. Analytics - Satisfaction Metrics

#### GET `/analytics/satisfaction`

Retrieve user experience and satisfaction metrics.

#### Request Query Parameters
```typescript
interface SatisfactionAnalyticsQuery {
  start_date: string;
  end_date: string;
}
```

#### Response
```typescript
interface SatisfactionAnalyticsResponse {
  summary: {
    csat_score: number;           // 1-5 scale
    positive_feedback_rate: number;
    negative_feedback_rate: number;
    rephrasing_rate: number;      // % of repeated intents
    total_feedback_count: number;
  };
  time_series: SatisfactionDataPoint[];
  feedback_samples: FeedbackSample[];
}

interface SatisfactionDataPoint {
  timestamp: string;
  positive_count: number;
  negative_count: number;
  csat_avg: number;
}

interface FeedbackSample {
  message_id: string;
  rating: "positive" | "negative";
  comment?: string;
  created_at: string;
}
```

---

## Common Error Response Format

All errors follow this structure:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

```json
{
  "error": {
    "code": "INVALID_MESSAGE",
    "message": "Message cannot exceed 4000 characters",
    "details": {
      "max_length": 4000,
      "received_length": 4532
    }
  }
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/chat` | 30 requests | per minute |
| `/conversations` | 100 requests | per minute |
| `/messages` | 100 requests | per minute |
| `/feedback` | 50 requests | per minute |
| `/analytics/*` | 20 requests | per minute |

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1705312800
```

---

## Validation Rules

| Field | Constraints |
|-------|-------------|
| `message` | Non-empty, max 4000 chars, trimmed |
| `department` | Enum: HR, IT, Finance, Legal, Operations, General |
| `comment` | Max 500 chars |
| `limit` | Min 1, max varies by endpoint |
| `dates` | Valid ISO 8601 format |
