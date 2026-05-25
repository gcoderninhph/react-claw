# Bootstrap Broker Role

**Hướng dẫn cho AI Agent**: Đây là file role duy nhất bạn cần copy vào `.github/roles/` của dự án React mới. Agent sẽ tự động kiểm tra, tải về, và tích hợp toàn bộ broker system.

---

## Bước 1: Kiểm tra dự án đã tích hợp broker chưa

Kiểm tra các dấu hiệu sau trong dự án hiện tại:

- Có file `broker.toml` ở gốc dự án không?
- Có thư mục `src/debug/brokerAdapter/` hoặc `broker-adapters/` không?
- Có file `.github/roles/broker.role.md` không?

Nếu **TẤT CẢ đều KHÔNG có** → Chuyển sang Bước 2.

Nếu **đã có đầy đủ** → Dừng. Dự án đã tích hợp. Đọc các role trong `.github/roles/` để biết cách làm việc.

---

## Bước 2: Tải broker system từ GitHub

```powershell
git clone https://github.com/gcoderninhph/react-claw.git C:\Temp\react-claw
```

---

## Bước 3: Copy roles vào dự án

```powershell
New-Item -ItemType Directory -Force -Path .github/roles
Copy-Item C:\Temp\react-claw\.github\roles\*.md -Destination .github/roles/ -Force
```

**Sau bước này, agent phải ĐỌC LẠI tất cả role trong `.github/roles/` theo thứ tự:**
1. `broker.role.md` — Integration rules
2. `feature-broker-enforcement.role.md` — Pattern form/page/button
3. `integration-workflow.role.md` — **Quy trình tích hợp từng bước vào dự án**
4. `validation-matrix.role.md` — Verification

---

## Bước 4: Copy adapter vào dự án

```powershell
Copy-Item -Recurse C:\Temp\react-claw\broker-adapters\react -Destination src/debug/brokerAdapter
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

Tạo file `broker.toml` ở gốc dự án (dùng template từ `C:\tools\broker\broker.example.toml`).

---

## Bước 7: Làm theo `integration-workflow.role.md`

Đọc `integration-workflow.role.md` và làm theo từng bước:
1. Hiểu cấu trúc dự án
2. Wire adapter vào entry point
3. Quét source code tìm form, page, button
4. Tạo command cho từng loại
5. Cập nhật config
6. Kiểm tra tích hợp

---

## Bước 8: Dọn dẹp

```powershell
Remove-Item -Recurse -Force C:\Temp\react-claw
```

---

## Tóm tắt nhanh

| Bước | Hành động |
|------|-----------|
| 1 | Kiểm tra tích hợp |
| 2 | Clone repo |
| 3 | Copy roles → **đọc lại tất cả** |
| 4 | Copy adapter |
| 5 | Tải `.exe` |
| 6 | Tạo `broker.toml` |
| 7 | Làm theo `integration-workflow.role.md` |
| 8 | Dọn dẹp |
