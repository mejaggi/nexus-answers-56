/**
 * AWS Integration Module
 * 
 * Export all AWS-related functionality from a single entry point
 */

// Configuration
export { AWS_CONFIG, validateAwsConfig } from "./config";

// Authentication
export {
  login,
  signup,
  logout,
  getAuthToken,
  getCurrentUser,
  getStoredSession,
  clearSession,
  refreshSession,
  type AuthUser,
  type AuthSession,
  type LoginCredentials,
  type SignupCredentials,
} from "./auth";

// API Client
export {
  sendChatMessage,
  saveAnalytics,
  generateSessionId,
  getSessionId,
  clearSessionId,
  healthCheck,
  type ChatRequest,
  type ChatResponse,
} from "./api-client";
