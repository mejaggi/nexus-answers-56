/**
 * AWS API Gateway Client
 * 
 * This client handles all communication with your AWS API Gateway.
 * It automatically includes authentication tokens and handles Lambda proxy responses.
 */

import { AWS_CONFIG } from "./config";
import { getAuthToken, refreshSession } from "./auth";
import { AnalyticsMetadata, Source } from "@/components/ChatMessage";

// Request/Response interfaces
export interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  department: string;
  session_id?: string | null;
  locale?: string;
  rag_mode?: string | null;
}

export interface ChatResponse {
  content: string;
  analytics: AnalyticsMetadata;
  sources: Source[];
  error?: string;
}

// Lambda proxy response format
interface LambdaProxyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

/**
 * Check if response is Lambda proxy format
 */
function isLambdaProxyResponse(data: unknown): data is LambdaProxyResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "statusCode" in data &&
    "body" in data
  );
}

/**
 * Parse Lambda response (handles both proxy and direct formats)
 */
function parseLambdaResponse<T>(data: unknown): T {
  if (isLambdaProxyResponse(data)) {
    try {
      return JSON.parse(data.body) as T;
    } catch {
      throw new Error(`Failed to parse Lambda response body: ${data.body}`);
    }
  }
  return data as T;
}

/**
 * Get request headers with authentication
 */
async function getHeaders(): Promise<HeadersInit> {
  // Try to refresh session if needed
  await refreshSession();
  
  const token = getAuthToken();
  
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(AWS_CONFIG.apiGateway.apiKey && { "x-api-key": AWS_CONFIG.apiGateway.apiKey }),
  };
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create session ID
 */
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(AWS_CONFIG.sessionStorageKey);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(AWS_CONFIG.sessionStorageKey, sessionId);
  }
  
  return sessionId;
}

/**
 * Clear session ID (for new conversations)
 */
export function clearSessionId(): void {
  sessionStorage.removeItem(AWS_CONFIG.sessionStorageKey);
}

/**
 * Send chat message to AWS API Gateway -> Lambda -> Bedrock
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const headers = await getHeaders();
  const sessionId = request.session_id || getSessionId();
  
  const response = await fetch(AWS_CONFIG.apiGateway.chatEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...request,
      session_id: sessionId,
      user_query: request.messages[request.messages.length - 1]?.content || "",
    }),
  });

  const data = await response.json();
  
  // Handle HTTP errors
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Authentication required. Please log in.");
    }
    
    const parsed = parseLambdaResponse<{ error?: string; message?: string }>(data);
    throw new Error(parsed.error || parsed.message || `API error: ${response.status}`);
  }
  
  // Parse Lambda response
  const parsed = parseLambdaResponse<ChatResponse & { response?: string; message?: string }>(data);
  
  // Handle Lambda proxy error status codes
  if (isLambdaProxyResponse(data) && data.statusCode >= 400) {
    throw new Error(parsed.error || `Lambda error: ${data.statusCode}`);
  }
  
  // Normalize response content field
  const content = parsed.content || parsed.response || parsed.message || "";
  
  return {
    content,
    analytics: parsed.analytics || {
      session_id: sessionId,
      execution_time_ms: 0,
      invocation_count: 1,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      model: "bedrock",
      department: request.department,
      timestamp: new Date().toISOString(),
      locale: request.locale || "en_US",
      rag_mode: request.rag_mode || null,
    },
    sources: parsed.sources || [],
  };
}

/**
 * Save analytics to RDS via Lambda (optional)
 */
export async function saveAnalytics(analytics: AnalyticsMetadata): Promise<void> {
  if (AWS_CONFIG.apiGateway.analyticsEndpoint.includes("your-api-id")) {
    // Analytics endpoint not configured, skip
    console.log("Analytics endpoint not configured, skipping save");
    return;
  }
  
  try {
    const headers = await getHeaders();
    
    await fetch(AWS_CONFIG.apiGateway.analyticsEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(analytics),
    });
  } catch (error) {
    // Don't throw - analytics save is non-critical
    console.error("Failed to save analytics:", error);
  }
}

/**
 * Health check for API Gateway
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(
      AWS_CONFIG.apiGateway.chatEndpoint.replace("/chat", "/health"),
      {
        method: "GET",
        headers: {
          ...(AWS_CONFIG.apiGateway.apiKey && { "x-api-key": AWS_CONFIG.apiGateway.apiKey }),
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
