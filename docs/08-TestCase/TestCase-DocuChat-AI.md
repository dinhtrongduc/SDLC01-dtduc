# Test Case: DocuChat AI

| | |
|---|---|
| **Tài liệu** | Test Case Specification |
| **Dự án** | DocuChat AI |
| **Nguồn** | `docs/07-UserStory/UserStory-DocuChat-AI.md` (Gherkin AC), code thực tế tại `server/`, `client/` |
| **Môi trường test** | Local dev — Backend: `http://localhost:4000` (`server/`), Frontend: `http://localhost:5173` (`client/`) |

> Mỗi Test Case (TC) map 1-1 hoặc 1-nhiều với 1 AC trong User Story backlog. Cột **Trạng thái** phản ánh kết quả lần chạy tay gần nhất (xem §4 Execution Log); để trống nghĩa là chưa thực thi.

---

## 1. Quy ước

| Trường | Ý nghĩa |
|---|---|
| **Loại** | Manual / Automation (API) / Automation (UI) |
| **Mức ưu tiên** | P0 (bắt buộc launch) / P1 / P2 — kế thừa từ User Story |
| **Trạng thái** | ✅ Pass / ❌ Fail / ⬜ Chưa chạy / 🚫 N/A (chưa implement) |

---

## 2. Epic 1 — Upload & Quản lý tài liệu

### TC-1.1 — Upload 1 file PDF hợp lệ
- **User Story**: US-1.1 · **Priority**: P0 · **Loại**: Automation (API) + Manual (UI)
- **Tiền điều kiện**: Đã mở workspace, chưa có tài liệu nào đang xử lý
- **Các bước**:
  1. Kéo-thả (hoặc chọn) 1 file `.pdf` ≤ 50MB vào khu vực upload
  2. Quan sát phản hồi hệ thống
- **Dữ liệu test**: `hop_dong_a.pdf` (PDF có text layer, 3 trang)
- **Kết quả mong đợi**: Hệ thống nhận file, hiển thị tên file, chuyển trạng thái `PROCESSING` ngay sau khi upload xong, sau đó tự động chuyển `READY` khi index xong
- **Trạng thái**: ✅ Pass (verify qua `POST /api/documents` + poll `GET /api/documents`, xem §4.1)

### TC-1.2 — Từ chối file không phải PDF
- **User Story**: US-1.1 · **Priority**: P0 · **Loại**: Automation (API)
- **Tiền điều kiện**: Đang ở màn hình upload
- **Các bước**: Chọn/thả 1 file `.docx` hoặc bất kỳ định dạng khác
- **Kết quả mong đợi**: Hệ thống từ chối ngay (client-side), hiển thị "Chỉ hỗ trợ file PDF"; không có request upload nào được gửi lên server. Phía server, nếu vẫn cố gửi thẳng API, `POST /api/documents` trả về `400` với message tương tự (xem `server/src/routes/documents.ts`, `server/src/middleware/upload.ts`)
- **Trạng thái**: ⬜ Chưa chạy (chưa test tay qua UI; logic server đã review code nhưng chưa gửi request thật kiểm chứng response 400)

### TC-1.3 — Từ chối file PDF > 50MB
- **User Story**: US-1.1 · **Priority**: P0 · **Loại**: Automation (API)
- **Các bước**: Chọn/thả 1 file `.pdf` > 50MB
- **Kết quả mong đợi**: Chặn ngay client-side (`client/src/App.tsx` → `validateFiles`), hiển thị "File ... vượt quá dung lượng cho phép (50MB)"; nếu gửi thẳng server, `multer` trả lỗi `LIMIT_FILE_SIZE` → `400` "File vượt quá dung lượng cho phép (50MB)"
- **Trạng thái**: ⬜ Chưa chạy

### TC-1.4 — Upload nhiều file cùng lúc
- **User Story**: US-1.2 · **Priority**: P0 · **Loại**: Automation (API)
- **Các bước**: Chọn/thả đồng thời 2 file PDF hợp lệ (`hop_dong_a.pdf`, `bao_gia_b.pdf`)
- **Kết quả mong đợi**: Cả 2 file được nhận, mỗi file có trạng thái xử lý độc lập, cả 2 đều chuyển `READY` sau khi index xong
- **Trạng thái**: ✅ Pass (verify qua `curl -F "files=@a.pdf" -F "files=@b.pdf"`, cả 2 doc trả về `pageCount` đúng: 3 và 1, xem §4.1)

### TC-1.5 — Hiển thị trạng thái xử lý realtime
- **User Story**: US-1.3 · **Priority**: P0 · **Loại**: Manual (UI) + Automation (API)
- **Các bước**: Upload 1 file, theo dõi badge trạng thái trong lúc index
- **Kết quả mong đợi**: Badge hiển thị "Đang xử lý..." kèm spinner trong lúc `PROCESSING`; chat input bị disable nếu đây là tài liệu `READY` duy nhất đang chờ; khi xong, badge chuyển "● Sẵn sàng" và input được enable
- **Trạng thái**: ⬜ Chưa chạy trên UI thật (logic polling đã code ở `client/src/App.tsx`, `useEffect` poll 1.5s khi có doc `PROCESSING`/`UPLOADING`, chưa quan sát trực tiếp bằng trình duyệt)

### TC-1.6 — PDF scan ảnh (không có text layer) → FAILED
- **User Story**: US-1.3 · **Priority**: P0 · **Loại**: Automation (API)
- **Tiền điều kiện**: Có 1 file PDF chỉ chứa ảnh scan, không có text layer
- **Kết quả mong đợi**: Document chuyển `FAILED`, `failureReason` = "Không thể đọc nội dung văn bản từ file này (có thể là bản scan ảnh)." (ném từ `ScanPdfError` trong `server/src/services/pdfService.ts`)
- **Trạng thái**: ⬜ Chưa chạy (chưa có fixture PDF scan ảnh thật để test; logic đã unit-verify bằng cách đọc code — cần bổ sung fixture trước khi tick Pass)

### TC-1.7 — Indexing timeout (> 60s)
- **User Story**: US-1.3 · **Priority**: P0 · **Loại**: Automation (API)
- **Kết quả mong đợi**: Document chuyển `FAILED`, `failureReason` = "Xử lý mất nhiều thời gian hơn dự kiến, vui lòng thử lại hoặc kiểm tra file." (`server/src/services/documentService.ts`, `withTimeout`)
- **Trạng thái**: ⬜ Chưa chạy (khó tái hiện vì mock pipeline rất nhanh; cần mock delay giả lập hoặc file PDF rất lớn/nhiều trang để kiểm chứng đường timeout)

### TC-1.8 — Xóa tài liệu
- **User Story**: US-1.4 · **Priority**: P1 · **Loại**: Automation (API)
- **Các bước**: Gọi `DELETE /api/documents/:id` với 1 document đã `READY`
- **Kết quả mong đợi**: Trả về `204`; document biến mất khỏi `GET /api/documents`; file vật lý trong `server/uploads/` bị xóa; các chunk liên quan cũng bị xóa khỏi store
- **Trạng thái**: ⬜ Chưa chạy

### TC-1.9 — Thử lại indexing sau khi FAILED
- **User Story**: US-1.3 (phần retry) · **Priority**: P1 · **Loại**: Automation (API)
- **Các bước**: Với 1 document `FAILED`, gọi `POST /api/documents/:id/retry`
- **Kết quả mong đợi**: Trạng thái chuyển về `PROCESSING` rồi chạy lại pipeline indexing; nếu nguyên nhân lỗi đã được khắc phục (ví dụ thay file khác cùng id — không áp dụng thực tế vì storagePath cố định) thì chuyển `READY`
- **Trạng thái**: ⬜ Chưa chạy

### TC-1.10 — Gắn tag tài liệu theo dự án *(P2 — ngoài phạm vi code hiện tại)*
- **User Story**: US-1.5 · **Priority**: P2 · **Trạng thái**: 🚫 N/A — chưa implement (xem README §"Giới hạn hiện tại")

---

## 3. Epic 2 — Chat & Q&A với trích dẫn nguồn

### TC-2.1 — Đặt câu hỏi khi có tài liệu sẵn sàng
- **User Story**: US-2.1 · **Priority**: P0 · **Loại**: Automation (API)
- **Tiền điều kiện**: ≥ 1 document `READY`, đã có `sessionId`
- **Các bước**: `POST /api/sessions/:id/messages` với `{ content: "..." }`
- **Kết quả mong đợi**: Server mở stream SSE (`Content-Type: text/event-stream`), gửi token liên tục, kết thúc bằng `event: done` chứa message AI hoàn chỉnh
- **Trạng thái**: ✅ Pass (xem §4.2, `curl -N`)

### TC-2.2 — Câu trả lời luôn kèm trích dẫn (file + trang)
- **User Story**: US-2.2 · **Priority**: P0 · **Loại**: Automation (API)
- **Dữ liệu test**: Câu hỏi "dieu khoan thanh toan la gi" trên 2 tài liệu `hop_dong_a.pdf` + `bao_gia_b.pdf`
- **Kết quả mong đợi**: Message AI trả về có `citations.length >= 1`, mỗi citation có `documentName` + `pageNumber` đúng với nguồn thực tế chứa nội dung được trích
- **Trạng thái**: ✅ Pass — kết quả thực tế: 3 citation, đúng cả 2 file + đúng số trang (tr.1 của `bao_gia_b.pdf`; tr.1, tr.2 của `hop_dong_a.pdf`), xem §4.2

### TC-2.3 — Xem đoạn văn bản gốc qua trích dẫn
- **User Story**: US-2.3 · **Priority**: P0 · **Loại**: Automation (API) + Manual (UI)
- **Các bước**: Lấy 1 citation từ TC-2.2, gọi `GET /api/documents/:id/pages/:pageNumber`
- **Kết quả mong đợi**: Trả về đúng `text` của trang đó, chứa nguyên văn đoạn excerpt đã dùng làm citation; trên UI, click chip trích dẫn mở overlay kèm `<mark>` highlight đúng đoạn (xem `client/src/components/CitationOverlay.tsx`)
- **Trạng thái**: ✅ Pass (API, xem §4.2) · ⬜ Chưa chạy (UI — chưa quan sát bằng trình duyệt thật)

### TC-2.4 — Từ chối trả lời khi không có dữ liệu liên quan
- **User Story**: US-2.4 · **Priority**: P0 · **Loại**: Automation (API)
- **Dữ liệu test**: Câu hỏi không liên quan, ví dụ "thoi tiet hom nay the nao"
- **Kết quả mong đợi**: `message.content` = "Tôi không tìm thấy thông tin này trong các tài liệu đã cung cấp.", `message.noAnswer = true`, `message.citations = []`
- **Trạng thái**: ✅ Pass (xem §4.3)

### TC-2.5 — Hỏi follow-up giữ ngữ cảnh (multi-turn)
- **User Story**: US-2.5 · **Priority**: P1 · **Loại**: Manual (UI)
- **Kết quả mong đợi**: Câu hỏi thứ 2 trong cùng session vẫn hiển thị nối tiếp lịch sử (UI load đúng thứ tự qua `GET /api/sessions/:id/messages`)
- **Lưu ý triển khai**: Mock LLM hiện **không** thực sự dùng ngữ cảnh hội thoại trước đó khi sinh câu trả lời (chỉ retrieval theo câu hỏi hiện tại) — đây là giới hạn của mock, cần lưu ý khi thay LLM thật phải truyền `history` vào prompt
- **Trạng thái**: 🚫 N/A (lưu lịch sử hoạt động đúng, nhưng "hiểu ngữ cảnh" theo đúng nghĩa AC chưa được mock đáp ứng đầy đủ)

### TC-2.6 — Hỏi tổng hợp đa tài liệu, phân biệt rõ nguồn
- **User Story**: US-2.6 · **Priority**: P0 · **Loại**: Automation (API)
- **Kết quả mong đợi**: Câu trả lời chứa cả 2 nguồn, có cụm nối "Trong khi đó," phân tách rõ ý theo từng tài liệu (xem `server/src/services/llmService.ts`)
- **Trạng thái**: ✅ Pass — câu trả lời thực tế đã đúng format "Theo bao_gia_b.pdf (tr.1): ... Trong khi đó, Theo hop_dong_a.pdf (tr.1): ...", xem §4.2

### TC-2.7 — Banner mất kết nối khi đang stream + nút Thử lại
- **User Story**: PRD §4.2 (edge case) · **Priority**: P0 · **Loại**: Manual (UI)
- **Các bước**: Ngắt mạng/tắt backend giữa lúc đang nhận stream
- **Kết quả mong đợi**: Stream dừng, hiển thị banner lỗi kèm nút "Thử lại" (`client/src/components/ChatPanel.tsx`, `chat-banner`), bấm Thử lại gửi lại đúng câu hỏi vừa lỗi
- **Trạng thái**: ⬜ Chưa chạy (chưa mô phỏng mất kết nối giữa chừng)

---

## 4. Execution Log (các lần chạy tay đã thực hiện)

### 4.1 Upload & Indexing
```
POST /api/documents  -F files=@hop_dong_a.pdf -F files=@bao_gia_b.pdf
→ 201, cả 2 document: status PROCESSING
GET /api/documents (sau ~3-5s)
→ hop_dong_a.pdf: status READY, pageCount 3
→ bao_gia_b.pdf:  status READY, pageCount 1
```
**Kết quả**: TC-1.1, TC-1.4 Pass.

### 4.2 Chat đa tài liệu kèm trích dẫn
```
POST /api/sessions {} → sessionId
POST /api/sessions/{id}/messages { content: "dieu khoan thanh toan la gi" }
→ stream token hợp lệ, event: done với message:
  content: "Theo bao_gia_b.pdf (tr.1): \"...\" Trong khi đó, Theo hop_dong_a.pdf (tr.1): \"...\""
  citations: [bao_gia_b.pdf tr.1, hop_dong_a.pdf tr.1, hop_dong_a.pdf tr.2]
  noAnswer: false
GET /api/documents/{hop_dong_a.id}/pages/1
→ text khớp đúng nội dung trang 1 đã trích dẫn
```
**Kết quả**: TC-2.1, TC-2.2, TC-2.3 (API), TC-2.6 Pass.

### 4.3 No-answer fallback
```
POST /api/sessions {} → sessionId
POST /api/sessions/{id}/messages { content: "thoi tiet hom nay the nao" }
→ event: done, message.content = "Tôi không tìm thấy thông tin này trong các tài liệu đã cung cấp."
  noAnswer: true, citations: []
```
**Kết quả**: TC-2.4 Pass.

---

## 5. Việc cần làm tiếp để hoàn tất bộ test case

1. Chạy tay toàn bộ các TC đang ⬜ qua UI thật tại `http://localhost:5173` (đặc biệt TC-1.2, 1.3, 1.5, 1.8, 1.9, 2.5, 2.7).
2. Tạo fixture PDF scan ảnh (không text layer) để verify TC-1.6.
3. Cân nhắc mock một document "chậm" (delay giả lập trong `documentService.ts`) để verify đường timeout TC-1.7 mà không phải chờ 60s thật.
4. Khi thay embedding/LLM mock bằng API thật, chạy lại toàn bộ bộ test case này như regression suite, đặc biệt TC-2.2/2.4/2.6 vì đây là 3 test case quyết định accuracy gate ≥ 90% (PRD §5.1).

---

⬅️ Nguồn: [User Story](../07-UserStory/UserStory-DocuChat-AI.md) · [SADD](../05-SADD/SADD-DocuChat-AI.md)
