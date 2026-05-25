# Validation Matrix Role

Use this role when validating broker integration in any React project. This defines the minimum set of checks that must pass before the broker integration is considered complete.

## Validation Matrix

### 1. Protocol Contract
| Check | Target | How to verify |
|-------|--------|---------------|
| Register handshake | broker | Connect with valid `project_id + shared_secret`, expect `type: "registered"` |
| Invalid auth rejected | broker | Connect with wrong secret, expect `type: "error"` with `code: "auth_failed"` |
| Release client rejected | broker | Connect with `runtime_mode: "release"` when `dev_only = true`, expect rejection |
| Ping/pong | broker | Send `type: "ping"`, expect `type: "pong"` |
| Invalid message format | broker | Send malformed JSON, expect `type: "error"` with `code: "invalid_message"` |

### 2. Command Routing
| Check | Target | How to verify |
|-------|--------|---------------|
| Command forwarded to app | broker + app | Agent sends command, app receives routed command |
| Response back to agent | broker + agent | App sends response, agent receives routed response |
| Ack on delivery | broker | Agent receives `type: "ack"` with correct `delivered_to` count |
| Unknown command rejected | broker + app | Agent sends unregistered command, app returns `ok: false` with error |
| Blocked command rejected | broker | Agent sends command in `blocked_commands` list, broker rejects |
| Kill switch blocks | broker | Activate kill switch, agent command rejected with "kill switch" message |
| Kill switch revives | broker | Deactivate kill switch, agent command routes normally |

### 3. Timeout Behavior
| Check | Target | How to verify |
|-------|--------|---------------|
| Timeout on no response | broker + agent | Send command to app that doesn't respond, agent receives `type: "timeout"` within `command_timeout_ms` |
| Pending cleanup on disconnect | broker | Agent disconnects with pending request, no stale state |

### 4. Multi-Project Isolation
| Check | Target | How to verify |
|-------|--------|---------------|
| Cross-project command blocked | broker | Agent for project A sends command, project B app does NOT receive it |
| Cross-project response blocked | broker | App for project A sends response, project B agent does NOT receive it |
| Audit records tagged correctly | broker | All audit records include correct `project_id` |

### 5. Audit Persistence
| Check | Target | How to verify |
|-------|--------|---------------|
| Register events logged | broker | Audit file contains `event: "register"` records with `platform` |
| Message events logged | broker | Audit file contains `event: "message"` records with `command_type` |
| Timeout events logged | broker | Audit file contains `event: "request_timeout"` records |
| Disconnect events logged | broker | Audit file contains `event: "disconnect"` records |
| Audit has required fields | broker | Records have `timestamp`, `event`, `outcome`, `project_id`, `session_id`, `request_id`, `source`, `platform`, `command_class`, `command_type`, `details` |

### 6. Per-Platform Coverage
| Check | Target | How to verify |
|-------|--------|---------------|
| Web: route command works | web app | `get_route` returns current URL |
| Web: log command works | web app | `get_recent_logs` returns log buffer |
| Web: state command works | web app | `get_state` returns state snapshot |
| Web: navigate works | web app | `navigate` changes URL |
| Desktop: main logs accessible | desktop app | `desktop_main_logs` returns main process logs |
| Desktop: IPC status accessible | desktop app | `desktop_ipc_status` returns channel health |
| Desktop: preload status accessible | desktop app | `desktop_preload_status` returns load status |
| Android: Metro status accessible | android app | `android_metro_status` returns bundler status |
| Android: Logcat reference works | android app | `android_logcat_reference` returns valid adb command |

### 7. Per-Button Coverage (Mandatory)
| Check | Target | How to verify |
|-------|--------|---------------|
| Every button has verify command | app | `listRegisteredCommands()` includes `button_*_verify` for every button |
| Every action button has trigger command | app | `button_*_trigger` exists for every button that performs an action |

### 8. Release Safety
| Check | Target | How to verify |
|-------|--------|---------------|
| Broker rejects release clients | broker | Connect with `runtime_mode: "release"`, expect rejection |
| React adapter tree-shaken in prod | app build | Production build contains no broker adapter code |
| Kill switch endpoints respond | broker | `GET /admin/kill` and `GET /admin/revive` return valid responses |
| Health reflects kill state | broker | `GET /health` shows `commands_disabled: true/false` correctly |

## Coverage Check Script (conceptual)

```bash
# Verify all declared commands in AGENT.md exist in code:
grep -oP 'commandName: "\K[^"]+' broker-adapters/react/src/commandRegistry.ts | sort > /tmp/registered.txt
grep -oP '`\K[^`]+' AGENT.md | grep -E '^(get_|form_|page_|button_|desktop_|android_)' | sort > /tmp/declared.txt
diff /tmp/registered.txt /tmp/declared.txt
```

## Completion Criteria
- [ ] All protocol contract checks pass.
- [ ] All command routing checks pass.
- [ ] Timeout behavior verified.
- [ ] Multi-project isolation confirmed.
- [ ] Audit persistence verified with all 11 fields.
- [ ] Per-platform coverage checked for web, desktop, android targets in scope.
- [ ] Every button has at least `button_*_verify` command.
- [ ] Release safety gates confirmed: broker rejects release, adapter tree-shaken.
