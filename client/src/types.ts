export type DocumentStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export interface DocumentDto {
  id: string;
  workspaceId: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  status: DocumentStatus;
  failureReason?: string;
  uploadedAt: string;
}

export type MessageRole = "user" | "ai";

export interface CitationDto {
  id: string;
  messageId: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  excerptText: string;
}

export interface MessageDto {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  citations: CitationDto[];
  noAnswer?: boolean;
}

export interface ChatSessionDto {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
