import { refresh as apiRefresh } from './auth';

export const AUTH_SESSION_EVENT = 'prompthub-auth-session-changed';

let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

function emitAuthSessionChanged(): void {
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function getStoredAccessToken(): string | null {
  return currentAccessToken;
}

export function getStoredRefreshToken(): string | null {
  return currentRefreshToken;
}

export function storeAuthSession(accessToken: string, refreshToken: string): void {
  currentAccessToken = accessToken;
  currentRefreshToken = refreshToken;
  emitAuthSessionChanged();
}

export function clearStoredAuthSession(): void {
  currentAccessToken = null;
  currentRefreshToken = null;
  emitAuthSessionChanged();
}

function withAuthorization(
  init: RequestInit,
  accessToken: string | null,
  replaceExisting = false,
): RequestInit {
  const headers = new Headers(init.headers ?? {});

  if (accessToken && (replaceExisting || !headers.has('Authorization'))) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return {
    ...init,
    credentials: 'include',
    headers,
  };
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const refreshed = await apiRefresh(currentRefreshToken ?? undefined);
        storeAuthSession(refreshed.data.accessToken, refreshed.data.refreshToken);
        return refreshed.data.accessToken;
      } catch {
        clearStoredAuthSession();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export async function fetchWithAuthRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const firstResponse = await fetch(
    input,
    withAuthorization(init, getStoredAccessToken()),
  );
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshedAccessToken = await refreshAccessToken();
  if (!refreshedAccessToken) {
    return firstResponse;
  }

  return fetch(input, withAuthorization(init, refreshedAccessToken, true));
}
