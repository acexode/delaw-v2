"use client";

import {
  Archive,
  Briefcase,
  Download,
  FileText,
  FolderPlus,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FilterPill } from "@/components/research/filter-pill";
import { NewDocumentModal } from "@/components/documents/new-document-modal";
import { useDocuments, useFolders } from "@/hooks/useDocuments";
import { documentsApi, foldersApi } from "@/lib/api-client";
import {
  DOC_STATUSES,
  DOC_STATUS_META,
  DOC_TYPES,
  DOC_TYPE_META,
  badgeStyle,
  relativeTime,
} from "@/lib/documents";
import type { DocumentListItem } from "@delaw/types";

const DATE_OPTIONS = [
  { label: "Any time", value: "" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
];

function withinDate(iso: string, range: string): boolean {
  if (!range) return true;
  const ms = Date.now() - new Date(iso).getTime();
  if (range === "today") return ms < 24 * 3600_000;
  if (range === "week") return ms < 7 * 24 * 3600_000;
  if (range === "month") return ms < 31 * 24 * 3600_000;
  return true;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [matterFilter, setMatterFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | "none" | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);

  const { folders, reload: reloadFolders } = useFolders();
  // Fetch by server-side filters; folder + date filtering is applied client-side
  // so per-folder counts can be computed from the same set.
  const { documents, status, error, reload } = useDocuments(
    useMemo(
      () => ({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
      [typeFilter, statusFilter],
    ),
  );

  const matters = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of documents) {
      if (d.matterId && d.matterTitle) map.set(d.matterId, d.matterTitle);
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [documents]);

  const visible = useMemo(
    () =>
      documents.filter(
        (d) =>
          (folderId === null || d.folderId === folderId) &&
          (!matterFilter || d.matterId === matterFilter) &&
          withinDate(d.updatedAt, dateFilter),
      ),
    [documents, folderId, matterFilter, dateFilter],
  );

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of documents) {
      if (d.folderId) counts.set(d.folderId, (counts.get(d.folderId) ?? 0) + 1);
    }
    return counts;
  }, [documents]);

  const toggleSel = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearSel = () => setSelected(new Set());

  const moveDoc = async (docId: string, target: string | null) => {
    try {
      await documentsApi.update(docId, { folderId: target });
      reload();
    } catch {
      setToast("Could not move the document");
    }
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    await Promise.all(ids.map((id) => documentsApi.remove(id).catch(() => null)));
    clearSel();
    reload();
    setToast(`${ids.length} document${ids.length > 1 ? "s" : ""} deleted`);
  };

  const bulkExport = () => {
    const rows = visible.filter((d) => selected.has(d.id));
    const lines = rows.map(
      (d) =>
        `- ${d.title} [${DOC_TYPE_META[d.type].label}]${d.matterTitle ? ` — ${d.matterTitle}` : ""}`,
    );
    const blob = new Blob([`# Documents\n\n${lines.join("\n")}`], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documents.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const newFolder = async () => {
    const name = window.prompt("New folder name");
    if (!name?.trim()) return;
    try {
      await foldersApi.create({ name: name.trim() });
      reloadFolders();
    } catch {
      setToast("Could not create folder");
    }
  };

  const folderIcon = (idx: number) =>
    idx === 0 ? Briefcase : idx % 3 === 0 ? Archive : FileText;

  return (
    <div className="flex h-full min-h-0">
      {/* Folder sidebar */}
      <aside className="flex w-[220px] flex-none flex-col overflow-y-auto border-r border-line-subtle bg-bg-900 p-3.5">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{ background: "linear-gradient(135deg,#D4B25E,#C9A84C)" }}
          className="mb-4 flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-bold text-gold-ink"
        >
          <Plus size={16} /> New Document
        </button>

        <div className="flex flex-col gap-0.5">
          <FolderRow
            label="All Documents"
            count={documents.length}
            icon={FileText}
            active={folderId === null}
            dragOver={dragOverFolder === "none"}
            onClick={() => setFolderId(null)}
            onDragOver={() => setDragOverFolder("none")}
            onDragLeave={() => setDragOverFolder(null)}
            onDrop={(docId) => {
              setDragOverFolder(null);
              void moveDoc(docId, null);
            }}
          />
          {folders.map((f, i) => (
            <FolderRow
              key={f.id}
              label={f.name}
              count={folderCounts.get(f.id) ?? 0}
              icon={folderIcon(i)}
              active={folderId === f.id}
              dragOver={dragOverFolder === f.id}
              onClick={() => setFolderId(f.id)}
              onDragOver={() => setDragOverFolder(f.id)}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={(docId) => {
                setDragOverFolder(null);
                void moveDoc(docId, f.id);
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => void newFolder()}
          className="mt-3 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-text-muted hover:bg-bg-hover hover:text-text-body"
        >
          <FolderPlus size={15} /> New folder
        </button>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-16 pt-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <h1 className="font-serif text-[22px] font-semibold text-text-cream">
              My Documents
            </h1>
            <span className="text-[12px] text-text-faint">
              {visible.length} document{visible.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <FilterPill
              label="Type"
              summary={
                typeFilter
                  ? DOC_TYPE_META[typeFilter as keyof typeof DOC_TYPE_META]
                      .label
                  : "Type"
              }
              options={DOC_TYPES.map((t) => ({
                label: DOC_TYPE_META[t].label,
                value: t,
              }))}
              isOn={(v) => v === typeFilter}
              onPick={(v) => setTypeFilter((p) => (p === v ? "" : v))}
            />
            <FilterPill
              label="Matter"
              summary={
                matterFilter
                  ? (matters.find((m) => m.value === matterFilter)?.label ??
                    "Matter")
                  : "Matter"
              }
              options={matters}
              isOn={(v) => v === matterFilter}
              onPick={(v) => setMatterFilter((p) => (p === v ? "" : v))}
            />
            <FilterPill
              label="Date"
              summary={
                DATE_OPTIONS.find((d) => d.value === dateFilter)?.label ?? "Date"
              }
              options={DATE_OPTIONS}
              isOn={(v) => v === dateFilter}
              onPick={(v) => setDateFilter(v)}
            />
            <FilterPill
              label="Status"
              summary={
                statusFilter
                  ? DOC_STATUS_META[
                      statusFilter as keyof typeof DOC_STATUS_META
                    ].label
                  : "Status"
              }
              options={DOC_STATUSES.map((s) => ({
                label: DOC_STATUS_META[s].label,
                value: s,
              }))}
              isOn={(v) => v === statusFilter}
              onPick={(v) => setStatusFilter((p) => (p === v ? "" : v))}
            />
            <div className="flex rounded-lg border border-line bg-bg-850 p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`flex h-[26px] items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-semibold ${
                  view === "grid"
                    ? "bg-gold text-gold-ink"
                    : "text-text-muted hover:text-text-body"
                }`}
              >
                <LayoutGrid size={13} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`flex h-[26px] items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-semibold ${
                  view === "list"
                    ? "bg-gold text-gold-ink"
                    : "text-text-muted hover:text-text-body"
                }`}
              >
                <List size={13} /> List
              </button>
            </div>
          </div>
        </div>

        {status === "loading" ? (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-[repeat(auto-fill,minmax(216px,1fr))] gap-3.5"
                : "flex flex-col gap-2"
            }
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`animate-pulse rounded-[13px] border border-line bg-bg-700 ${
                  view === "grid" ? "h-[150px]" : "h-[52px]"
                }`}
              />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-start gap-3 rounded-[13px] border border-line bg-bg-700 p-6">
            <p className="text-[13px] text-text-muted">
              {error ?? "Could not load documents."}
            </p>
            <button
              type="button"
              onClick={reload}
              className="rounded-lg border border-line-strong bg-bg-750 px-3 py-1.5 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
            >
              Retry
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-[13px] border border-dashed border-line bg-bg-700 p-10 text-center">
            <FileText size={26} className="mx-auto mb-3 text-text-faint" />
            <h3 className="font-serif text-base text-text-cream">
              No documents here yet
            </h3>
            <p className="mt-1 text-[13px] text-text-muted">
              Create a new document or drag one into this folder.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-3 py-2 text-[12.5px] font-semibold text-text-body hover:border-gold"
            >
              <Plus size={14} /> New Document
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(216px,1fr))] gap-3.5">
            {visible.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                selected={selected.has(d.id)}
                onToggle={() => toggleSel(d.id)}
                onOpen={() => router.push(`/documents/${d.id}`)}
              />
            ))}
          </div>
        ) : (
          <DocList
            docs={visible}
            selected={selected}
            onToggle={toggleSel}
            onOpen={(id) => router.push(`/documents/${id}`)}
          />
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-rise items-center gap-3 rounded-xl border border-gold/30 bg-bg-600 px-4 py-2.5 shadow-card">
          <span className="text-[12.5px] font-semibold text-gold">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={bulkExport}
            className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-2.5 py-1.5 text-[12px] font-semibold text-text-body hover:border-line-accent"
          >
            <Download size={13} /> Export
          </button>
          <button
            type="button"
            onClick={() => void bulkDelete()}
            className="flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-2.5 py-1.5 text-[12px] font-semibold text-danger hover:bg-danger/20"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            type="button"
            onClick={clearSel}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-body"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <NewDocumentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        folderId={folderId}
        onCreated={reload}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-line-strong bg-bg-600 px-4 py-2.5 text-[12.5px] text-text-body shadow-card">
          {toast}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-3 text-gold"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function FolderRow({
  label,
  count,
  icon: Icon,
  active,
  dragOver,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label: string;
  count: number;
  icon: typeof FileText;
  active: boolean;
  dragOver: boolean;
  onClick: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (docId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const docId = e.dataTransfer.getData("text/document-id");
        if (docId) onDrop(docId);
      }}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
        dragOver
          ? "bg-gold/15 ring-1 ring-gold"
          : active
            ? "bg-gold/10 font-semibold text-text-cream"
            : "font-medium text-text-muted hover:bg-bg-hover"
      }`}
    >
      <Icon size={16} className={active ? "text-gold" : "text-text-muted"} />
      <span className="flex-1 truncate">{label}</span>
      <span className="font-mono text-[10.5px] text-text-faint">{count}</span>
    </button>
  );
}

function DocCard({
  doc,
  selected,
  onToggle,
  onOpen,
}: {
  doc: DocumentListItem;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const meta = DOC_TYPE_META[doc.type];
  return (
    <div
      draggable
      onDragStart={(e) =>
        e.dataTransfer.setData("text/document-id", doc.id)
      }
      onClick={onOpen}
      className={`group relative cursor-pointer rounded-[13px] border bg-bg-700 p-[15px] transition hover:border-line-accent ${
        selected ? "border-gold" : "border-line"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          style={badgeStyle(meta.color)}
          className="rounded-[5px] px-[7px] py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em]"
        >
          {meta.label}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] transition ${
            selected
              ? "border-gold bg-gold text-gold-ink"
              : "border-line-accent text-transparent opacity-0 group-hover:opacity-100"
          }`}
        >
          {selected && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      <div className="mb-1.5 font-serif text-[14px] font-semibold leading-[1.35] text-text-cream">
        {doc.title}
      </div>
      <div className="mb-3.5 text-[11px] text-gold-muted">
        {doc.matterTitle ?? "No matter"}
      </div>
      <div className="flex items-center justify-between border-t border-line-subtle pt-2.5">
        <span className="text-[11px] text-text-faint">
          {relativeTime(doc.updatedAt)}
        </span>
        <span
          title={doc.editorName ?? undefined}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-line-accent bg-[linear-gradient(140deg,#2b3650,#1a2233)] text-[9.5px] font-bold text-gold"
        >
          {doc.editorInitials}
        </span>
      </div>
    </div>
  );
}

function DocList({
  docs,
  selected,
  onToggle,
  onOpen,
}: {
  docs: DocumentListItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[13px] border border-line bg-bg-750">
      <div className="grid grid-cols-[34px_2.4fr_1fr_1.4fr_0.9fr] border-b border-line-subtle px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-faint">
        <span />
        <span>Name</span>
        <span>Type</span>
        <span>Matter</span>
        <span>Modified</span>
      </div>
      {docs.map((d) => {
        const meta = DOC_TYPE_META[d.type];
        const sel = selected.has(d.id);
        return (
          <div
            key={d.id}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("text/document-id", d.id)
            }
            onClick={() => onOpen(d.id)}
            className={`grid cursor-pointer grid-cols-[34px_2.4fr_1fr_1.4fr_0.9fr] items-center border-t border-line-subtle px-4 py-3 transition hover:bg-bg-hover ${
              sel ? "bg-gold/[0.06]" : ""
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(d.id);
              }}
              className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] ${
                sel
                  ? "border-gold bg-gold text-gold-ink"
                  : "border-line-accent text-transparent"
              }`}
            >
              {sel && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span className="truncate text-[13px] font-semibold text-text-body">
              {d.title}
            </span>
            <span>
              <span
                style={badgeStyle(meta.color)}
                className="rounded-[5px] px-[7px] py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em]"
              >
                {meta.label}
              </span>
            </span>
            <span className="truncate text-[12px] text-text-muted">
              {d.matterTitle ?? "—"}
            </span>
            <span className="text-[12px] text-text-faint">
              {relativeTime(d.updatedAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
