# DocuChat AI — MVP

Cài đặt code theo `docs/` (BRD → PRD → Class Diagram → Use Case → SADD → HTML Design → User Story). Phạm vi đã code: **Epic 1 (Upload & quản lý tài liệu)** + **Epic 2 (Chat & Q&A kèm trích dẫn)**, đúng với các P0 user story.

## Cấu trúc

```
server/   Backend Node.js + TypeScript + Express (API, RAG pipeline)
client/   Frontend React + TypeScript + Vite (UI 2 cột theo docs/06-HTML-Design)
docs/     Tài liệu SDLC (BRD → ... → User Story)
```

## Chạy thử

```bash
# Terminal 1 — backend (http://localhost:4000)
cd server
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm install
npm run dev
```

Mở `http://localhost:5173`, kéo-thả 1 file PDF, chờ trạng thái chuyển "Sẵn sàng", rồi đặt câu hỏi.

## Giới hạn hiện tại (đã xác nhận với người dùng khi bắt đầu code)

- **LLM & Embedding là mock**, không gọi API bên ngoài — xem `server/src/services/embeddingService.ts` và `server/src/services/llmService.ts`. Mock dùng "hashing trick" bag-of-words cho embedding (retrieval dựa trên trùng từ khóa thật, không phải ngẫu nhiên) và template câu trả lời trích nguyên văn đoạn chunk khớp nhất. Thay bằng API thật (Anthropic/OpenAI) bằng cách implement lại 2 interface `EmbeddingProvider` / `ChatProvider`, phần còn lại của app không cần sửa.
- **Không có SSO/auth thật** — dùng 1 user & workspace mặc định (xem `store.getOrCreateDefaultWorkspace()`).
- **Lưu trữ**: JSON file (`server/data/db.json`) + file PDF trên đĩa (`server/uploads/`), thay cho Relational DB + Object Storage thật trong SADD. Đủ cho demo nội bộ, cần thay khi lên production.
- **Chưa làm**: tóm tắt tự động (Epic 3), chia sẻ phiên chat & phân quyền tài liệu (Epic 5, P2).
- **Chưa kiểm thử bằng trình duyệt thật (Playwright/chromium-cli)** — ổ đĩa máy dev lúc code chỉ còn ~170MB trống nên không an toàn để cài thêm Chromium. Đã kiểm thử: typecheck sạch (backend + frontend), `vite build` thành công, và toàn bộ API backend (upload, indexing, chat streaming, citation, no-answer fallback) qua curl. Khuyến nghị tự mở `http://localhost:5173` để xác nhận UI trước khi coi là hoàn tất.

## Lưu ý quan trọng

Ổ đĩa C: đang gần như đầy (có lúc chỉ còn ~170–300MB trống trong lúc code). Nên dọn bớt dung lượng trước khi chạy `npm install` cho các thay đổi lớn tiếp theo, tránh lỗi `ENOSPC`.
