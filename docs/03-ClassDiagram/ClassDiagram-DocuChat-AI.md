# Class Diagram: DocuChat AI

| | |
|---|---|
| **Tài liệu** | Domain / Class Diagram |
| **Dự án** | DocuChat AI |
| **Nguồn** | Dựa trên `docs/02-PRD/PRD-DocuChat-AI.md` (Epic 1, 2, 4, 5) |

---

## 1. Mermaid Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +string name
        +string email
        +string ssoId
        +UserRole role
        +DateTime createdAt
        +login()
        +logout()
    }

    class UserRole {
        <<enumeration>>
        BD_SALES
        MANAGER
        ADMIN
    }

    class Workspace {
        +UUID id
        +string name
        +UUID ownerId
        +DateTime createdAt
        +addDocument(doc)
        +createChatSession()
    }

    class WorkspaceMember {
        +UUID id
        +UUID workspaceId
        +UUID userId
        +MemberPermission permission
    }

    class MemberPermission {
        <<enumeration>>
        OWNER
        EDITOR
        VIEWER
    }

    class Document {
        +UUID id
        +UUID workspaceId
        +string fileName
        +long fileSizeBytes
        +int pageCount
        +DocumentStatus status
        +string storageUrl
        +DateTime uploadedAt
        +upload()
        +delete()
        +retryIndexing()
    }

    class DocumentStatus {
        <<enumeration>>
        UPLOADING
        PROCESSING
        READY
        FAILED
    }

    class DocumentChunk {
        +UUID id
        +UUID documentId
        +int pageNumber
        +string textContent
        +float[] embeddingVector
        +int chunkIndex
    }

    class Tag {
        +UUID id
        +UUID workspaceId
        +string name
    }

    class ChatSession {
        +UUID id
        +UUID workspaceId
        +UUID ownerId
        +string title
        +DateTime createdAt
        +DateTime updatedAt
        +rename(title)
        +addMessage(msg)
        +shareReadOnly()
    }

    class Message {
        +UUID id
        +UUID sessionId
        +MessageRole role
        +string content
        +DateTime createdAt
        +int timeToFirstTokenMs
    }

    class MessageRole {
        <<enumeration>>
        USER
        AI
    }

    class Citation {
        +UUID id
        +UUID messageId
        +UUID documentId
        +int pageNumber
        +string excerptText
    }

    class DocumentSummary {
        +UUID id
        +UUID documentId
        +string summaryText
        +DateTime generatedAt
    }

    class AnalyticsEvent {
        +UUID id
        +string eventType
        +UUID userId
        +JSON payload
        +DateTime timestamp
    }

    User "1" --> "0..*" Workspace : owns
    User "1" --> "0..*" WorkspaceMember
    Workspace "1" --> "0..*" WorkspaceMember
    User --> UserRole
    WorkspaceMember --> MemberPermission

    Workspace "1" --> "0..*" Document : contains
    Workspace "1" --> "0..*" ChatSession : contains
    Document --> DocumentStatus
    Document "1" --> "0..*" DocumentChunk : chunked into
    Document "0..*" --> "0..*" Tag : tagged with
    Document "1" --> "0..1" DocumentSummary : summarized by

    ChatSession "1" --> "1..*" Message : history
    Message --> MessageRole
    Message "1" --> "0..*" Citation : references
    Citation "0..*" --> "1" Document : cites

    User "1" --> "0..*" AnalyticsEvent : triggers
```

## 2. Giải thích các lớp chính

| Lớp | Vai trò | Liên kết PRD |
|---|---|---|
| `User` | Nhân sự đăng nhập qua SSO nội bộ (Linh, Quang, Admin) | §2.1, §5.1 |
| `Workspace` | Không gian làm việc chứa tài liệu + phiên chat của một nhóm/dự án | §4.1 |
| `Document` | Đại diện 1 file PDF đã upload, có trạng thái xử lý rõ ràng | Epic 1 |
| `DocumentChunk` | Đơn vị văn bản đã được embedding để phục vụ retrieval (RAG) | Epic 2 (kỹ thuật) |
| `Tag` | Gắn nhãn tài liệu theo dự án (P2) | Story 1.5 |
| `ChatSession` | Một phiên hội thoại hỏi-đáp, có thể đổi tên/chia sẻ | Epic 4, 5 |
| `Message` | Tin nhắn trong phiên chat (người dùng hoặc AI) | Epic 2 |
| `Citation` | Trích dẫn nguồn gắn với 1 Message, trỏ tới Document + trang | Story 2.2, 2.3 |
| `DocumentSummary` | Tóm tắt tự động sau khi upload (P1) | Epic 3 |
| `AnalyticsEvent` | Sự kiện tracking phục vụ đo OKR | §5.2 |

## 3. Ghi chú thiết kế

- `Citation` tách khỏi `DocumentChunk` vì một câu trả lời có thể trích dẫn nhiều đoạn nhưng chỉ cần lưu excerpt hiển thị cho người dùng, không cần toàn bộ embedding.
- `DocumentStatus.FAILED` cần lưu kèm lý do lỗi (xem AC Story 1.3) — có thể mở rộng thêm field `failureReason` khi sang SADD/DB schema.
- `WorkspaceMember` + `MemberPermission` là phần chuẩn bị cho Epic 5 (P2 — phân quyền), chưa bắt buộc cho P0 MVP nhưng đưa vào model sớm để tránh phải migrate lớn sau này.

---

➡️ Tiếp theo: [Use Case](../04-UseCase/UseCase-DocuChat-AI.md)
