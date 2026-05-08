type TokenListener = (token: string | null) => void;
type LogoutListener = () => void;

type BroadcastMessage =
  | { type: "TOKEN_UPDATED"; token: string | null }
  | { type: "LOGOUT" };

const AUTH_CHANNEL_NAME = "mc-auth-channel";
const REFRESH_LOCK_KEY = "mc:auth-refresh-lock";
const REFRESH_LOCK_TTL_MS = 5000;
const PEER_REFRESH_WAIT_MS = 3000;

const TAB_ID = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  ? crypto.randomUUID()
  : `tab-${Math.random().toString(36).slice(2)}`;

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let channel: BroadcastChannel | null = null;

const tokenListeners = new Set<TokenListener>();
const logoutListeners = new Set<LogoutListener>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getChannel(): BroadcastChannel | null {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!channel) {
    channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const payload = event.data;
      if (!payload || typeof payload !== "object") {
        return;
      }

      if (payload.type === "TOKEN_UPDATED") {
        accessToken = payload.token;
        tokenListeners.forEach((listener) => listener(accessToken));
      }

      if (payload.type === "LOGOUT") {
        accessToken = null;
        tokenListeners.forEach((listener) => listener(null));
        logoutListeners.forEach((listener) => listener());
      }
    };
  }

  return channel;
}

function broadcast(message: BroadcastMessage): void {
  const activeChannel = getChannel();
  activeChannel?.postMessage(message);
}

function tryAcquireRefreshLock(): string | null {
  if (!isBrowser()) {
    return "non-browser-lock";
  }

  const now = Date.now();
  const lockId = `${TAB_ID}:${now}`;
  const raw = window.localStorage.getItem(REFRESH_LOCK_KEY);

  if (raw) {
    const [ownerId, timestampRaw] = raw.split(":");
    const timestamp = Number(timestampRaw);
    const isExpired = Number.isNaN(timestamp) || now - timestamp > REFRESH_LOCK_TTL_MS;
    if (!isExpired && ownerId !== TAB_ID) {
      return null;
    }
  }

  window.localStorage.setItem(REFRESH_LOCK_KEY, lockId);
  const stored = window.localStorage.getItem(REFRESH_LOCK_KEY);
  return stored === lockId ? lockId : null;
}

function releaseRefreshLock(lockId: string | null): void {
  if (!isBrowser() || !lockId || lockId === "non-browser-lock") {
    return;
  }

  const stored = window.localStorage.getItem(REFRESH_LOCK_KEY);
  if (stored === lockId) {
    window.localStorage.removeItem(REFRESH_LOCK_KEY);
  }
}

function waitForPeerRefreshResult(timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      unsubscribeToken();
      unsubscribeLogout();
      resolve(null);
    }, timeoutMs);

    const unsubscribeToken = subscribeAccessToken((token) => {
      if (!token) {
        return;
      }
      window.clearTimeout(timeout);
      unsubscribeToken();
      unsubscribeLogout();
      resolve(token);
    });

    const unsubscribeLogout = subscribeLogout(() => {
      window.clearTimeout(timeout);
      unsubscribeToken();
      unsubscribeLogout();
      resolve(null);
    });
  });
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null, options: { broadcast?: boolean } = {}): void {
  accessToken = token;
  tokenListeners.forEach((listener) => listener(accessToken));

  if (options.broadcast !== false) {
    broadcast({ type: "TOKEN_UPDATED", token });
  }
}

export function clearAccessToken(options: { broadcast?: boolean } = {}): void {
  accessToken = null;
  tokenListeners.forEach((listener) => listener(null));

  if (options.broadcast !== false) {
    broadcast({ type: "LOGOUT" });
  }
}

export function subscribeAccessToken(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

export function subscribeLogout(listener: LogoutListener): () => void {
  logoutListeners.add(listener);
  return () => logoutListeners.delete(listener);
}

export async function withRefreshLock(runRefresh: () => Promise<string | null>): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  let lockId = tryAcquireRefreshLock();
  if (!lockId && isBrowser()) {
    const peerToken = await waitForPeerRefreshResult(PEER_REFRESH_WAIT_MS);
    if (peerToken) {
      return peerToken;
    }
    lockId = tryAcquireRefreshLock();
  }

  if (!lockId) {
    return null;
  }

  refreshPromise = runRefresh().finally(() => {
    releaseRefreshLock(lockId);
    refreshPromise = null;
  });

  return refreshPromise;
}
