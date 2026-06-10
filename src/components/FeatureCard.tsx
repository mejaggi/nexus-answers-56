import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Feature } from "@/data/departmentFeatures";
import { tap } from "@/lib/native";

interface Props {
  feature: Feature;
  onActivate: (f: Feature) => void;
}

export const FeatureCard = ({ feature, onActivate }: Props) => {
  const Icon = feature.icon;
  const handleClick = () => {
    tap();
    onActivate(feature);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      className={cn(
        "group relative overflow-hidden p-5 cursor-pointer border-border",
        "bg-card hover:bg-card/80 transition-all duration-200",
        "hover:shadow-medium hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-accent/15 flex items-center justify-center text-accent">
          <Icon className="h-5 w-5" />
        </div>
        {feature.badge && (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {feature.badge}
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-3">{feature.description}</p>
      <div className="mt-4 flex items-center text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
        Open <ArrowRight className="h-3 w-3 ml-1" />
      </div>
    </Card>
  );
};
