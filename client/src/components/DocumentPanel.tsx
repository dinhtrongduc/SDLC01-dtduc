import { useRef, useState } from "react";
import { DocumentDto } from "../types";

interface Props {
  documents: DocumentDto[];
  onUpload: (files: File[]) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
  uploadError: string | null;
}

const MAX_SIZE = 50 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusBadge(doc: DocumentDto) {
  switch (doc.status) {
    case "UPLOADING":
      return <span className="status-badge uploading"><span className="spinner" /> Đang tải lên...</span>;
    case "PROCESSING":
      return <span className="status-badge processing"><span className="spinner" /> Đang xử lý...</span>;
    case "READY":
      return <span className="status-badge ready">● Sẵn sàng</span>;
    case "FAILED":
      return <span className="status-badge failed">⚠ Lỗi xử lý</span>;
  }
}

export function DocumentPanel({ documents, onUpload, onDelete, onRetry, uploadError }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    onUpload(Array.from(fileList));
  }

  return (
    <aside className="doc-panel">
      <div
        className={`dropzone${dragOver ? " dragover" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <strong>Kéo-thả file PDF vào đây</strong>
        Hoặc bấm để chọn file (tối đa 50MB/file)
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploadError && <div style={{ margin: "0 16px 12px", color: "var(--color-danger)", fontSize: 13 }}>{uploadError}</div>}

      {documents.length === 0 ? (
        <div className="empty-state">
          📄
          <br />
          Chưa có tài liệu nào.
          <br />
          Upload tài liệu PDF đầu tiên để bắt đầu hỏi đáp.
        </div>
      ) : (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li className="doc-item" key={doc.id}>
              <div className="doc-name" title={doc.fileName}>{doc.fileName}</div>
              <div className="doc-meta">
                {doc.pageCount > 0 ? `${doc.pageCount} trang · ` : ""}
                {formatSize(doc.fileSizeBytes)}
              </div>
              {statusBadge(doc)}
              {doc.status === "FAILED" && (
                <>
                  <div className="error-msg">{doc.failureReason}</div>
                  <div className="doc-actions">
                    <button onClick={() => onRetry(doc.id)}>Thử lại</button>
                    <button onClick={() => onDelete(doc.id)}>Xóa</button>
                  </div>
                </>
              )}
              {doc.status === "READY" && (
                <div className="doc-actions">
                  <button onClick={() => onDelete(doc.id)}>Xóa</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export { MAX_SIZE };
