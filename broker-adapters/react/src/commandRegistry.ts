/**
 * Command registry — maps named broker commands to handler functions.
 * Every feature, form, and button must register its broker-check commands here.
 */

import type { CommandClass } from './types';

export interface CommandHandler {
  commandName: string;
  commandClass: CommandClass;
  handler: (params: Record<string, unknown> | undefined, respond: (ok: boolean, result?: Record<string, unknown>, error?: string) => void) => void | Promise<void>;
}

const registry = new Map<string, CommandHandler>();

export function registerCommand(handler: CommandHandler): void {
  if (registry.has(handler.commandName)) {
    console.warn(`[broker] duplicate command registration: ${handler.commandName}`);
  }
  registry.set(handler.commandName, handler);
}

export function unregisterCommand(commandName: string): boolean {
  return registry.delete(commandName);
}

export function findHandler(commandName: string): CommandHandler | undefined {
  return registry.get(commandName);
}

export function listRegisteredCommands(): string[] {
  return Array.from(registry.keys()).sort();
}

// --- Predefined read-only commands every React app should register ---
// These are registered by the adapter bootstrap, not by individual features.

export const BUILT_IN_COMMANDS: CommandHandler[] = [
  {
    commandName: 'get_route',
    commandClass: 'read',
    handler: (_params, respond) => {
      respond(true, {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        href: window.location.href,
      });
    },
  },
  {
    commandName: 'get_recent_logs',
    commandClass: 'read',
    handler: (_params, respond) => {
      import('./ringBuffer').then(({ getRecentLogs }) => {
        respond(true, { logs: getRecentLogs(100) });
      });
    },
  },
  {
    commandName: 'get_recent_requests',
    commandClass: 'read',
    handler: (_params, respond) => {
      import('./ringBuffer').then(({ getRecentRequests }) => {
        respond(true, { requests: getRecentRequests(100) });
      });
    },
  },
  {
    commandName: 'get_visible_errors',
    commandClass: 'read',
    handler: (_params, respond) => {
      import('./ringBuffer').then(({ getRecentErrors }) => {
        respond(true, { errors: getRecentErrors(50) });
      });
    },
  },
  {
    commandName: 'get_state',
    commandClass: 'read',
    handler: (_params, respond) => {
      // Projects should replace this with real React state via setStateSnapshotFn()
      if (stateSnapshotFn) {
        try {
          const snapshot = stateSnapshotFn();
          respond(true, snapshot as Record<string, unknown>);
        } catch (err) {
          respond(false, undefined, String(err));
        }
      } else {
        respond(true, {
          _note: 'No state snapshot registered. Call setStateSnapshotFn() to expose React state.',
          route: {
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          },
        });
      }
    },
  },
  {
    commandName: 'dump_query_cache',
    commandClass: 'read',
    handler: (_params, respond) => {
      if (queryCacheDumpFn) {
        try {
          const cache = queryCacheDumpFn();
          respond(true, cache as Record<string, unknown>);
        } catch (err) {
          respond(false, undefined, String(err));
        }
      } else {
        respond(true, {
          _note: 'No query cache dump registered. Call setQueryCacheDumpFn() to expose cache state.',
        });
      }
    },
  },
  {
    commandName: 'navigate',
    commandClass: 'ui_control',
    handler: (params, respond) => {
      const path = typeof params?.path === 'string' ? params.path : '/';
      try {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
        respond(true, { navigated_to: path });
      } catch (err) {
        respond(false, undefined, String(err));
      }
    },
  },
  {
    commandName: 'set_feature_flag',
    commandClass: 'feature_flag',
    handler: (params, respond) => {
      const flag = typeof params?.flag === 'string' ? params.flag : '';
      const value = params?.value;
      if (!flag) {
        respond(false, undefined, 'missing required param: flag');
        return;
      }
      featureFlagStore.set(flag, value);
      // Trigger render update for any listener
      featureFlagListeners.forEach(fn => {
        try { fn(flag, value); } catch { /* swallow */ }
      });
      respond(true, { flag, value });
    },
  },
  {
    commandName: 'reset_debug_state',
    commandClass: 'ui_control',
    handler: (_params, respond) => {
      import('./ringBuffer').then(({ clearLogs, clearRequests }) => {
        clearLogs();
        clearRequests();
        featureFlagStore.clear();
        respond(true, { message: 'debug state reset: logs, requests, feature flags cleared' });
      });
    },
  },
];

// --- Extension points for project-specific state ---

type StateSnapshotFn = () => unknown;
type QueryCacheDumpFn = () => unknown;
type FeatureFlagListener = (flag: string, value: unknown) => void;

let stateSnapshotFn: StateSnapshotFn | undefined;
let queryCacheDumpFn: QueryCacheDumpFn | undefined;
const featureFlagStore = new Map<string, unknown>();
const featureFlagListeners: FeatureFlagListener[] = [];

/** Register a function that returns the current React state snapshot. */
export function setStateSnapshotFn(fn: StateSnapshotFn): void {
  stateSnapshotFn = fn;
}

/** Register a function that dumps the current query/cache state (e.g. React Query cache). */
export function setQueryCacheDumpFn(fn: QueryCacheDumpFn): void {
  queryCacheDumpFn = fn;
}

/** Listen for feature flag changes triggered by the agent. */
export function onFeatureFlagChange(listener: FeatureFlagListener): () => void {
  featureFlagListeners.push(listener);
  return () => {
    const idx = featureFlagListeners.indexOf(listener);
    if (idx >= 0) featureFlagListeners.splice(idx, 1);
  };
}

/** Read a feature flag value set by the agent. */
export function getFeatureFlag(flag: string): unknown {
  return featureFlagStore.get(flag);
}
