import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { DepartmentNav, Department } from "@/components/DepartmentNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TypingIndicator } from "@/components/TypingIndicator";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useChatWithAnalytics } from "@/hooks/useChatWithAnalytics";

const departmentPrompts: Record<Department, string[]> = {
  HR: [
    "What is the policy for remote work requests?",
    "How do I apply for parental leave?",
    "What are the performance review timelines?",
    "Tell me about the employee benefits package",
  ],
  Finance: [
    "How do I submit an expense report?",
    "What is the approval process for capital expenditures?",
    "Explain the budget allocation process",
    "What are the quarterly financial reporting deadlines?",
  ],
  IT: [
    "How do I request new software or hardware?",
    "What is the incident reporting procedure?",
    "Explain the data security policies",
    "How do I set up VPN access for remote work?",
  ],
  Operations: [
    "What are the procurement guidelines?",
    "Explain the vendor onboarding process",
    "What is the supply chain management policy?",
    "How do I report operational issues?",
  ],
};

const Index = () => {
  const [activeDepartment, setActiveDepartment] = useState<Department>("HR");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    handleFeedback: chatHandleFeedback,
    analytics 
  } = useChatWithAnalytics();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, activeDepartment);
  };

  const handleFeedback = (messageId: string, feedback: "like" | "dislike") => {
    chatHandleFeedback(messageId, feedback);
    toast({
      title: "Feedback received",
      description: "Thank you for helping us improve!",
    });
  };

  return (
    <div className="flex h-screen bg-gradient-subtle">
      <DepartmentNav
        activeDepartment={activeDepartment}
        onDepartmentChange={setActiveDepartment}
        showAnalytics={showAnalytics}
        onAnalyticsToggle={() => setShowAnalytics(!showAnalytics)}
      />

      {showAnalytics ? (
        <AnalyticsDashboard analyticsData={analytics.getAggregatedAnalytics()} />
      ) : (
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card shadow-soft px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {activeDepartment} Assistant
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about {activeDepartment.toLowerCase()} policies and procedures
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-muted-foreground">AI Online</span>
                </div>
                <ThemeToggle />
                <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=employee" alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">EM</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <div className="flex-1 flex gap-6 p-6 overflow-hidden">
            <div className="flex-1 flex flex-col gap-4">
              <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="space-y-4 pr-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-4 shadow-medium">
                        <span className="text-2xl font-bold text-accent-foreground">AI</span>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Welcome to {activeDepartment} Assistant
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        I'm here to help you find information quickly. Try asking a question or
                        select a suggested prompt to get started.
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          onFeedback={handleFeedback}
                        />
                      ))}
                      {isLoading && <TypingIndicator />}
                    </>
                  )}
                </div>
              </ScrollArea>

              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                placeholder={`Ask about ${activeDepartment.toLowerCase()} policies, procedures, or information...`}
              />
            </div>

            <div className="w-80">
              <SuggestedPrompts
                prompts={departmentPrompts[activeDepartment]}
                onPromptClick={handleSendMessage}
                department={activeDepartment}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
