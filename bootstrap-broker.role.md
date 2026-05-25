# Bootstrap Broker Role

**Hướng dẫn cho AI Agent**: Đây là file role duy nhất bạn cần copy vào `.github/roles/` của dự án React mới. Agent sẽ tự động kiểm tra, tải về, và tích hợp toàn bộ broker system.

---

## Bước 1: Kiểm tra dự án đã tích hợp broker chưa

Kiểm tra các dấu hiệu sau trong dự án hiện tại:

- [ ] Có file `broker.toml` ở gốc dự án không?
- [ ] Có thư mục `src/debug/brokerAdapter/` hoặc `broker-adapters/` không?
- [ ] Có file `.github/roles/broker.role.md` không?
- [ ] Trong `package.json` có mention đến broker adapter không?

Nếu **TẤT CẢ đều KHÔNG có** → dự án chưa tích hợp. Chuyển sang Bước 2.

Nếu **đã có một phần** → kiểm tra version, có thể cần update. Hỏi user trước khi làm.

Nếu **đã có đầy đủ** → dự án đã tích hợp, không cần làm gì thêm. Chỉ cần đọc các role hiện có trong `.github/roles/` để biết cách làm việc.

---

## Bước 2: Tải broker system từ GitHub

Chạy các lệnh sau trong terminal:

```powershell
git clone https://github.com/gcoderninhph/react-claw.git C:\Temp\react-claw
```

Sau khi clone xong, đọc file `C:\Temp\react-claw\AGENTS.md` để hiểu cấu trúc repo.

---

## Bước 3: Copy roles vào dự án

Copy TẤT CẢ các file role từ repo vào `.github/roles/` của dự án:

```powershell
New-Item -ItemType Directory -Force -Path .github/roles
Copy-Item C:\Temp\react-claw\.github\roles\*.md -Destination .github/roles/ -Force
```

Danh sách role sẽ được copy:
- `broker.role.md` — Quy tắc tích hợp broker
- `feature-broker-enforcement.role.md` — Pattern form/page/button
- `validation-matrix.role.md` — Ma trận kiểm thử
- `Map.role.md` — Quy tắc tổ chức map file

**Sau khi copy xong, agent phải ĐỌC LẠI tất cả các role này** để áp dụng đúng quy tắc vào code.

---

## Bước 4: Copy adapter vào dự án

Copy thư mục adapter phù hợp với target của dự án:

```powershell
# React Web
Copy-Item -Recurse C:\Temp\react-claw\broker-adapters\react -Destination src/debug/brokerAdapter

# Desktop (Electron) — nếu cần
# Copy-Item -Recurse C:\Temp\react-claw\broker-adapters\desktop -Destination src/debug/brokerAdapterDesktop

# Android (React Native) — nếu cần
# Copy-Item -Recurse C:\Temp\react-claw\broker-adapters\android -Destination src/debug/brokerAdapterAndroid
```

---

## Bước 5: Tải broker.exe từ GitHub Releases

```powershell
$version = "v0.1.0"
New-Item -ItemType Directory -Force -Path C:\tools\broker
Invoke-WebRequest -Uri "https://github.com/gcoderninhph/react-claw/releases/download/$version/broker-rs.exe" -OutFile "C:\tools\broker\broker-rs.exe"
Invoke-WebRequest -Uri "https://github.com/gcoderninhph/react-claw/releases/download/$version/broker.example.toml" -OutFile "C:\tools\broker\broker.example.toml"
```

---

## Bước 6: Tạo file broker.toml cho dự án

Tạo file `broker.toml` ở gốc dự án với nội dung:

```toml
[broker]
host = "127.0.0.1"
port = 47001
audit_log_path = "logs/broker/audit.jsonl"
dev_only = true
command_timeout_ms = 15000
timeout_poll_interval_ms = 500

[[projects]]
project_id = "<TÊN_DỰ_ÁN>"
project_name = "<TÊN_HIỂN_THỊ>"
shared_secret = "<TẠO_SECRET_NGẪU_NHIÊN>"
allowed_targets = ["web"]
allowed_command_classes = ["read", "ui_control", "feature_flag"]
allowed_commands = [
    "get_route",
    "get_recent_logs",
    "get_recent_requests",
    "get_visible_errors",
    "get_state",
    "dump_query_cache",
    "navigate",
    "set_feature_flag",
    "reset_debug_state",
]
```

Thay `<TÊN_DỰ_ÁN>`, `<TÊN_HIỂN_THỊ>`, `<TẠO_SECRET_NGẪU_NHIÊN>` bằng giá trị thực tế. Secret nên là chuỗi ngẫu nhiên ít nhất 16 ký tự.

---

## Bước 7: Wire adapter vào app entry point

Tìm file entry point của React app (thường là `src/main.tsx` hoặc `src/index.tsx`). Thêm vào đầu file, trước `ReactDOM.createRoot`:

```typescript
// ===== BROKER DEBUG INTEGRATION (development only) =====
if (import.meta.env.DEV) {
  import('./debug/brokerAdapter').then(({ initBroker }) => {
    initBroker({
      url: 'ws://127.0.0.1:47001/ws',
      projectId: '<TÊN_DỰ_ÁN>',
      sharedSecret: '<TẠO_SECRET_NGẪU_NHIÊN>',
      sessionId: `session-${Date.now()}`,
      clientName: 'web-app',
      platform: 'web',
    });
  });
}
// ===== END BROKER INTEGRATION =====
```

**Desktop (Electron)**: platform `'desktop'`, import thêm từ `brokerAdapterDesktop`.

**Android (React Native)**: platform `'android'`, import thêm từ `brokerAdapterAndroid`.

---

## Bước 8: Học và áp dụng các role

Sau khi copy xong tất cả role vào `.github/roles/`, agent phải:

1. **Đọc `broker.role.md`** để hiểu:
   - Protocol rules (register, command, response, timeout)
   - Quy tắc tích hợp bắt buộc (mọi button phải có command)
   - Configuration rules

2. **Đọc `feature-broker-enforcement.role.md`** để biết:
   - Pattern đặt tên command: `form_<name>_state`, `page_<name>_state`, `button_<name>_verify`, `button_<name>_trigger`
   - Cấu trúc response cho từng loại

3. **Áp dụng vào code dự án**:
   - Đọc toàn bộ source code → tìm tất cả form, page, button
   - Với mỗi form: tạo `form_<name>_state` command trả về field values + validation errors
   - Với mỗi data page: tạo `page_<name>_state` command trả về data + cache + pagination
   - Với mỗi button: tạo `button_<name>_verify` command (bắt buộc) và `button_<name>_trigger` (nếu là action button)
   - Đăng ký tất cả command bằng `registerCommand()` trong file command registry của adapter
   - Cập nhật `broker.toml` `allowed_commands` nếu có command mới

4. **Đọc `validation-matrix.role.md`** sau khi hoàn thành để verify mọi thứ đúng.

---

## Bước 9: Khởi động broker và kiểm tra

```powershell
# Terminal 1: Khởi động broker
C:\tools\broker\broker-rs.exe --config broker.toml

# Terminal 2: Kiểm tra health
Invoke-WebRequest -Uri http://127.0.0.1:47001/health

# Terminal 3: Khởi động React app
npm run dev
```

Sau khi app chạy, mở WebSocket tới `ws://127.0.0.1:47001/ws` và gửi `register` để xác nhận kết nối thành công.

---

## Bước 10: Dọn dẹp

```powershell
Remove-Item -Recurse -Force C:\Temp\react-claw
```

---

## Tóm tắt cho agent

| Bước | Hành động | Tự động? |
|------|-----------|----------|
| 1 | Kiểm tra dự án đã có broker chưa | ✅ |
| 2 | Clone `https://github.com/gcoderninhph/react-claw.git` | ✅ |
| 3 | Copy roles vào `.github/roles/` → **đọc lại tất cả** | ✅ |
| 4 | Copy adapter vào `src/debug/brokerAdapter/` | ✅ |
| 5 | Tải `broker-rs.exe` từ Releases | ✅ |
| 6 | Tạo `broker.toml` với project_id, secret | ✅ |
| 7 | Wire `initBroker()` vào app entry point | ✅ |
| 8 | Học role → quét source → tạo command cho mọi form/page/button | Agent làm |
| 9 | Khởi động broker + app → kiểm tra health | ✅ |
| 10 | Dọn dẹp thư mục tạm | ✅ |

**Quan trọng nhất**: Sau bước 3, agent phải đọc lại TẤT CẢ role files trong `.github/roles/`. Các role này sẽ hướng dẫn agent cách viết code đúng chuẩn broker.
