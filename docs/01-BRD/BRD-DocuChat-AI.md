# BRD: DocuChat AI — Công cụ Chat với Tài liệu PDF (MVP nội bộ)

| | |
|---|---|
| **Tài liệu** | Business Requirements Document (BRD) |
| **Dự án** | DocuChat AI |
| **Phiên bản** | 0.1 — Draft |
| **Trạng thái** | Chờ xác nhận stakeholder trước khi chuyển sang PRD |
| **Nguồn** | Suy ngược từ `docs/02-PRD/PRD-DocuChat-AI.md` (chưa có BRD gốc) |

> **Lưu ý:** Tài liệu này được dựng lại từ PRD đã có sẵn (vì chưa có BRD gốc). Các mục business objective, scope, stakeholder, business rule bên dưới là suy luận hợp lý từ bối cảnh PRD — **cần Product Owner / Sponsor xác nhận lại** trước khi dùng làm căn cứ chính thức.

---

## 1. Bối cảnh & Vấn đề kinh doanh

Đội ngũ Business Development / Sales / Vận hành xử lý 10–20 tài liệu PDF/tuần (hợp đồng, đề xuất, báo giá, hồ sơ đối tác). Thông tin nằm rải rác trong nhiều file riêng lẻ khiến nhân sự phải mở thủ công 5–7 file để trả lời một câu hỏi, dễ bỏ sót, và không có cơ chế xác minh nguồn khi tổng hợp thông tin.

**Chi phí hiện tại (ước tính, cần xác nhận):** thời gian tra cứu thủ công ~15 phút/câu hỏi, rủi ro ra quyết định/báo giá sai do thiếu thông tin hoặc hiểu sai tài liệu.

## 2. Mục tiêu kinh doanh (Business Objectives)

| # | Mục tiêu | Liên kết tới KR (xem PRD §1.2) |
|---|---|---|
| BO-1 | Giảm thời gian tra cứu thông tin từ tài liệu kinh doanh nội bộ | O1-KR1, KR2 |
| BO-2 | Tăng tỷ lệ áp dụng công cụ trong đội BD/Sales trong giai đoạn thử nghiệm nội bộ | O1-KR3 |
| BO-3 | Xây dựng nền tảng kỹ thuật (RAG) đủ ổn định để mở rộng thành knowledge layer toàn công ty sau MVP | O2 |
| BO-4 | Giảm rủi ro ra quyết định sai do thiếu/trích dẫn sai thông tin nguồn | Accuracy gate ≥ 90% |

## 3. Phạm vi dự án (Scope)

### 3.1 Trong phạm vi (In Scope — MVP)
- Upload, xử lý (index) và quản lý file PDF trong một workspace nội bộ
- Hỏi đáp bằng ngôn ngữ tự nhiên (tiếng Việt/Anh) trên nội dung PDF đã upload, kèm trích dẫn nguồn (file + trang)
- Truy xuất tổng hợp từ nhiều tài liệu trong cùng một câu hỏi
- Xem lại đoạn văn bản gốc tại đúng trang khi click trích dẫn
- Lịch sử phiên chat cơ bản
- Đăng nhập bằng tài khoản/SSO nội bộ công ty

### 3.2 Ngoài phạm vi (Out of Scope — MVP, cân nhắc giai đoạn sau)
- Chia sẻ phiên chat ra ngoài / cộng tác nhiều người cùng lúc (Epic 5, P2)
- Phân quyền chi tiết theo tài liệu/phòng ban (Epic 5, P2)
- Tóm tắt tự động sau upload (Epic 3, P1 — gợi ý mở rộng)
- Hỗ trợ định dạng khác ngoài PDF (Word, Excel, ảnh scan không text layer)
- Thương mại hóa ra ngoài công ty
- Tích hợp kho dữ liệu toàn công ty, đa nguồn

## 4. Stakeholders

| Vai trò | Mô tả | Quan tâm chính |
|---|---|---|
| **Sponsor / Product Owner** | Người phê duyệt ngân sách & phạm vi MVP | ROI, rủi ro bảo mật dữ liệu nội bộ |
| **Primary user — "Linh" (Chuyên viên BD)** | Người dùng chính hàng ngày | Tốc độ, độ chính xác, dễ dùng không cần đào tạo |
| **Secondary user — "Quang" (Trưởng phòng Kinh doanh)** | Dùng để tổng hợp thông tin ra quyết định | Độ tin cậy (có trích dẫn) để báo cáo cấp cao hơn |
| **Legal/Compliance (tertiary, tham khảo)** | Có nhu cầu tra cứu điều khoản hợp đồng | Bảo mật & độ chính xác cao hơn mức MVP — hoãn tới giai đoạn sau |
| **IT/Security** | Phê duyệt kiến trúc, SSO, lưu trữ dữ liệu | Mã hóa dữ liệu, không dùng tài liệu để train model bên thứ ba |
| **Engineering team** | Triển khai kỹ thuật | Tính khả thi của ngưỡng hiệu năng (indexing < 30s, TTFT < 3s) |

## 5. Business Requirements (mức cao, phi kỹ thuật)

| ID | Yêu cầu nghiệp vụ |
|---|---|
| BR-1 | Nhân sự phải có khả năng đưa tài liệu PDF nội bộ vào hệ thống mà không cần hỗ trợ kỹ thuật |
| BR-2 | Hệ thống phải trả lời câu hỏi nghiệp vụ bằng ngôn ngữ tự nhiên và luôn cho biết câu trả lời lấy từ đâu (file, trang) |
| BR-3 | Hệ thống không được bịa thông tin ngoài phạm vi tài liệu đã cung cấp (rủi ro nghiệp vụ: quyết định sai dựa trên thông tin sai) |
| BR-4 | Dữ liệu tài liệu kinh doanh (có thể nhạy cảm) phải được bảo vệ — mã hóa, không dùng để huấn luyện lại model của bên thứ ba |
| BR-5 | Chỉ nhân sự có tài khoản công ty (SSO nội bộ) mới truy cập được |
| BR-6 | Hệ thống phải đủ nhanh để không làm gián đoạn quy trình làm việc hiện tại (xử lý & trả lời gần real-time) |
| BR-7 | MVP giới hạn trong nội bộ — không yêu cầu mức độ compliance/scale như sản phẩm thương mại hóa |

## 6. Business Rules

- BRule-1: Chỉ chấp nhận file định dạng PDF, dung lượng ≤ 50MB/file
- BRule-2: Câu trả lời không có trích dẫn nguồn hợp lệ không được xem là câu trả lời hợp lệ (gắn với accuracy gate)
- BRule-3: Khi không tìm thấy thông tin trong tài liệu, hệ thống phải từ chối trả lời thay vì suy diễn
- BRule-4: Nội dung tài liệu upload không được dùng để huấn luyện lại mô hình AI của bên thứ ba

## 7. Giả định & Ràng buộc (Assumptions & Constraints)

**Giả định:**
- Công ty đã có hệ thống SSO/tài khoản nội bộ có thể tích hợp
- Người dùng mục tiêu không có kỹ năng kỹ thuật, cần UI tối giản
- Đây là MVP nội bộ, không phát hành ra ngoài công ty trong giai đoạn này

**Ràng buộc:**
- Ngân sách/thời gian ở mức MVP — không đầu tư hạ tầng scale lớn ngay từ đầu
- Phải tuân thủ chính sách bảo mật dữ liệu nội bộ của công ty (mã hóa at-rest/in-transit)
- Giới hạn kỹ thuật của nhà cung cấp LLM/embedding được công ty phê duyệt sử dụng

## 8. Success Criteria (mức nghiệp vụ)

- Thời gian tra cứu thông tin giảm từ ~15 phút xuống < 2 phút (O1-KR1)
- Độ chính xác câu trả lời + trích dẫn ≥ 90% trên bộ test nội bộ (O1-KR2)
- ≥ 70% nhân sự BD/Sales được cấp quyền sử dụng ít nhất 1 lần/tuần trong 4 tuần đầu (O1-KR3)
- Nền tảng kỹ thuật đáp ứng ngưỡng hiệu năng để làm tiền đề mở rộng (O2)

## 9. Rủi ro kinh doanh (Business Risks)

| Rủi ro | Tác động | Giảm thiểu đề xuất |
|---|---|---|
| AI trả lời sai/bịa thông tin → mất lòng tin ngay từ lần dùng đầu | Cao | Accuracy gate ≥ 90% trước khi launch; luôn bắt buộc trích dẫn |
| Rò rỉ dữ liệu kinh doanh nhạy cảm qua bên thứ ba (nhà cung cấp LLM) | Cao | Chính sách không train lại model bên thứ ba; mã hóa dữ liệu; access control SSO |
| Tỷ lệ áp dụng thấp nếu UX phức tạp | Trung bình | UX tối giản, không cần đào tạo (xem PRD §4) |
| Hiệu năng không đạt ngưỡng ảnh hưởng tới trải nghiệm & niềm tin | Trung bình | Launch gate performance criteria (PRD §5.1) |

## 10. Điểm cần Sponsor/Stakeholder xác nhận

1. Phạm vi MVP ở trên (In/Out of scope) có đúng kỳ vọng ban đầu không?
2. Yêu cầu bảo mật/compliance cụ thể nào chưa được liệt kê (ví dụ: quy định riêng với tài liệu mật)?
3. Quy mô người dùng & tài liệu dự kiến để ước tính ngân sách hạ tầng?
4. Ngân sách/timeline chính thức cho MVP (chưa được đề cập trong tài liệu nguồn)?

---

➡️ Sau khi BRD được xác nhận, chi tiết hoá thành **PRD** tại [`docs/02-PRD/PRD-DocuChat-AI.md`](../02-PRD/PRD-DocuChat-AI.md).
