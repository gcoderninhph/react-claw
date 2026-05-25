# MAP.tools.broker_rs

## broker-rs
- broker-rs/Cargo.toml - Declares the reusable Rust broker crate and its runtime dependencies.
- broker-rs/Cargo.lock - Locks the Rust dependency graph for reproducible broker builds.
- broker-rs/.gitignore - Ignores Rust build outputs and local broker logs for the broker crate.
- broker-rs/README.md - Documents how to validate config, start the broker, perform the handshake, and understand request lifecycle behavior.
- broker-rs/config/broker.example.toml - Provides a sample multi-project broker configuration with target and command-class allowlists.
- broker-rs/src/main.rs - Parses CLI arguments, loads config, builds server state, and runs the broker server.
- broker-rs/src/config.rs - Loads and validates broker TOML configuration, timeout settings, and project-level policy.
- broker-rs/src/protocol.rs - Defines the JSON protocol for registration, commands, responses, events, acks, timeouts, and errors.
- broker-rs/src/audit.rs - Persists structured broker audit records as JSONL.
- broker-rs/src/server.rs - Hosts the health and WebSocket endpoints, authenticates clients, correlates pending requests, routes messages, emits timeouts, and records audit events.
- .github/roles/broker.role.md - Defines the broker integration rules that React projects must follow.

## Deployment
- broker-rs/build.ps1 - Builds the broker and copies the `.exe` plus sample config into a distributable folder.
- broker-rs/DEPLOY.md - Documents the reusable deployment model: one broker per machine, many React projects connecting through config.
- broker-rs/RELEASE_SAFETY.md - Documents release safety rules, kill switch endpoints, and React adapter gating requirements.