export class ScanPdfError extends Error {
  constructor() {
    super("Không thể đọc nội dung văn bản từ file này (có thể là bản scan ảnh).");
    this.name = "ScanPdfError";
  }
}

interface TextItem {
  str?: string;
}

/**
 * Trích text theo từng trang bằng pdfjs-dist (bản legacy, chạy được trong Node
 * không cần DOM/canvas). Nếu toàn bộ file không có text layer (ví dụ bản scan
 * ảnh), ném ScanPdfError để route xử lý theo đúng AC
 * (docs/02-PRD/PRD-DocuChat-AI.md, Story 1.3).
 */
export async function parsePdfPages(buffer: Buffer): Promise<{ pages: string[]; pageCount: number }> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0,
  });

  const doc = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = (textContent.items as TextItem[]).map((item) => item.str ?? "").join(" ");
      pages.push(text);
    }
  } finally {
    await doc.destroy();
  }

  const hasAnyText = pages.some((p) => p.trim().length > 0);
  if (!hasAnyText) {
    throw new ScanPdfError();
  }

  return { pages, pageCount: doc.numPages };
}
