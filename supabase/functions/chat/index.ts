import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Analytics interface matching Lambda response format
interface AnalyticsMetadata {
  session_id: string;
  execution_time_ms: number;
  invocation_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model: string;
  department: string;
  timestamp: string;
  locale: string;
  rag_mode: string | null;
}

// Lambda proxy response interface (matches your existing Lambda pattern)
interface LambdaProxyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

// Parsed Lambda response body
interface LambdaResponseBody {
  response?: string;
  content?: string;
  message?: string;
  analytics?: Partial<AnalyticsMetadata>;
  sources?: Array<{ title: string; type: string; reference?: string }>;
  error?: string;
}

// Generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const { messages, department, session_id, locale = "en_US", rag_mode = null } = await req.json();

    // AWS Lambda Proxy configuration - UPDATE THESE VALUES
    const AWS_LAMBDA_ENDPOINT = Deno.env.get("AWS_LAMBDA_ENDPOINT") || "https://your-lambda-endpoint.execute-api.region.amazonaws.com/stage/chat";
    const AWS_LAMBDA_API_KEY = Deno.env.get("AWS_LAMBDA_API_KEY") || "";

    const currentSessionId = session_id || generateSessionId();

    console.log(`[${currentSessionId}] Processing request for department: ${department}`);
    console.log(`[${currentSessionId}] Calling Lambda proxy at: ${AWS_LAMBDA_ENDPOINT}`);

    // Build Lambda proxy request body (matching your existing Lambda event format)
    const lambdaRequestBody = {
      // Standard Lambda proxy event body fields
      messages: messages,
      session_id: currentSessionId,
      department: department,
      locale: locale,
      rag_mode: rag_mode,
      // Additional context your Lambda might need
      user_query: messages[messages.length - 1]?.content || "",
    };

    // Call AWS Lambda via API Gateway (Lambda Proxy Integration)
    const response = await fetch(AWS_LAMBDA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AWS_LAMBDA_API_KEY && { "x-api-key": AWS_LAMBDA_API_KEY }),
      },
      body: JSON.stringify(lambdaRequestBody),
    });

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // Lambda Proxy returns statusCode in body OR as HTTP status
    let lambdaResponse: LambdaProxyResponse | LambdaResponseBody;
    const responseText = await response.text();
    
    try {
      lambdaResponse = JSON.parse(responseText);
    } catch {
      console.error(`[${currentSessionId}] Failed to parse Lambda response:`, responseText);
      throw new Error("Invalid Lambda response format");
    }

    console.log(`[${currentSessionId}] Lambda response received in ${executionTimeMs}ms`);

    // Handle Lambda Proxy Integration response format
    let statusCode: number;
    let bodyContent: LambdaResponseBody;

    if ('statusCode' in lambdaResponse && 'body' in lambdaResponse) {
      // Lambda Proxy response format: { statusCode, headers, body }
      statusCode = lambdaResponse.statusCode;
      try {
        bodyContent = typeof lambdaResponse.body === 'string' 
          ? JSON.parse(lambdaResponse.body) 
          : lambdaResponse.body;
      } catch {
        bodyContent = { response: lambdaResponse.body };
      }
    } else {
      // Direct response format (non-proxy Lambda or API Gateway transformation)
      statusCode = response.status;
      bodyContent = lambdaResponse as LambdaResponseBody;
    }

    // Handle error responses
    if (statusCode >= 400 || !response.ok) {
      console.error(`[${currentSessionId}] Lambda error:`, statusCode, JSON.stringify(bodyContent));
      
      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limits exceeded, please try again later.",
            analytics: null 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (statusCode === 403 || statusCode === 401) {
        return new Response(
          JSON.stringify({ 
            error: "Access denied. Check Lambda API key configuration.",
            analytics: null 
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(bodyContent.error || `Lambda error: ${statusCode}`);
    }

    // Extract response content (supporting multiple field names from Lambda)
    const assistantContent = bodyContent.response || bodyContent.content || bodyContent.message || "";

    // Build analytics - use Lambda-provided analytics or generate defaults
    const analytics: AnalyticsMetadata = {
      session_id: currentSessionId,
      execution_time_ms: bodyContent.analytics?.execution_time_ms || executionTimeMs,
      invocation_count: bodyContent.analytics?.invocation_count || 1,
      input_tokens: bodyContent.analytics?.input_tokens || 0,
      output_tokens: bodyContent.analytics?.output_tokens || 0,
      total_tokens: bodyContent.analytics?.total_tokens || 0,
      model: bodyContent.analytics?.model || "lambda-llm",
      department: department || "General",
      timestamp: new Date().toISOString(),
      locale: locale,
      rag_mode: rag_mode,
    };

    console.log(`[${currentSessionId}] Analytics:`, JSON.stringify(analytics));

    // Return response with analytics metadata
    return new Response(
      JSON.stringify({
        content: assistantContent,
        analytics: analytics,
        sources: bodyContent.sources || generateDefaultSources(department),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    console.error("Chat error:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        analytics: {
          session_id: generateSessionId(),
          execution_time_ms: executionTimeMs,
          invocation_count: 0,
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          model: "lambda-llm",
          department: "Unknown",
          timestamp: new Date().toISOString(),
          locale: "en_US",
          rag_mode: null,
          error: true,
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Default sources when Lambda doesn't provide them
function generateDefaultSources(department: string): Array<{ title: string; type: string; reference?: string }> {
  const departmentSources: Record<string, Array<{ title: string; type: string; reference?: string }>> = {
    HR: [
      { title: "Employee Handbook v3.2", type: "document", reference: "HR-DOC-001" },
      { title: "HR Policy Guidelines", type: "policy", reference: "HR-POL-002" },
    ],
    Finance: [
      { title: "Financial Procedures Manual", type: "document", reference: "FIN-DOC-001" },
      { title: "Expense Policy 2024", type: "policy", reference: "FIN-POL-001" },
    ],
    IT: [
      { title: "IT Security Handbook", type: "document", reference: "IT-DOC-001" },
      { title: "Software Request Portal", type: "link", reference: "IT-SYS-001" },
    ],
    Operations: [
      { title: "Operations Manual", type: "document", reference: "OPS-DOC-001" },
      { title: "Vendor Guidelines", type: "policy", reference: "OPS-POL-001" },
    ],
  };

  return departmentSources[department] || [];
}
