import { MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeatureCard } from "@/components/FeatureCard";
import { departmentFeatures, departmentTagline, type Feature } from "@/data/departmentFeatures";
import type { Department } from "@/components/DepartmentNav";

interface Props {
  department: Department;
  onActivate: (f: Feature) => void;
  onOpenChat: () => void;
}

export const DepartmentLanding = ({ department, onActivate, onOpenChat }: Props) => {
  const features = departmentFeatures[department];

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 md:p-10 shadow-medium relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              {department} Workspace
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">
              Welcome to the {department} Assistant
            </h1>
            <p className="text-sm md:text-base opacity-90 max-w-xl mb-5">
              {departmentTagline[department]}
            </p>
            <Button
              onClick={onOpenChat}
              size="lg"
              variant="secondary"
              className="shadow-soft"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Open chat
            </Button>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-8 md:mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              What can I do for you?
            </h2>
            <span className="text-xs text-muted-foreground">
              {features.length} capabilities
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {features.map((f) => (
              <FeatureCard key={f.id} feature={f} onActivate={onActivate} />
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-10">
          Tip: every capability also works by just asking in chat.
        </p>
      </div>
    </ScrollArea>
  );
};
