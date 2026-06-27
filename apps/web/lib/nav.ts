import {
  Home,
  Search,
  CircleCheckBig,
  FileText,
  SquarePen,
  Scale,
  BookOpen,
  Briefcase,
  Sparkles,
  Receipt,
  Workflow,
  Users,
  Palette,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  dot?: boolean;
};

export type NavGroup = {
  /** Group heading shown above the items (omitted for the top-level item). */
  label?: string;
  items: NavItem[];
};

/**
 * Primary application navigation.
 *
 * Group structure mirrors the DeLaw design (dashboard.dc.html sidebar:
 * RESEARCH / DOCUMENTS / CASES / AI TOOLS / PRACTICE / SYSTEM). Route paths
 * follow the spec §6.1 App Router structure exactly.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: Home }],
  },
  {
    label: "Research",
    items: [
      { label: "Legal Research", href: "/research", icon: Search, dot: true },
      { label: "Citation Check", href: "/citation-check", icon: CircleCheckBig },
    ],
  },
  {
    label: "Documents",
    items: [
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "Draft", href: "/documents/new", icon: SquarePen },
      { label: "Contract Analysis", href: "/contracts", icon: Scale },
      { label: "Templates", href: "/documents/templates", icon: BookOpen },
    ],
  },
  {
    label: "Cases",
    items: [{ label: "Case Management", href: "/matters", icon: Briefcase }],
  },
  {
    label: "AI Tools",
    items: [
      { label: "Legal Chat", href: "/chat", icon: Sparkles },
      { label: "Proofreading", href: "/proofread", icon: CircleCheckBig },
      { label: "Summarise", href: "/summarise", icon: BookOpen },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Clients", href: "/clients", icon: Users },
      { label: "Billing", href: "/billing", icon: Receipt },
      { label: "Workflows", href: "/workflows", icon: Workflow },
    ],
  },
  {
    label: "System",
    items: [{ label: "Design System", href: "/design-system", icon: Palette }],
  },
];

/** Flat lookup of route path → page title (used for header breadcrumbs). */
export const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/research": "Legal Research",
  "/citation-check": "Citation Check",
  "/documents": "Documents",
  "/documents/new": "Draft",
  "/documents/templates": "Templates",
  "/contracts": "Contract Analysis",
  "/matters": "Case Management",
  "/chat": "Legal Chat",
  "/proofread": "Proofreading",
  "/summarise": "Summarise",
  "/clients": "Clients",
  "/billing": "Billing",
  "/workflows": "Workflows",
  "/design-system": "Design System",
  "/settings/account": "Settings",
};

export function getRouteTitle(pathname: string): string {
  const exact = ROUTE_TITLES[pathname];
  if (exact) return exact;
  const match = Object.keys(ROUTE_TITLES)
    .filter((p) => pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return (match && ROUTE_TITLES[match]) || "DeLaw";
}
