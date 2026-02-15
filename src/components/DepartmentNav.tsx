import { Building2, Users, DollarSign, Settings, Briefcase, BarChart3, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export type Department = "HR" | "Finance" | "IT" | "Operations";

interface DepartmentNavProps {
  activeDepartment: Department;
  onDepartmentChange: (dept: Department) => void;
  showAnalytics: boolean;
  onAnalyticsToggle: () => void;
}

const departments: { name: Department; icon: typeof Users; color: string }[] = [
  { name: "HR", icon: Users, color: "text-accent" },
  { name: "Finance", icon: DollarSign, color: "text-accent" },
  { name: "IT", icon: Settings, color: "text-accent" },
  { name: "Operations", icon: Briefcase, color: "text-accent" },
];

const NavContent = ({
  activeDepartment,
  onDepartmentChange,
  showAnalytics,
  onAnalyticsToggle,
  onItemClick,
}: DepartmentNavProps & { onItemClick?: () => void }) => (
  <div className="h-full bg-sidebar flex flex-col">
    <div className="p-6 border-b border-sidebar-border">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
          <Building2 className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-sidebar-foreground">Enterprise AI</h1>
          <p className="text-xs text-sidebar-foreground/60">Knowledge Assistant</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 p-4 space-y-2">
      <div className="space-y-2">
        {departments.map((dept) => {
          const Icon = dept.icon;
          const isActive = activeDepartment === dept.name && !showAnalytics;

          return (
            <button
              key={dept.name}
              onClick={() => {
                onDepartmentChange(dept.name);
                if (showAnalytics) onAnalyticsToggle();
                onItemClick?.();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && dept.color)} />
              <span className="font-medium">{dept.name}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-4 mt-4 border-t border-sidebar-border">
        <button
          onClick={() => {
            onAnalyticsToggle();
            onItemClick?.();
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            showAnalytics
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <BarChart3 className={cn("h-5 w-5", showAnalytics && "text-accent")} />
          <span className="font-medium">Analytics</span>
        </button>
      </div>
    </nav>

    <div className="p-4 border-t border-sidebar-border">
      <div className="text-xs text-sidebar-foreground/50 text-center">
        Connected to S3, SharePoint, DKM
      </div>
    </div>
  </div>
);

export const DepartmentNav = (props: DepartmentNavProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-3 z-50 bg-card shadow-medium border border-border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
          <NavContent {...props} onItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="h-full border-r border-sidebar-border">
      <NavContent {...props} />
    </div>
  );
};
