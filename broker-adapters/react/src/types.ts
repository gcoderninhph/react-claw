/**
 * broker-rs protocol types for React adapter.
 * Mirrors broker-rs/src/protocol.rs — keep in sync with the Rust broker.
 */

export type ClientRole = 'app' | 'agent';

export type TargetPlatform = 'web' | 'desktop' | 'android';

export type RuntimeMode = 'development' | 'release';

export type CommandClass = 'read' | 'ui_control' | 'feature_flag' | 'dangerous';

export interface RegisterRequest {
  type: 'register';
  project_id: string;
  session_id: string;
  shared_secret: string;
  client_name: string;
  role: ClientRole;
  platform: TargetPlatform;
  runtime_mode: RuntimeMode;
}

export interface CommandMessage {
  type: 'command';
  request_id: string;
  class: CommandClass;
  name: string;
  params?: Record<string, unknown>;
}

export interface ResponseMessage {
  type: 'response';
  request_id: string;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export interface PingMessage {
  type: 'ping';
  timestamp: string;
}

export type ClientEnvelope = RegisterRequest | CommandMessage | ResponseMessage | PingMessage;

export interface RegisteredMessage {
  type: 'registered';
  connection_id: string;
  project_id: string;
  session_id: string;
}

export interface AckMessage {
  type: 'ack';
  request_id: string;
  delivered_to: number;
}

export interface TimeoutMessage {
  type: 'timeout';
  request_id: string;
  command_name: string;
  timeout_ms: number;
}

export interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

export interface RoutedCommand {
  type: 'command';
  from: { connection_id: string; client_name: string; role: ClientRole; platform: TargetPlatform };
  request_id: string;
  class: CommandClass;
  name: string;
  params?: Record<string, unknown>;
}

export interface RoutedResponse {
  type: 'response';
  from: { connection_id: string; client_name: string; role: ClientRole; platform: TargetPlatform };
  request_id: string;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export type ServerEnvelope =
  | RegisteredMessage
  | PingMessage
  | AckMessage
  | TimeoutMessage
  | ErrorMessage
  | RoutedCommand
  | RoutedResponse
  | { type: 'pong'; timestamp: string };

export interface BrokerConfig {
  url: string;
  projectId: string;
  sharedSecret: string;
  sessionId: string;
  clientName: string;
  platform: TargetPlatform;
}
