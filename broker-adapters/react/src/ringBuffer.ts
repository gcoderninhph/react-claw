/**
 * In-memory ring buffer for recent logs and events.
 * Only active in development — never shipped in release builds.
 */

interface RingEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

const MAX_RING_SIZE = 200;

let ring: RingEntry[] = [];

function now(): string {
  return new Date().toISOString();
}

export function pushLog(level: RingEntry['level'], message: string, data?: unknown): void {
  ring.push({ timestamp: now(), level, message, data });
  if (ring.length > MAX_RING_SIZE) {
    ring = ring.slice(-MAX_RING_SIZE);
  }
}

export function getRecentLogs(count = 50): RingEntry[] {
  return ring.slice(-count);
}

export function getRecentErrors(count = 30): RingEntry[] {
  return ring.filter(e => e.level === 'error').slice(-count);
}

export function clearLogs(): void {
  ring = [];
}

// --- Request buffer ---

interface RequestEntry {
  requestId: string;
  command: string;
  sentAt: string;
  respondedAt?: string;
  ok?: boolean;
  error?: string;
}

let requests: RequestEntry[] = [];

export function trackRequestSent(requestId: string, command: string): void {
  requests.push({ requestId, command, sentAt: now() });
  if (requests.length > MAX_RING_SIZE) {
    requests = requests.slice(-MAX_RING_SIZE);
  }
}

export function trackRequestResolved(requestId: string, ok: boolean, error?: string): void {
  const entry = requests.find(r => r.requestId === requestId);
  if (entry) {
    entry.respondedAt = now();
    entry.ok = ok;
    entry.error = error;
  }
}

export function getRecentRequests(count = 50): RequestEntry[] {
  return requests.slice(-count);
}

export function clearRequests(): void {
  requests = [];
}
