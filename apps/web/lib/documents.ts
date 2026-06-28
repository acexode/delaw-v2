import type { DocStatus, DocType } from "@delaw/types";

// Document type → display label + accent colour. Colours follow the DeLaw
// design (dashboard.dc.html typeColors), extended for every spec §3.3 doc_type.
export const DOC_TYPE_META: Record<DocType, { label: string; color: string }> = {
  PLEADING: { label: "Pleading", color: "#3B82F6" },
  CONTRACT: { label: "Contract", color: "#10B981" },
  BRIEF: { label: "Brief", color: "#C9A84C" },
  MEMO: { label: "Memo", color: "#8B95A8" },
  TEMPLATE: { label: "Template", color: "#A78BFA" },
  RESEARCH: { label: "Research", color: "#A78BFA" },
  GENERATED: { label: "Generated", color: "#C9A84C" },
  UPLOADED: { label: "Uploaded", color: "#8B95A8" },
};

export const DOC_TYPES: DocType[] = [
  "PLEADING",
  "CONTRACT",
  "BRIEF",
  "MEMO",
  "RESEARCH",
  "GENERATED",
  "UPLOADED",
];

export const DOC_STATUSES: DocStatus[] = ["DRAFT", "REVIEW", "FINAL", "ARCHIVED"];

export const DOC_STATUS_META: Record<
  DocStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: "Draft", color: "#8B95A8" },
  REVIEW: { label: "In Review", color: "#F59E0B" },
  FINAL: { label: "Final", color: "#10B981" },
  ARCHIVED: { label: "Archived", color: "#5C6678" },
};

export const TEMPLATE_CATEGORIES = [
  "All",
  "Commercial Agreements",
  "Litigation",
  "Corporate",
  "Employment",
  "Real Estate",
  "Intellectual Property",
  "Criminal",
  "Family Law",
];

/** Inline style for a type/status badge using its accent colour. */
export function badgeStyle(color: string): React.CSSProperties {
  return {
    color,
    background: `${color}1f`,
    border: `1px solid ${color}55`,
  };
}

/** Compact relative time like the design ("2h ago", "Yesterday", "3 days ago"). */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} wk ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function initialsFrom(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}
