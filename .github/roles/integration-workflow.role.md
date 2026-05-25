# Integration Workflow Role

Use this role after all broker files have been copied into the target React project. This role defines the step-by-step agent workflow for integrating the broker into any React codebase.

---

## Step 1: Understand the Project

Before creating any commands, understand the project structure:

1. Read the project's entry point (`src/main.tsx` or `src/index.tsx`) to understand the app shell.
2. Read the project's route configuration (React Router, Next.js pages, etc.) to understand all screens.
3. Identify the component library in use (Material UI, Ant Design, custom components, etc.).
4. If the project has `MAP.md` or `map_md/`, read them to understand file responsibilities.

---

## Step 2: Wire the Adapter

1. Open the project entry point (`src/main.tsx` or `src/index.tsx`).
2. Add the broker bootstrap code **before** `ReactDOM.createRoot()` or equivalent:

```typescript
if (import.meta.env.DEV) {
  import('./debug/brokerAdapter').then(({ initBroker }) => {
    initBroker({
      url: 'ws://127.0.0.1:47001/ws',
      projectId: '<from broker.toml>',
      sharedSecret: '<from broker.toml>',
      sessionId: `session-${Date.now()}`,
      clientName: 'web-app',
      platform: 'web',
    });
  });
}
```

3. Read `broker.toml` at the project root for `projectId` and `sharedSecret` values.
4. For Electron projects, use `platform: 'desktop'` and import from `brokerAdapterDesktop`.
5. For React Native projects, use `platform: 'android'` and import from `brokerAdapterAndroid`.

---

## Step 3: Scan the Codebase for Integration Points

Scan the entire `src/` directory and identify:

### Forms
Look for:
- `<form>` elements
- Form libraries: `react-hook-form`, `Formik`, `useForm`
- Input components with `name` or `id` attributes
- Components named `*Form*`, `*Login*`, `*Register*`, `*Profile*`, `*Settings*`

For each form found, note:
- File path
- Form name (derive from component name or purpose)
- Field names (from `name` attributes, `useForm` schema, or input `id`s)
- Validation logic (schema, custom validators)

### Data Pages
Look for:
- Components that fetch data: `useQuery`, `useSWR`, `fetch()`, `axios.get()`
- Table/list components with data
- Dashboard, listing, or detail pages
- Components named `*Page*`, `*List*`, `*Table*`, `*Dashboard*`, `*Detail*`

For each data page found, note:
- File path
- Page name
- Data source (API endpoint, cache key)
- Pagination/sorting state

### Buttons
Look for:
- `<button>` elements
- Components named `*Button*`
- Action triggers: `onClick`, `onSubmit`, `handle*`
- Icon buttons, menu items with actions

For each button found, note:
- File path
- Button name (derive from text content or purpose)
- Action type: submit, delete, navigate, toggle, etc.
- State dependencies: loading, disabled, visible

---

## Step 4: Create Commands

Open the adapter's command file: `src/debug/brokerAdapter/commandRegistry.ts` (or create a project-specific `src/debug/brokerCommands.ts`).

### For Each Form
Create a `form_<name>_state` read command:

```typescript
import { registerCommand } from './debug/brokerAdapter';

registerCommand({
  commandName: 'form_login_state',
  commandClass: 'read',
  handler: (_params, respond) => {
    // Gather current form state
    respond(true, {
      fields: {
        email: emailRef.current?.value ?? '',
        password: '', // never expose secrets in logs
      },
      errors: {
        email: emailError,
        password: passwordError,
      },
      status: {
        valid: isValid,
        submitting: isSubmitting,
        submitError: submitError?.message ?? null,
      },
    });
  },
});
```

### For Each Data Page
Create a `page_<name>_state` read command:

```typescript
registerCommand({
  commandName: 'page_dashboard_state',
  commandClass: 'read',
  handler: (_params, respond) => {
    respond(true, {
      data: dashboardData,
      loading: isLoading,
      cache: queryClient.getQueryState(['dashboard'])?.status ?? 'empty',
      pagination: { page: currentPage, pageSize },
      error: error?.message ?? null,
    });
  },
});
```

### For Each Button
Create a `button_<name>_verify` read command (MANDATORY):

```typescript
registerCommand({
  commandName: 'button_save_profile_verify',
  commandClass: 'read',
  handler: (_params, respond) => {
    respond(true, {
      visible: isVisible,
      disabled: isDisabled,
      label: 'Save Profile',
    });
  },
});
```

For action buttons, also create a `button_<name>_trigger` ui_control command:

```typescript
registerCommand({
  commandName: 'button_save_profile_trigger',
  commandClass: 'ui_control',
  handler: async (_params, respond) => {
    try {
      await handleSave();
      respond(true, { saved: true });
    } catch (err) {
      respond(false, undefined, String(err));
    }
  },
});
```

---

## Step 5: Update Configuration

1. Open `broker.toml` at the project root.
2. Add all new command names to the `allowed_commands` list.
3. If any command uses `commandClass: 'dangerous'`, ensure `allowed_command_classes` includes `"dangerous"`.
4. Verify `shared_secret` matches what's in the entry point code.

---

## Step 6: Verify Integration

1. Start the broker:
   ```powershell
   C:\tools\broker\broker-rs.exe --config broker.toml
   ```

2. Start the React app:
   ```powershell
   npm run dev
   ```

3. Verify the health endpoint:
   ```powershell
   Invoke-WebRequest http://127.0.0.1:47001/health
   ```
   Expected response: `{"status":"ok","project_count":...,"dev_only":true,"commands_disabled":false}`

4. List all registered commands (add this temporarily to verify):
   ```typescript
   import { listRegisteredCommands } from './debug/brokerAdapter';
   console.log('Registered commands:', listRegisteredCommands());
   ```

5. Check that every button in the UI has a corresponding `button_*_verify` command.

---

## Step 7: Document for the Agent

1. Update the project's `[project-name].agent.md` (or create from `broker-adapters/react/AGENT.md` template).
2. List all project-specific commands under the "Commands đặc thù của dự án" section.
3. Document any project-specific log paths or debugging notes.

---

## Integration Checklist

- [ ] Broker bootstrap code added to app entry point (gated behind dev mode).
- [ ] All forms have `form_*_state` read commands.
- [ ] All data pages have `page_*_state` read commands.
- [ ] Every button has `button_*_verify` read command.
- [ ] Action buttons have `button_*_trigger` ui_control command.
- [ ] All commands registered via `registerCommand()`.
- [ ] `broker.toml` `allowed_commands` updated with all new commands.
- [ ] Broker health endpoint responds.
- [ ] Registered commands list verified.
- [ ] Agent guide file updated with project-specific commands.
