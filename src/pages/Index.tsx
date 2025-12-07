import { useState, useRef, useEffect } from "react";
import { ChatMessage, Message } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { DepartmentNav, Department } from "@/components/DepartmentNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const responses: Record<Department, string> = {
      HR: `Based on our HR policies and procedures, I can help you with that. Our employee handbook states that ${userMessage.toLowerCase().includes("leave") ? "leave requests should be submitted at least 2 weeks in advance through the HRMS portal. You'll need approval from your direct manager and HR." : userMessage.toLowerCase().includes("remote") ? "remote work requests are evaluated on a case-by-case basis. You can submit a request through the employee portal with justification and expected duration." : "you can find detailed information in the employee handbook section 4.2. Please reach out to HR if you need specific guidance."}`,
      Finance: `According to our financial policies, ${userMessage.toLowerCase().includes("expense") ? "expense reports must be submitted within 30 days with original receipts. All expenses over $500 require manager approval before submission." : userMessage.toLowerCase().includes("budget") ? "budget allocation follows a quarterly review process. Department heads submit proposals which are reviewed by the finance committee." : "our financial procedures ensure compliance and transparency. For specific questions, please consult the Finance Policy Document v2.3."}`,
      IT: `From an IT perspective, ${userMessage.toLowerCase().includes("software") ? "software requests should be submitted through the IT service portal. All requests are reviewed for security compliance and licensing before approval." : userMessage.toLowerCase().includes("security") ? "data security is paramount. All employees must follow our information security policy including strong passwords, MFA, and regular security training." : "our IT policies ensure secure and efficient operations. Please refer to the IT Operations Manual for detailed procedures."}`,
      Operations: `Based on operational guidelines, ${userMessage.toLowerCase().includes("procurement") ? "all procurement must follow the standard three-quote process for purchases over $5,000. Contact the procurement team for vendor recommendations." : userMessage.toLowerCase().includes("vendor") ? "vendor onboarding requires completion of our vendor assessment form, insurance verification, and contract approval from legal." : "operational procedures are documented in our Operations Handbook. Specific questions should be directed to your department manager."}`,
    };

    return (
      responses[activeDepartment] ||
      "I understand your question. Let me search our knowledge base for the most relevant information. This would typically pull from our integrated systems including S3 policies, SharePoint documents, and DKM records."
    );
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
        content: aiResponse,
        timestamp: new Date(),
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
      />

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
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs text-muted-foreground">AI Online</span>
              </div>
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
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onFeedback={handleFeedback}
                    />
                  ))
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
    </div>
  );
};

export default Index;
