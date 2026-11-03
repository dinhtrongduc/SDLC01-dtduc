import { DocumentChunkRecord } from "../types";

export interface ScoredChunk {
  chunk: DocumentChunkRecord;
  score: number;
}

// Vector đã được chuẩn hoá L2 ở embeddingService -> dot product = cosine similarity.
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

const DEFAULT_TOP_K = 5;
const DEFAULT_THRESHOLD = 0.05;

export function topKChunks(
  queryVector: number[],
  chunks: DocumentChunkRecord[],
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_THRESHOLD
): ScoredChunk[] {
  return chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryVector, chunk.embedding) }))
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
