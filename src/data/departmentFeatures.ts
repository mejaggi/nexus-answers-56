import {
  FileSearch,
  CalendarClock,
  Ticket,
  PackageSearch,
  Wifi,
  KeyRound,
  Receipt,
  Wallet,
  TrendingUp,
  ClipboardList,
  Truck,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { Department } from "@/components/DepartmentNav";

export type FeatureAction =
  | { kind: "prompt"; prompt: string }
  | { kind: "flow"; flow: "cv-scan" | "software-request" };

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  action: FeatureAction;
}

export const departmentFeatures: Record<Department, Feature[]> = {
  HR: [
    {
      id: "cv-scan",
      title: "CV → JD Fitment Scan",
      description: "Upload a CV and a job description to get a fitment score, gaps and strengths.",
      icon: FileSearch,
      badge: "Agent",
      action: { kind: "flow", flow: "cv-scan" },
    },
    {
      id: "leave",
      title: "Leave & Time Off",
      description: "Check balances, holiday calendar, or start a leave request.",
      icon: CalendarClock,
      action: { kind: "prompt", prompt: "Help me start a leave request and show my current balance." },
    },
    {
      id: "policy",
      title: "Policy Lookup",
      description: "Ask any HR policy question and get cited answers from the handbook.",
      icon: ClipboardList,
      action: { kind: "prompt", prompt: "What is the policy for remote work requests?" },
    },
    {
      id: "benefits",
      title: "Benefits Explorer",
      description: "Health, retirement, learning credits — explained for your grade.",
      icon: Wallet,
      action: { kind: "prompt", prompt: "Walk me through my benefits package." },
    },
  ],
  IT: [
    {
      id: "software",
      title: "Software Request",
      description: "Request a license or new tool with justification — routed to your manager.",
      icon: PackageSearch,
      badge: "Form",
      action: { kind: "flow", flow: "software-request" },
    },
    {
      id: "room",
      title: "Book a Meeting Room",
      description: "Find and book an available room by floor, capacity and time.",
      icon: CalendarClock,
      action: { kind: "prompt", prompt: "Book me a meeting room for 4 people tomorrow 2-3pm." },
    },
    {
      id: "ticket",
      title: "Ticket Status",
      description: "Check status of your open IT tickets and recent updates.",
      icon: Ticket,
      action: { kind: "prompt", prompt: "Show the status of my open IT tickets." },
    },
    {
      id: "vpn",
      title: "VPN / Network Diagnostic",
      description: "Guided diagnostic that probes your connection and suggests fixes.",
      icon: Wifi,
      badge: "Agent",
      action: { kind: "prompt", prompt: "Run a VPN and network diagnostic for my laptop." },
    },
    {
      id: "password",
      title: "Password Reset",
      description: "Securely reset your AD password with MFA verification.",
      icon: KeyRound,
      badge: "Agent",
      action: { kind: "prompt", prompt: "Help me reset my password (with MFA)." },
    },
  ],
  Finance: [
    {
      id: "expense",
      title: "Submit Expense",
      description: "Capture receipts and submit an expense report.",
      icon: Receipt,
      action: { kind: "prompt", prompt: "Help me submit an expense report." },
    },
    {
      id: "budget",
      title: "Budget Status",
      description: "See your cost center's burn vs. budget for the period.",
      icon: TrendingUp,
      action: { kind: "prompt", prompt: "Show my cost center's budget burn this quarter." },
    },
    {
      id: "approval",
      title: "CapEx Approval",
      description: "Start a capital expenditure approval workflow.",
      icon: ClipboardList,
      action: { kind: "prompt", prompt: "Walk me through the CapEx approval process." },
    },
  ],
  Operations: [
    {
      id: "procure",
      title: "Procurement Guide",
      description: "Vendor onboarding, PO thresholds, and approval matrix.",
      icon: Truck,
      action: { kind: "prompt", prompt: "Explain the procurement and vendor onboarding process." },
    },
    {
      id: "incident",
      title: "Report Operational Issue",
      description: "Log an operations incident with category and severity.",
      icon: AlertTriangle,
      action: { kind: "prompt", prompt: "I want to report an operational issue." },
    },
  ],
};

export const departmentTagline: Record<Department, string> = {
  HR: "People, policies and growth — at your fingertips.",
  IT: "Self-serve support, faster than a ticket.",
  Finance: "Budgets, expenses and approvals — explained.",
  Operations: "Procurement, vendors and on-the-floor support.",
};
