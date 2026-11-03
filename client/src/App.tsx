import { useEffect, useRef, useState } from "react";
import * as api from "./api";
import { ChatSessionDto, CitationDto, DocumentDto, MessageDto } from "./types";
import { DocumentPanel, MAX_SIZE } from "./components/DocumentPanel";
import { ChatPanel } from "./components/ChatPanel";
import { CitationOverlay } from "./components/CitationOverlay";

interface CitationOverlayState {
  documentName: string;
  pageNumber: number;
  text: string;
  excerptText: string;
}

export default function App() {
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const lastQuestionRef = useRef<string>("");

  const [citationOverlay, setCitationOverlay] = useState<CitationOverlayState | null>(null);

  const hasReadyDocuments = documents.some((d) => d.status === "READY");
  const hasPendingDocuments = documents.some((d) => d.status === "UPLOADING" || d.status === "PROCESSING");

  async function refreshDocuments() {
    const { documents: docs } = await api.listDocuments();
    setDocuments(docs);
  }

  // Khởi tạo: workspace, tài liệu, phiên chat
  useEffect(() => {
    (async () => {
      const { workspace } = await api.getWorkspace();
      setWorkspaceName(workspace.name);
      await refreshDocuments();

      const { sessions: existing } = await api.listSessions();
      if (existing.length > 0) {
        setSessions(existing);
        setActiveSessionId(existing[0].id);
      } else {
        const { session } = await api.createSession("Phiên chat mới");
        setSessions([session]);
        setActiveSessionId(session.id);
      }
    })();
  }, []);

  // Poll trạng thái tài liệu khi đang upload/xử lý (PRD Story 1.3)
  useEffect(() => {
    if (!hasPendingDocuments) return;
    const interval = setInterval(refreshDocuments, 1500);
    return () => clearInterval(interval);
  }, [hasPendingDocuments]);

  // Tải lịch sử khi đổi phiên chat (PRD Story 4.1)
  useEffect(() => {
    if (!activeSessionId) return;
    (async () => {
      const { messages: history } = await api.listMessages(activeSessionId);
      setMessages(history);
      setStreamingText(null);
      setChatError(null);
    })();
  }, [activeSessionId]);

  function validateFiles(files: File[]): { valid: File[]; error: string | null } {
    const invalidType = files.find((f) => !f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf");
    if (invalidType) return { valid: [], error: "Chỉ hỗ trợ file PDF" };

    const tooLarge = files.find((f) => f.size > MAX_SIZE);
    if (tooLarge) return { valid: [], error: `File "${tooLarge.name}" vượt quá dung lượng cho phép (50MB)` };

    return { valid: files, error: null };
  }

  async function handleUpload(files: File[]) {
    const { valid, error } = validateFiles(files);
    setUploadError(error);
    if (error || valid.length === 0) return;

    const { documents: created } = await api.uploadDocuments(valid);
    setDocuments((prev) => [...prev, ...created]);
  }

  async function handleDelete(id: string) {
    await api.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleRetry(id: string) {
    const { document } = await api.retryDocument(id);
    setDocuments((prev) => prev.map((d) => (d.id === id ? document : d)));
  }

  async function handleNewSession() {
    const { session } = await api.createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
  }

  async function handleRenameSession(id: string, title: string) {
    const { session } = await api.renameSession(id, title);
    setSessions((prev) => prev.map((s) => (s.id === id ? session : s)));
  }

  async function handleSend(content: string) {
    if (!activeSessionId) return;
    lastQuestionRef.current = content;
    setChatError(null);
    setIsSending(true);
    setStreamingText("");

    const optimisticUserMessage: MessageDto = {
      id: `local-${Date.now()}`,
      sessionId: activeSessionId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      citations: [],
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    await api.sendMessageStream(activeSessionId, content, {
      onToken: (token) => setStreamingText((prev) => (prev ?? "") + token),
      onDone: (message) => {
        setMessages((prev) => [...prev, message]);
        setStreamingText(null);
        setIsSending(false);
      },
      onError: (error) => {
        setChatError(error);
        setStreamingText(null);
        setIsSending(false);
      },
    });
  }

  function handleRetrySend() {
    if (lastQuestionRef.current) handleSend(lastQuestionRef.current);
  }

  async function handleCitationClick(citation: CitationDto) {
    try {
      const page = await api.getDocumentPage(citation.documentId, citation.pageNumber);
      setCitationOverlay({
        documentName: page.documentName,
        pageNumber: page.pageNumber,
        text: page.text,
        excerptText: citation.excerptText,
      });
    } catch (err) {
      setCitationOverlay({
        documentName: citation.documentName,
        pageNumber: citation.pageNumber,
        text: "Tài liệu đã bị xóa hoặc không còn tồn tại.",
        excerptText: "",
      });
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>DocuChat AI</h1>
        <span className="user-chip">Linh · BD/Sales · {workspaceName}</span>
      </header>

      <div className="app-layout">
        <DocumentPanel
          documents={documents}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onRetry={handleRetry}
          uploadError={uploadError}
        />
        <ChatPanel
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          messages={messages}
          streamingText={streamingText}
          isSending={isSending}
          chatError={chatError}
          onRetry={handleRetrySend}
          hasReadyDocuments={hasReadyDocuments}
          onSend={handleSend}
          onCitationClick={handleCitationClick}
        />
      </div>

      {citationOverlay && (
        <CitationOverlay
          documentName={citationOverlay.documentName}
          pageNumber={citationOverlay.pageNumber}
          pageText={citationOverlay.text}
          excerptText={citationOverlay.excerptText}
          onClose={() => setCitationOverlay(null)}
        />
      )}
    </>
  );
}
