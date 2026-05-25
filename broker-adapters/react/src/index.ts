/**
 * Bootstrap the broker adapter in a React app.
 * Call `initBroker()` once at app startup (development only).
 */

import type { BrokerConfig } from './types';
import { createBrokerClient, type BrokerClient } from './brokerClient';
import { registerCommand, BUILT_IN_COMMANDS, findHandler, type CommandHandler } from './commandRegistry';

let client: BrokerClient | undefined;

export function getBrokerClient(): BrokerClient | undefined {
  return client;
}

export async function initBroker(config: BrokerConfig): Promise<BrokerClient> {
  if (client) {
    return client;
  }

  client = createBrokerClient(config);

  // Register built-in read-only commands
  for (const cmd of BUILT_IN_COMMANDS) {
    registerCommand(cmd);
  }

  // Handle routed commands from the agent
  client.onCommand((envelope) => {
    if (envelope.type !== 'command') return;

    const handler = findHandler(envelope.name);
    if (!handler) {
      client!.sendResponse({
        request_id: envelope.request_id,
        ok: false,
        error: `unknown command: ${envelope.name}`,
      });
      return;
    }

    const respond = (ok: boolean, result?: Record<string, unknown>, error?: string) => {
      client!.sendResponse({
        request_id: envelope.request_id,
        ok,
        result,
        error,
      });
    };

    try {
      const maybePromise = handler.handler(envelope.params, respond);
      if (maybePromise instanceof Promise) {
        maybePromise.catch((err: unknown) => {
          respond(false, undefined, String(err));
        });
      }
    } catch (err) {
      respond(false, undefined, String(err));
    }
  });

  await client.connect();
  return client;
}

// Re-export for convenience
export { registerCommand, unregisterCommand, findHandler, listRegisteredCommands, type CommandHandler } from './commandRegistry';
export { type BrokerClient } from './brokerClient';
export type { BrokerConfig } from './types';
