import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoginPage from '@/pages/LoginPage';
import MoodPage from '@/pages/MoodPage';

// ─── Auth context mock ────────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
const mockAuthFetch = vi.fn();

vi.mock('@/context', () => ({
  useAuth: () => ({
    login: mockLogin,
    authFetch: mockAuthFetch,
    user: null,
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Button ───────────────────────────────────────────────────────────────────

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', async () => {
    const handler = vi.fn();
    render(
      <Button disabled onClick={handler}>
        Nope
      </Button>
    );
    await userEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('renders danger variant', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild.className).toMatch(/bg-red-600/);
  });
});

// ─── Card ─────────────────────────────────────────────────────────────────────

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild.className).toMatch(/p-6/);
  });

  it('omits padding when padding=false', () => {
    const { container } = render(<Card padding={false}>Content</Card>);
    expect(container.firstChild.className).not.toMatch(/p-6/);
  });

  it('merges extra className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild.className).toMatch(/custom-class/);
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(<EmptyState title="Nothing here" message="Try again later" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState icon="🎉" title="Yay" />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<EmptyState title="Empty" action={<button>Do something</button>} />);
    expect(
      screen.getByRole('button', { name: 'Do something' })
    ).toBeInTheDocument();
  });

  it('omits title/message when not provided', () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector('h3')).toBeNull();
    expect(container.querySelector('p')).toBeNull();
  });
});

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

describe('ErrorBanner', () => {
  it('renders the error message', () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has role=alert for screen readers', () => {
    render(<ErrorBanner message="Oops" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders nothing when message is empty', () => {
    const { container } = render(<ErrorBanner message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorBanner message={null} />);
    expect(container.firstChild).toBeNull();
  });
});

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingSpinner message="Fetching data…" />);
    expect(screen.getByText('Fetching data…')).toBeInTheDocument();
  });

  it('has role=status for screen readers', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ─── LoginPage ────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renders sign in form by default', () => {
    renderLogin();
    expect(
      screen.getByRole('heading', { name: 'Welcome back' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('toggles to register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(
      screen.getByRole('heading', { name: 'Create your account' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('shows error when login fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    renderLogin();
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'test@test.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid credentials'
      );
    });
  });

  it('calls login and navigates to dashboard on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'fake.jwt.token' }),
    });

    renderLogin();
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'user@test.com'
    );
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('fake.jwt.token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});

// ─── MoodPage ─────────────────────────────────────────────────────────────────

function renderMood() {
  return render(
    <MemoryRouter>
      <MoodPage />
    </MemoryRouter>
  );
}

describe('MoodPage', () => {
  it('renders mood selection form', () => {
    renderMood();
    expect(
      screen.getByRole('heading', { name: /how are you feeling/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: /mood rating/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('shows error when submitted without selecting a mood', async () => {
    renderMood();
    await userEvent.click(screen.getByRole('button', { name: /submit mood/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /please select a mood/i
      );
    });
  });

  it('marks the selected mood radio as checked', async () => {
    renderMood();
    const goodButton = screen.getByRole('radio', { name: /good/i });
    await userEvent.click(goodButton);
    expect(goodButton).toHaveAttribute('aria-checked', 'true');
  });

  it('shows resources after successful submission', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        isCrisis: false,
        resources: [
          {
            id: 1,
            title: 'Mindfulness Guide',
            description: 'Helpful tips',
            url: 'https://example.com',
          },
        ],
      }),
    });

    renderMood();
    await userEvent.click(screen.getByRole('radio', { name: /great/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit mood/i }));

    await waitFor(() => {
      expect(screen.getByText('Mindfulness Guide')).toBeInTheDocument();
    });
  });

  it('shows crisis panel when isCrisis is true', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ isCrisis: true, resources: [] }),
    });

    renderMood();
    await userEvent.click(screen.getByRole('radio', { name: /very low/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit mood/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/immediate support available/i)
      ).toBeInTheDocument();
    });
  });
});
