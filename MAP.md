# Workspace Map Index

## Root app and governance
- map_md/MAP.root.scraping_api.md: Root scraping API, workspace governance docs, and existing agent-role files.
- bootstrap-broker.role.md: Single-file bootstrap role — copy into any React project to auto-integrate the broker system.
- AGENTS.md: Root entry point for AI agents cloning the react-claw GitHub repo.

## Reusable broker
- map_md/MAP.tools.broker_rs.md: Reusable Rust broker executable, config, runtime contract, and broker integration role.
- .github/workflows/release.yml: GitHub Actions CI/CD to build broker-rs.exe and publish GitHub Releases.

## Broker adapters (react / desktop / android)
- map_md/MAP.tools.broker_adapter_react.md: Reusable React TypeScript debug adapter (web) with built-in commands.
- map_md/MAP.tools.broker_adapter_desktop.md: Desktop (Electron) adapter with renderer/main split diagnostics.
- map_md/MAP.tools.broker_adapter_android.md: Android (React Native) adapter with JS/native diagnostics split.

## Governance roles
- .github/roles/broker.role.md: Broker integration rules that React projects must follow.
- .github/roles/feature-broker-enforcement.role.md: Per-feature enforcement rules for forms, pages, buttons, desktop, and Android broker-check commands.
- .github/roles/validation-matrix.role.md: Validation matrix and coverage check criteria for broker-integrated projects.
