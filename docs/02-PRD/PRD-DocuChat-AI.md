# PRD: DocuChat AI — Công cụ Chat với Tài liệu PDF (MVP)

> **Bối cảnh:** Chưa có SRS chính thức. Các pillar dưới đây là giả định hợp lý rút ra từ bối cảnh dự án — cần xác nhận lại trước khi chuyển sang thiết kế/kỹ thuật.

## Xác nhận Product Pillars

| Pillar | Giả định |
|---|---|
| **Tên sản phẩm (working name)** | DocuChat AI |
| **Target user** | Nhân sự Business Development / Sales / Vận hành — người phải xử lý nhiều hợp đồng, đề xuất, báo cáo PDF mỗi tuần, không có kỹ năng kỹ thuật |
| **Vấn đề cốt lõi** | Thông tin nằm rải rác trong nhiều file PDF riêng lẻ → tốn thời gian tìm & tổng hợp thủ công, dễ bỏ sót, không ai chắc thông tin vừa trích là đúng nguồn nào |
| **Giải pháp cốt lõi** | Web app dạng RAG (Retrieval-Augmented Generation): upload PDF → AI trả lời câu hỏi bằng ngôn ngữ tự nhiên, **luôn kèm trích dẫn nguồn (file + trang)** để người dùng tự xác minh |
| **UX pillars** | (1) Web-first, thao tác tối giản (kéo-thả upload, không cần training); (2) Trả lời có trích dẫn — ưu tiên "tin cậy được" hơn "mượt mà"; (3) Phản hồi gần real-time (streaming); (4) Bảo mật dữ liệu doanh nghiệp (tài liệu kinh doanh = nhạy cảm) |

Đây là **MVP nội bộ** (internal tool), không phải sản phẩm thương mại hóa ra ngoài — điều này ảnh hưởng đến mức độ ưu tiên của security/compliance và scale.

---

## 1. Executive Summary & Strategy

### 1.1 Product Vision
Trở thành lớp tra cứu tri thức (knowledge layer) mặc định cho mọi tài liệu kinh doanh nội bộ — nơi bất kỳ nhân sự nào cũng có thể "hỏi" kho tài liệu công ty bằng ngôn ngữ tự nhiên và nhận câu trả lời đáng tin cậy, có nguồn gốc rõ ràng, thay vì phải đọc/tìm thủ công qua hàng chục file PDF.

MVP này là bước đầu tiên: chứng minh giá trị cốt lõi (upload → hỏi → trả lời có trích dẫn) trước khi mở rộng sang tích hợp kho dữ liệu toàn công ty, đa định dạng, và phân quyền phức tạp.

### 1.2 Objectives & Key Results (OKRs)

**O1: Giảm thời gian tra cứu thông tin từ tài liệu kinh doanh**
- KR1: Thời gian trung bình để tìm ra 1 thông tin cụ thể giảm từ ~15 phút (tìm thủ công) xuống **< 2 phút** (đo bằng time-to-answer trong app)
- KR2: Độ chính xác câu trả lời (đúng nội dung + đúng trích dẫn nguồn) đạt **≥ 90%** trên bộ 50 câu hỏi test nội bộ
- KR3: **≥ 70%** nhân sự BD/Sales được cấp quyền dùng thử ít nhất 1 lần/tuần trong 4 tuần đầu sau khi launch nội bộ

**O2: Đảm bảo nền tảng kỹ thuật đủ ổn định để mở rộng sau MVP**
- KR1: Thời gian xử lý (indexing) 1 file PDF 20 trang **< 30 giây**
- KR2: Thời gian phản hồi token đầu tiên của chat **< 3 giây**
- KR3: Tỷ lệ upload/xử lý thất bại **< 5%**

---

## 2. User Personas & User Journeys

### 2.1 Target Personas

**Primary — "Linh", Chuyên viên Phát triển Kinh doanh**
- 25–32 tuổi, xử lý 10–20 tài liệu/tuần (hợp đồng, đề xuất, báo giá, hồ sơ đối tác)
- Không rành kỹ thuật, cần công cụ đơn giản, không muốn đọc hướng dẫn
- Nỗi đau: phải mở 5–7 file PDF cùng lúc để trả lời 1 câu hỏi của khách hàng/sếp

**Secondary — "Quang", Trưởng phòng Kinh doanh**
- Cần tổng hợp nhanh thông tin từ nhiều báo cáo/đề xuất để ra quyết định hoặc duyệt deal
- Quan tâm đến độ tin cậy (có trích dẫn) vì sẽ dùng thông tin này để báo cáo lên cấp cao hơn

**Tertiary (tham khảo, không phải target chính thức của MVP) — Legal/Compliance**
- Có thể cần tra cứu điều khoản hợp đồng, nhưng yêu cầu bảo mật & chính xác cao hơn mức MVP đáp ứng → cân nhắc ở giai đoạn sau

### 2.2 High-Level User Journey

```
Nhận link/được giới thiệu nội bộ
   → Đăng nhập (SSO nội bộ hoặc tài khoản công ty cấp)
   → Tạo workspace/phiên chat mới
   → Kéo-thả upload 1 hoặc nhiều file PDF
   → Hệ thống xử lý & index (có loading state rõ ràng)
   → Người dùng gõ câu hỏi bằng ngôn ngữ tự nhiên
   → AI trả lời (streaming) kèm trích dẫn [Tên file, trang X]
   → Người dùng click trích dẫn → xem đúng đoạn văn bản gốc trong PDF
   → Tiếp tục hỏi thêm (multi-turn) hoặc upload thêm tài liệu khác để hỏi xuyên nhiều file
   → Kết thúc phiên (lịch sử được lưu để quay lại sau)
```

Điểm rời bỏ (drop-off) rủi ro nhất: ngay sau bước upload nếu xử lý quá chậm, hoặc ngay sau câu trả lời đầu tiên nếu AI trả lời sai/không có trích dẫn → mất lòng tin ngay lập tức.

---

## 3. Functional Requirements & User Stories

### Epic 1 — Upload & Quản lý tài liệu (P0)

| # | User Story | Priority |
|---|---|---|
| 1.1 | Là Linh, tôi muốn kéo-thả hoặc chọn file PDF để upload, để không mất thời gian thao tác | P0 |
| 1.2 | Là Linh, tôi muốn upload nhiều file PDF cùng lúc, để chuẩn bị hỏi xuyên nhiều tài liệu | P0 |
| 1.3 | Là Linh, tôi muốn thấy trạng thái xử lý (đang tải lên/đang xử lý/sẵn sàng) của từng file, để biết khi nào có thể bắt đầu hỏi | P0 |
| 1.4 | Là Linh, tôi muốn xem danh sách các file đã upload và xóa file không cần nữa | P1 |
| 1.5 | Là Quang, tôi muốn gắn tag/nhóm tài liệu theo dự án, để dễ quản lý khi có nhiều hồ sơ | P2 |

**AC — Story 1.1 (P0)**
```
Given người dùng đang ở màn hình chính của workspace
When người dùng kéo-thả 1 file .pdf hợp lệ (≤ 50MB) vào khu vực upload
Then hệ thống nhận file, hiển thị tên file + progress bar upload
And khi upload xong, hệ thống tự động chuyển sang trạng thái "Đang xử lý"

Given người dùng chọn file không phải .pdf (ví dụ .docx)
When người dùng thả file vào khu vực upload
Then hệ thống từ chối file và hiển thị thông báo lỗi rõ ràng: "Chỉ hỗ trợ file PDF"
And không có file nào được gửi lên server
```

**AC — Story 1.3 (P0)**
```
Given 1 file đã upload thành công và đang được xử lý/index
When quá trình index đang chạy
Then UI hiển thị trạng thái "Đang xử lý..." kèm spinner, chat input bị disable cho file đó
And khi index xong, trạng thái chuyển thành "Sẵn sàng" và chat input được enable

Given quá trình index thất bại (ví dụ PDF là ảnh scan không có text layer)
When hệ thống không trích xuất được nội dung
Then hiển thị thông báo lỗi cụ thể: "Không thể đọc nội dung văn bản từ file này (có thể là bản scan ảnh)"
And đề xuất người dùng thử file khác hoặc liên hệ hỗ trợ
```

---

### Epic 2 — Chat & Q&A với trích dẫn nguồn (P0)

| # | User Story | Priority |
|---|---|---|
| 2.1 | Là Linh, tôi muốn gõ câu hỏi bằng tiếng Việt/tiếng Anh tự nhiên về nội dung tài liệu đã upload, để không cần đọc toàn bộ file | P0 |
| 2.2 | Là Linh, tôi muốn mỗi câu trả lời của AI kèm trích dẫn (tên file + số trang), để tôi tự xác minh được độ chính xác | P0 |
| 2.3 | Là Linh, tôi muốn click vào trích dẫn để xem đúng đoạn văn bản gốc trong PDF, để kiểm chứng nhanh không cần mở file riêng | P0 |
| 2.4 | Là Linh, tôi muốn AI trả lời "Không tìm thấy thông tin này trong tài liệu" khi không có dữ liệu, thay vì bịa thông tin | P0 |
| 2.5 | Là Linh, tôi muốn hỏi tiếp các câu follow-up trong cùng ngữ cảnh hội thoại (multi-turn), để đào sâu thông tin | P1 |
| 2.6 | Là Quang, tôi muốn đặt 1 câu hỏi và nhận câu trả lời tổng hợp từ nhiều tài liệu cùng lúc, để không phải hỏi từng file riêng | P0 |

**AC — Story 2.2 & 2.4 (P0)**
```
Given 1 hoặc nhiều file đã ở trạng thái "Sẵn sàng"
When người dùng gửi câu hỏi liên quan đến nội dung có trong tài liệu
Then AI trả lời bằng streaming text
And mỗi câu trả lời phải kèm ít nhất 1 trích dẫn dạng [Tên_file.pdf, trang X]
And nếu câu trả lời tổng hợp từ nhiều nguồn, mỗi ý phải gắn đúng trích dẫn tương ứng

Given người dùng hỏi về thông tin KHÔNG có trong bất kỳ tài liệu nào đã upload
When AI xử lý câu hỏi
Then AI phải trả lời rõ ràng "Tôi không tìm thấy thông tin này trong các tài liệu đã cung cấp"
And KHÔNG được tự suy diễn/bịa thông tin ngoài phạm vi tài liệu
```

**AC — Story 2.3 (P0)**
```
Given AI đã trả lời kèm trích dẫn [file.pdf, trang 5]
When người dùng click vào trích dẫn đó
Then hệ thống mở PDF viewer tại đúng trang 5
And highlight đoạn văn bản nguồn được dùng để tạo câu trả lời
```

**AC — Story 2.6 (P0)**
```
Given người dùng đã upload từ 2 file PDF trở lên, đều ở trạng thái "Sẵn sàng"
When người dùng đặt câu hỏi liên quan đến nội dung nằm ở các file khác nhau
Then AI trả lời tổng hợp, có phân biệt rõ nguồn nào nói gì (ví dụ: "Theo Hợp_đồng_A.pdf (tr.3)... trong khi Báo_giá_B.pdf (tr.1) lại nêu...")
```

---

### Epic 3 — Tóm tắt tài liệu tự động (P1 — gợi ý mở rộng)

| # | User Story | Priority |
|---|---|---|
| 3.1 | Là Linh, tôi muốn nhận bản tóm tắt tự động ngay sau khi upload xong, để nắm nhanh nội dung chính trước khi hỏi chi tiết | P1 |

### Epic 4 — Lịch sử & quản lý phiên chat (P1)

| # | User Story | Priority |
|---|---|---|
| 4.1 | Là Linh, tôi muốn quay lại phiên chat trước đó kèm toàn bộ lịch sử hội thoại, để không phải hỏi lại từ đầu | P1 |
| 4.2 | Là Linh, tôi muốn đổi tên phiên chat để dễ tìm lại sau này | P2 |

### Epic 5 — Chia sẻ & cộng tác (P2 — gợi ý mở rộng)

| # | User Story | Priority |
|---|---|---|
| 5.1 | Là Quang, tôi muốn chia sẻ link phiên chat cho đồng nghiệp xem (read-only), để không phải giải thích lại | P2 |
| 5.2 | Là Quản trị viên, tôi muốn phân quyền ai được xem tài liệu nào, để tránh rò rỉ thông tin nhạy cảm giữa các phòng ban | P2 |

---

## 4. UX & UI Requirements

### 4.1 Core Wireframe/Flow Logic
- **Layout 2 cột**: cột trái = danh sách tài liệu đã upload + trạng thái xử lý; cột phải = khung chat chính (dạng hội thoại, tin nhắn người dùng bên phải, AI bên trái)
- Khu vực upload luôn hiển thị cố định (drag-drop zone) ở đầu cột trái, kể cả khi đã có tài liệu
- Câu trả lời AI streaming theo từng token, trích dẫn hiển thị dạng chip/badge nhỏ có thể click ngay dưới câu trả lời — không gộp chung vào văn bản gây rối mắt
- Khi click trích dẫn → mở panel/modal PDF viewer bên phải hoặc overlay, có highlight màu vàng đoạn nguồn, không điều hướng rời khỏi khung chat (giữ ngữ cảnh hội thoại)
- Input chat luôn ở dưới cùng, disable kèm tooltip giải thích khi chưa có tài liệu nào "Sẵn sàng"

### 4.2 Edge Cases & Error States

| Tình huống | Xử lý |
|---|---|
| Mất kết nối mạng giữa chừng khi đang chat | Hiển thị banner "Mất kết nối — đang thử kết nối lại", giữ nguyên tin nhắn đã gõ, không mất dữ liệu input |
| Mất kết nối khi đang stream câu trả lời | Dừng stream, hiển thị nút "Thử lại" thay vì câu trả lời bị cắt ngang không rõ ràng |
| Chưa có tài liệu nào được upload | Empty state hướng dẫn rõ: "Upload tài liệu PDF đầu tiên để bắt đầu hỏi đáp" kèm minh họa |
| File PDF là bản scan ảnh (không có text layer) | Thông báo lỗi cụ thể, không index im lặng rồi trả lời sai (xem AC 1.3) |
| File vượt quá dung lượng cho phép (> 50MB) | Chặn upload ngay từ client-side, thông báo giới hạn trước khi gửi lên server |
| Câu hỏi không liên quan đến tài liệu nào | AI từ chối lịch sự, không trả lời ngoài phạm vi tài liệu (xem AC 2.4) |
| Xử lý/index quá lâu (timeout) | Sau ngưỡng thời gian (ví dụ 60s), thông báo "Xử lý mất nhiều thời gian hơn dự kiến, vui lòng thử lại hoặc kiểm tra file" thay vì loading vô hạn |

---

## 5. Release Criteria & Post-Launch Metrics

### 5.1 Launch Gate Criteria
- **Performance**: Indexing 1 file 20 trang < 30s; time-to-first-token < 3s (đúng theo OKR O2)
- **Security**: Dữ liệu tài liệu được mã hóa at-rest và in-transit; không dùng nội dung tài liệu upload để train lại model của bên thứ ba (quan trọng vì đây là tài liệu kinh doanh nội bộ); access control cơ bản theo tài khoản công ty (SSO)
- **QA Coverage**: Toàn bộ P0 user stories có test case pass theo đúng Given-When-Then AC đã định nghĩa; test với tối thiểu 20 file PDF thực tế đa dạng định dạng (text thuần, bảng biểu, scan) để xác nhận tỷ lệ lỗi index < 5%
- **Accuracy gate**: Đạt ≥ 90% độ chính xác trên bộ 50 câu hỏi test nội bộ (điều kiện launch, trùng với OKR O1-KR2) — nếu không đạt, launch nội bộ ở dạng "giới hạn beta" cho 1 nhóm nhỏ trước

### 5.2 Analytics & Tracking

**Funnel chính (đo drop-off):**
`document_upload_started` → `document_upload_completed` → `document_indexed_success` → `first_question_asked` → `answer_received_with_citation` → `citation_clicked`

**Sự kiện cần instrument:**

| Event | Thuộc tính quan trọng |
|---|---|
| `document_upload_started` / `completed` / `failed` | file_size, file_count, failure_reason |
| `document_indexed_success` / `failed` | processing_time_ms, page_count, failure_reason |
| `chat_message_sent` | message_length, is_multi_doc_query (bool), session_id |
| `chat_response_received` | time_to_first_token_ms, total_response_time_ms, has_citation (bool), num_citations |
| `citation_clicked` | document_id, page_number |
| `no_answer_found` | query_text (ẩn danh hóa nếu cần), document_ids_in_scope |
| `session_resumed` | days_since_last_active |
| `feature_used_summary` (P1) | document_id |
| `error_occurred` | error_type, error_context |

**Mục đích đo lường**: xác nhận trực tiếp 2 OKR ở mục 1.2 — time-to-answer (qua chat_message_sent → chat_response_received), độ chính xác (qua tỷ lệ no_answer_found vs citation_clicked làm proxy cho sự tin cậy), và tần suất sử dụng lặp lại (session_resumed) để đo mức độ adoption thực tế trong đội BD/Sales.

---

## Điểm cần xác nhận trước khi chuyển sang giai đoạn thiết kế/kỹ thuật

1. Phạm vi P0 ở trên có đúng là MVP bạn hình dung, hay cần cắt bớt (ví dụ bỏ multi-doc query khỏi P0)?
2. Có yêu cầu bảo mật/compliance cụ thể nào (ví dụ không được dùng API AI bên thứ ba cho tài liệu mật) chưa được đề cập?
3. Quy mô người dùng dự kiến ở MVP (bao nhiêu nhân sự, bao nhiêu tài liệu) để điều chỉnh lại các ngưỡng performance cho sát thực tế hơn.
