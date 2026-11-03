import { CitationDto, MessageRole } from "../types";

interface Props {
  role: MessageRole;
  content: string;
  citations?: CitationDto[];
  noAnswer?: boolean;
  onCitationClick?: (citation: CitationDto) => void;
}

export function MessageBubble({ role, content, citations = [], noAnswer, onCitationClick }: Props) {
  return (
    <div className={`msg-row ${role}${noAnswer ? " no-answer" : ""}`}>
      <div>
        <div className="bubble">{content || "…"}</div>
        {citations.length > 0 && (
          <div className="citations">
            {citations.map((c) => (
              <span key={c.id} className="citation-chip" onClick={() => onCitationClick?.(c)}>
                📄 {c.documentName} · tr.{c.pageNumber}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
