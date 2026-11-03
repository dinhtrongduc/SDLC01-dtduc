import { useEffect, useRef, useState } from "react";
import { ChatSessionDto, CitationDto, MessageDto } from "../types";
import { MessageBubble } from "./MessageBubble";

interface Props {
  sessions: ChatSessionDto[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, title: string) => void;
  messages: MessageDto[];
  streamingText: string | null;
  isSending: boolean;
  chatError: string | null;
  onRetry: () => void;
  hasReadyDocuments: boolean;
  onSend: (content: string) => void;
  onCitationClick: (citation: CitationDto) => void;
}

export function ChatPanel({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  messages,
  streamingText,
  isSending,
  chatError,
  onRetry,
  hasReadyDocuments,
  onSend,
  onCitationClick,
}: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending || !hasReadyDocuments) return;
    onSend(trimmed);
    setInput("");
  }

  function handleRename() {
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;
    const title = window.prompt("Đổi tên phiên chat", session.title);
    if (title && title.trim()) onRenameSession(session.id, title.trim());
  }

  return (
    <main className="chat-panel">
      <div className="chat-toolbar">
        <select value={activeSessionId ?? ""} onChange={(e) => onSelectSession(e.target.value)}>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <button onClick={handleRename} disabled={!activeSessionId}>Đổi tên</button>
        <button onClick={onNewSession}>+ Phiên mới</button>
      </div>

      {chatError && (
        <div className="chat-banner">
          {chatError} <button onClick={onRetry} style={{ marginLeft: 8 }}>Thử lại</button>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && !streamingText ? (
          <div className="chat-empty">
            {hasReadyDocuments
              ? "Đặt câu hỏi đầu tiên về tài liệu đã upload."
              : "Upload ít nhất 1 tài liệu PDF ở cột bên trái để bắt đầu đặt câu hỏi."}
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                citations={m.citations}
                noAnswer={m.noAnswer}
                onCitationClick={onCitationClick}
              />
            ))}
            {streamingText !== null && <MessageBubble role="ai" content={streamingText} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Đặt câu hỏi về tài liệu đã upload..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!hasReadyDocuments || isSending}
            title={!hasReadyDocuments ? "Upload ít nhất 1 tài liệu PDF ở trạng thái Sẵn sàng để bắt đầu" : undefined}
          />
          <button type="submit" disabled={!hasReadyDocuments || isSending || !input.trim()}>Gửi</button>
        </div>
        <div className="input-hint">
          {hasReadyDocuments
            ? "Tip: bạn có thể hỏi xuyên nhiều tài liệu cùng lúc."
            : "Ô chat sẽ được kích hoạt khi có ít nhất 1 tài liệu ở trạng thái \"Sẵn sàng\"."}
        </div>
      </form>
    </main>
  );
}
