import { useRef, useEffect, useState } from "react";
import { Home } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { DepartmentNav, Department } from "@/components/DepartmentNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TypingIndicator } from "@/components/TypingIndicator";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { LanguageChips, Language, translateText } from "@/components/LanguageChips";
import { DepartmentLanding } from "@/components/DepartmentLanding";
import { CVScanDialog } from "@/components/flows/CVScanDialog";
import { SoftwareRequestDialog } from "@/components/flows/SoftwareRequestDialog";
import type { Feature } from "@/data/departmentFeatures";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAwsChat } from "@/hooks/useAwsChat";
import { tap } from "@/lib/native";

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

type View = "landing" | "chat";

const Index = () => {
  const [activeDepartment, setActiveDepartment] = useState<Department>("HR");
  const [view, setView] = useState<View>("landing");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [cvOpen, setCvOpen] = useState(false);
  const [swOpen, setSwOpen] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    messageId: string;
    messageContent: string;
  }>({ open: false, messageId: "", messageContent: "" });
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    handleFeedback: chatHandleFeedback,
    analytics,
  } = useAwsChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  // Return to landing whenever the user switches departments
  const handleDepartmentChange = (d: Department) => {
    setActiveDepartment(d);
    setView("landing");
  };

  const handleSendMessage = async (content: string) => {
    if (view === "landing") setView("chat");
    const prefix =
      language === "en"
        ? ""
        : `[Respond in ${language === "fr" ? "French" : "Filipino"}] `;
    await sendMessage(prefix + content, activeDepartment);
  };

  const handleFeedback = (messageId: string, feedback: "like" | "dislike") => {
    chatHandleFeedback(messageId, feedback);
    toast({ title: "Feedback received", description: "Thank you for helping us improve!" });
  };

  const handleDislikeWithTicket = (messageId: string, messageContent: string) => {
    setFeedbackDialog({ open: true, messageId, messageContent });
  };

  const handleActivateFeature = (f: Feature) => {
    if (f.action.kind === "flow") {
      if (f.action.flow === "cv-scan") setCvOpen(true);
      if (f.action.flow === "software-request") setSwOpen(true);
      return;
    }
    // prompt action -> open chat and send
    handleSendMessage(f.action.prompt);
  };

  return (
    <div className="flex h-screen bg-gradient-subtle">
      <DepartmentNav
        activeDepartment={activeDepartment}
        onDepartmentChange={handleDepartmentChange}
        showAnalytics={showAnalytics}
        onAnalyticsToggle={() => setShowAnalytics(!showAnalytics)}
      />

      {showAnalytics ? (
        <AnalyticsDashboard analyticsData={analytics.getAggregatedAnalytics()} />
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border bg-card shadow-soft px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className={isMobile ? "ml-12" : ""}>
                <h2 className="text-lg md:text-2xl font-bold text-foreground">
                  {activeDepartment} Assistant
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {view === "landing"
                    ? `Browse capabilities for ${activeDepartment.toLowerCase()}`
                    : `Ask me anything about ${activeDepartment.toLowerCase()} policies`}
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                {view === "chat" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      tap();
                      setView("landing");
                    }}
                    className="hidden sm:inline-flex"
                  >
                    <Home className="h-4 w-4 mr-1.5" /> Overview
                  </Button>
                )}
                <LanguageChips
                  value={language}
                  onChange={setLanguage}
                  className="hidden sm:flex"
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    AI Online
                  </span>
                </div>
                <ThemeToggle />
                <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-primary/20">
                  <AvatarImage
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=employee"
                    alt="User"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    EM
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {/* Mobile language chips + overview row */}
            <div className="mt-3 sm:hidden flex items-center justify-between gap-2">
              <LanguageChips value={language} onChange={setLanguage} />
              {view === "chat" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    tap();
                    setView("landing");
                  }}
                >
                  <Home className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>

          {view === "landing" ? (
            <DepartmentLanding
              department={activeDepartment}
              onActivate={handleActivateFeature}
              onOpenChat={() => {
                tap();
                setView("chat");
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 overflow-hidden">
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <ScrollArea className="flex-1" ref={scrollRef}>
                  <div className="space-y-4 pr-2 md:pr-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8 md:py-12">
                        <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-4 shadow-medium">
                          <span className="text-xl md:text-2xl font-bold text-accent-foreground">
                            AI
                          </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                          {activeDepartment} chat
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md px-4">
                          Ask a question or pick a suggested prompt.
                        </p>
                        {isMobile && (
                          <div className="mt-6 w-full">
                            <SuggestedPrompts
                              prompts={departmentPrompts[activeDepartment]}
                              onPromptClick={handleSendMessage}
                              department={activeDepartment}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <ChatMessage
                            key={message.id}
                            message={
                              message.role === "assistant"
                                ? {
                                    ...message,
                                    content: translateText(message.content, language),
                                  }
                                : message
                            }
                            onFeedback={handleFeedback}
                            onDislikeWithTicket={handleDislikeWithTicket}
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
                  placeholder={`Ask about ${activeDepartment.toLowerCase()} policies...`}
                />
              </div>

              {!isMobile && (
                <div className="w-80">
                  <SuggestedPrompts
                    prompts={departmentPrompts[activeDepartment]}
                    onPromptClick={handleSendMessage}
                    department={activeDepartment}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <CVScanDialog open={cvOpen} onOpenChange={setCvOpen} />
      <SoftwareRequestDialog open={swOpen} onOpenChange={setSwOpen} />

      <FeedbackDialog
        open={feedbackDialog.open}
        onOpenChange={(open) => setFeedbackDialog((prev) => ({ ...prev, open }))}
        messageId={feedbackDialog.messageId}
        messageContent={feedbackDialog.messageContent}
        department={activeDepartment}
      />
    </div>
  );
};

export default Index;
