interface Props {
  documentName: string;
  pageNumber: number;
  pageText: string;
  excerptText: string;
  onClose: () => void;
}

export function CitationOverlay({ documentName, pageNumber, pageText, excerptText, onClose }: Props) {
  const idx = excerptText ? pageText.indexOf(excerptText.slice(0, 60)) : -1;

  let content: React.ReactNode = pageText;
  if (idx !== -1) {
    const before = pageText.slice(0, idx);
    const match = pageText.slice(idx, idx + excerptText.length);
    const after = pageText.slice(idx + excerptText.length);
    content = (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    );
  }

  return (
    <div className="overlay show" onClick={onClose}>
      <div className="pdf-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-panel-header">
          <strong>{documentName} — Trang {pageNumber}</strong>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="pdf-page-mock">{content}</div>
      </div>
    </div>
  );
}
