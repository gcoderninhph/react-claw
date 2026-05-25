# MAP.tools.broker_adapter_react

## broker-adapters/react
- broker-adapters/react/package.json - Declares the adapter package metadata and TypeScript config.
- broker-adapters/react/tsconfig.json - Configures TypeScript compilation for the React adapter.
- broker-adapters/react/README.md - Documents how to copy the adapter into a React project and wire it up.
- broker-adapters/react/AGENT.md - Provides the AI agent investigation guide template for projects using the broker.
- broker-adapters/react/src/types.ts - Defines the TypeScript protocol types mirroring broker-rs/src/protocol.rs.
- broker-adapters/react/src/brokerClient.ts - Implements the WebSocket client with register, command, response, timeout, and reconnect logic.
- broker-adapters/react/src/commandRegistry.ts - Maps named broker commands to handler functions with built-in read-only commands.
- broker-adapters/react/src/ringBuffer.ts - Provides in-memory ring buffers for recent logs and requests (dev-only).
- broker-adapters/react/src/index.ts - Bootstraps the broker adapter, registers built-in commands, and re-exports the public API.
