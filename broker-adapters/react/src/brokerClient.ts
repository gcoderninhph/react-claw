/**
 * WebSocket client for the broker-rs protocol.
 * Handles registration, ping/pong, sending commands, and receiving responses/timeouts.
 */

import type {
  BrokerConfig,
  ClientEnvelope,
  CommandMessage,
  ResponseMessage,
  ServerEnvelope,
} from './types';
import { pushLog, trackRequestResolved, trackRequestSent } from './ringBuffer';

type ResponseHandler = (response: ServerEnvelope) => void;

export interface BrokerClient {
  /** Connect and register with the broker. Resolves when `registered` is received. */
  connect(): Promise<void>;
  /** Send a command message to the broker. */
  sendCommand(command: Omit<CommandMessage, 'type'>): void;
  /** Send a response back to the requesting agent. */
  sendResponse(response: Omit<ResponseMessage, 'type'>): void;
  /** Register a handler for routed commands from the agent. */
  onCommand(handler: ResponseHandler): void;
  /** Register a handler for timeout messages. */
  onTimeout(handler: ResponseHandler): void;
  /** Check if the socket is currently open. */
  isConnected(): boolean;
  /** Get the connection ID assigned by the broker. */
  connectionId(): string | undefined;
  /** Disconnect gracefully. */
  disconnect(): void;
}

export function createBrokerClient(config: BrokerConfig): BrokerClient {
  let socket: WebSocket | undefined;
  let connected = false;
  let connId: string | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const commandHandlers: ResponseHandler[] = [];
  const timeoutHandlers: ResponseHandler[] = [];

  function connect(): Promise<void> {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        socket = new WebSocket(config.url);
      } catch (err) {
        pushLog('error', 'Failed to create WebSocket', err);
        reject(err);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      socket.onopen = () => {
        clearTimeout(timeout);
        pushLog('info', 'WebSocket opened');

        const register: ClientEnvelope = {
          type: 'register',
          project_id: config.projectId,
          session_id: config.sessionId,
          shared_secret: config.sharedSecret,
          client_name: config.clientName,
          role: 'app',
          platform: config.platform,
          runtime_mode: 'development',
        };

        socket!.send(JSON.stringify(register));
      };

      socket.onmessage = (event) => {
        let envelope: ServerEnvelope;
        try {
          envelope = JSON.parse(event.data as string) as ServerEnvelope;
        } catch (err) {
          pushLog('warn', 'Failed to parse server message', { raw: event.data, error: String(err) });
          return;
        }

        switch (envelope.type) {
          case 'registered':
            connected = true;
            connId = envelope.connection_id;
            pushLog('info', 'Broker registered', { connectionId: connId, projectId: envelope.project_id });
            resolve();
            break;

          case 'command':
            pushLog('info', 'Received routed command', { requestId: envelope.request_id, name: envelope.name });
            for (const handler of commandHandlers) {
              try { handler(envelope); } catch { /* swallow */ }
            }
            break;

          case 'timeout':
            pushLog('warn', 'Request timed out', { requestId: envelope.request_id, command: envelope.command_name });
            for (const handler of timeoutHandlers) {
              try { handler(envelope); } catch { /* swallow */ }
            }
            break;

          case 'ack':
            // broker confirmed delivery
            break;

          case 'error':
            pushLog('error', `Broker error: ${envelope.message}`, { code: envelope.code });
            break;

          case 'pong':
            // keepalive
            break;

          default:
            pushLog('warn', 'Unknown server message', envelope);
        }
      };

      socket.onclose = () => {
        connected = false;
        pushLog('warn', 'WebSocket closed');
        scheduleReconnect();
      };

      socket.onerror = (err) => {
        pushLog('error', 'WebSocket error', String(err));
        clearTimeout(timeout);
        reject(new Error('WebSocket connection error'));
      };
    });
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) return;
    pushLog('info', 'Scheduling broker reconnect in 3s');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      connect().catch(() => {
        pushLog('warn', 'Broker reconnect failed');
      });
    }, 3000);
  }

  function sendCommand(command: Omit<CommandMessage, 'type'>): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      pushLog('error', 'Cannot send command — socket not open', { command: command.name });
      return;
    }
    const envelope: ClientEnvelope = { type: 'command', ...command };
    socket.send(JSON.stringify(envelope));
    trackRequestSent(command.request_id, command.name);
  }

  function sendResponse(response: Omit<ResponseMessage, 'type'>): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      pushLog('error', 'Cannot send response — socket not open', { requestId: response.request_id });
      return;
    }
    const envelope: ClientEnvelope = { type: 'response', ...response };
    socket.send(JSON.stringify(envelope));
    trackRequestResolved(response.request_id, response.ok, response.error);
  }

  function onCommand(handler: ResponseHandler): void {
    commandHandlers.push(handler);
  }

  function onTimeout(handler: ResponseHandler): void {
    timeoutHandlers.push(handler);
  }

  function isConnected(): boolean {
    return connected;
  }

  function getConnectionId(): string | undefined {
    return connId;
  }

  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
    if (socket) {
      socket.close();
      socket = undefined;
    }
    connected = false;
    connId = undefined;
  }

  return {
    connect,
    sendCommand,
    sendResponse,
    onCommand,
    onTimeout,
    isConnected,
    connectionId: getConnectionId,
    disconnect,
  };
}
