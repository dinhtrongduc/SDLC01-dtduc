/**
 * Embedding provider — interface để dễ thay thế bằng API thật
 * (ví dụ OpenAI text-embedding-3, Voyage AI...) mà không đổi code gọi nó.
 *
 * Mock hiện tại dùng "hashing trick" bag-of-words: xem văn bản là tập từ,
 * hash mỗi từ vào 1 chiều cố định rồi đếm tần suất + chuẩn hoá L2.
 * Cosine similarity giữa 2 vector phản ánh mức trùng từ vựng — đủ để
 * demo retrieval hoạt động thật (không phải random) mà không cần API key.
 */
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

const VECTOR_DIM = 512;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return hash % VECTOR_DIM;
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const vec = new Array(VECTOR_DIM).fill(0);
    for (const token of tokenize(text)) {
      vec[hashToken(token)] += 1;
    }
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

// Đổi provider ở đây khi có API key thật, phần còn lại của app không cần sửa.
export const embeddingProvider: EmbeddingProvider = new MockEmbeddingProvider();
