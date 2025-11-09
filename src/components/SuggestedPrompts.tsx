import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  department: string;
}

export const SuggestedPrompts = ({
  prompts,
  onPromptClick,
  department,
}: SuggestedPromptsProps) => {
  return (
    <Card className="p-6 bg-card border-border shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">
          Suggested Questions for {department}
        </h3>
      </div>
      <div className="grid gap-2">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="ghost"
            className="justify-start text-left h-auto py-3 px-4 hover:bg-muted/50 transition-colors"
            onClick={() => onPromptClick(prompt)}
          >
            <span className="text-sm text-muted-foreground">{prompt}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
