import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelpAgent } from '../components/agent/HelpAgent';
import { ChatBot } from '../components/agent/ChatBot';
import { useAppStore } from '../store/useAppStore';

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Reset store state before each test
beforeEach(() => {
  const store = useAppStore.getState();
  store.setShowGuidedTour(false);
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('HelpAgent', () => {
  it('renders the floating bubble button', () => {
    renderWithRouter(<HelpAgent />);
    const bubble = document.getElementById('help-bubble');
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveAttribute('title', 'Help & AI Assistant');
  });

  it('opens the chat panel when bubble is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HelpAgent />);

    // Panel should not be visible initially
    expect(screen.queryByText('ServiceCore Help')).not.toBeInTheDocument();

    const bubble = document.getElementById('help-bubble')!;
    await user.click(bubble);

    // Panel should now be visible
    expect(screen.getByText('ServiceCore Help')).toBeInTheDocument();
  });

  it('has Chat, Glossary, and Changelog tabs', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HelpAgent />);

    const bubble = document.getElementById('help-bubble')!;
    await user.click(bubble);

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Glossary')).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });
});

describe('ChatBot', () => {
  it('renders welcome message', () => {
    render(<ChatBot />);
    expect(
      screen.getByText(/ServiceCore Help Assistant/)
    ).toBeInTheDocument();
  });

  it('renders input field with placeholder', () => {
    render(<ChatBot />);
    const input = screen.getByPlaceholderText('Ask about ServiceCore...');
    expect(input).toBeInTheDocument();
  });

  it('input field accepts text', async () => {
    const user = userEvent.setup();
    render(<ChatBot />);
    const input = screen.getByPlaceholderText('Ask about ServiceCore...');

    await user.type(input, 'How does overtime work?');
    expect(input).toHaveValue('How does overtime work?');
  });

  it('renders AI Assistant header', () => {
    render(<ChatBot />);
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });
});
