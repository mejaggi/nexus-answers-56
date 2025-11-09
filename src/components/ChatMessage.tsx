import { useState } from "react";
import { ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "like" | "dislike";
}

interface ChatMessageProps {
  message: Message;
  onFeedback: (messageId: string, feedback: "like" | "dislike") => void;
}

export const ChatMessage = ({ message, onFeedback }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-4 p-6 rounded-xl transition-all duration-300",
        isUser ? "bg-muted/50" : "bg-card"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-semibold text-sm shadow-soft",
          isUser
            ? "bg-gradient-primary text-primary-foreground"
            : "bg-gradient-accent text-accent-foreground"
        )}
      >
        {isUser ? "You" : "AI"}
      </div>

      <div className="flex-1 space-y-3">
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{message.timestamp.toLocaleTimeString()}</span>

          {!isUser && (
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 hover:bg-muted",
                  message.feedback === "like" && "text-accent"
                )}
                onClick={() => onFeedback(message.id, "like")}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 hover:bg-muted",
                  message.feedback === "dislike" && "text-destructive"
                )}
                onClick={() => onFeedback(message.id, "dislike")}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
