# BASE AGENT - Quy trình chung để tạo agent theo dự án

## 1) Mục tiêu
Tài liệu này là khung làm việc nền để AI đọc cùng với yêu cầu người dùng, từ đó sinh ra agent phù hợp với từng dự án cụ thể.

Mục tiêu của agent được tạo:
- Hiểu đúng phạm vi và mặt phẳng tác động của task.
- Lập kế hoạch trước khi sửa mã.
- Đánh giá tính khả thi và rủi ro trước khi triển khai.
- Triển khai theo bước nhỏ, dễ kiểm chứng.
- Chạy validate đúng theo công nghệ.
- Cập nhật tài liệu theo dõi công việc và bản đồ dự án.

## 2) Đầu vào bắt buộc khi AI tạo agent
AI phải đọc đủ các nguồn sau trước khi tạo agent chuyên biệt:
- Yêu cầu hiện tại của người dùng.
- MAP.md chính tại root (đóng vai trò index điều hướng).
    - Dựa vào yêu cầu hiện tại xác định map con cần đọc trong map_md
    - Các map con trong thư mục map_md/ theo bề mặt và miền chức năng, ví dụ:
        - map_md/MAP.desktop_app.auth.md
        - map_md/MAP.desktop_app.user_manager.md
        - map_md/MAP.backend.auth.md
        - map_md/MAP.backend.user_manager.md
- Các tài liệu quy ước nếu có trong repo (vai trò, coding standards, runbook, convention).

Nếu thiếu MAP.md thì tạo mới quy chuẩn được ghi trong .github/roles/map.role.md

## 3) Bộ khung workflow bắt buộc

### Bước 1 - Định vị bối cảnh
- Xác định task thuộc bề mặt nào: frontend, admin web, backend, runtime,...
- Đọc MAP.md chính trước để chọn đúng map con trong map_md/.
- Đọc map con đúng bề mặt/miền trước khi broad search.

### Bước 2 - Lập kế hoạch trước hành động
- Restate kết quả cần đạt.
- Liệt kê file dự kiến tác động.
- Kiểm tra phụ thuộc, môi trường chạy, quyền truy cập, risk blockers.
- Đánh giá giới hạn kích thước file. Nếu file quá lớn, thêm task tách file ngay trong cùng phiên.

### Bước 3 - Làm rõ khi thiếu thông tin
- Chỉ hỏi câu hỏi cần thiết để unblock.
- Không code khi thiếu acceptance criteria quan trọng.
- Ưu tiên câu hỏi ngắn, rõ, có lựa chọn.

### Bước 4 - Tạo task
- Ghi task đang làm vào file TASK.md nếu có. Trong trường hợp chưa có TASK.md, tạo file này theo quy chuẩn được ghi trong .github/roles/task.role.md.

### Bước 5 - Triển khai
- Sửa đúng nguyên nhân gốc, thay đổi tối thiểu.
- Triển khai theo bước nhỏ có thể test ngay.
- Nếu tạo file mới hoặc đổi trách nhiệm file, cập nhật map con tương ứng và cập nhật index trong MAP.md (nếu có thêm/đổi map con) ngay trong cùng phiên.
- Nếu lỗi phát sinh scope mới, cập nhật task file.

### Bước 6 - Validate
- Chạy test hẹp trước, test rộng sau.
- Chạy build/lint/test/syntax theo công nghệ liên quan.
- Nếu thay đổi runtime backend trong container, restart bằng docker compose.
- Nếu validate fail, sửa tiếp hoặc nói rõ là lỗi pre-existing ngoài scope.

### Bước 7 - Đóng task
- Chuyển task hoàn thành trong file TASK.md sang file TASK.completed.md.
- Cập nhật MAP.md chính và/hoặc map con trong map_md cho mọi file mới, đổi tên, đổi trách nhiệm.
- Báo cáo: đã đổi gì, đã validate gì, còn blocker gì.

## 4) Khung đánh giá tính khả thi
Trước khi agent bắt đầu code, phải tự đánh giá:
- Scope có rõ ràng không?
- Acceptance criteria đã đủ chưa?
- Có cần dữ liệu/credential từ người dùng không?
- Có tác động đến nhiều bề mặt không?
- Có rủi ro phá vỡ hành vi cũ không?
- Có giới hạn về môi trường (Docker, ports, network, permission) không?

Nếu có blocker nghiêm trọng, agent phải dừng ở mức hỏi bổ sung thông tin.

## 5) Quy tắc task tracking
- Nếu có TASK.md: dùng nó làm source of truth.
- Nếu không có TASK.md: thông báo rõ và dùng kế hoạch tạm trong chat.
- Mọi thay đổi scope lớn phải được ghi vào task file cùng phiên.
- Mọi tác vụ xong phải chuyển sang TASK.completed.md.

## 6) Quy tắc map routing
- Luôn đọc MAP.md chính trước để định tuyến map con phù hợp.
- Lựa chọn map con theo bề mặt và miền chức năng trước khi tìm kiếm rộng.
- Nếu task đa bề mặt, đọc tất cả map con liên quan.
- Nếu MAP.md hoặc map con thiếu mà task có sửa code/thay đổi trách nhiệm, tạo map còn thiếu và backfill ngay.

## 7) Mẫu output chuẩn mà mọi agent cần trả về
Mọi agent được tạo nên trả về theo đúng khung sau:
- Current task status.
- Plan before implementation.
- Feasibility notes.
- Validation result.
- Task-file update status.

## 8) Ma trận validation gợi ý theo công nghệ
AI tạo agent nên map validate theo stack phát hiện trong repo:

- React/Vite:
  - npm run build
  - npm run lint (nếu có)
  - npm test (nếu có)

- Node backend:
  - npm run build (nếu có)
  - npm run lint (nếu có)
  - npm test (nếu có)

- Python/Flask:
  - python -m py_compile cho file lẻ
  - python -m compileall cho nhiều file
  - pytest (nếu có)

- Docker runtime:
  - docker compose up -d
  - docker compose up -d --build khi đổi runtime/deps

## 9) Mẫu prompt sinh agent theo dự án
AI có thể dùng mẫu này để tạo agent mới:

- Tên agent: [tên ngắn gọn theo domain]
- Mục tiêu: [kết quả dự án cần đạt]
- Task file ưu tiên: TASK.md
- Map file ưu tiên:
  - MAP.md (index)
  - Danh sách map con liên quan trong map_md/, ví dụ: [map_md/MAP.backend.auth.md, map_md/MAP.backend.user_manager.md]
- Rule quan trọng:
  - Plan trước khi code
  - Feasibility trước implementation
  - Clarify nếu thiếu thông tin
  - Validate đúng stack
  - Cập nhật task/map cùng phiên
- Tiêu chí xác nhận hoàn thành: [danh sách acceptance criteria]

## 10) Nguyên tắc thiết kế agent tốt
- Có guardrail rõ để tránh sửa code vô hại.
- Ưu tiên thay đổi nhỏ, có thể rollback.
- Luôn để lại dấu vết trạng thái qua task/map.
- Đọc MAP.md index trước, rồi đọc map con trước broad search để giảm edit sai vị trí.

## 11) Checklist nhanh trước khi kết thúc
- Đã đọc task file?
- Đã đọc MAP.md chính và map con đúng bề mặt/miền?
- Đã có plan và feasibility notes?
- Đã validate theo stack liên quan?
- Đã cập nhật TASK.md và hệ map (MAP.md + map_md/*) nếu có thay đổi trách nhiệm/file?
- Đã báo cáo kết quả theo 5 mục output chuẩn?
- Đã chuyển task sang TASK.completed.md nếu hoàn thành?

---
Tài liệu này là khung nền tổng quát. Khi tạo agent cụ thể, AI cần kết hợp thêm yêu cầu người dùng hiện tại, cấu trúc thật của repo, và quy ước nội bộ của dự án để đạt độ chính xác cao.