export interface RawChunk {
  pageNumber: number;
  chunkIndex: number;
  text: string;
}

const MAX_CHUNK_LEN = 1000;

/**
 * Chia text từng trang thành các chunk vừa phải để embedding/retrieval.
 * MVP: chia theo độ dài ký tự, không overlap (đủ dùng cho demo).
 */
export function chunkPages(pages: string[]): RawChunk[] {
  const chunks: RawChunk[] = [];
  let chunkIndex = 0;

  pages.forEach((pageText, i) => {
    const pageNumber = i + 1;
    const trimmed = pageText.replace(/\s+/g, " ").trim();
    if (!trimmed) return;

    if (trimmed.length <= MAX_CHUNK_LEN) {
      chunks.push({ pageNumber, chunkIndex: chunkIndex++, text: trimmed });
      return;
    }

    for (let start = 0; start < trimmed.length; start += MAX_CHUNK_LEN) {
      chunks.push({
        pageNumber,
        chunkIndex: chunkIndex++,
        text: trimmed.slice(start, start + MAX_CHUNK_LEN),
      });
    }
  });

  return chunks;
}
