/**
 * Desktop (Electron) adapter entry point.
 *
 * Split into two surfaces:
 * - renderer: same broker adapter as web (copy broker-adapters/react/src).
 * - main process: this file exposes read-only main-process diagnostics.
 *
 * Every broker message from the desktop adapter must include a process label
 * so the agent can distinguish renderer-side vs main-side events.
 */

// Re-export the React adapter so the renderer process uses the same client.
// In your Electron renderer entry point, call initBroker() from
// broker-adapters/react/src/index.ts with platform: 'desktop'.
export {
  initBroker,
  getBrokerClient,
  registerCommand,
  unregisterCommand,
  findHandler,
  listRegisteredCommands,
  setStateSnapshotFn,
  setQueryCacheDumpFn,
  onFeatureFlagChange,
  getFeatureFlag,
} from '../react/src/index';

// --- Main-process diagnostics (exposed via IPC bridge) ---

export interface MainDiagnostics {
  /** Recent main-process log entries (ring buffer). */
  mainLogs: MainLogEntry[];
  /** IPC channel status: channel name → healthy? */
  ipcChannels: Record<string, boolean>;
  /** Preload script load status. */
  preloadLoaded: boolean;
  /** Preload error message if any. */
  preloadError?: string;
  /** File-system paths accessible to the app. */
  appPaths: Record<string, string>;
  /** Electron version info. */
  electronVersions: Record<string, string>;
}

export interface MainLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  process: 'main';
}

// --- Main-process ring buffer (use in your Electron main.js/mian.ts) ---

const MAX_MAIN_LOGS = 200;
const mainLogRing: MainLogEntry[] = [];
const ipcChannelStatus = new Map<string, boolean>();
let preloadLoaded = false;
let preloadError: string | undefined;

export function pushMainLog(level: MainLogEntry['level'], message: string): void {
  mainLogRing.push({ timestamp: new Date().toISOString(), level, message, process: 'main' });
  if (mainLogRing.length > MAX_MAIN_LOGS) {
    mainLogRing.splice(0, mainLogRing.length - MAX_MAIN_LOGS);
  }
}

export function setIpcChannelStatus(channel: string, healthy: boolean): void {
  ipcChannelStatus.set(channel, healthy);
}

export function setPreloadStatus(loaded: boolean, error?: string): void {
  preloadLoaded = loaded;
  preloadError = error;
}

export function getMainDiagnostics(): MainDiagnostics {
  return {
    mainLogs: mainLogRing.slice(-100),
    ipcChannels: Object.fromEntries(ipcChannelStatus),
    preloadLoaded,
    preloadError,
    appPaths: {},
    electronVersions: {},
  };
}

// --- Register main-process commands (call from your IPC bridge) ---
// In your Electron main process, wire these into the broker client:

export function registerMainCommands(registerFn: typeof import('../react/src/commandRegistry').registerCommand): void {
  registerFn({
    commandName: 'desktop_main_logs',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, { logs: mainLogRing.slice(-100), process: 'main' });
    },
  });

  registerFn({
    commandName: 'desktop_ipc_status',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, { channels: Object.fromEntries(ipcChannelStatus), process: 'main' });
    },
  });

  registerFn({
    commandName: 'desktop_preload_status',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, { loaded: preloadLoaded, error: preloadError || null, process: 'main' });
    },
  });
}
