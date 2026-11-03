import { ChatSessionDto, DocumentDto, MessageDto } from "./types";

const BASE = "/api";

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getWorkspace() {
  const res = await fetch(`${BASE}/workspace`);
  return asJson<{ workspace: { id: string; name: string } }>(res);
}

export async function listDocuments() {
  const res = await fetch(`${BASE}/documents`);
  return asJson<{ documents: DocumentDto[] }>(res);
}

export async function uploadDocuments(files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${BASE}/documents`, { method: "POST", body: form });
  return asJson<{ documents: DocumentDto[] }>(res);
}

export async function deleteDocument(id: string) {
  const res = await fetch(`${BASE}/documents/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Xóa tài liệu thất bại");
  }
}

export async function retryDocument(id: string) {
  const res = await fetch(`${BASE}/documents/${id}/retry`, { method: "POST" });
  return asJson<{ document: DocumentDto }>(res);
}

export async function getDocumentPage(documentId: string, pageNumber: number) {
  const res = await fetch(`${BASE}/documents/${documentId}/pages/${pageNumber}`);
  return asJson<{ documentId: string; documentName: string; pageNumber: number; text: string }>(res);
}

export async function listSessions() {
  const res = await fetch(`${BASE}/sessions`);
  return asJson<{ sessions: ChatSessionDto[] }>(res);
}

export async function createSession(title?: string) {
  const res = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return asJson<{ session: ChatSessionDto }>(res);
}

export async function renameSession(id: string, title: string) {
  const res = await fetch(`${BASE}/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return asJson<{ session: ChatSessionDto }>(res);
}

export async function listMessages(sessionId: string) {
  const res = await fetch(`${BASE}/sessions/${sessionId}/messages`);
  return asJson<{ messages: MessageDto[] }>(res);
}

export interface StreamHandlers {
  onToken: (token: string) => void;
  onDone: (message: MessageDto) => void;
  onError: (error: string) => void;
}

/**
 * Gửi câu hỏi và đọc phản hồi dạng Server-Sent Events thủ công
 * (fetch + ReadableStream, vì EventSource gốc không hỗ trợ POST body).
 */
export async function sendMessageStream(sessionId: string, content: string, handlers: StreamHandlers) {
  let res: Response;
  try {
    res = await fetch(`${BASE}/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch {
    handlers.onError("Mất kết nối — đang thử kết nối lại");
    return;
  }

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    handlers.onError(body.error ?? "Gửi câu hỏi thất bại");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminated = false;

  try {
    while (!terminated) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        if (parseSseEvent(rawEvent, handlers)) terminated = true;
      }
    }
  } catch {
    handlers.onError("Mất kết nối — đang thử kết nối lại");
    return;
  }

  if (!terminated) {
    // Kết nối đóng giữa chừng mà chưa nhận được event "done"/"error" (PRD §4.2)
    handlers.onError("Mất kết nối khi đang trả lời");
  }
}

/** Trả về true nếu đây là event kết thúc stream (done/error). */
function parseSseEvent(raw: string, handlers: StreamHandlers): boolean {
  let eventName = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return false;

  const parsed = JSON.parse(data);
  if (eventName === "done") {
    handlers.onDone(parsed.message as MessageDto);
    return true;
  }
  if (eventName === "error") {
    handlers.onError(parsed.error as string);
    return true;
  }
  if (typeof parsed.token === "string") {
    handlers.onToken(parsed.token);
  }
  return false;
}
