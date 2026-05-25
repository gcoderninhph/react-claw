# broker-adapter-react

Reusable React debug adapter for the `broker-rs` WebSocket protocol.

Copy this folder into any React project to enable AI agent inspection through the broker.

## Files

| File | Purpose |
|------|---------|
| `src/types.ts` | Protocol types matching `broker-rs/src/protocol.rs` |
| `src/brokerClient.ts` | WebSocket client with register, command, response, timeout, reconnect |
| `src/commandRegistry.ts` | Named command → handler mapping; 9 built-in commands (`get_route`, `get_recent_logs`, `get_recent_requests`, `get_visible_errors`, `get_state`, `dump_query_cache`, `navigate`, `set_feature_flag`, `reset_debug_state`) |
| `src/ringBuffer.ts` | In-memory ring buffers for recent logs and requests |
| `src/index.ts` | Bootstrap helper (`initBroker`) and re-exports |
| `AGENT.md` | AI agent guide for this project (template to customize per project) |

## Usage

```typescript
// In your app entry point (development only):
import { initBroker, registerCommand } from './debug/brokerAdapter';

if (import.meta.env.DEV) {
  initBroker({
    url: 'ws://127.0.0.1:47001/ws',
    projectId: 'my-react-app',
    sharedSecret: 'dev-secret-change-me',
    sessionId: `session-${Date.now()}`,
    clientName: 'web-app',
    platform: 'web',
  });

  // Register project-specific commands for features, forms, and buttons:
  registerCommand({
    commandName: 'form_login_state',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, { email: '', password: '', errors: [] });
    },
  });

  registerCommand({
    commandName: 'button_save_profile_trigger',
    commandClass: 'ui_control',
    handler: async (_params, respond) => {
      // trigger the save action and return result
      respond(true, { saved: true });
    },
  });
}
```

## Extension points for project state

- `setStateSnapshotFn(fn)` — register a function that returns the current React state snapshot (queried by `get_state`).
- `setQueryCacheDumpFn(fn)` — register a function that dumps the query/cache state (queried by `dump_query_cache`).
- `onFeatureFlagChange(listener)` — subscribe to feature flag changes triggered by `set_feature_flag`.
- `getFeatureFlag(flag)` — read a feature flag value set by the agent.

## Desktop & Android adapters

See sibling folders:
- `broker-adapters/desktop/` — Electron renderer/main split with process labels.
- `broker-adapters/android/` — React Native JS/native diagnostics split.

## Dev-only gating

- Always gate behind `import.meta.env.DEV` (Vite) or equivalent.
- Tree-shaking removes all broker code in production builds.
- Broker rejects release-mode clients when `dev_only = true`.
