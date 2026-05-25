# AGENTS.md — React Claw Broker System

Repo này chứa reusable broker system cho React projects: broker Rust (`.exe`) + TypeScript adapters + governance roles.

## Cấu trúc repo

```
react-claw/
├── AGENTS.md                          # File này — entry point cho AI agent
├── bootstrap-broker.role.md           # File duy nhất cần copy vào dự án mới
├── broker-rs/                         # Rust broker source
│   ├── src/                           # config, protocol, audit, server
│   ├── config/broker.example.toml     # Template config
│   ├── build.ps1                      # Build script → .exe
│   ├── DEPLOY.md                      # Mô hình deployment
│   └── RELEASE_SAFETY.md              # Quy tắc an toàn
├── broker-adapters/                   # TypeScript adapters
│   ├── react/                         # Web (Vite/CRA/Next.js)
│   ├── desktop/                       # Electron
│   └── android/                       # React Native
├── .github/
│   ├── roles/                         # Governance roles
│   │   ├── broker.role.md             # Quy tắc tích hợp
│   │   ├── feature-broker-enforcement.role.md  # Pattern form/page/button
│   │   ├── validation-matrix.role.md  # Ma trận kiểm thử
│   │   └── Map.role.md                # Quy tắc map
│   └── workflows/release.yml          # CI/CD build + release
└── README.md
```

## Cách agent sử dụng repo này

### Đường dẫn A: Từ dự án React (khuyến nghị)

User copy 1 file `bootstrap-broker.role.md` vào `.github/roles/` của dự án. Agent đọc file đó → tự động làm mọi thứ:
1. Kiểm tra tích hợp
2. Clone repo này
3. Copy roles + adapter
4. Tải `.exe` từ Releases
5. Tạo config
6. Wire adapter
7. Học role → quét source → tạo command

### Đường dẫn B: Clone repo trực tiếp

Nếu agent clone repo này trước, đọc roles theo thứ tự:
1. `.github/roles/broker.role.md` — Integration rules
2. `.github/roles/feature-broker-enforcement.role.md` — Patterns
3. `.github/roles/validation-matrix.role.md` — Verification

Sau đó áp dụng vào dự án React mục tiêu.

## Releases

Broker `.exe` được build và publish tại:  
https://github.com/gcoderninhph/react-claw/releases

Mỗi release chứa:
- `broker-rs.exe` — Windows executable
- `broker.example.toml` — Template config
- `adapter-react.zip` — React web adapter
- `adapter-desktop.zip` — Desktop adapter
- `adapter-android.zip` — Android adapter
