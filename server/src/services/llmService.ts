import { ScoredChunk } from "./vectorSearch";

/**
 * Chat provider — interface để thay bằng LLM thật (Anthropic Claude, OpenAI...)
 * sau này mà không phải đổi ragService/routes. Interface trả về AsyncGenerator
 * để hỗ trợ streaming token giống hành vi thật (PRD yêu cầu streaming + TTFT < 3s).
 */
export interface ChatProvider {
  streamAnswer(question: string, matches: ScoredChunk[], documentNameById: Map<string, string>): AsyncGenerator<string>;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* streamWords(text: string, delayMs: number): AsyncGenerator<string> {
  const parts = text.split(/(\s+)/).filter((p) => p.length > 0);
  for (const part of parts) {
    yield part;
    await delay(delayMs);
  }
}

const NO_ANSWER_TEXT = "Tôi không tìm thấy thông tin này trong các tài liệu đã cung cấp.";

export class MockChatProvider implements ChatProvider {
  async *streamAnswer(
    _question: string,
    matches: ScoredChunk[],
    documentNameById: Map<string, string>
  ): AsyncGenerator<string> {
    if (matches.length === 0) {
      yield* streamWords(NO_ANSWER_TEXT, 20);
      return;
    }

    // Lấy tối đa 1 câu đại diện / tài liệu, tối đa 3 tài liệu, giữ thứ tự theo score.
    const seenDocs = new Set<string>();
    const sentences: string[] = [];
    for (const m of matches) {
      if (seenDocs.has(m.chunk.documentId)) continue;
      seenDocs.add(m.chunk.documentId);
      const fileName = documentNameById.get(m.chunk.documentId) ?? "tài liệu";
      const excerpt = m.chunk.textContent.slice(0, 220).trim();
      sentences.push(`Theo ${fileName} (tr.${m.chunk.pageNumber}): "${excerpt}${m.chunk.textContent.length > 220 ? "..." : ""}"`);
      if (seenDocs.size >= 3) break;
    }

    const answer =
      sentences.length > 1
        ? sentences.join(" Trong khi đó, ")
        : sentences[0];

    yield* streamWords(answer, 20);
  }
}

export const chatProvider: ChatProvider = new MockChatProvider();
export { NO_ANSWER_TEXT };
