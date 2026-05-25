# [project-name].agent.md

Hướng dẫn cho AI Agent kết nối và điều tra bug qua broker trong dự án React này.

## 1. Kết nối broker

Broker chạy độc lập, không phụ thuộc vào repo này.

```json
{
  "type": "register",
  "project_id": "<điền project_id từ broker.toml>",
  "session_id": "<session-xxx>",
  "shared_secret": "<điền shared_secret>",
  "client_name": "ai-agent",
  "role": "agent",
  "platform": "web",
  "runtime_mode": "development"
}
```

Gửi message này qua WebSocket tới `ws://127.0.0.1:47001/ws`. Broker sẽ trả về `type: "registered"` kèm `connection_id`.

Sau khi registered, agent có thể gửi command và nhận response.

## 2. Các command được phép

Dự án này cho phép các command class sau (xem `broker.toml`):

| Class | Mô tả | Ví dụ |
|-------|-------|-------|
| `read` | Chỉ đọc — không thay đổi state | `get_route`, `get_state`, `get_recent_logs`, `get_recent_requests`, `get_visible_errors` |
| `ui_control` | Điều khiển UI nhẹ | `navigate`, `set_feature_flag`, `reset_debug_state` |
| `feature_flag` | Bật/tắt flag debug | `set_feature_flag` |

**Command bị cấm**: `dangerous` — mọi command class này sẽ bị broker từ chối.

## 3. Các command mặc định (built-in)

Mọi React app dùng adapter của broker đều có các command này:

| Command | Class | Kết quả |
|---------|-------|---------|
| `get_route` | `read` | `{ pathname, search, hash, href }` |
| `get_recent_logs` | `read` | `{ logs: [...] }` — 100 dòng log gần nhất |
| `get_recent_requests` | `read` | `{ requests: [...] }` — 100 request gần nhất |

## 4. Command đặc thù của dự án này

*(Điền danh sách command do từng feature/component đăng ký)*

### Ví dụ:
| Command | Class | Mô tả |
|---------|-------|-------|
| `form_login_state` | `read` | Lấy trạng thái form login: field values, validation errors |
| `page_dashboard_state` | `read` | Lấy trạng thái page dashboard: data, cache, loading |
| `button_save_profile_trigger` | `ui_control` | Kích hoạt nút Save Profile và trả kết quả |
| `button_logout_verify` | `read` | Kiểm tra nút Logout có visible/disabled đúng không |

**Quy tắc**: Mọi button phải có ít nhất một command `read` (verify) hoặc `ui_control` (trigger).

## 5. Quy trình điều tra bug

Khi gặp bug, agent phải tuân thủ trình tự sau:

1. **Đọc log trước khi sửa code**
   - Gửi `get_recent_logs` để xem log runtime gần nhất.
   - Nếu log không đủ, đọc file log trên disk:
     - Web: mở browser DevTools → Console
     - Desktop: đọc `logs/desktop/renderer.log` và `logs/desktop/main.log`
     - Android: đọc `logs/android/logcat.log`

2. **Chụp trạng thái hiện tại**
   - Gửi `get_route` để biết user đang ở route nào.
   - Gửi các command `*_state` của page/form đang active.
   - Gửi `get_recent_requests` để xem API calls gần đây.

3. **Xác định nguyên nhân**
   - So sánh state thực tế với state mong đợi.
   - Xác định component/file nào gây ra sai lệch.
   - Đọc file code liên quan (dùng MAP.md để định tuyến).

4. **Sửa code**
   - Chỉ sửa sau khi đã có evidence từ log và state.
   - Sau khi sửa, gửi lại command để xác nhận fix.

5. **Validation**
   - Gửi lại command `get_recent_logs` để kiểm tra không có error mới.
   - Gửi command `get_route` + các `*_state` để xác nhận state đúng.

## 6. Cách gửi command

```json
{
  "type": "command",
  "request_id": "req-001",
  "class": "read",
  "name": "get_route",
  "params": {}
}
```

Broker sẽ trả về:

```json
{
  "type": "ack",
  "request_id": "req-001",
  "delivered_to": 1
}
```

Sau đó app sẽ trả về:

```json
{
  "type": "response",
  "from": { "connection_id": "...", "client_name": "web-app", ... },
  "request_id": "req-001",
  "ok": true,
  "result": { "pathname": "/login", ... }
}
```

Nếu app không trả lời trong `command_timeout_ms` (mặc định 15s), broker sẽ gửi:

```json
{
  "type": "timeout",
  "request_id": "req-001",
  "command_name": "get_route",
  "timeout_ms": 15000
}
```

## 7. Quy tắc bắt buộc

- [ ] Luôn đọc log trước khi sửa code.
- [ ] Luôn chụp state hiện tại trước khi chẩn đoán.
- [ ] Không gửi command khi chưa có `request_id` duy nhất.
- [ ] Không dùng command class `dangerous` (sẽ bị từ chối).
- [ ] Kiểm tra `ok: false` trong response và đọc `error` để biết lý do.
- [ ] Nếu nhận `timeout`, app có thể đang treo hoặc command không được đăng ký.
- [ ] Sau khi sửa code, phải validation lại bằng command.

## 8. File log trong dự án

| Target | Đường dẫn log | Cách đọc |
|--------|--------------|----------|
| Web | Browser DevTools Console | Mở DevTools → tab Console |
| Web | `logs/web/runtime-forwarded.log` (nếu có logger ghi file) | Đọc file |
| Desktop | `logs/desktop/renderer.log` | Đọc file |
| Desktop | `logs/desktop/main.log` | Đọc file |
| Android | `logs/android/logcat.log` | Đọc file hoặc `adb logcat` |

## 9. Phiên làm việc mẫu

```
Agent: register → broker → registered
Agent: command get_recent_logs → broker → app → broker → agent: response { logs: [...] }
Agent: (đọc log, thấy error "Cannot read property 'name' of undefined")
Agent: command get_route → broker → app → broker → agent: response { pathname: "/profile" }
Agent: command page_profile_state → broker → app → broker → agent: response { user: null, loading: false }
Agent: (kết luận: user null gây lỗi ở ProfilePage.tsx line 42)
Agent: (đọc file ProfilePage.tsx, thêm null check)
Agent: command get_recent_logs → broker → app → broker → agent: response { logs: [...] }
Agent: (xác nhận không còn error)
```
