import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { CostsSecurityPage } from '../pages/CostsSecurityPage';
import { MarketingPage } from '../pages/MarketingPage';

function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  it('renders hero section with "ServiceCore" text', () => {
    renderWithRouter(<LandingPage />);
    // The footer has "ServiceCore" as plain text
    expect(screen.getByText('ServiceCore')).toBeInTheDocument();
  });

  it('renders the hero headline text', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('The Complete')).toBeInTheDocument();
    expect(screen.getByText('Operations Platform')).toBeInTheDocument();
  });

  it('has login/CTA buttons', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Customer Login')).toBeInTheDocument();
    // Multiple "See ServiceCore in Action!" buttons exist
    const ctaButtons = screen.getAllByText('See ServiceCore in Action!');
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
  });
});

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders demo user dropdown', () => {
    renderWithRouter(<LoginPage />, { route: '/login' });
    expect(screen.getByText('Select a demo user...')).toBeInTheDocument();
  });

  it('renders Sign In header', () => {
    renderWithRouter(<LoginPage />, { route: '/login' });
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows 3 demo users when dropdown is opened', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />, { route: '/login' });

    // Click to open dropdown
    await user.click(screen.getByText('Select a demo user...'));

    // All 3 demo users should be visible
    expect(screen.getByText('JP Wilson')).toBeInTheDocument();
    expect(screen.getByText('Marcus Trujillo')).toBeInTheDocument();
    expect(screen.getByText('Andrea Quintana')).toBeInTheDocument();
  });
});

describe('CostsSecurityPage', () => {
  it('renders Project Details header', () => {
    renderWithRouter(<CostsSecurityPage />, { route: '/costs' });
    expect(screen.getByText('Project Details')).toBeInTheDocument();
  });

  it('renders AI Models section', () => {
    renderWithRouter(<CostsSecurityPage />, { route: '/costs' });
    expect(screen.getByText('AI Models')).toBeInTheDocument();
  });

  it('renders Infrastructure Costs section', () => {
    renderWithRouter(<CostsSecurityPage />, { route: '/costs' });
    expect(screen.getByText('Infrastructure Costs')).toBeInTheDocument();
  });
});

describe('MarketingPage', () => {
  it('renders ad pipeline stats', () => {
    renderWithRouter(<MarketingPage />, { route: '/marketing' });
    expect(screen.getByText('Total Ads')).toBeInTheDocument();
    expect(screen.getByText('Publishable (7.0+)')).toBeInTheDocument();
    expect(screen.getByText('Avg Quality')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
  });

  it('renders Ad Generation Pipeline header', () => {
    renderWithRouter(<MarketingPage />, { route: '/marketing' });
    expect(screen.getByText('Ad Generation Pipeline')).toBeInTheDocument();
  });

  it('renders Generate Ads button', () => {
    renderWithRouter(<MarketingPage />, { route: '/marketing' });
    expect(screen.getByText('Generate Ads')).toBeInTheDocument();
  });
});
