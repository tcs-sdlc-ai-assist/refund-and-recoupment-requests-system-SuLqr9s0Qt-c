import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SearchRequests from './SearchRequests.jsx';
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

describe('SearchRequests', () => {
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

  function renderSearchRequests() {
    return render(
      <MemoryRouter>
        <SearchRequests />
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
    it('renders the Search Requests heading', () => {
      renderSearchRequests();
      expect(screen.getByRole('heading', { name: /search requests/i })).toBeInTheDocument();
    });

    it('renders the description text', () => {
      renderSearchRequests();
      expect(screen.getByText(/search and filter refund and recoupment requests/i)).toBeInTheDocument();
    });

    it('renders the Refresh button', () => {
      renderSearchRequests();
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('renders the Create Request button', () => {
      renderSearchRequests();
      expect(screen.getByRole('button', { name: /create request/i })).toBeInTheDocument();
    });

    it('navigates to /requests/create when Create Request is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();
      const button = screen.getByRole('button', { name: /create request/i });
      await user.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/requests/create');
    });
  });

  describe('filter rendering', () => {
    it('renders the Request ID filter input', () => {
      renderSearchRequests();
      expect(screen.getByLabelText(/request id/i)).toBeInTheDocument();
    });

    it('renders the Member filter dropdown', () => {
      renderSearchRequests();
      expect(screen.getByLabelText(/member/i)).toBeInTheDocument();
    });

    it('renders the Status filter dropdown', () => {
      renderSearchRequests();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('renders the Date From filter input', () => {
      renderSearchRequests();
      expect(screen.getByLabelText(/date from/i)).toBeInTheDocument();
    });

    it('renders the Date To filter input', () => {
      renderSearchRequests();
      expect(screen.getByLabelText(/date to/i)).toBeInTheDocument();
    });

    it('renders the Search button', () => {
      renderSearchRequests();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('renders the Clear button in the filter panel', () => {
      renderSearchRequests();
      expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument();
    });

    it('renders member options in the Member dropdown', () => {
      renderSearchRequests();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Robert Johnson')).toBeInTheDocument();
    });

    it('renders status options in the Status dropdown', () => {
      renderSearchRequests();
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();
      // Check that status options exist
      const options = within(statusSelect).getAllByRole('option');
      // "All Statuses" + 4 status options
      expect(options.length).toBe(5);
    });
  });

  describe('results table display', () => {
    it('displays the request table with column headers', () => {
      renderSearchRequests();
      expect(screen.getByText('Request ID')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Created Date')).toBeInTheDocument();
    });

    it('displays all 5 seeded requests initially', () => {
      renderSearchRequests();
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1 header row + 5 data rows
      expect(rows.length).toBe(6);
    });

    it('displays request IDs in the table', () => {
      renderSearchRequests();
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.getByText('REQ-004')).toBeInTheDocument();
      expect(screen.getByText('REQ-005')).toBeInTheDocument();
    });

    it('resolves member names in the table', () => {
      renderSearchRequests();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Robert Johnson')).toBeInTheDocument();
      expect(screen.getByText('Emily Davis')).toBeInTheDocument();
      expect(screen.getByText('Michael Wilson')).toBeInTheDocument();
    });

    it('resolves provider names in the table', () => {
      renderSearchRequests();
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
      expect(screen.getByText('Sunrise Medical Center')).toBeInTheDocument();
      expect(screen.getByText('Valley Health Clinic')).toBeInTheDocument();
    });

    it('displays the results count showing all requests', () => {
      renderSearchRequests();
      expect(screen.getByText(/showing all 5 requests/i)).toBeInTheDocument();
    });
  });

  describe('search functionality - filter by Request ID', () => {
    it('filters requests by Request ID partial match', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const requestIdInput = screen.getByLabelText(/request id/i);
      await user.type(requestIdInput, 'REQ-001');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-003')).not.toBeInTheDocument();
    });

    it('filters requests by Request ID case-insensitively', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const requestIdInput = screen.getByLabelText(/request id/i);
      await user.type(requestIdInput, 'req-003');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(screen.getByText('REQ-003')).toBeInTheDocument();
    });
  });

  describe('search functionality - filter by Member', () => {
    it('filters requests by selected member', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-003')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-004')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-005')).not.toBeInTheDocument();
    });
  });

  describe('search functionality - filter by Status', () => {
    it('filters requests by New status', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.NEW);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // REQ-001 and REQ-005 are New
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-005')).toBeInTheDocument();
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-003')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-004')).not.toBeInTheDocument();
    });

    it('filters requests by In Progress status', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.IN_PROGRESS);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // REQ-002 is In Progress
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
    });

    it('filters requests by Processed status', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.PROCESSED);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // REQ-003 is Processed
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
    });

    it('filters requests by Closed status', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.CLOSED);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // REQ-004 is Closed
      expect(screen.getByText('REQ-004')).toBeInTheDocument();
      expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
    });
  });

  describe('search functionality - combined filters', () => {
    it('filters by status and member combined', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.NEW);

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Only REQ-001 is New and belongs to M001
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.queryByText('REQ-005')).not.toBeInTheDocument();
    });

    it('shows filtered count when filters are applied', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.NEW);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(screen.getByText(/showing 2 of 5 requests/i)).toBeInTheDocument();
    });

    it('returns no results when filters match nothing', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const requestIdInput = screen.getByLabelText(/request id/i);
      await user.type(requestIdInput, 'REQ-999');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(screen.getByText('No requests found')).toBeInTheDocument();
    });
  });

  describe('search functionality - date range filters', () => {
    it('filters requests by date from', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const dateFromInput = screen.getByLabelText(/date from/i);
      await user.type(dateFromInput, '2024-05-01');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // REQ-001 (May 1), REQ-002 (May 10), REQ-005 (Jun 1)
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('REQ-005')).toBeInTheDocument();
      expect(screen.queryByText('REQ-003')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-004')).not.toBeInTheDocument();
    });

    it('filters requests by date to', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const dateToInput = screen.getByLabelText(/date to/i);
      await user.type(dateToInput, '2024-04-01');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // REQ-004 (Mar 1)
      expect(screen.getByText('REQ-004')).toBeInTheDocument();
      expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
    });

    it('filters requests by date range', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const dateFromInput = screen.getByLabelText(/date from/i);
      await user.type(dateFromInput, '2024-04-01');

      const dateToInput = screen.getByLabelText(/date to/i);
      await user.type(dateToInput, '2024-05-15');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // REQ-003 (Apr 15), REQ-001 (May 1), REQ-002 (May 10)
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.queryByText('REQ-004')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-005')).not.toBeInTheDocument();
    });
  });

  describe('clear filters', () => {
    it('resets all filters and shows all requests when Clear is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      // Apply a filter first
      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.NEW);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Verify filter is applied
      expect(screen.getByText(/showing 2 of 5 requests/i)).toBeInTheDocument();

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /^clear$/i });
      await user.click(clearButton);

      // All requests should be shown again
      expect(screen.getByText(/showing all 5 requests/i)).toBeInTheDocument();
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.getByText('REQ-004')).toBeInTheDocument();
      expect(screen.getByText('REQ-005')).toBeInTheDocument();
    });

    it('clears the Request ID input when Clear is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const requestIdInput = screen.getByLabelText(/request id/i);
      await user.type(requestIdInput, 'REQ-001');

      const clearButton = screen.getByRole('button', { name: /^clear$/i });
      await user.click(clearButton);

      expect(requestIdInput.value).toBe('');
    });

    it('clears the Member dropdown when Clear is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const clearButton = screen.getByRole('button', { name: /^clear$/i });
      await user.click(clearButton);

      expect(memberSelect.value).toBe('');
    });

    it('clears the Status dropdown when Clear is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.NEW);

      const clearButton = screen.getByRole('button', { name: /^clear$/i });
      await user.click(clearButton);

      expect(statusSelect.value).toBe('');
    });
  });

  describe('row click navigation', () => {
    it('navigates to request detail when a row is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const row = screen.getByRole('button', { name: /view request REQ-001/i });
      await user.click(row);

      expect(mockNavigate).toHaveBeenCalledWith('/requests/REQ-001');
    });

    it('navigates to the correct request when a different row is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const row = screen.getByRole('button', { name: /view request REQ-003/i });
      await user.click(row);

      expect(mockNavigate).toHaveBeenCalledWith('/requests/REQ-003');
    });
  });

  describe('empty state', () => {
    it('renders empty table message when no requests exist', () => {
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);
      renderSearchRequests();
      expect(screen.getByText('No requests found')).toBeInTheDocument();
    });

    it('displays showing 0 requests when no requests exist', () => {
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);
      renderSearchRequests();
      expect(screen.getByText(/showing all 0 requests/i)).toBeInTheDocument();
    });
  });

  describe('refresh functionality', () => {
    it('reloads data when Refresh button is clicked', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      // Verify initial data
      expect(screen.getByText('REQ-001')).toBeInTheDocument();

      // Click refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Data should still be present after refresh
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-005')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('displays an error alert when data loading fails', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage failure');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderSearchRequests();
      expect(screen.getByText(/failed to load requests/i)).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('allows dismissing the error alert', async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage failure');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      renderSearchRequests();

      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(dismissButton);

      expect(screen.queryByText(/failed to load requests/i)).not.toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('filter interaction updates results count', () => {
    it('updates results count when filtering by member', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M002');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(screen.getByText(/showing 1 of 5 requests/i)).toBeInTheDocument();
    });

    it('updates results count when filtering by status returns multiple results', async () => {
      const user = userEvent.setup();
      renderSearchRequests();

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, REQUEST_STATUSES.NEW);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(screen.getByText(/showing 2 of 5 requests/i)).toBeInTheDocument();
    });
  });
});