// Shared legal-research filter definitions used by the research home page and
// the results page, so both surfaces stay in sync. Selections are carried
// between the two pages as URL search params, then mapped to the server-side
// SearchFilters contract (spec §4.5 / §5.6).

import type { ContentType, ResearchMode, SearchFilters } from "@delaw/types";

export type FilterDimension = keyof Pick<
  SearchFilters,
  "jurisdictions" | "courts" | "subjectAreas" | "contentTypes"
>;

export type FilterGroup = {
  label: string;
  /** URL search-param key used to carry this group's selection. */
  param: string;
  dimension: FilterDimension;
  opts: { label: string; value: string }[];
};

// `value` is what the API receives; `label` is what the user sees. Legal-area
// values are matched as substrings server-side (e.g. "Constitutional" matches
// the stored "Constitutional Law").
export const FILTER_GROUPS: FilterGroup[] = [
  {
    label: "Jurisdiction",
    param: "jur",
    dimension: "jurisdictions",
    opts: [
      { label: "Nigeria", value: "NG" },
      { label: "Ghana", value: "GH" },
      { label: "Kenya", value: "KE" },
      { label: "South Africa", value: "ZA" },
    ],
  },
  {
    label: "Court",
    param: "court",
    dimension: "courts",
    opts: [
      { label: "Supreme Court", value: "Supreme Court" },
      { label: "Court of Appeal", value: "Court of Appeal" },
      { label: "Federal High Court", value: "Federal High Court" },
      { label: "State High Court", value: "State High Court" },
    ],
  },
  {
    label: "Legal area",
    param: "area",
    dimension: "subjectAreas",
    opts: [
      { label: "Land Law", value: "Land Law" },
      { label: "Constitutional", value: "Constitutional" },
      { label: "Commercial", value: "Commercial" },
    ],
  },
  {
    label: "Source",
    param: "src",
    dimension: "contentTypes",
    opts: [
      { label: "Case Law", value: "CASE_LAW" },
      { label: "Legislation", value: "STATUTE" },
      { label: "Regulations", value: "REGULATION" },
    ],
  },
];

export type DateOption = {
  label: string;
  value: string;
  yearFrom?: number;
  yearTo?: number;
};

// Date is a single-select preset (the API takes year_from / year_to).
export const DATE_OPTIONS: DateOption[] = [
  { label: "Any time", value: "" },
  { label: "2020 – present", value: "2020-", yearFrom: 2020 },
  { label: "2010 – present", value: "2010-", yearFrom: 2010 },
  { label: "2000 – present", value: "2000-", yearFrom: 2000 },
  { label: "Before 2000", value: "-1999", yearTo: 1999 },
];

export const filterKey = (label: string, value: string) => `${label}:${value}`;

/** Every option ticked — the default, unconstrained state. */
export function allChecked(): Set<string> {
  return new Set(
    FILTER_GROUPS.flatMap((g) => g.opts.map((o) => filterKey(g.label, o.value))),
  );
}

/** A group constrains results only when some — but not all — options are on. */
function constrainedSelection(
  group: FilterGroup,
  checked: Set<string>,
): string[] | null {
  const selected = group.opts.filter((o) =>
    checked.has(filterKey(group.label, o.value)),
  );
  if (selected.length === 0 || selected.length === group.opts.length) return null;
  return selected.map((o) => o.value);
}

/**
 * Build the server-side filter payload from the checkbox state + date preset.
 * A group with all (or none) of its options ticked imposes no constraint, so
 * the default "everything on" state returns the full corpus.
 */
export function buildFilters(
  checked: Set<string>,
  mode: ResearchMode,
  dateValue: string,
): SearchFilters {
  const filters: SearchFilters = {};
  for (const group of FILTER_GROUPS) {
    const values = constrainedSelection(group, checked);
    if (!values) continue;
    if (group.dimension === "contentTypes") {
      filters.contentTypes = values as ContentType[];
    } else {
      filters[group.dimension] = values;
    }
  }
  // The Case Law Search mode always restricts to case law.
  if (mode === "CASE_LAW") filters.contentTypes = ["CASE_LAW"];

  const date = DATE_OPTIONS.find((d) => d.value === dateValue);
  if (date?.yearFrom != null) filters.yearFrom = date.yearFrom;
  if (date?.yearTo != null) filters.yearTo = date.yearTo;
  return filters;
}

/** Encode constrained groups + date preset into URL params (omitting defaults). */
export function filtersToParams(
  checked: Set<string>,
  dateValue: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const group of FILTER_GROUPS) {
    const values = constrainedSelection(group, checked);
    if (values) out[group.param] = values.join(",");
  }
  if (dateValue) out.date = dateValue;
  return out;
}

// Accepts both URLSearchParams and Next's ReadonlyURLSearchParams.
type ParamGetter = { get(name: string): string | null };

/** Decode the checkbox state from URL params; absent group params default to all-on. */
export function checkedFromParams(params: ParamGetter): Set<string> {
  const set = new Set<string>();
  for (const group of FILTER_GROUPS) {
    const raw = params.get(group.param);
    const valid = new Set(group.opts.map((o) => o.value));
    const values = raw ? raw.split(",") : group.opts.map((o) => o.value);
    for (const v of values) if (valid.has(v)) set.add(filterKey(group.label, v));
  }
  return set;
}

export function dateFromParams(params: ParamGetter): string {
  const v = params.get("date") ?? "";
  return DATE_OPTIONS.some((d) => d.value === v) ? v : "";
}

/** Short summary for a pill label, e.g. "Court · 2" or "Nigeria". */
export function groupSummary(group: FilterGroup, checked: Set<string>): string {
  const selected = group.opts.filter((o) =>
    checked.has(filterKey(group.label, o.value)),
  );
  if (selected.length === 0 || selected.length === group.opts.length) {
    return group.label === "Jurisdiction" ? "All jurisdictions" : `Any ${group.label.toLowerCase()}`;
  }
  if (selected.length === 1) return selected[0]!.label;
  return `${group.label} · ${selected.length}`;
}
