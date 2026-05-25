# Vai Trò Map Files (Bản Tiếng Việt)

Sử dụng tài liệu này khi bạn tạo mới, tái cấu trúc, hoặc cập nhật hệ thống map ở thư mục gốc repository.

## Mục tiêu
- MAP.md là bản đồ tổng ở cấp workspace.
- MAP.md không mô tả trực tiếp từng file mã nguồn; thay vào đó, nó liệt kê các file map con theo từng dự án và nhóm chức năng.
- Các file map con nằm trong thư mục map_md/ và là nơi mô tả vai trò file chi tiết.
- Tất cả mô tả vai trò file trong các map con phải viết bằng tiếng Anh để tối ưu routing cho agent đa ngôn ngữ.

## Quy cách mới bắt buộc
- Duy trì 1 file MAP.md chính tại root.
- MAP.md chính chỉ đóng vai trò index điều hướng đến các map con.
- Mỗi map con là 1 file .md trong thư mục map_md/.
- Tên map con phải phản ánh rõ bề mặt + miền chức năng.

Ví dụ cấu trúc:

```md
## Desktop app
map_md/MAP.desktop_app.auth.md: Authentication flows, guards, token/session handling.
map_md/MAP.desktop_app.user_manager.md: User listing, profile editing, permissions UI.

## Backend
map_md/MAP.backend.auth.md: Auth endpoints, middleware, token verification.
map_md/MAP.backend.user_manager.md: User CRUD services, validation, repository layer.
```

## Khi nào cần tạo hoặc cập nhật MAP.md chính
- Khi chưa có MAP.md nhưng task có tạo file, thêm chức năng, đổi trách nhiệm file, hoặc cần tăng độ chính xác định vị.
- Khi thêm nhóm dự án mới hoặc nhóm chức năng mới.
- Khi map con đổi tên, di chuyển, tách/nhập.
- Luôn cập nhật MAP.md trong cùng phiên thay đổi mã, không để dồn phiên sau.

## Khi nào cần tạo hoặc cập nhật map con trong map_md/
- Khi có file mới trong một miền chức năng.
- Khi file đổi trách nhiệm chính.
- Khi file bị tách/nhập/đổi tên/di chuyển.
- Khi cấu trúc dự án drift khiến map hiện tại khó định tuyến.

## Quy tắc phạm vi (Coverage)
- Lần đầu tạo hệ map: phải bao phủ toàn bộ workspace theo mô hình map tổng + map con.
- Sau khi đã có map: chỉ cập nhật các map con bị ảnh hưởng, trừ khi cần dọn lớn để giảm sai định tuyến.
- Bao gồm: source files, key configs, entry points, scripts quan trọng.
- Bỏ qua: file sinh tự động, cache, uploads, dependency folders, trừ khi repo chủ động chỉnh sửa trực tiếp các thư mục đó.

## Cấu trúc đề xuất cho MAP.md chính
MAP.md nên nhóm theo bề mặt lớn, mỗi dòng là 1 map con và mô tả ngắn.

Mẫu:

```md
# Workspace Map Index

## Desktop app
- map_md/MAP.desktop_app.auth.md: Desktop authentication surface and related files.
- map_md/MAP.desktop_app.user_manager.md: Desktop user management surface.

## Admin web
- map_md/MAP.admin.auth.md: Admin authentication surface.
- map_md/MAP.admin.user_manager.md: Admin user management surface.

## Backend
- map_md/MAP.backend.auth.md: Backend auth APIs and guards.
- map_md/MAP.backend.user_manager.md: Backend user domain services and routes.
```

## Cấu trúc đề xuất cho từng map con
Mỗi map con mô tả theo file-level, 1 dòng/1 file, đường dẫn tương đối từ root.

Mẫu:

```md
# MAP.backend.auth

## server
- server/app.py - Initializes Flask app, registers auth routes, and bootstraps middleware.
- server/auth/routes.py - Defines authentication endpoints and request/response contracts.
- server/auth/service.py - Handles login logic, token issuance, and credential checks.
- server/auth/middleware.py - Enforces auth guard and token validation for protected APIs.
```

## Quy tắc viết mô tả trong map con
- Mỗi entry đúng 1 file.
- Đường dẫn phải là workspace-relative.
- Mô tả ngắn gọn, rõ trách nhiệm chính, hướng hành động.
- Nêu ranh giới sau khi tách file (nếu có) để tránh sửa sai vị trí.
- Nếu file chỉ còn vai trò wrapper mỏng, phải chỉ ra file chứa logic thật.

## Quy tắc cập nhật
- Tạo file mới: thêm entry vào map con phù hợp ngay trong cùng phiên.
- File đổi trách nhiệm: cập nhật mô tả entry tương ứng ngay.
- File tách do quy tắc giới hạn kích thước: cập nhật entry file cũ + thêm entry file mới.
- File bị xóa/đổi tên: xóa hoặc đổi entry ngay lập tức.
- Nếu thêm map con mới: bắt buộc bổ sung dòng index vào MAP.md chính.

## Quy tắc đặt tên map con
Khuyến nghị mẫu tên:
- map_md/MAP.<surface>.<domain>.md

Trong đó:
- <surface>: desktop_app | admin | backend | shared | ...
- <domain>: auth | user_manager | billing | notifications | media | ...

Ví dụ:
- map_md/MAP.desktop_app.auth.md
- map_md/MAP.admin.user_manager.md
- map_md/MAP.backend.notifications.md

## Ghi chú cho agent
- Bước đầu tiên luôn đọc MAP.md để chọn map con đúng miền.
- Không broad search ngay khi chưa đọc map index.
- Nếu task đa bề mặt, đọc nhiều map con liên quan trước khi sửa mã.
- Nếu map thiếu hoặc stale làm tăng rủi ro sửa nhầm, phải sửa map trong cùng phiên.
- Map là chỉ mục định tuyến, không thay thế kiểm chứng hành vi thực tế.

## Checklist hoàn tất
- Đã cập nhật MAP.md chính chưa?
- Đã cập nhật đúng map con trong map_md/ chưa?
- Có map con mới nào cần thêm vào index không?
- Mô tả trong map con đã là tiếng Anh chưa?
- Các đường dẫn đã là workspace-relative chưa?
- Đã phản ánh đủ các file mới/đổi tên/tách/nhập/xóa chưa?
