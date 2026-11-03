import { Router } from "express";
import fs from "fs";
import { v4 as uuid } from "uuid";
import { upload } from "../middleware/upload";
import { store } from "../db/store";
import { indexDocument } from "../services/documentService";
import { DocumentRecord } from "../types";

export const documentsRouter = Router();

function getWorkspaceId() {
  return store.getOrCreateDefaultWorkspace().id;
}

// POST /api/documents — upload 1 hoặc nhiều file PDF (PRD Story 1.1, 1.2)
documentsRouter.post("/", (req, res, next) => {
  upload.array("files")(req, res, (err) => {
    if (err) {
      if (err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE") {
        return res.status(400).json({ error: "Chỉ hỗ trợ file PDF" });
      }
      if ((err as { code?: string }).code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File vượt quá dung lượng cho phép (50MB)" });
      }
      return res.status(400).json({ error: "Upload thất bại" });
    }
    next();
  });
}, (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) {
    return res.status(400).json({ error: "Không có file hợp lệ nào được gửi lên" });
  }

  const workspaceId = getWorkspaceId();
  const created: DocumentRecord[] = files.map((file) => {
    const doc: DocumentRecord = {
      id: uuid(),
      workspaceId,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      pageCount: 0,
      status: "PROCESSING",
      storagePath: file.path,
      uploadedAt: new Date().toISOString(),
    };
    store.addDocument(doc);
    // Fire-and-forget: không block response, client poll GET /api/documents để lấy trạng thái.
    void indexDocument(doc);
    return doc;
  });

  res.status(201).json({ documents: created });
});

// GET /api/documents — danh sách tài liệu + trạng thái (PRD Story 1.3, 1.4)
documentsRouter.get("/", (_req, res) => {
  const workspaceId = getWorkspaceId();
  res.json({ documents: store.listDocuments(workspaceId) });
});

// DELETE /api/documents/:id (PRD Story 1.4)
documentsRouter.delete("/:id", (req, res) => {
  const doc = store.getDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

  if (fs.existsSync(doc.storagePath)) {
    fs.unlinkSync(doc.storagePath);
  }
  store.deleteDocument(doc.id);
  res.status(204).send();
});

// POST /api/documents/:id/retry — thử lại indexing khi FAILED
documentsRouter.post("/:id/retry", (req, res) => {
  const doc = store.getDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

  store.updateDocument(doc.id, { status: "PROCESSING", failureReason: undefined });
  void indexDocument(doc);
  res.status(202).json({ document: store.getDocument(doc.id) });
});

// GET /api/documents/:id/pages/:pageNumber — nội dung trang để hiển thị khi click trích dẫn (PRD Story 2.3)
documentsRouter.get("/:id/pages/:pageNumber", (req, res) => {
  const doc = store.getDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

  const pageNumber = Number(req.params.pageNumber);
  const chunks = store
    .listChunksForDocument(doc.id)
    .filter((c) => c.pageNumber === pageNumber);

  if (chunks.length === 0) {
    return res.status(404).json({ error: "Không tìm thấy nội dung trang này" });
  }

  const text = chunks.map((c) => c.textContent).join(" ");
  res.json({ documentId: doc.id, documentName: doc.fileName, pageNumber, text });
});
