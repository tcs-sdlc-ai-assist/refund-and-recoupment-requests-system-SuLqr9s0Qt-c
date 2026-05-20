import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import {
  STORAGE_KEYS,
  CURRENT_DATA_VERSION,
  SEED_MEMBERS,
  SEED_PROVIDERS,
  SEED_PAYMENTS,
  SEED_REQUESTS,
  REQUEST_STATUSES,
  REQUEST_TYPES,
} from '../constants.js';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  let originalLocalStorage;
  let mockStorage;

  function createMockStorage() {
    const store = {};
    return {
      getItem: vi.fn((key) => {
        return store[key] !== undefined ? store[key] : null;
      }),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      _store: store,
    };
  }

  function seedStorage() {
    mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
    mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
    mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
    mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify(SEED_PAYMENTS);
    mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(SEED_REQUESTS);
  }

  function renderDashboard() {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    mockStorage = createMockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    seedStorage();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('page header', () => {
    it('renders the Dashboard heading', () => {
      renderDashboard();
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('renders the overview description text', () => {
      renderDashboard();
      expect(screen.getByText(/overview of refund and recoupment request activity/i)).toBeInTheDocument();
    });
  });

  describe('summary metrics', () => {
    it('displays the total requests count', () => {
      renderDashboard();
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays the total refund amount', () => {
      renderDashboard();
      expect(screen.getByText('Total Refund Amount')).toBeInTheDocument();
      // Refund: 250 + 120.75 + 150 = 520.75
      expect(screen.getByText('$520.75')).toBeInTheDocument();
    });

    it('displays the total recoupment amount', () => {
      renderDashboard();
      expect(screen.getByText('Total Recoupment Amount')).toBeInTheDocument();
      // Recoupment: 475.50 + 890.25 = 1365.75
      expect(screen.getByText('$1,365.75')).toBeInTheDocument();
    });

    it('displays the total amount paid', () => {
      renderDashboard();
      expect(screen.getByText('Total Amount Paid')).toBeInTheDocument();
      // Payments: 250 + 475.50 + 120.75 + 300 + 890.25 + 150 + 200 + 550 = 2936.50
      expect(screen.getByText('$2,936.50')).toBeInTheDocument();
    });
  });

  describe('status breakdown', () => {
    it('displays the count of New requests', () => {
      renderDashboard();
      const newLabel = screen.getByText('New');
      expect(newLabel).toBeInTheDocument();
      // 2 New requests: REQ-001, REQ-005
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays the count of In Progress requests', () => {
      renderDashboard();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('displays the count of Processed requests', () => {
      renderDashboard();
      expect(screen.getByText('Processed')).toBeInTheDocument();
    });

    it('displays the count of Closed requests', () => {
      renderDashboard();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });
  });

  describe('quick action buttons', () => {
    it('renders the Create Request button', () => {
      renderDashboard();
      expect(screen.getByRole('button', { name: /create request/i })).toBeInTheDocument();
    });

    it('navigates to /requests/create when Create Request is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();
      const button = screen.getByRole('button', { name: /create request/i });
      await user.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/requests/create');
    });

    it('renders the Search Requests button', () => {
      renderDashboard();
      expect(screen.getByRole('button', { name: /search requests/i })).toBeInTheDocument();
    });

    it('navigates to /requests when Search Requests is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();
      const button = screen.getByRole('button', { name: /search requests/i });
      await user.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/requests');
    });

    it('renders the Reports button', () => {
      renderDashboard();
      expect(screen.getByRole('button', { name: /^reports$/i })).toBeInTheDocument();
    });

    it('navigates to /reports when Reports is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();
      const button = screen.getByRole('button', { name: /^reports$/i });
      await user.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/reports');
    });
  });

  describe('recent requests table', () => {
    it('renders the Recent Requests heading', () => {
      renderDashboard();
      expect(screen.getByText('Recent Requests')).toBeInTheDocument();
    });

    it('displays request table with column headers', () => {
      renderDashboard();
      expect(screen.getByText('Request ID')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Created Date')).toBeInTheDocument();
    });

    it('displays up to 5 recent requests sorted by created date descending', () => {
      renderDashboard();
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1 header row + up to 5 data rows
      expect(rows.length).toBe(6);
    });

    it('displays request IDs in the table', () => {
      renderDashboard();
      // Most recent first: REQ-005 (Jun 1), REQ-002 (May 10), REQ-001 (May 1), REQ-003 (Apr 15), REQ-004 (Mar 1)
      expect(screen.getByText('REQ-005')).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.getByText('REQ-004')).toBeInTheDocument();
    });

    it('resolves member names in the table', () => {
      renderDashboard();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Michael Wilson')).toBeInTheDocument();
    });

    it('resolves provider names in the table', () => {
      renderDashboard();
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
      expect(screen.getByText('Sunrise Medical Center')).toBeInTheDocument();
    });

    it('navigates to request detail when a row is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();
      const row = screen.getByRole('button', { name: /view request REQ-001/i });
      await user.click(row);
      expect(mockNavigate).toHaveBeenCalledWith('/requests/REQ-001');
    });
  });

  describe('empty state', () => {
    it('renders empty table message when no requests exist', () => {
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);
      renderDashboard();
      expect(screen.getByText('No requests found')).toBeInTheDocument();
    });

    it('displays zero metrics when no requests exist', () => {
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      renderDashboard();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('displays an error alert when data loading fails', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage failure');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderDashboard();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('allows dismissing the error alert', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage failure');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      renderDashboard();
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(dismissButton);
      expect(screen.queryByText(/failed to load dashboard data/i)).not.toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });
});