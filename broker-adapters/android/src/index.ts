/**
 * Android (React Native) adapter.
 *
 * Split into two diagnostics surfaces:
 * - JS side: same broker adapter as web (copy broker-adapters/react/src).
 * - Native side: Logcat reference and RN-specific diagnostics.
 *
 * The Android adapter does NOT replace Logcat — it provides a structured
 * reference path so the agent knows where to look for native logs.
 */

// Re-export the React adapter so the JS side uses the same client.
// In your RN entry point, call initBroker() with platform: 'android'.
export {
  initBroker,
  getBrokerClient,
  registerCommand,
  unregisterCommand,
  findHandler,
  listRegisteredCommands,
} from '../react/src/index';

// --- Android-specific diagnostics ---

export interface AndroidDiagnostics {
  /** Whether Metro bundler is connected. */
  metroConnected: boolean;
  /** Last Metro error message if any. */
  metroError?: string;
  /** Logcat filter hint for the agent (e.g. "ReactNative|AndroidRuntime"). */
  logcatFilter: string;
  /** Device/emulator info. */
  deviceInfo: Record<string, string>;
}

const androidDiag: AndroidDiagnostics = {
  metroConnected: false,
  logcatFilter: 'ReactNative|AndroidRuntime',
  deviceInfo: {},
};

export function setMetroStatus(connected: boolean, error?: string): void {
  androidDiag.metroConnected = connected;
  androidDiag.metroError = error;
}

export function setDeviceInfo(info: Record<string, string>): void {
  Object.assign(androidDiag.deviceInfo, info);
}

export function getAndroidDiagnostics(): AndroidDiagnostics {
  return { ...androidDiag };
}

// --- Register Android-specific commands ---

export function registerAndroidCommands(
  registerFn: typeof import('../react/src/commandRegistry').registerCommand,
): void {
  registerFn({
    commandName: 'android_metro_status',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, {
        metroConnected: androidDiag.metroConnected,
        metroError: androidDiag.metroError || null,
      });
    },
  });

  registerFn({
    commandName: 'android_logcat_reference',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, {
        filter: androidDiag.logcatFilter,
        command: `adb logcat ${androidDiag.logcatFilter}:* *:S`,
        deviceInfo: androidDiag.deviceInfo,
        note: 'Run this adb command to get native logs. JS logs are available via get_recent_logs.',
      });
    },
  });

  registerFn({
    commandName: 'android_device_info',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, androidDiag.deviceInfo);
    },
  });
}
