# react-claw — Reusable React Debug Broker

Broker Rust + TypeScript adapters cho phép AI agent điều tra bug trong React apps qua WebSocket protocol.

## Cách dùng

### Bắt đầu dự án React mới

1. Copy `bootstrap-broker.role.md` vào `.github/roles/` của dự án React.
2. AI agent sẽ tự động đọc role và tích hợp toàn bộ system.
3. Khởi động broker: `C:\tools\broker\broker-rs.exe --config broker.toml`
4. Chạy app: `npm run dev`
5. Agent có thể gửi command qua WebSocket để điều tra bug.

### Tải broker thủ công

Từ [Releases](https://github.com/gcoderninhph/react-claw/releases):
- `broker-rs.exe` — Windows executable
- `broker.example.toml` — Template config

### Cấu trúc

| Thành phần | Mô tả |
|-----------|-------|
| `broker-rs/` | Rust broker (config, protocol, WebSocket server, audit, routing, timeout) |
| `broker-adapters/react/` | React web adapter (socket client, command registry, ring buffers) |
| `broker-adapters/desktop/` | Electron desktop adapter (renderer/main split) |
| `broker-adapters/android/` | React Native android adapter (JS/native split) |
| `.github/roles/` | Governance roles cho AI agent |
| `.github/workflows/release.yml` | CI/CD build `.exe` + tạo GitHub Release |

## Yêu cầu

- **Broker**: Rust toolchain (để build từ source) hoặc tải `.exe` từ Releases
- **Adapter**: TypeScript, React 18+, Vite/CRA/Next.js
- **Agent**: WebSocket client bất kỳ

---

## Scraping API (legacy)

API trung gian trả JSON từ trang https://netshort.dramafren.org.

### Cài đặt

```bash
npm install
npm start
```

Server chạy tại `http://localhost:3000`.


## Endpoints

### 1) Danh sách phim

`GET /api/movies?page=1`

Ví dụ:

```bash
curl "http://localhost:3000/api/movies?page=1"
```

### 2) Tìm kiếm

`GET /api/search?q=love&lang=English`

Ví dụ:

```bash
curl "http://localhost:3000/api/search?q=love&lang=English"
```

### 3) Chi tiết phim

`GET /api/movie/:id`

Ví dụ:

```bash
curl "http://localhost:3000/api/movie/2055222367238881281"
```

### 4) Danh sách tập của phim

`GET /api/movie/:id/episodes`

Ví dụ:

```bash
curl "http://localhost:3000/api/movie/2054447638445948930/episodes"
```

### 5) Lấy link video trực tiếp của 1 tập

`GET /api/movie/:id/episode/:ep`

Ví dụ:

```bash
curl "http://localhost:3000/api/movie/2054447638445948930/episode/1"
```

Luu y: `streamUrl` la link ky theo thoi gian (co the het han sau mot khoang thoi gian).

### 6) Health check

`GET /health`

## Dramafren endpoints

### 1) Danh sach series Dramafren

`GET /api/dramafren/series?page=1`

Vi du:

```bash
curl "http://localhost:3000/api/dramafren/series?page=1"
```

### 2) Danh sach tap theo series slug

`GET /api/dramafren/series/:slug`

Vi du:

```bash
curl "http://localhost:3000/api/dramafren/series/united-to-crush-one-lying-man"
```

### 3) Link player/mirror cua trang watch

`GET /api/dramafren/watch/:slug`

Vi du:

```bash
curl "http://localhost:3000/api/dramafren/watch/united-to-crush-one-lying-man"
```

Ghi chu: Dramafren thuong embed video tu ben thu ba (vi du Ok.ru). API se tra `currentIframe` va danh sach `mirrors` (da decode tu `data-em`).
