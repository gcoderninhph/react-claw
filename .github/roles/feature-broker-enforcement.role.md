# Feature Broker Enforcement Role

Use this role when implementing any new feature in a broker-integrated React project. This role enforces that every feature, form, page, and button exposes the broker-check surface required by `broker.role.md`.

## Per-Feature Requirements

### 1. Forms
Every form must register a `read` command that returns:
- Field names and current values
- Per-field validation errors
- Form-level validation summary (valid, submitting, submit errors)
- Naming convention: `form_<name>_state`

```typescript
registerCommand({
  commandName: 'form_login_state',
  commandClass: 'read',
  handler: (_params, respond) => {
    respond(true, {
      fields: { email: emailRef.current?.value ?? '', password: '' },
      errors: { email: emailError, password: passwordError },
      status: { valid, submitting, submitError },
    });
  },
});
```

### 2. Data Pages
Every data page must register a `read` command that returns:
- Current data (or loading/error state)
- Cache status (fresh, stale, empty)
- Pagination/sorting state if applicable
- Last fetch timestamp
- Naming convention: `page_<name>_state`

```typescript
registerCommand({
  commandName: 'page_dashboard_state',
  commandClass: 'read',
  handler: (_params, respond) => {
    respond(true, {
      data: dashboardData,
      cache: queryClient.getQueryState(['dashboard'])?.status ?? 'empty',
      pagination: { page, pageSize },
      lastFetch: lastFetchTime,
    });
  },
});
```

### 3. Buttons
Every button must register at least one command:
- `read` command to verify button state (visible, disabled, label, variant)
- `ui_control` command to trigger and get result (optional, for actions)
- Naming convention: `button_<name>_verify` (read) and `button_<name>_trigger` (ui_control)

```typescript
registerCommand({
  commandName: 'button_save_profile_verify',
  commandClass: 'read',
  handler: (_params, respond) => {
    respond(true, { visible, disabled, label: 'Save Profile' });
  },
});

registerCommand({
  commandName: 'button_save_profile_trigger',
  commandClass: 'ui_control',
  handler: async (_params, respond) => {
    await handleSave();
    respond(true, { saved: true });
  },
});
```

### 4. Desktop Integrations (Electron)
Every desktop feature must register commands for:
- IPC channel status relevant to the feature
- Main-process errors related to the feature
- Preload bridge status if applicable
- Naming convention: `desktop_<feature>_<aspect>`

### 5. Android Flows (React Native)
Every Android feature must register commands for:
- JS-side state and errors (via standard React adapter)
- Native-side log reference (via `android_logcat_reference` with feature-specific filter)
- Metro bundler status if the feature depends on hot reload
- Naming convention: `android_<feature>_<aspect>`

## Enforcement Checklist

Before merging any feature PR, verify:
- [ ] Every form on the feature has a `form_*_state` command.
- [ ] Every data page on the feature has a `page_*_state` command.
- [ ] Every button on the feature has a `button_*_verify` command.
- [ ] Action buttons have a `button_*_trigger` command.
- [ ] Desktop features expose IPC/main diagnostics commands.
- [ ] Android features expose JS error state and native log references.
- [ ] All new commands are listed in the project's `[project-name].agent.md`.
- [ ] All new commands are allowed in `broker.toml` (allowed_commands list or empty=all allowed).
- [ ] Dangerous mutation commands use `commandClass: 'dangerous'`.
- [ ] No broker code leaks into release builds (gated behind `import.meta.env.DEV`).
