import fs from "fs";
import path from "path";
import {
  ChatSessionRecord,
  DocumentChunkRecord,
  DocumentRecord,
  MessageRecord,
  WorkspaceRecord,
} from "../types";

/**
 * MVP persistence: in-memory + write-through JSON file.
 * Thay bằng Relational DB (Postgres) + Vector DB thật khi lên production
 * (xem docs/05-SADD/SADD-DocuChat-AI.md).
 */

interface DbShape {
  workspaces: WorkspaceRecord[];
  documents: DocumentRecord[];
  chunks: DocumentChunkRecord[];
  sessions: ChatSessionRecord[];
  messages: MessageRecord[];
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function loadInitial(): DbShape {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as DbShape;
    } catch {
      // file hỏng -> bỏ qua, bắt đầu lại
    }
  }
  return { workspaces: [], documents: [], chunks: [], sessions: [], messages: [] };
}

const db: DbShape = loadInitial();

function persist() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export const store = {
  // ---- Workspace ----
  getOrCreateDefaultWorkspace(): WorkspaceRecord {
    let ws = db.workspaces[0];
    if (!ws) {
      ws = { id: "default-workspace", name: "Workspace mặc định", createdAt: new Date().toISOString() };
      db.workspaces.push(ws);
      persist();
    }
    return ws;
  },

  // ---- Documents ----
  addDocument(doc: DocumentRecord) {
    db.documents.push(doc);
    persist();
  },
  updateDocument(id: string, patch: Partial<DocumentRecord>) {
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) return undefined;
    Object.assign(doc, patch);
    persist();
    return doc;
  },
  getDocument(id: string) {
    return db.documents.find((d) => d.id === id);
  },
  listDocuments(workspaceId: string) {
    return db.documents
      .filter((d) => d.workspaceId === workspaceId)
      .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
  },
  deleteDocument(id: string) {
    db.documents = db.documents.filter((d) => d.id !== id);
    db.chunks = db.chunks.filter((c) => c.documentId !== id);
    persist();
  },

  // ---- Chunks ----
  addChunks(chunks: DocumentChunkRecord[]) {
    db.chunks.push(...chunks);
    persist();
  },
  listChunksForWorkspace(workspaceId: string): DocumentChunkRecord[] {
    const docIds = new Set(db.documents.filter((d) => d.workspaceId === workspaceId && d.status === "READY").map((d) => d.id));
    return db.chunks.filter((c) => docIds.has(c.documentId));
  },
  listChunksForDocument(documentId: string) {
    return db.chunks
      .filter((c) => c.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  },

  // ---- Chat sessions ----
  createSession(session: ChatSessionRecord) {
    db.sessions.push(session);
    persist();
  },
  listSessions(workspaceId: string) {
    return db.sessions
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  getSession(id: string) {
    return db.sessions.find((s) => s.id === id);
  },
  renameSession(id: string, title: string) {
    const s = db.sessions.find((x) => x.id === id);
    if (!s) return undefined;
    s.title = title;
    s.updatedAt = new Date().toISOString();
    persist();
    return s;
  },
  touchSession(id: string) {
    const s = db.sessions.find((x) => x.id === id);
    if (s) {
      s.updatedAt = new Date().toISOString();
      persist();
    }
  },

  // ---- Messages ----
  addMessage(message: MessageRecord) {
    db.messages.push(message);
    persist();
  },
  listMessages(sessionId: string) {
    return db.messages
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
};
