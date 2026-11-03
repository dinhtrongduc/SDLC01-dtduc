export type DocumentStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  status: DocumentStatus;
  failureReason?: string;
  storagePath: string;
  uploadedAt: string;
}

export interface DocumentChunkRecord {
  id: string;
  documentId: string;
  pageNumber: number;
  chunkIndex: number;
  textContent: string;
  embedding: number[];
}

export type MessageRole = "user" | "ai";

export interface CitationRecord {
  id: string;
  messageId: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  excerptText: string;
}

export interface MessageRecord {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  citations: CitationRecord[];
  noAnswer?: boolean;
}

export interface ChatSessionRecord {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: string;
}
