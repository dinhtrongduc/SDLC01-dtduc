import fs from "fs";
import { store } from "../db/store";
import { parsePdfPages, ScanPdfError } from "./pdfService";
import { chunkPages } from "./chunkService";
import { embeddingProvider } from "./embeddingService";
import { DocumentChunkRecord, DocumentRecord } from "../types";
import { v4 as uuid } from "uuid";

const INDEXING_TIMEOUT_MS = 60_000;
const TIMEOUT_MESSAGE = "Xử lý mất nhiều thời gian hơn dự kiến, vui lòng thử lại hoặc kiểm tra file.";
const GENERIC_FAILURE_MESSAGE = "Không thể xử lý file này. Vui lòng thử lại hoặc liên hệ hỗ trợ.";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
  ]);
}

/**
 * Chạy pipeline indexing cho 1 Document: parse PDF theo trang -> chunk -> embed -> lưu.
 * Cập nhật DocumentStatus theo đúng vòng đời mô tả ở
 * docs/03-ClassDiagram/ClassDiagram-DocuChat-AI.md và docs/05-SADD.
 */
export async function indexDocument(doc: DocumentRecord): Promise<void> {
  try {
    const buffer = fs.readFileSync(doc.storagePath);

    const { pages, pageCount } = await withTimeout(parsePdfPages(buffer), INDEXING_TIMEOUT_MS).catch((err) => {
      if (err instanceof Error && err.message === "TIMEOUT") {
        throw new Error("TIMEOUT");
      }
      throw err;
    });

    const rawChunks = chunkPages(pages);

    const chunkRecords: DocumentChunkRecord[] = [];
    for (const rc of rawChunks) {
      const embedding = await embeddingProvider.embed(rc.text);
      chunkRecords.push({
        id: uuid(),
        documentId: doc.id,
        pageNumber: rc.pageNumber,
        chunkIndex: rc.chunkIndex,
        textContent: rc.text,
        embedding,
      });
    }

    store.addChunks(chunkRecords);
    store.updateDocument(doc.id, { status: "READY", pageCount, failureReason: undefined });
  } catch (err) {
    if (err instanceof ScanPdfError) {
      store.updateDocument(doc.id, { status: "FAILED", failureReason: err.message });
    } else if (err instanceof Error && err.message === "TIMEOUT") {
      store.updateDocument(doc.id, { status: "FAILED", failureReason: TIMEOUT_MESSAGE });
    } else {
      console.error(`Indexing thất bại cho document ${doc.id} (${doc.fileName}):`, err);
      store.updateDocument(doc.id, { status: "FAILED", failureReason: GENERIC_FAILURE_MESSAGE });
    }
  }
}
