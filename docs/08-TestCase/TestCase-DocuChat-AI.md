# Test Case: DocuChat AI

| | |
|---|---|
| **Tài liệu** | Test Case Specification |
| **Dự án** | DocuChat AI |
| **Nguồn** | `docs/07-UserStory/UserStory-DocuChat-AI.md` (Gherkin AC), code thực tế tại `server/`, `client/` |
| **Môi trường test** | Local dev — Backend: `http://localhost:4000` (`server/`), Frontend: `http://localhost:5173` (`client/`) |
| **Lần chạy gần nhất** | 2026-11-03 — API test case: 14/17 Pass, 1 bug phát hiện & đã fix, 3 còn lại là Manual (UI) chưa quan sát bằng trình duyệt thật |

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
- **Dữ liệu test**: `hop_dong_a.pdf` (PDF có text layer, 3 trang, tự sinh bằng `server/test-fixtures/make_pdf.js`)
- **Kết quả mong đợi**: Hệ thống nhận file, hiển thị tên file, chuyển trạng thái `PROCESSING` ngay sau khi upload xong, sau đó tự động chuyển `READY` khi index xong
- **Trạng thái**: ✅ Pass (API) — xem §4.1 · ⬜ Chưa chạy (UI thật, chưa quan sát bằng trình duyệt)

### TC-1.2 — Từ chối file không phải PDF
- **User Story**: US-1.1 · **Priority**: P0 · **Loại**: Automation (API)
- **Tiền điều kiện**: Đang ở màn hình upload
- **Các bước**: Gửi thẳng `POST /api/documents` với 1 file `.docx`
- **Dữ liệu test**: `fake.docx`
- **Kết quả mong đợi**: `400 { "error": "Chỉ hỗ trợ file PDF" }`, không tạo Document nào
- **Trạng thái**: ✅ Pass — xem §4.4

### TC-1.3 — Từ chối file PDF > 50MB
- **User Story**: US-1.1 · **Priority**: P0 · **Loại**: Automation (API)
- **Các bước**: Gửi thẳng `POST /api/documents` với 1 file 50MB + 2KB
- **Kết quả mong đợi**: `400 { "error": "File vượt quá dung lượng cho phép (50MB)" }`
- **Trạng thái**: ✅ Pass — xem §4.4

### TC-1.4 — Upload nhiều file cùng lúc
- **User Story**: US-1.2 · **Priority**: P0 · **Loại**: Automation (API)
- **Các bước**: Chọn/thả đồng thời 2 file PDF hợp lệ (`hop_dong_a.pdf`, `bao_gia_b.pdf`)
- **Kết quả mong đợi**: Cả 2 file được nhận, mỗi file có trạng thái xử lý độc lập, cả 2 đều chuyển `READY` sau khi index xong
- **Trạng thái**: ✅ Pass — cả 2 doc trả về `pageCount` đúng: 3 và 1, xem §4.1

### TC-1.5 — Hiển thị trạng thái xử lý realtime
- **User Story**: US-1.3 · **Priority**: P0 · **Loại**: Manual (UI) + Automation (API)
- **Các bước**: Upload 1 file, theo dõi trạng thái qua các lần `GET /api/documents` liên tiếp
- **Kết quả mong đợi**: Trạng thái đi đúng chuỗi `PROCESSING` → `READY`, thời gian index 1 file 1-3 trang < 3s (API) — badge spinner/disable input là phần UI
- **Trạng thái**: ✅ Pass (API, chuỗi trạng thái đúng và nhanh — xem §4.1) · ⬜ Chưa chạy (UI — badge/spinner/disable input chưa quan sát bằng trình duyệt thật)

### TC-1.6 — PDF scan ảnh (không có text layer) → FAILED
- **User Story**: US-1.3 · **Priority**: P0 · **Loại**: Automation (API)
- **Tiền điều kiện**: File PDF chỉ có 1 trang với content stream rỗng (mô phỏng không text layer)
- **Dữ liệu test**: `scan_no_text.pdf` (tự sinh)
- **Kết quả mong đợi**: Document chuyển `FAILED`, `failureReason` = "Không thể đọc nội dung văn bản từ file này (có thể là bản scan ảnh)."
- **Trạng thái**: ✅ Pass — xem §4.5

### TC-1.7 — Indexing timeout (> 60s)
- **User Story**: US-1.3 · **Priority**: P0 · **Loại**: Automation (API)
- **Phương pháp test**: Tạm thời hạ `INDEXING_TIMEOUT_MS` xuống 1ms + chèn delay 300ms giả lập trong `documentService.ts` để buộc nhánh timeout chạy (đã revert lại `60_000` ngay sau khi test, xem §4.6)
- **Kết quả mong đợi**: Document chuyển `FAILED`, `failureReason` = "Xử lý mất nhiều thời gian hơn dự kiến, vui lòng thử lại hoặc kiểm tra file."
- **Trạng thái**: ✅ Pass — xem §4.6

### TC-1.8 — Xóa tài liệu
- **User Story**: US-1.4 · **Priority**: P1 · **Loại**: Automation (API)
- **Các bước**: Gọi `DELETE /api/documents/:id` với 1 document đã `READY`
- **Kết quả mong đợi**: Trả về `204`; document biến mất khỏi `GET /api/documents`; file vật lý trong `server/uploads/` bị xóa
- **Trạng thái**: ✅ Pass — xem §4.7 (xác nhận cả list API lẫn file vật lý trên đĩa đều đã bị xóa)

### TC-1.9 — Thử lại indexing sau khi FAILED
- **User Story**: US-1.3 (phần retry) · **Priority**: P1 · **Loại**: Automation (API)
- **Các bước**: Với document `FAILED` ở TC-1.6, gọi `POST /api/documents/:id/retry`
- **Kết quả mong đợi**: Trạng thái chuyển về `PROCESSING` rồi chạy lại pipeline; vì nội dung file không đổi nên kết quả cuối vẫn là `FAILED` với cùng lý do — xác nhận cơ chế retry chạy lại đúng pipeline (không phải đơn thuần đổi trạng thái)
- **Trạng thái**: ✅ Pass — xem §4.7

### TC-1.10 — Gắn tag tài liệu theo dự án *(P2 — ngoài phạm vi code hiện tại)*
- **User Story**: US-1.5 · **Priority**: P2 · **Trạng thái**: 🚫 N/A — chưa implement (xem README §"Giới hạn hiện tại")

---

## 3. Epic 2 — Chat & Q&A với trích dẫn nguồn

### TC-2.1 — Đặt câu hỏi khi có tài liệu sẵn sàng
- **User Story**: US-2.1 · **Priority**: P0 · **Loại**: Automation (API)
- **Tiền điều kiện**: ≥ 1 document `READY`, đã có `sessionId`
- **Các bước**: `POST /api/sessions/:id/messages` với `{ content: "..." }`
- **Kết quả mong đợi**: Server mở stream SSE (`Content-Type: text/event-stream`), gửi token liên tục, kết thúc bằng `event: done` chứa message AI hoàn chỉnh
- **Trạng thái**: ✅ Pass — xem §4.2

### TC-2.2 — Câu trả lời luôn kèm trích dẫn (file + trang)
- **User Story**: US-2.2 · **Priority**: P0 · **Loại**: Automation (API)
- **Dữ liệu test**: Câu hỏi "dieu khoan thanh toan la gi" trên 2 tài liệu `hop_dong_a.pdf` + `bao_gia_b.pdf`
- **Kết quả mong đợi**: Message AI trả về có `citations.length >= 1`, mỗi citation có `documentName` + `pageNumber` đúng với nguồn thực tế chứa nội dung được trích, excerpt là nguyên văn đầy đủ (không bị cắt cụt)
- **Trạng thái**: ✅ Pass — 3 citation, đúng cả 2 file + đúng số trang, excerpt đầy đủ nguyên câu (xem §4.2 — đã verify lại sau khi sửa bug fixture ở §4.2 Ghi chú)

### TC-2.3 — Xem đoạn văn bản gốc qua trích dẫn
- **User Story**: US-2.3 · **Priority**: P0 · **Loại**: Automation (API) + Manual (UI)
- **Các bước**: Lấy 1 citation từ TC-2.2, gọi `GET /api/documents/:id/pages/:pageNumber`
- **Kết quả mong đợi**: Trả về đúng `text` của trang đó, chứa nguyên văn đoạn excerpt đã dùng làm citation; trên UI, click chip trích dẫn mở overlay kèm `<mark>` highlight đúng đoạn
- **Trạng thái**: ✅ Pass (API, xem §4.2) · ⬜ Chưa chạy (UI — chưa quan sát bằng trình duyệt thật)

### TC-2.4 — Từ chối trả lời khi không có dữ liệu liên quan
- **User Story**: US-2.4 · **Priority**: P0 · **Loại**: Automation (API)
- **Dữ liệu test**: Câu hỏi không liên quan, ví dụ "thoi tiet hom nay the nao"
- **Kết quả mong đợi**: `message.content` = "Tôi không tìm thấy thông tin này trong các tài liệu đã cung cấp.", `message.noAnswer = true`, `message.citations = []`
- **Trạng thái**: ✅ Pass — xem §4.3

### TC-2.5 — Hỏi follow-up giữ ngữ cảnh (multi-turn)
- **User Story**: US-2.5 · **Priority**: P1 · **Loại**: Manual (UI) + Automation (API, một phần)
- **Kết quả mong đợi**: Câu hỏi thứ 2 trong cùng session vẫn hiển thị nối tiếp lịch sử
- **Kết quả thực tế**: `GET /api/sessions/:id/messages` trả đúng thứ tự `[user, ai]` theo thời gian (xem §4.8) → phần lưu & tải lịch sử Pass
- **Lưu ý triển khai**: Mock LLM hiện **không** thực sự dùng ngữ cảnh hội thoại trước đó khi sinh câu trả lời (chỉ retrieval theo câu hỏi hiện tại) — giới hạn của mock, cần truyền `history` vào prompt khi thay LLM thật
- **Trạng thái**: ✅ Pass (phần lưu/tải lịch sử) · 🚫 N/A (phần "hiểu ngữ cảnh" — chưa được mock đáp ứng đầy đủ)

### TC-2.6 — Hỏi tổng hợp đa tài liệu, phân biệt rõ nguồn
- **User Story**: US-2.6 · **Priority**: P0 · **Loại**: Automation (API)
- **Kết quả mong đợi**: Câu trả lời chứa cả 2 nguồn, có cụm nối "Trong khi đó," phân tách rõ ý theo từng tài liệu
- **Trạng thái**: ✅ Pass — format đúng "Theo bao_gia_b.pdf (tr.1): ... Trong khi đó, Theo hop_dong_a.pdf (tr.1): ...", xem §4.2

### TC-2.7 — Banner mất kết nối khi đang stream + nút Thử lại
- **User Story**: PRD §4.2 (edge case) · **Priority**: P0 · **Loại**: Manual (UI) + Automation (API, transport-level)
- **Các bước**: Gửi câu hỏi, kill process backend ngay giữa lúc đang stream token
- **Kết quả mong đợi (transport)**: Kết nối SSE đóng đột ngột giữa chừng, không có `event: done`
- **Kết quả mong đợi (client)**: `sendMessageStream` phải bắt được lỗi này và gọi `onError` để hiển thị banner "Mất kết nối" kèm nút Thử lại, thay vì unhandled rejection / treo UI mãi mãi
- **Kết quả thực tế**: Transport-level xác nhận đúng (xem §4.9) — stream dừng đột ngột không có `event: done`. **Phát hiện bug** ở `client/src/api.ts::sendMessageStream`: không có try/catch quanh `fetch()` và vòng lặp `reader.read()`, cũng không xử lý trường hợp stream kết thúc (`done:true`) mà chưa từng nhận `event: done/error` → sẽ gây unhandled rejection hoặc UI treo im lặng thay vì hiện banner. **Đã fix**: bọc try/catch quanh fetch + vòng đọc stream, gọi `handlers.onError(...)` khi fetch lỗi hoặc đọc stream lỗi; thêm cờ `terminated` để phát hiện trường hợp stream đóng mà chưa nhận event kết thúc, cũng gọi `onError` trong trường hợp đó. Đã `npx tsc -b` lại sạch sau khi fix.
- **Trạng thái**: ✅ Pass (sau khi fix — xem §4.9) · ⬜ Chưa chạy lại bằng UI thật để xác nhận banner hiển thị đúng bằng mắt

---

## 4. Execution Log (các lần chạy tay đã thực hiện — 2026-11-03)

### 4.1 Upload & Indexing (TC-1.1, 1.4, 1.5)
```
POST /api/documents  -F files=@hop_dong_a.pdf -F files=@bao_gia_b.pdf
→ 201, cả 2 document: status PROCESSING
GET /api/documents (sau ~2s)
→ hop_dong_a.pdf: status READY, pageCount 3
→ bao_gia_b.pdf:  status READY, pageCount 1
```

### 4.2 Chat đa tài liệu kèm trích dẫn (TC-2.1, 2.2, 2.3 API, 2.6)
```
POST /api/sessions {} → sessionId
POST /api/sessions/{id}/messages { content: "dieu khoan thanh toan la gi" }
→ stream token hợp lệ, event: done với message:
  content: "Theo bao_gia_b.pdf (tr.1): \"Bao gia B Trang 1. Dieu khoan thanh toan: khach hang
            thanh toan 100 phan tram ngay khi ky hop dong, khong chia nho dot thanh toan.\"
            Trong khi đó, Theo hop_dong_a.pdf (tr.1): \"Hop dong A Trang 1. Dieu khoan thanh
            toan: ben B tra truoc 30 phan tram gia tri hop dong ngay sau khi ky, phan con lai
            70 phan tram thanh toan trong vong 7 ngay sau khi nghiem thu ban giao.\""
  citations: [bao_gia_b.pdf tr.1, hop_dong_a.pdf tr.1, hop_dong_a.pdf tr.2]
  noAnswer: false
GET /api/documents/{hop_dong_a.id}/pages/1
→ text khớp đúng, đầy đủ nguyên văn nội dung trang 1 đã trích dẫn
```
**Ghi chú quan trọng — bug phát hiện & đã fix trong lúc chuẩn bị fixture**: Lần chạy test case đầu tiên dùng PDF test fixture sinh bởi `pdfkit`, sau đó chuyển sang PDF tự build tay. Fixture tay ban đầu không wrap dòng (1 dòng text rất dài vẽ bằng 1 lệnh `Tj` duy nhất) khiến `pdfjs-dist` cắt cụt văn bản khi đoạn text vẽ tràn ra ngoài `MediaBox` của trang (đã xác nhận bằng thực nghiệm: độ dài text trích xuất được tỷ lệ nghịch với cỡ chữ và tỷ lệ thuận với bề rộng MediaBox — ví dụ cùng 300 ký tự 'a', font 4pt trích được 243 ký tự, font 28pt chỉ trích được 35 ký tự, MediaBox siêu rộng thì trích đủ 300/300). Đây **không phải bug trong code server** — PDF thật từ Word/trình soạn thảo luôn tự wrap dòng nên không bao giờ gặp tình huống này. Đã sửa script sinh fixture (`server/test-fixtures/make_pdf.js`) để wrap dòng đúng trước khi chạy lại toàn bộ test case ở trên. Nhân tiện cũng đã thêm `standardFontDataUrl` + `useSystemFonts: true` vào `server/src/services/pdfService.ts` để tránh warning "Unable to load font data" khi parse PDF dùng font chuẩn không nhúng — cải thiện độ chính xác đo bề rộng glyph cho PDF thật.

### 4.3 No-answer fallback (TC-2.4)
```
POST /api/sessions {} → sessionId
POST /api/sessions/{id}/messages { content: "thoi tiet hom nay the nao" }
→ event: done, message.content = "Tôi không tìm thấy thông tin này trong các tài liệu đã cung cấp."
  noAnswer: true, citations: []
```

### 4.4 Từ chối file không hợp lệ (TC-1.2, TC-1.3)
```
POST /api/documents -F files=@fake.docx
→ 400 { "error": "Chỉ hỗ trợ file PDF" }

POST /api/documents -F files=@oversize.pdf (50MB + 2KB)
→ 400 { "error": "File vượt quá dung lượng cho phép (50MB)" }
```
(File `oversize.pdf` đã xóa ngay sau test để tiết kiệm dung lượng đĩa — máy test chỉ còn ~100-150MB trống trong suốt phiên test này.)

### 4.5 PDF scan ảnh — không text layer (TC-1.6)
```
POST /api/documents -F files=@scan_no_text.pdf
→ 201, status PROCESSING
GET /api/documents (sau ~1.5s)
→ status FAILED
  failureReason: "Không thể đọc nội dung văn bản từ file này (có thể là bản scan ảnh)."
```

### 4.6 Indexing timeout (TC-1.7)
```
# Tạm sửa server/src/services/documentService.ts:
#   INDEXING_TIMEOUT_MS = 1 (thay vì 60_000)
#   + chèn delay giả lập 300ms trước khi parse PDF thật (đảm bảo luôn thua trong Promise.race)
# Restart server, test:
POST /api/documents -F files=@bao_gia_b.pdf
GET /api/documents (sau ~1.5s)
→ status FAILED
  failureReason: "Xử lý mất nhiều thời gian hơn dự kiến, vui lòng thử lại hoặc kiểm tra file."
# Đã revert INDEXING_TIMEOUT_MS về 60_000 và xóa đoạn delay giả lập ngay sau test.
# git diff xác nhận documentService.ts không còn khác biệt so với bản gốc đã commit.
```

### 4.7 Xóa & thử lại tài liệu (TC-1.8, TC-1.9)
```
DELETE /api/documents/{bao_gia_b.id}
→ 204
GET /api/documents → bao_gia_b.pdf không còn trong danh sách
ls server/uploads/ → file vật lý đã bị xóa khỏi đĩa

POST /api/documents/{scan_no_text.id}/retry
→ 202, status PROCESSING
GET /api/documents (sau ~1.5s)
→ status FAILED (cùng failureReason — đúng vì nội dung file scan không đổi,
  xác nhận retry thực sự chạy lại pipeline chứ không chỉ đổi trạng thái)
```

### 4.8 Lịch sử & đổi tên phiên chat (TC-2.5 — phần lưu trữ, US-4.1/4.2)
```
GET /api/sessions/{id}/messages
→ [ { role: "user", content: "dieu khoan thanh toan la gi" },
    { role: "ai", content: "Theo bao_gia_b.pdf ..." } ]   # đúng thứ tự thời gian

PATCH /api/sessions/{id} { title: "Hoi dap hop dong A" }
→ 200, session.title cập nhật đúng
```

### 4.9 Mất kết nối giữa chừng khi stream (TC-2.7)
```
POST /api/sessions/{id}/messages { content: "..." } (chạy nền, --max-time 3)
# Sau ~0.3s, kill process backend (taskkill)
→ output file dừng đột ngột giữa chừng token, KHÔNG có "event: done"
  (xác nhận đúng kịch bản "mất kết nối khi đang stream" ở transport level)
```
Từ kết quả này, rà soát `client/src/api.ts::sendMessageStream` và phát hiện thiếu xử lý lỗi cho đúng 2 tình huống trên (fetch lỗi, và reader kết thúc mà chưa có event done/error) → đã fix (xem TC-2.7 ở trên). `npx tsc -b` pass sau khi fix.

---

## 5. Việc cần làm tiếp để hoàn tất bộ test case

1. Mở `http://localhost:5173` bằng trình duyệt thật để xác nhận bằng mắt các phần UI còn ⬜: badge/spinner trạng thái tài liệu (TC-1.5), overlay highlight khi click trích dẫn (TC-2.3), và đặc biệt **banner "Mất kết nối" + nút Thử lại sau khi fix bug ở TC-2.7** — đây là phần quan trọng nhất cần xác nhận lại vì vừa sửa code.
2. Khi thay embedding/LLM mock bằng API thật, chạy lại toàn bộ bộ test case này như regression suite, đặc biệt TC-2.2/2.4/2.6 vì đây là 3 test case quyết định accuracy gate ≥ 90% (PRD §5.1).
3. Cân nhắc thêm 1 fixture PDF scan ảnh "thật" (ảnh chụp thật, không phải content stream rỗng mô phỏng) để test case TC-1.6 sát với thực tế người dùng hơn.

---

⬅️ Nguồn: [User Story](../07-UserStory/UserStory-DocuChat-AI.md) · [SADD](../05-SADD/SADD-DocuChat-AI.md)
