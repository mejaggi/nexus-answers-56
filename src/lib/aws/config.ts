/**
 * AWS Configuration
 * 
 * UPDATE THESE VALUES with your AWS endpoints
 * These can also be set via environment variables (preferred for production)
 */

export const AWS_CONFIG = {
  // API Gateway endpoints - UPDATE THESE
  apiGateway: {
    // Main chat endpoint (Bedrock via Lambda)
    chatEndpoint: import.meta.env.VITE_AWS_CHAT_ENDPOINT || "https://your-api-id.execute-api.region.amazonaws.com/prod/chat",
    
    // Authentication endpoint
    authEndpoint: import.meta.env.VITE_AWS_AUTH_ENDPOINT || "https://your-api-id.execute-api.region.amazonaws.com/prod/auth",
    
    // Analytics endpoint (optional - for persisting analytics to RDS)
    analyticsEndpoint: import.meta.env.VITE_AWS_ANALYTICS_ENDPOINT || "https://your-api-id.execute-api.region.amazonaws.com/prod/analytics",
    
    // API Key (if using API Gateway API Key authentication)
    apiKey: import.meta.env.VITE_AWS_API_KEY || "",
  },
  
  // Region configuration
  region: import.meta.env.VITE_AWS_REGION || "us-east-1",
  
  // Token storage key
  tokenStorageKey: "aws_auth_token",
  
  // Session storage key  
  sessionStorageKey: "aws_session_id",
};

/**
 * Validate configuration
 * Call this on app startup to ensure required configs are set
 */
export function validateAwsConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (AWS_CONFIG.apiGateway.chatEndpoint.includes("your-api-id")) {
    errors.push("Chat endpoint not configured. Set VITE_AWS_CHAT_ENDPOINT environment variable.");
  }
  
  if (AWS_CONFIG.apiGateway.authEndpoint.includes("your-api-id")) {
    errors.push("Auth endpoint not configured. Set VITE_AWS_AUTH_ENDPOINT environment variable.");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
