import { Router } from "express";
import { v4 as uuid } from "uuid";
import { store } from "../db/store";
import { generateAnswer } from "../services/ragService";
import { CitationRecord, MessageRecord } from "../types";

export const chatRouter = Router();

function getWorkspaceId() {
  return store.getOrCreateDefaultWorkspace().id;
}

// GET /api/sessions — danh sách phiên chat (PRD Story 4.1)
chatRouter.get("/sessions", (_req, res) => {
  const workspaceId = getWorkspaceId();
  res.json({ sessions: store.listSessions(workspaceId) });
});

// POST /api/sessions — tạo phiên chat mới
chatRouter.post("/sessions", (req, res) => {
  const workspaceId = getWorkspaceId();
  const now = new Date().toISOString();
  const session = {
    id: uuid(),
    workspaceId,
    title: (req.body?.title as string) || "Phiên chat mới",
    createdAt: now,
    updatedAt: now,
  };
  store.createSession(session);
  res.status(201).json({ session });
});

// PATCH /api/sessions/:id — đổi tên phiên chat (PRD Story 4.2)
chatRouter.patch("/sessions/:id", (req, res) => {
  const title = (req.body?.title as string)?.trim();
  if (!title) return res.status(400).json({ error: "Tên phiên không được để trống" });

  const session = store.renameSession(req.params.id, title);
  if (!session) return res.status(404).json({ error: "Không tìm thấy phiên chat" });
  res.json({ session });
});

// GET /api/sessions/:id/messages — lịch sử hội thoại (PRD Story 4.1)
chatRouter.get("/sessions/:id/messages", (req, res) => {
  const session = store.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Không tìm thấy phiên chat" });
  res.json({ messages: store.listMessages(session.id) });
});

// POST /api/sessions/:id/messages — gửi câu hỏi, trả lời streaming (SSE) kèm trích dẫn
// (PRD Story 2.1, 2.2, 2.3, 2.4, 2.6)
chatRouter.post("/sessions/:id/messages", async (req, res) => {
  const session = store.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Không tìm thấy phiên chat" });

  const content = (req.body?.content as string)?.trim();
  if (!content) return res.status(400).json({ error: "Câu hỏi không được để trống" });

  const userMessage: MessageRecord = {
    id: uuid(),
    sessionId: session.id,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
    citations: [],
  };
  store.addMessage(userMessage);
  store.touchSession(session.id);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const workspaceId = store.getOrCreateDefaultWorkspace().id;
  const { stream, citations: rawCitations, noAnswer } = await generateAnswer(workspaceId, content);

  let fullText = "";
  try {
    for await (const token of stream) {
      fullText += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
  } catch {
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Mất kết nối khi đang trả lời" })}\n\n`);
    res.end();
    return;
  }

  const aiMessageId = uuid();
  const citations: CitationRecord[] = rawCitations.map((c) => ({
    ...c,
    id: uuid(),
    messageId: aiMessageId,
  }));

  const aiMessage: MessageRecord = {
    id: aiMessageId,
    sessionId: session.id,
    role: "ai",
    content: fullText,
    createdAt: new Date().toISOString(),
    citations,
    noAnswer,
  };
  store.addMessage(aiMessage);
  store.touchSession(session.id);

  res.write(`event: done\ndata: ${JSON.stringify({ message: aiMessage })}\n\n`);
  res.end();
});
