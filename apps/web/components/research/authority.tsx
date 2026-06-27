import { Check, Minus, X } from "lucide-react";
import type { ReactNode } from "react";

// Authority-status presentation (spec §3.3 + design dashboard.dc.html):
// GOOD_LAW ✓ green | OVERRULED ✗ red | DISTINGUISHED ~ amber | DOUBTED amber.
type Meta = {
  label: string;
  icon: ReactNode;
  className: string;
  dot: string;
};

export function authorityMeta(status: string): Meta {
  switch (status) {
    case "OVERRULED":
      return {
        label: "Overruled",
        icon: <X size={12} strokeWidth={2.5} />,
        className: "bg-danger/15 text-danger",
        dot: "bg-danger",
      };
    case "DISTINGUISHED":
      return {
        label: "Distinguished",
        icon: <Minus size={12} strokeWidth={2.5} />,
        className: "bg-warning/15 text-warning",
        dot: "bg-warning",
      };
    case "DOUBTED":
      return {
        label: "Doubted",
        icon: <Minus size={12} strokeWidth={2.5} />,
        className: "bg-warning/15 text-warning",
        dot: "bg-warning",
      };
    default:
      return {
        label: "Good Law",
        icon: <Check size={12} strokeWidth={2.5} />,
        className: "bg-success/15 text-success",
        dot: "bg-success",
      };
  }
}

export function AuthorityBadge({ status }: { status: string }) {
  const meta = authorityMeta(status);
  return (
    <span
      className={`inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}
