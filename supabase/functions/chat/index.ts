import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Analytics cache - similar to LangMesh cached_data pattern
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

// Generate session ID like LangMesh session_id
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Estimate tokens (rough approximation - 1 token ≈ 4 chars)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  let invocationCount = 0;

  try {
    const { messages, department, session_id, locale = "en_US", rag_mode = null } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use provided session_id or generate new one
    const currentSessionId = session_id || generateSessionId();

    // Department-specific system prompts (like LangMesh's context handling)
    const departmentPrompts: Record<string, string> = {
      HR: "You are an HR policy assistant. Help employees understand HR policies, benefits, leave procedures, and workplace guidelines. Be professional and cite policy documents when relevant.",
      Finance: "You are a Finance department assistant. Help with expense reports, budget questions, financial procedures, and compliance guidelines. Be precise and reference financial policies.",
      IT: "You are an IT support assistant. Help with software requests, security policies, technical procedures, and system access. Be clear and reference IT documentation.",
      Operations: "You are an Operations assistant. Help with procurement, vendor management, supply chain questions, and operational procedures. Be efficient and reference operational guidelines.",
    };

    const systemPrompt = departmentPrompts[department] || 
      "You are a helpful enterprise assistant. Answer questions clearly and professionally.";

    // Calculate input tokens before API call
    const inputText = messages.map((m: { content: string }) => m.content).join(" ");
    const inputTokens = estimateTokens(inputText + systemPrompt);

    console.log(`[${currentSessionId}] Processing request for department: ${department}`);
    console.log(`[${currentSessionId}] Input tokens estimate: ${inputTokens}`);

    // Call Lovable AI Gateway (similar to LangMesh SDK interaction)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false, // Non-streaming for analytics capture
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${currentSessionId}] AI Gateway error:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limits exceeded, please try again later.",
            analytics: null 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required, please add funds.",
            analytics: null 
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // Extract response content
    const assistantContent = data.choices?.[0]?.message?.content || "";
    const outputTokens = estimateTokens(assistantContent);
    const totalTokens = inputTokens + outputTokens;

    // Build analytics metadata (like LangMesh's RESPONSE_METADATA_MSG)
    const analytics: AnalyticsMetadata = {
      session_id: currentSessionId,
      execution_time_ms: executionTimeMs,
      invocation_count: invocationCount + 1,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      model: "google/gemini-3-flash-preview",
      department: department || "General",
      timestamp: new Date().toISOString(),
      locale: locale,
      rag_mode: rag_mode,
    };

    console.log(`[${currentSessionId}] Response generated in ${executionTimeMs}ms`);
    console.log(`[${currentSessionId}] Analytics:`, JSON.stringify(analytics));

    // Return response with analytics metadata
    return new Response(
      JSON.stringify({
        content: assistantContent,
        analytics: analytics,
        sources: generateSources(department),
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
          model: "google/gemini-3-flash-preview",
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

// Generate department-specific sources (like LangMesh's RAG sources)
function generateSources(department: string): Array<{ title: string; type: string; reference?: string }> {
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
