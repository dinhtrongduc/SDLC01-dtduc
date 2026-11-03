import { store } from "../db/store";
import { embeddingProvider } from "./embeddingService";
import { topKChunks } from "./vectorSearch";
import { chatProvider } from "./llmService";
import { CitationRecord } from "../types";

export interface RagAnswer {
  stream: AsyncGenerator<string>;
  citations: Omit<CitationRecord, "id" | "messageId">[];
  noAnswer: boolean;
}

/**
 * Orchestrate retrieval-augmented answer:
 * 1. Embed câu hỏi
 * 2. Lấy top-k chunk liên quan nhất trong các Document đã READY của workspace
 * 3. Nếu không có chunk nào đạt ngưỡng -> trả lời "không tìm thấy" (PRD Story 2.4)
 * 4. Ngược lại -> sinh câu trả lời streaming kèm trích dẫn (file + trang) (PRD Story 2.2/2.6)
 */
export async function generateAnswer(workspaceId: string, question: string): Promise<RagAnswer> {
  const chunks = store.listChunksForWorkspace(workspaceId);
  const queryVector = await embeddingProvider.embed(question);
  const matches = topKChunks(queryVector, chunks);

  const documentNameById = new Map<string, string>();
  for (const chunk of chunks) {
    if (!documentNameById.has(chunk.documentId)) {
      const doc = store.getDocument(chunk.documentId);
      if (doc) documentNameById.set(chunk.documentId, doc.fileName);
    }
  }

  const seenCitationKeys = new Set<string>();
  const citations: Omit<CitationRecord, "id" | "messageId">[] = [];
  for (const m of matches) {
    const key = `${m.chunk.documentId}:${m.chunk.pageNumber}`;
    if (seenCitationKeys.has(key)) continue;
    seenCitationKeys.add(key);
    citations.push({
      documentId: m.chunk.documentId,
      documentName: documentNameById.get(m.chunk.documentId) ?? "tài liệu",
      pageNumber: m.chunk.pageNumber,
      excerptText: m.chunk.textContent.slice(0, 300),
    });
    if (citations.length >= 3) break;
  }

  return {
    stream: chatProvider.streamAnswer(question, matches, documentNameById),
    citations,
    noAnswer: matches.length === 0,
  };
}
