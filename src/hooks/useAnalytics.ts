import { useState, useCallback, useRef } from "react";
import { AnalyticsMetadata } from "@/components/ChatMessage";

export type { AnalyticsMetadata };

// Aggregated analytics for dashboard
export interface AggregatedAnalytics {
  totalMessages: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageExecutionTime: number;
  executionTimes: number[];
  sessionsCount: number;
  feedbackPositive: number;
  feedbackNegative: number;
  departmentBreakdown: Record<string, number>;
  hourlyUsage: Record<string, number>;
  dailyUsage: { date: string; messages: number; tokens: number }[];
}

export const useAnalytics = () => {
  const [analyticsHistory, setAnalyticsHistory] = useState<AnalyticsMetadata[]>([]);
  const [feedbackRecords, setFeedbackRecords] = useState<{ messageId: string; rating: "like" | "dislike" }[]>([]);
  const sessionIds = useRef<Set<string>>(new Set());

  // Track a new analytics event from the edge function
  const trackAnalytics = useCallback((analytics: AnalyticsMetadata) => {
    setAnalyticsHistory((prev) => [...prev, analytics]);
    sessionIds.current.add(analytics.session_id);
  }, []);

  // Track feedback (like store_bot_rating in LangMesh)
  const trackFeedback = useCallback((messageId: string, rating: "like" | "dislike") => {
    setFeedbackRecords((prev) => {
      const existing = prev.find((f) => f.messageId === messageId);
      if (existing) {
        return prev.map((f) => (f.messageId === messageId ? { ...f, rating } : f));
      }
      return [...prev, { messageId, rating }];
    });
  }, []);

  // Get aggregated analytics for dashboard
  const getAggregatedAnalytics = useCallback((): AggregatedAnalytics => {
    const totalMessages = analyticsHistory.length;
    const totalTokens = analyticsHistory.reduce((sum, a) => sum + a.total_tokens, 0);
    const totalInputTokens = analyticsHistory.reduce((sum, a) => sum + a.input_tokens, 0);
    const totalOutputTokens = analyticsHistory.reduce((sum, a) => sum + a.output_tokens, 0);
    const executionTimes = analyticsHistory.map((a) => a.execution_time_ms);
    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
        : 0;

    // Department breakdown
    const departmentBreakdown: Record<string, number> = {};
    analyticsHistory.forEach((a) => {
      departmentBreakdown[a.department] = (departmentBreakdown[a.department] || 0) + 1;
    });

    // Hourly usage
    const hourlyUsage: Record<string, number> = {};
    analyticsHistory.forEach((a) => {
      const hour = new Date(a.timestamp).getHours().toString().padStart(2, "0") + ":00";
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
    });

    // Daily usage
    const dailyMap: Record<string, { messages: number; tokens: number }> = {};
    analyticsHistory.forEach((a) => {
      const date = new Date(a.timestamp).toISOString().split("T")[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { messages: 0, tokens: 0 };
      }
      dailyMap[date].messages += 1;
      dailyMap[date].tokens += a.total_tokens;
    });
    const dailyUsage = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Feedback counts
    const feedbackPositive = feedbackRecords.filter((f) => f.rating === "like").length;
    const feedbackNegative = feedbackRecords.filter((f) => f.rating === "dislike").length;

    return {
      totalMessages,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      averageExecutionTime: Math.round(averageExecutionTime),
      executionTimes,
      sessionsCount: sessionIds.current.size,
      feedbackPositive,
      feedbackNegative,
      departmentBreakdown,
      hourlyUsage,
      dailyUsage,
    };
  }, [analyticsHistory, feedbackRecords]);

  // Get the latest analytics entry
  const getLatestAnalytics = useCallback((): AnalyticsMetadata | null => {
    return analyticsHistory.length > 0 ? analyticsHistory[analyticsHistory.length - 1] : null;
  }, [analyticsHistory]);

  // Clear all analytics (for testing)
  const clearAnalytics = useCallback(() => {
    setAnalyticsHistory([]);
    setFeedbackRecords([]);
    sessionIds.current.clear();
  }, []);

  return {
    analyticsHistory,
    trackAnalytics,
    trackFeedback,
    getAggregatedAnalytics,
    getLatestAnalytics,
    clearAnalytics,
    feedbackRecords,
  };
};
