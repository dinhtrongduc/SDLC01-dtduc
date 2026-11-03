# User Story Backlog: DocuChat AI

| | |
|---|---|
| **Tài liệu** | User Story Backlog (chi tiết hóa từ PRD Epic 1–5) |
| **Dự án** | DocuChat AI |
| **Nguồn** | `docs/02-PRD/PRD-DocuChat-AI.md` §3, `docs/04-UseCase/UseCase-DocuChat-AI.md` |

> Story point là ước lượng tương đối (Fibonacci), cần team kỹ thuật xác nhận lại ở sprint planning.

---

## Epic 1 — Upload & Quản lý tài liệu

### US-1.1 (P0, 3 pts) — Upload 1 file PDF
**Là** Linh, **tôi muốn** kéo-thả hoặc chọn file PDF để upload, **để** không mất thời gian thao tác.

```gherkin
Given người dùng đang ở màn hình chính của workspace
When người dùng kéo-thả 1 file .pdf hợp lệ (≤ 50MB) vào khu vực upload
Then hệ thống nhận file, hiển thị tên file + progress bar upload
And khi upload xong, hệ thống tự động chuyển sang trạng thái "Đang xử lý"

Given người dùng chọn file không phải .pdf (ví dụ .docx)
When người dùng thả file vào khu vực upload
Then hệ thống từ chối file và hiển thị thông báo lỗi rõ ràng: "Chỉ hỗ trợ file PDF"
And không có file nào được gửi lên server

Given người dùng chọn file PDF > 50MB
When người dùng thả file vào khu vực upload
Then hệ thống chặn ngay từ client-side, hiển thị thông báo giới hạn dung lượng trước khi gửi lên server
```
**Definition of Done**: Unit test cho validate type/size; UI hiển thị đúng 3 trạng thái (uploading, lỗi loại file, lỗi dung lượng); event `document_upload_started/completed/failed` được bắn đúng.

### US-1.2 (P0, 5 pts) — Upload nhiều file cùng lúc
**Là** Linh, **tôi muốn** upload nhiều file PDF cùng lúc, **để** chuẩn bị hỏi xuyên nhiều tài liệu.

```gherkin
Given người dùng đang ở màn hình chính của workspace
When người dùng kéo-thả hoặc chọn nhiều file .pdf hợp lệ cùng lúc
Then hệ thống nhận tất cả file hợp lệ, upload song song, mỗi file có progress bar riêng
And các file không hợp lệ trong cùng lượt chọn bị từ chối độc lập, không chặn các file hợp lệ khác
```
**Definition of Done**: Có thể upload tối thiểu 5 file đồng thời không lỗi; mỗi file có trạng thái độc lập.

### US-1.3 (P0, 5 pts) — Xem trạng thái xử lý tài liệu
**Là** Linh, **tôi muốn** thấy trạng thái xử lý (đang tải lên/đang xử lý/sẵn sàng) của từng file, **để** biết khi nào có thể bắt đầu hỏi.

```gherkin
Given 1 file đã upload thành công và đang được xử lý/index
When quá trình index đang chạy
Then UI hiển thị trạng thái "Đang xử lý..." kèm spinner, chat input bị disable cho file đó
And khi index xong, trạng thái chuyển thành "Sẵn sàng" và chat input được enable

Given quá trình index thất bại (ví dụ PDF là ảnh scan không có text layer)
When hệ thống không trích xuất được nội dung
Then hiển thị thông báo lỗi cụ thể: "Không thể đọc nội dung văn bản từ file này (có thể là bản scan ảnh)"
And đề xuất người dùng thử file khác hoặc liên hệ hỗ trợ

Given quá trình index chạy quá 60 giây
When ngưỡng timeout bị vượt
Then hiển thị "Xử lý mất nhiều thời gian hơn dự kiến, vui lòng thử lại hoặc kiểm tra file" thay vì loading vô hạn
```
**Definition of Done**: Indexing 1 PDF 20 trang < 30s (đo bằng `processing_time_ms`); tỷ lệ thất bại < 5% trên bộ test 20 file đa dạng.

### US-1.4 (P1, 3 pts) — Xem & xóa tài liệu
**Là** Linh, **tôi muốn** xem danh sách các file đã upload và xóa file không cần nữa.

```gherkin
Given danh sách tài liệu trong workspace có ≥ 1 file
When người dùng bấm "Xóa" trên 1 file
Then hệ thống yêu cầu xác nhận, sau đó xóa file khỏi danh sách, storage và vector index
And nếu file đang được dùng trong 1 câu trả lời đã lưu trước đó, citation cũ vẫn hiển thị nhưng không thể mở lại nội dung gốc (hiển thị "Tài liệu đã bị xóa")
```

### US-1.5 (P2, 3 pts) — Gắn tag tài liệu theo dự án
**Là** Quang, **tôi muốn** gắn tag/nhóm tài liệu theo dự án, **để** dễ quản lý khi có nhiều hồ sơ.

```gherkin
Given 1 tài liệu đã ở trạng thái "Sẵn sàng"
When người dùng gắn 1 hoặc nhiều tag cho tài liệu
Then tag được lưu và hiển thị trên doc item, có thể lọc danh sách tài liệu theo tag
```

---

## Epic 2 — Chat & Q&A với trích dẫn nguồn

### US-2.1 (P0, 5 pts) — Đặt câu hỏi tự nhiên
**Là** Linh, **tôi muốn** gõ câu hỏi bằng tiếng Việt/tiếng Anh tự nhiên về nội dung tài liệu đã upload, **để** không cần đọc toàn bộ file.

```gherkin
Given có ít nhất 1 tài liệu ở trạng thái "Sẵn sàng"
When người dùng gõ câu hỏi (tiếng Việt hoặc tiếng Anh) và gửi
Then hệ thống nhận câu hỏi, hiển thị trạng thái "đang trả lời" trong khi chờ token đầu tiên (< 3s)
```

### US-2.2 (P0, 8 pts) — Trả lời kèm trích dẫn nguồn
**Là** Linh, **tôi muốn** mỗi câu trả lời của AI kèm trích dẫn (tên file + số trang), **để** tôi tự xác minh được độ chính xác.

```gherkin
Given 1 hoặc nhiều file đã ở trạng thái "Sẵn sàng"
When người dùng gửi câu hỏi liên quan đến nội dung có trong tài liệu
Then AI trả lời bằng streaming text
And mỗi câu trả lời phải kèm ít nhất 1 trích dẫn dạng [Tên_file.pdf, trang X]
And nếu câu trả lời tổng hợp từ nhiều nguồn, mỗi ý phải gắn đúng trích dẫn tương ứng
```
**Definition of Done**: Đạt ≥ 90% độ chính xác (nội dung + trích dẫn đúng) trên bộ 50 câu hỏi test nội bộ (accuracy gate PRD §5.1).

### US-2.3 (P0, 5 pts) — Xem đoạn văn bản gốc qua trích dẫn
**Là** Linh, **tôi muốn** click vào trích dẫn để xem đúng đoạn văn bản gốc trong PDF, **để** kiểm chứng nhanh không cần mở file riêng.

```gherkin
Given AI đã trả lời kèm trích dẫn [file.pdf, trang 5]
When người dùng click vào trích dẫn đó
Then hệ thống mở PDF viewer tại đúng trang 5 (overlay, không điều hướng rời khỏi khung chat)
And highlight đoạn văn bản nguồn được dùng để tạo câu trả lời
```

### US-2.4 (P0, 3 pts) — Từ chối trả lời khi không có dữ liệu
**Là** Linh, **tôi muốn** AI trả lời "Không tìm thấy thông tin này trong tài liệu" khi không có dữ liệu, **thay vì** bịa thông tin.

```gherkin
Given người dùng hỏi về thông tin KHÔNG có trong bất kỳ tài liệu nào đã upload
When AI xử lý câu hỏi
Then AI phải trả lời rõ ràng "Tôi không tìm thấy thông tin này trong các tài liệu đã cung cấp"
And KHÔNG được tự suy diễn/bịa thông tin ngoài phạm vi tài liệu
```

### US-2.5 (P1, 5 pts) — Hỏi follow-up (multi-turn)
**Là** Linh, **tôi muốn** hỏi tiếp các câu follow-up trong cùng ngữ cảnh hội thoại, **để** đào sâu thông tin.

```gherkin
Given người dùng đã nhận 1 câu trả lời trong phiên chat hiện tại
When người dùng gửi câu hỏi tiếp theo có liên quan ngữ cảnh ("còn điều khoản phạt thì sao?")
Then AI hiểu ngữ cảnh từ các message trước đó trong cùng ChatSession khi trả lời
```

### US-2.6 (P0, 8 pts) — Hỏi tổng hợp đa tài liệu
**Là** Quang, **tôi muốn** đặt 1 câu hỏi và nhận câu trả lời tổng hợp từ nhiều tài liệu cùng lúc, **để** không phải hỏi từng file riêng.

```gherkin
Given người dùng đã upload từ 2 file PDF trở lên, đều ở trạng thái "Sẵn sàng"
When người dùng đặt câu hỏi liên quan đến nội dung nằm ở các file khác nhau
Then AI trả lời tổng hợp, có phân biệt rõ nguồn nào nói gì
  (ví dụ: "Theo Hợp_đồng_A.pdf (tr.3)... trong khi Báo_giá_B.pdf (tr.1) lại nêu...")
```

---

## Epic 3 — Tóm tắt tài liệu tự động

### US-3.1 (P1, 5 pts) — Tóm tắt tự động sau upload
**Là** Linh, **tôi muốn** nhận bản tóm tắt tự động ngay sau khi upload xong, **để** nắm nhanh nội dung chính trước khi hỏi chi tiết.

```gherkin
Given 1 tài liệu vừa chuyển sang trạng thái "Sẵn sàng"
When quá trình indexing hoàn tất
Then hệ thống tự động sinh và hiển thị bản tóm tắt ngắn (3-5 bullet chính) ngay trên doc item hoặc panel chi tiết
```

---

## Epic 4 — Lịch sử & quản lý phiên chat

### US-4.1 (P1, 5 pts) — Xem lại phiên chat trước đó
**Là** Linh, **tôi muốn** quay lại phiên chat trước đó kèm toàn bộ lịch sử hội thoại, **để** không phải hỏi lại từ đầu.

```gherkin
Given người dùng đã có ≥ 1 phiên chat trước đó trong workspace
When người dùng mở danh sách phiên chat và chọn 1 phiên cũ
Then hệ thống tải lại toàn bộ Message + Citation đã lưu, đúng thứ tự thời gian
```

### US-4.2 (P2, 2 pts) — Đổi tên phiên chat
**Là** Linh, **tôi muốn** đổi tên phiên chat để dễ tìm lại sau này.

```gherkin
Given 1 phiên chat đang mở
When người dùng chỉnh sửa tiêu đề phiên và lưu
Then tiêu đề mới được cập nhật và hiển thị trong danh sách phiên chat
```

---

## Epic 5 — Chia sẻ & cộng tác

### US-5.1 (P2, 5 pts) — Chia sẻ phiên chat read-only
**Là** Quang, **tôi muốn** chia sẻ link phiên chat cho đồng nghiệp xem (read-only), **để** không phải giải thích lại.

```gherkin
Given 1 phiên chat có nội dung
When người dùng bấm "Chia sẻ" và tạo link
Then hệ thống sinh 1 link read-only, người nhận link xem được toàn bộ Message + Citation nhưng không gửi được câu hỏi mới
```

### US-5.2 (P2, 8 pts) — Phân quyền tài liệu theo phòng ban
**Là** Quản trị viên, **tôi muốn** phân quyền ai được xem tài liệu nào, **để** tránh rò rỉ thông tin nhạy cảm giữa các phòng ban.

```gherkin
Given Admin đang ở màn hình quản trị workspace
When Admin gán quyền Viewer/Editor cho 1 User trên 1 Document hoặc Workspace cụ thể
Then User không có quyền sẽ không thấy tài liệu đó trong danh sách và không truy xuất được nội dung qua chat
```

---

## Tổng hợp Priority & Story Points

| Epic | P0 pts | P1 pts | P2 pts |
|---|---|---|---|
| Epic 1 — Upload & Quản lý | 13 | 3 | 3 |
| Epic 2 — Chat & Q&A | 24 | 5 | — |
| Epic 3 — Tóm tắt | — | 5 | — |
| Epic 4 — Lịch sử | — | 5 | 2 |
| Epic 5 — Chia sẻ | — | — | 13 |

**Tổng P0 (bắt buộc cho MVP launch)**: 37 pts — tương ứng Epic 1 (upload cốt lõi) + Epic 2 (chat/Q&A/trích dẫn cốt lõi), đúng với Launch Gate Criteria ở PRD §5.1.

---

⬅️ Quay lại: [SADD](../05-SADD/SADD-DocuChat-AI.md) · [HTML Design](../06-HTML-Design/index.html)
