// Document + folder domain types — shared between the Node API and web client.
// Mirror the document/folder routes (apps/api/src/routes/documents.ts,
// folders.ts, spec §4.4) and the spec §3.3 enums (doc_type, doc_status).

export type DocType =
  | "PLEADING"
  | "CONTRACT"
  | "BRIEF"
  | "MEMO"
  | "TEMPLATE"
  | "RESEARCH"
  | "GENERATED"
  | "UPLOADED";

export type DocStatus = "DRAFT" | "REVIEW" | "FINAL" | "ARCHIVED";

/** A row in the documents hub list (GET /api/v1/documents). */
export interface DocumentListItem {
  id: string;
  title: string;
  type: DocType;
  status: DocStatus;
  folderId: string | null;
  matterId: string | null;
  matterTitle: string | null;
  fileUrl: string | null;
  fileName: string | null;
  wordCount: number | null;
  version: number;
  createdBy: string;
  editorName: string | null;
  editorAvatar: string | null;
  editorInitials: string;
  updatedAt: string;
}

/** A full document (GET /api/v1/documents/:id). */
export interface DocumentDetail {
  id: string;
  organisationId: string;
  folderId: string | null;
  matterId: string | null;
  createdBy: string;
  title: string;
  type: DocType;
  status: DocStatus;
  content: string | null;
  contentHtml: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  wordCount: number | null;
  jurisdiction: string | null;
  version: number;
  isTemplate: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string | null;
}

export interface DocumentListResponse {
  documents: DocumentListItem[];
}

export interface DocumentResponse {
  document: DocumentDetail;
}

export interface CreateDocumentRequest {
  title: string;
  type?: DocType;
  status?: DocStatus;
  folderId?: string | null;
  matterId?: string | null;
  content?: string;
  contentHtml?: string;
  jurisdiction?: string;
  templateId?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  type?: DocType;
  status?: DocStatus;
  folderId?: string | null;
  matterId?: string | null;
  content?: string;
  contentHtml?: string;
  jurisdiction?: string;
}

export interface DocumentVersionSummary {
  id: string;
  version: number;
  title: string;
  wordCount: number | null;
  createdBy?: string;
  authorName?: string | null;
  authorInitials?: string;
  createdAt: string;
}

export interface DocumentVersionsResponse {
  versions: DocumentVersionSummary[];
}

export interface DocumentVersionResponse {
  version: DocumentVersionSummary;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  matterId: string | null;
  createdAt: string;
}

export interface FoldersResponse {
  folders: Folder[];
}

export interface FolderResponse {
  folder: Folder;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
  matterId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
}

export type TemplateSource = "official" | "firm";

export interface TemplateSummary {
  id: string;
  name: string;
  type: DocType;
  jurisdiction: string | null;
  category: string;
  source: TemplateSource;
  uses: number;
}

export interface TemplatesResponse {
  templates: TemplateSummary[];
}
