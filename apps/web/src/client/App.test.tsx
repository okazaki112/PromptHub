import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { authState } = vi.hoisted(() => ({
  authState: {
    isAuthenticated: true,
    isLoading: false,
    isBootstrapLoading: false,
    isInitialized: true,
    registrationAllowed: true,
    refreshBootstrap: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => authState,
}));

vi.mock('./pages/Login', () => ({ LoginPage: () => <div>login page</div> }));
vi.mock('./pages/Setup', () => ({ SetupPage: () => <div>setup page</div> }));
vi.mock('./pages/DesktopWorkspace', () => ({
  DesktopWorkspacePage: () => <div>desktop workspace</div>,
}));

import { App } from './App';

describe('client App routing', () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    authState.isBootstrapLoading = false;
    authState.isInitialized = true;
  });

  afterEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
  });

  it('redirects unauthenticated users to the login page', async () => {
    authState.isAuthenticated = false;
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(await screen.findByText('login page')).toBeTruthy();
  });

  it('redirects uninitialized installs to the setup page', async () => {
    authState.isAuthenticated = false;
    authState.isInitialized = false;
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(await screen.findByText('setup page')).toBeTruthy();
  });

  it('shows a loading screen while auth state is loading', () => {
    authState.isLoading = true;
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(screen.getByText('dashboard.loading')).toBeTruthy();
  });

  it('renders the desktop workspace for authenticated users on any protected route', async () => {
    window.history.pushState({}, '', '/');
    const { unmount } = render(<App />);

    expect(await screen.findByText('desktop workspace')).toBeTruthy();

    unmount();
    window.history.pushState({}, '', '/missing');
    render(<App />);

    expect(await screen.findByText('desktop workspace')).toBeTruthy();
  });
});
