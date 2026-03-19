import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth, DEMO_USERS } from '../auth/AuthContext';
import { RequireAuth } from '../auth/RequireAuth';

// Helper component to test useAuth hook
function AuthConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-name">{user?.name ?? 'none'}</span>
      <button onClick={() => login('demo-admin')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

// Helper component that calls useAuth outside provider
function UseAuthOutsideProvider() {
  try {
    useAuth();
    return <div>no error</div>;
  } catch (e) {
    return <div data-testid="error">{(e as Error).message}</div>;
  }
}

describe('DEMO_USERS', () => {
  it('has 3 users with correct roles', () => {
    expect(DEMO_USERS).toHaveLength(3);
    const roles = DEMO_USERS.map((u) => u.role);
    expect(roles).toContain('admin');
    expect(roles).toContain('driver');
    expect(roles).toContain('manager');
  });
});

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children', () => {
    render(
      <AuthProvider>
        <div>child content</div>
      </AuthProvider>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('login sets user and localStorage', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user-name')).toHaveTextContent('none');

    await user.click(screen.getByText('Login'));

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user-name')).toHaveTextContent('JP Wilson');
    expect(localStorage.getItem('servicecore_demo_user')).toBe('demo-admin');
  });

  it('logout clears user and localStorage', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login'));
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');

    await user.click(screen.getByText('Logout'));

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user-name')).toHaveTextContent('none');
    expect(localStorage.getItem('servicecore_demo_user')).toBeNull();
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    render(<UseAuthOutsideProvider />);
    expect(screen.getByTestId('error')).toHaveTextContent(
      'useAuth must be used within AuthProvider'
    );
  });
});

describe('RequireAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AuthProvider>
          <RequireAuth>
            <div>protected content</div>
          </RequireAuth>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    localStorage.setItem('servicecore_demo_user', 'demo-admin');
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AuthProvider>
          <RequireAuth>
            <div>protected content</div>
          </RequireAuth>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
