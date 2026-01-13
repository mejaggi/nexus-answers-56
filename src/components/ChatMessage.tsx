import { useState } from "react";
import { ThumbsUp, ThumbsDown, Copy, Check, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export interface Source {
  title: string;
  type: "policy" | "document" | "link";
  reference?: string;
}

export interface AnalyticsMetadata {
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
  error?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "like" | "dislike";
  sources?: Source[];
  analytics?: AnalyticsMetadata;
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
        <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2">{children}</pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-medium">Sources:</span>
            {message.sources.map((source, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 text-xs bg-muted/60 hover:bg-muted px-2 py-1 rounded-md cursor-pointer transition-colors"
              >
                {source.type === "link" ? (
                  <ExternalLink className="h-3 w-3 text-primary" />
                ) : (
                  <FileText className="h-3 w-3 text-primary" />
                )}
                <span className="text-foreground/80">{source.title}</span>
              </div>
            ))}
          </div>
        )}

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
