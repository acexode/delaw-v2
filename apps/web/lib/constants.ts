import type { OrgType, SubscriptionPlan } from "@delaw/types";

// Static option sets for the registration flow. Content matches main.html;
// pricing matches spec §10.1 (authoritative).

export type AccountTypeKey = "individual" | "firm" | "corporate" | "judiciary";

export interface AccountTypeOption {
  key: AccountTypeKey;
  title: string;
  desc: string;
  /** lucide-react icon name resolved in the page. */
  icon: "user" | "building2" | "briefcase" | "scale";
  /** org_type used when this account type does not customise it in step 3. */
  defaultOrgType: OrgType;
}

export const ACCOUNT_TYPES: AccountTypeOption[] = [
  {
    key: "individual",
    title: "Individual Lawyer",
    desc: "Solo practitioners & advocates in private practice.",
    icon: "user",
    defaultOrgType: "SOLO",
  },
  {
    key: "firm",
    title: "Law Firm / Chambers",
    desc: "Partnerships & chambers with multiple lawyers.",
    icon: "building2",
    defaultOrgType: "LAW_FIRM",
  },
  {
    key: "corporate",
    title: "Corporate Legal Team",
    desc: "In-house counsel & company legal departments.",
    icon: "briefcase",
    defaultOrgType: "CORPORATE",
  },
  {
    key: "judiciary",
    title: "Judiciary / Court",
    desc: "Judges, registrars & court administration.",
    icon: "scale",
    defaultOrgType: "JUDICIARY",
  },
];

/** Organisation type select (step 3) — maps directly to the org_type enum. */
export const ORG_TYPE_OPTIONS: { value: OrgType; label: string }[] = [
  { value: "LAW_FIRM", label: "Law Firm" },
  { value: "CHAMBERS", label: "Chambers" },
  { value: "CORPORATE", label: "Corporate / In-house" },
  { value: "JUDICIARY", label: "Judiciary / Court" },
  { value: "SOLO", label: "Solo Practice" },
];

/** Primary jurisdiction select — value is the 2-letter country code. */
export const JURISDICTIONS: { value: string; label: string }[] = [
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
  { value: "RW", label: "Rwanda" },
];

export const DIAL_CODES: { value: string; label: string }[] = [
  { value: "+234", label: "🇳🇬 +234" },
  { value: "+233", label: "🇬🇭 +233" },
  { value: "+254", label: "🇰🇪 +254" },
  { value: "+27", label: "🇿🇦 +27" },
  { value: "+44", label: "🇬🇧 +44" },
  { value: "+1", label: "🇺🇸 +1" },
];

export const LAWYER_COUNTS = ["1", "2–5", "6–20", "20–50", "50+"];

export const PRACTICE_AREAS = [
  "Commercial",
  "Litigation",
  "Energy & Natural Resources",
  "Intellectual Property",
  "Employment",
  "Real Estate",
  "Criminal",
  "Family",
  "Banking & Finance",
  "Tax",
  "Corporate / M&A",
  "Maritime",
];

// 36 states + FCT (37 entries).
export const NIGERIA_STATES = [
  "Lagos",
  "FCT — Abuja",
  "Rivers",
  "Kano",
  "Oyo",
  "Kaduna",
  "Enugu",
  "Anambra",
  "Delta",
  "Edo",
  "Ogun",
  "Abia",
  "Akwa Ibom",
  "Imo",
  "Plateau",
  "Cross River",
  "Ondo",
  "Osun",
  "Ekiti",
  "Kwara",
  "Benue",
  "Niger",
  "Borno",
  "Bauchi",
  "Sokoto",
  "Kebbi",
  "Adamawa",
  "Taraba",
  "Gombe",
  "Yobe",
  "Jigawa",
  "Katsina",
  "Zamfara",
  "Nasarawa",
  "Kogi",
  "Ebonyi",
  "Bayelsa",
];

export interface PlanOption {
  key: SubscriptionPlan;
  name: string;
  price: string;
  unit: string;
  recommended?: boolean;
  features: string[];
}

// Pricing per spec §10.1 (NGN/month).
export const PLANS: PlanOption[] = [
  {
    key: "FREE",
    name: "Free",
    price: "₦0",
    unit: "free forever",
    features: ["1 seat", "20 AI credits / mo", "Research only", "5 matters"],
  },
  {
    key: "SOLO",
    name: "Solo",
    price: "₦15,000",
    unit: "/ month",
    features: [
      "1 seat",
      "200 AI credits / mo",
      "All AI tools",
      "50 matters · 10GB storage",
    ],
  },
  {
    key: "PROFESSIONAL",
    name: "Professional",
    price: "₦35,000",
    unit: "/ month",
    recommended: true,
    features: [
      "3 seats",
      "500 AI credits / mo",
      "All features",
      "200 matters · 50GB storage",
    ],
  },
  {
    key: "FIRM",
    name: "Firm",
    price: "₦120,000",
    unit: "/ month",
    features: [
      "10 seats",
      "2,000 AI credits / mo",
      "Workflows & automation",
      "Unlimited matters · 200GB",
    ],
  },
];

export interface ChecklistItem {
  key: string;
  title: string;
  desc: string;
  action: string;
  href: string;
}

export const ONBOARDING_ITEMS: ChecklistItem[] = [
  {
    key: "profile",
    title: "Complete your profile",
    desc: "Add your bar number, photo and signature so documents are filing-ready.",
    action: "Complete profile",
    href: "/settings/account",
  },
  {
    key: "matter",
    title: "Add your first matter",
    desc: "Open a case file to start tracking deadlines, documents and time.",
    action: "Add a matter",
    href: "/matters",
  },
  {
    key: "research",
    title: "Run your first research query",
    desc: "Ask DeLaw AI a question and get verified Nigerian authorities in seconds.",
    action: "Try research",
    href: "/research",
  },
  {
    key: "doc",
    title: "Draft your first document",
    desc: "Generate a court-ready brief or contract with AI assistance.",
    action: "Draft a document",
    href: "/documents",
  },
  {
    key: "team",
    title: "Invite a team member",
    desc: "Bring colleagues into your chambers workspace to collaborate.",
    action: "Send an invite",
    href: "/settings/team",
  },
  {
    key: "billing",
    title: "Set up billing",
    desc: "Add a payment method to continue after your 14-day free trial.",
    action: "Add payment method",
    href: "/billing",
  },
];

/** Password strength scorer mirroring main.html `pwStrength`. */
export function passwordStrength(value: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
  const colors = ["#EF4444", "#EF4444", "#F59E0B", "#10B981", "#10B981"];
  return {
    score,
    label: value ? labels[score] ?? "" : "",
    color: colors[score] ?? "#EF4444",
  };
}
