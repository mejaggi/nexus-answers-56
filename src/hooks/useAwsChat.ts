import { useState, useCallback, useRef } from "react";
import {
  sendChatMessage,
  saveAnalytics,
  getSessionId,
  clearSessionId,
} from "@/lib/aws/api-client";
import { useAnalytics } from "./useAnalytics";
import { Message, Source, AnalyticsMetadata } from "@/components/ChatMessage";

/**
 * Chat hook using AWS API Gateway + Lambda + Bedrock
 * Drop-in replacement for useChatWithAnalytics that uses AWS instead of Supabase
 */
export const useAwsChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const analytics = useAnalytics();

  const sendMessage = useCallback(
    async (content: string, department: string) => {
      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Build message history for context
        const messageHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        messageHistory.push({ role: "user", content });

        // Call AWS API Gateway -> Lambda -> Bedrock
        const data = await sendChatMessage({
          messages: messageHistory,
          department,
          session_id: sessionIdRef.current,
          locale: navigator.language || "en_US",
        });

        // Store session_id for subsequent requests
        if (data.analytics?.session_id) {
          sessionIdRef.current = data.analytics.session_id;
        }

        // Track analytics locally
        if (data.analytics) {
          analytics.trackAnalytics(data.analytics);
          // Optionally persist to RDS
          saveAnalytics(data.analytics);
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
          sources: data.sources,
          analytics: data.analytics,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);
        console.error("Chat error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, analytics]
  );

  const handleFeedback = useCallback(
    (messageId: string, feedback: "like" | "dislike") => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg))
      );
      analytics.trackFeedback(messageId, feedback);
    },
    [analytics]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = null;
    clearSessionId();
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    handleFeedback,
    clearMessages,
    analytics,
    sessionId: sessionIdRef.current,
  };
};
