"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Download,
  Highlighter,
  History,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Redo2,
  RotateCw,
  Share2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAutoSave } from "@/hooks/useDocuments";
import { useResearchStream } from "@/hooks/useResearch";
import { DOC_STATUSES, DOC_STATUS_META } from "@/lib/documents";
import type { DocStatus, DocumentDetail, ResearchRequest } from "@delaw/types";

import { VersionHistory } from "./version-history";

interface Heading {
  level: number;
  text: string;
  pos: number;
}

const QUICK_ACTIONS = [
  { id: "proofread", label: "Proofread selection" },
  { id: "research", label: "Research related cases" },
  { id: "clause", label: "Suggest next clause" },
  { id: "citations", label: "Check citations" },
] as const;

export function DocumentEditor({ doc }: { doc: DocumentDetail }) {
  const [title, setTitle] = useState(doc.title);
  const [statusValue, setStatusValue] = useState<DocStatus>(doc.status);
  const [statusOpen, setStatusOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [wordCount, setWordCount] = useState(doc.wordCount ?? 0);
  const [aiOpen, setAiOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const save = useAutoSave(doc.id);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Typography,
      Underline,
      Highlight,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
      Placeholder.configure({
        placeholder: "Start drafting your document, or use a template…",
      }),
    ],
    content:
      doc.contentHtml ??
      (doc.content
        ? doc.content
            .split(/\n+/)
            .map((line) => `<p>${escapeHtml(line)}</p>`)
            .join("")
        : "<p></p>"),
    editorProps: {
      attributes: {
        class: "min-h-[60vh] focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      save.schedule({ content: ed.getText(), contentHtml: ed.getHTML() });
      setWordCount(ed.storage.characterCount.words());
      refreshHeadings(ed);
    },
  });

  const refreshHeadings = useCallback((ed: NonNullable<typeof editor>) => {
    const items: Heading[] = [];
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        items.push({
          level: node.attrs.level as number,
          text: node.textContent || "Untitled section",
          pos,
        });
      }
    });
    setHeadings(items);
  }, []);

  useEffect(() => {
    if (editor) {
      refreshHeadings(editor);
      setWordCount(editor.storage.characterCount.words());
    }
  }, [editor, refreshHeadings]);

  const onTitle = (value: string) => {
    setTitle(value);
    save.schedule({ title: value });
  };

  const onStatus = (value: DocStatus) => {
    setStatusValue(value);
    setStatusOpen(false);
    save.schedule({ status: value });
    void save.saveNow();
  };

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos + 1).run();
    const dom = editor.view.domAtPos(pos + 1).node as HTMLElement | null;
    const el = dom?.nodeType === 1 ? dom : dom?.parentElement;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const exportAs = async (format: "pdf" | "docx") => {
    setExportOpen(false);
    await save.saveNow();
    const html = editor?.getHTML() ?? "";
    if (format === "pdf") {
      const win = window.open("", "_blank");
      if (!win) {
        setToast("Allow pop-ups to export as PDF");
        return;
      }
      win.document.write(
        `<html><head><title>${escapeHtml(title)}</title><style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7;color:#111}h1,h2,h3{font-family:Georgia,serif}</style></head><body><h1>${escapeHtml(title)}</h1>${html}</body></html>`,
      );
      win.document.close();
      win.focus();
      win.print();
    } else {
      const docHtml = `<!DOCTYPE html><html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${html}</body></html>`;
      const blob = new Blob([docHtml], { type: "application/msword" });
      downloadBlob(blob, `${safeFileName(title)}.doc`);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Document link copied to clipboard");
    } catch {
      setToast("Could not copy link");
    }
  };

  // --- AI panel (grounded research) ---
  const [aiInput, setAiInput] = useState("");
  const [aiRequest, setAiRequest] = useState<ResearchRequest | null>(null);
  const ai = useResearchStream(aiRequest);

  const runAi = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setAiRequest({ query: trimmed, mode: "QUICK", jurisdiction: "NG" });
  };

  const quickAction = (id: (typeof QUICK_ACTIONS)[number]["id"]) => {
    const selection = editor
      ? editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          " ",
        )
      : "";
    const context = selection || title;
    const prompts: Record<string, string> = {
      proofread: `Proofread this passage for grammar, clarity and Nigerian legal citation form: ${context}`,
      research: `Find Nigerian authorities relevant to: ${context}`,
      clause: `Suggest the next clause for a ${doc.type.toLowerCase()} titled "${title}".`,
      citations: `Identify and verify the Nigerian case citations referenced in: ${context}`,
    };
    setAiInput(prompts[id] ?? "");
    runAi(prompts[id] ?? "");
  };

  const insertCitation = (text: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(` ${text} `).run();
    setToast("Citation inserted into the draft");
  };

  const dividers = "mx-1 h-5 w-px bg-line";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex flex-none flex-wrap items-center gap-3 border-b border-line-subtle bg-bg-850 px-5 py-2.5">
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          className="min-w-0 flex-1 bg-transparent font-serif text-[17px] font-semibold text-text-cream outline-none"
          placeholder="Untitled document"
        />
        <button
          type="button"
          onClick={() => setToast("Linking a matter needs the Matters module (coming soon).")}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-2.5 text-[12px] font-semibold text-gold-muted hover:border-line-accent"
        >
          {doc.matterId ? "Matter linked" : "Link matter"}
        </button>

        {/* Status badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((v) => !v)}
            style={{
              color: DOC_STATUS_META[statusValue].color,
              background: `${DOC_STATUS_META[statusValue].color}1f`,
              border: `1px solid ${DOC_STATUS_META[statusValue].color}55`,
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold uppercase tracking-[0.04em]"
          >
            {DOC_STATUS_META[statusValue].label}
            <ChevronDown size={12} />
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-9 z-30 w-36 rounded-[10px] border border-line bg-bg-800 p-1.5 shadow-card">
              {DOC_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatus(s)}
                  className="flex w-full items-center justify-between rounded-[7px] px-2 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-bg-700"
                >
                  {DOC_STATUS_META[s].label}
                  {s === statusValue && <Check size={13} className="text-gold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void share()}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-2.5 text-[12px] font-semibold text-text-body hover:border-line-accent"
        >
          <Share2 size={14} /> Share
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-2.5 text-[12px] font-semibold text-text-body hover:border-line-accent"
          >
            <Download size={14} /> Export <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-9 z-30 w-32 rounded-[10px] border border-line bg-bg-800 p-1.5 shadow-card">
              <button
                type="button"
                onClick={() => void exportAs("pdf")}
                className="block w-full rounded-[7px] px-2 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-bg-700"
              >
                Export as PDF
              </button>
              <button
                type="button"
                onClick={() => void exportAs("docx")}
                className="block w-full rounded-[7px] px-2 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-bg-700"
              >
                Export as DOCX
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-2.5 text-[12px] font-semibold text-text-body hover:border-line-accent"
        >
          <History size={14} /> History
        </button>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex flex-none flex-wrap items-center gap-1 border-b border-line-subtle bg-bg-900 px-4 py-2">
          <TbBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
            <Bold size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
            <Italic size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
            <UnderlineIcon size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
            <Strikethrough size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")}>
            <Highlighter size={15} />
          </TbBtn>
          <span className={dividers} />
          {[1, 2, 3].map((level) => (
            <TbBtn
              key={level}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()
              }
              active={editor.isActive("heading", { level })}
            >
              <span className="text-[12.5px] font-bold">H{level}</span>
            </TbBtn>
          ))}
          <span className={dividers} />
          <TbBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
            <List size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
            <ListOrdered size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
            <span className="text-[13px] font-semibold">❝</span>
          </TbBtn>
          <span className={dividers} />
          <TbBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
            <AlignLeft size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
            <AlignCenter size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
            <AlignRight size={15} />
          </TbBtn>
          <span className={dividers} />
          <TbBtn onClick={setLink} active={editor.isActive("link")}>
            <Link2 size={15} />
          </TbBtn>
          <span className={dividers} />
          <TbBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 size={15} />
          </TbBtn>
          <TbBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 size={15} />
          </TbBtn>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className={`flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition ${
                aiOpen
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "border-line-strong bg-bg-750 text-text-muted hover:border-line-accent"
              }`}
            >
              Ask DeLaw
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* TOC sidebar */}
        <aside className="hidden w-[240px] flex-none flex-col overflow-y-auto border-r border-line-subtle bg-bg-900 p-4 lg:flex">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-faint">
            Table of contents
          </div>
          {headings.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-text-faint">
              Headings you add (H1–H3) will appear here automatically.
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {headings.map((h, i) => (
                <button
                  key={`${h.pos}-${i}`}
                  type="button"
                  onClick={() => scrollToHeading(h.pos)}
                  style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                  className="truncate rounded-md py-1.5 pr-2 text-left text-[12.5px] text-text-muted hover:bg-bg-hover hover:text-text-body"
                >
                  {h.text}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Editor page */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-bg-base py-8">
          <div
            className="delaw-editor mx-auto w-[720px] max-w-[92%] rounded-md border border-line bg-bg-800 px-[60px] py-[54px] shadow-card"
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* AI panel */}
        {aiOpen && (
          <aside className="flex w-80 flex-none flex-col border-l border-line-subtle bg-bg-900">
            <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
              <span className="flex items-center gap-2 font-serif text-sm font-semibold text-text-cream">
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-gold/30 bg-gold/10 text-gold">
                  <RotateCw size={12} />
                </span>
                Ask DeLaw
              </span>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="text-text-faint hover:text-text-body"
              >
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {ai.status === "idle" ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[12.5px] leading-relaxed text-text-muted">
                    Ask a question about Nigerian law, or use a quick action to
                    work on the current selection.
                  </p>
                </div>
              ) : ai.status === "error" ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-[12.5px] text-text-muted">
                    {ai.error === "INSUFFICIENT_CREDITS"
                      ? "You have used all of your AI credits for this billing period."
                      : "The request failed. Please try again."}
                  </p>
                  {ai.error !== "INSUFFICIENT_CREDITS" && (
                    <button
                      type="button"
                      onClick={ai.retry}
                      className="rounded-lg border border-line-strong bg-bg-750 px-3 py-1.5 text-[12px] font-semibold text-text-body hover:border-line-accent"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[12.5px] leading-[1.65] text-text-secondary">
                  {ai.status === "loading" && !ai.answer ? (
                    <div className="flex flex-col gap-2">
                      {[100, 92, 84].map((w) => (
                        <div
                          key={w}
                          className="h-3 animate-pulse rounded bg-bg-600"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <span className="whitespace-pre-wrap">{ai.answer}</span>
                      {(ai.status === "streaming" || ai.status === "loading") && (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-gold align-text-bottom" />
                      )}
                      {ai.sources.length > 0 && ai.status === "complete" && (
                        <div className="mt-3 flex flex-col gap-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text-faint">
                            Authorities
                          </div>
                          {ai.sources.slice(0, 6).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                insertCitation(s.citation ?? s.title)
                              }
                              className="rounded-lg border border-line bg-bg-750 px-2.5 py-2 text-left hover:border-gold"
                            >
                              <div className="font-mono text-[10.5px] text-gold">
                                {s.citation ?? s.title}
                              </div>
                              <div className="mt-0.5 text-[11px] text-text-muted">
                                Click to insert
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex-none border-t border-line-subtle p-3">
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => quickAction(a.id)}
                    className="rounded-full border border-line-strong bg-bg-750 px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-gold hover:text-gold"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-bg-750 px-3 py-2 focus-within:border-gold">
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      runAi(aiInput);
                    }
                  }}
                  rows={1}
                  placeholder="Ask DeLaw anything…"
                  className="max-h-24 min-h-[20px] flex-1 resize-none bg-transparent text-[12.5px] text-text-body outline-none"
                />
                <button
                  type="button"
                  onClick={() => runAi(aiInput)}
                  disabled={!aiInput.trim()}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gold text-gold-ink disabled:opacity-40"
                >
                  {ai.status === "loading" || ai.status === "streaming" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RotateCw size={14} />
                  )}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-none items-center gap-4 border-t border-line-subtle bg-bg-850 px-5 py-2 text-[11.5px]">
        <SaveIndicator status={save.status} lastSavedAt={save.lastSavedAt} onRetry={save.retry} />
        <span className="ml-auto font-mono text-text-faint">
          {wordCount.toLocaleString()} word{wordCount === 1 ? "" : "s"}
        </span>
      </div>

      {historyOpen && (
        <VersionHistory
          documentId={doc.id}
          onClose={() => setHistoryOpen(false)}
          onSaved={() => setToast("Version saved")}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-lg border border-line-strong bg-bg-600 px-4 py-2.5 text-[12.5px] text-text-body shadow-card">
          {toast}
          <button type="button" onClick={() => setToast(null)} className="ml-3 text-gold">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function TbBtn({
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[30px] min-w-[30px] items-center justify-center rounded-lg px-1.5 transition disabled:opacity-30 ${
        active
          ? "bg-gold/15 text-gold"
          : "text-text-muted hover:bg-bg-hover hover:text-text-body"
      }`}
    >
      {children}
    </button>
  );
}

function SaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: {
  status: ReturnType<typeof useAutoSave>["status"];
  lastSavedAt: Date | null;
  onRetry: () => void;
}) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-text-muted">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-2 text-danger">
        Failed to save
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-danger/40 px-1.5 py-0.5 text-[11px] font-semibold hover:bg-danger/10"
        >
          Retry
        </button>
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-success">
        <Check size={13} /> Saved
        {lastSavedAt && (
          <span className="text-text-faint">
            {lastSavedAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </span>
    );
  }
  return <span className="text-text-faint">All changes saved</span>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "document";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
