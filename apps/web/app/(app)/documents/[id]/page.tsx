"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { DocumentEditor } from "@/components/documents/editor";
import { useDocument } from "@/hooks/useDocuments";

export default function DocumentEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? null;
  const { data, status, error, reload } = useDocument(id);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex h-full flex-col">
        <div className="h-12 flex-none animate-pulse border-b border-line-subtle bg-bg-850" />
        <div className="h-10 flex-none animate-pulse border-b border-line-subtle bg-bg-900" />
        <div className="flex-1 bg-bg-base py-8">
          <div className="mx-auto h-[60vh] w-[720px] max-w-[92%] animate-pulse rounded-md border border-line bg-bg-800" />
        </div>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="font-serif text-lg text-text-cream">
          {error ?? "Document not found"}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reload}
            className="rounded-lg border border-line-strong bg-bg-750 px-3 py-1.5 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.push("/documents")}
            className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-bg-750 px-3 py-1.5 text-[12.5px] font-semibold text-text-body hover:border-line-accent"
          >
            <ArrowLeft size={14} /> Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return <DocumentEditor key={data.id} doc={data} />;
}
