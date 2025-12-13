import { useState, useRef, useEffect } from "react";
import { ChatMessage, Message, Source } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { DepartmentNav, Department } from "@/components/DepartmentNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TypingIndicator } from "@/components/TypingIndicator";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState<Department>("HR");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const simulateAIResponse = async (userMessage: string): Promise<{ content: string; sources: Source[] }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const departmentSources: Record<Department, Source[]> = {
      HR: [
        { title: "Employee Handbook v3.2", type: "document" },
        { title: "HR Policy Guidelines", type: "policy" },
      ],
      Finance: [
        { title: "Financial Procedures Manual", type: "document" },
        { title: "Expense Policy 2024", type: "policy" },
      ],
      IT: [
        { title: "IT Security Handbook", type: "document" },
        { title: "Software Request Portal", type: "link" },
      ],
      Operations: [
        { title: "Operations Manual", type: "document" },
        { title: "Vendor Guidelines", type: "policy" },
      ],
    };

    const responses: Record<Department, string> = {
      HR: `Based on our **HR policies and procedures**, I can help you with that.\n\n${userMessage.toLowerCase().includes("leave") ? "### Leave Request Process\n\n1. Submit requests **at least 2 weeks in advance** through the HRMS portal\n2. You'll need approval from your direct manager\n3. HR will review and confirm within 3 business days" : userMessage.toLowerCase().includes("remote") ? "### Remote Work Guidelines\n\nRemote work requests are evaluated on a **case-by-case basis**. Requirements:\n\n- Submit through the employee portal\n- Include justification and expected duration\n- Manager approval required" : "You can find detailed information in the *Employee Handbook Section 4.2*. Please reach out to HR if you need specific guidance."}`,
      Finance: `According to our **financial policies**:\n\n${userMessage.toLowerCase().includes("expense") ? "### Expense Submission\n\n- Reports must be submitted within **30 days**\n- Include original receipts\n- Expenses over **$500** require pre-approval" : userMessage.toLowerCase().includes("budget") ? "### Budget Allocation Process\n\n1. Quarterly review cycle\n2. Department heads submit proposals\n3. Finance committee reviews and approves" : "Our financial procedures ensure compliance and transparency. See the *Finance Policy Document v2.3* for details."}`,
      IT: `From an **IT perspective**:\n\n${userMessage.toLowerCase().includes("software") ? "### Software Request Process\n\n1. Submit via IT Service Portal\n2. Security compliance review\n3. Licensing verification\n4. Typical approval: 3-5 business days" : userMessage.toLowerCase().includes("security") ? "### Data Security Requirements\n\n- **Strong passwords** (12+ characters)\n- MFA required for all systems\n- Complete security training annually" : "Our IT policies ensure secure operations. Refer to the *IT Operations Manual* for procedures."}`,
      Operations: `Based on **operational guidelines**:\n\n${userMessage.toLowerCase().includes("procurement") ? "### Procurement Process\n\n- Three-quote process for purchases **over $5,000**\n- Contact procurement team for vendor recommendations\n- Standard approval timeline: 5-7 days" : userMessage.toLowerCase().includes("vendor") ? "### Vendor Onboarding\n\n1. Complete vendor assessment form\n2. Insurance verification\n3. Legal contract approval\n4. System access setup" : "Operational procedures are in the *Operations Handbook*. Contact your department manager for specific questions."}`,
    };

    return {
      content: responses[activeDepartment] || "I understand your question. Let me search our knowledge base for the most relevant information.",
      sources: departmentSources[activeDepartment] || [],
    };
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date(),
        sources: aiResponse.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, feedback: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );

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
        <AnalyticsDashboard />
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
