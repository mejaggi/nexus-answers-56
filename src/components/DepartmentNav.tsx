import { Building2, Users, DollarSign, Settings, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export type Department = "HR" | "Finance" | "IT" | "Operations";

interface DepartmentNavProps {
  activeDepartment: Department;
  onDepartmentChange: (dept: Department) => void;
}

const departments: { name: Department; icon: typeof Users; color: string }[] = [
  { name: "HR", icon: Users, color: "text-accent" },
  { name: "Finance", icon: DollarSign, color: "text-accent" },
  { name: "IT", icon: Settings, color: "text-accent" },
  { name: "Operations", icon: Briefcase, color: "text-accent" },
];

export const DepartmentNav = ({
  activeDepartment,
  onDepartmentChange,
}: DepartmentNavProps) => {
  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
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
        {departments.map((dept) => {
          const Icon = dept.icon;
          const isActive = activeDepartment === dept.name;

          return (
            <button
              key={dept.name}
              onClick={() => onDepartmentChange(dept.name)}
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
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          Connected to S3, SharePoint, DKM
        </div>
      </div>
    </div>
  );
};
