import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CreateEditRequest from './CreateEditRequest.jsx';
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

describe('CreateEditRequest', () => {
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

  function renderCreatePage() {
    return render(
      <MemoryRouter initialEntries={['/requests/create']}>
        <Routes>
          <Route path="/requests/create" element={<CreateEditRequest />} />
        </Routes>
      </MemoryRouter>
    );
  }

  function renderEditPage(requestId) {
    return render(
      <MemoryRouter initialEntries={[`/requests/${requestId}`]}>
        <Routes>
          <Route path="/requests/:requestId" element={<CreateEditRequest />} />
        </Routes>
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

  describe('create mode - form rendering', () => {
    it('renders the Create Request heading', () => {
      renderCreatePage();
      expect(screen.getByRole('heading', { name: /create request/i })).toBeInTheDocument();
    });

    it('renders the description text', () => {
      renderCreatePage();
      expect(screen.getByText(/fill in the form below to create a new refund or recoupment request/i)).toBeInTheDocument();
    });

    it('renders the Request Type select field', () => {
      renderCreatePage();
      expect(screen.getByLabelText(/request type/i)).toBeInTheDocument();
    });

    it('renders the Member select field', () => {
      renderCreatePage();
      expect(screen.getByLabelText(/member/i)).toBeInTheDocument();
    });

    it('renders the Provider select field', () => {
      renderCreatePage();
      expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    });

    it('renders the Claim ID text field', () => {
      renderCreatePage();
      expect(screen.getByLabelText(/claim id/i)).toBeInTheDocument();
    });

    it('renders the Amount number field', () => {
      renderCreatePage();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    it('renders the Save button in create mode', () => {
      renderCreatePage();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('renders the Clear button in create mode', () => {
      renderCreatePage();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('renders the Cancel button in create mode', () => {
      renderCreatePage();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not render the Update button in create mode', () => {
      renderCreatePage();
      expect(screen.queryByRole('button', { name: /^update$/i })).not.toBeInTheDocument();
    });

    it('does not render the Delete button in create mode', () => {
      renderCreatePage();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('renders member options in the Member dropdown', () => {
      renderCreatePage();
      const memberSelect = screen.getByLabelText(/member/i);
      expect(memberSelect).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('renders provider options in the Provider dropdown', () => {
      renderCreatePage();
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
      expect(screen.getByText('Sunrise Medical Center')).toBeInTheDocument();
    });
  });

  describe('create mode - field validation', () => {
    it('shows validation error when request type is not selected', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/request type is required/i)).toBeInTheDocument();
    });

    it('shows validation error when member is not selected', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const typeSelect = screen.getByLabelText(/request type/i);
      await user.selectOptions(typeSelect, 'refund');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/member id is required/i)).toBeInTheDocument();
    });

    it('shows validation error when amount is empty', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const typeSelect = screen.getByLabelText(/request type/i);
      await user.selectOptions(typeSelect, 'refund');

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });

    it('shows validation error when claim ID has invalid format', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const typeSelect = screen.getByLabelText(/request type/i);
      await user.selectOptions(typeSelect, 'refund');

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const claimInput = screen.getByLabelText(/claim id/i);
      await user.type(claimInput, 'INVALID');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/claim id must follow the format/i)).toBeInTheDocument();
    });

    it('shows error alert when validation fails', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/please fix the validation errors before saving/i)).toBeInTheDocument();
    });

    it('clears field error when user changes the field value', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/request type is required/i)).toBeInTheDocument();

      const typeSelect = screen.getByLabelText(/request type/i);
      await user.selectOptions(typeSelect, 'refund');

      expect(screen.queryByText(/request type is required/i)).not.toBeInTheDocument();
    });
  });

  describe('create mode - successful creation', () => {
    it('creates a request with valid data and shows success message', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const typeSelect = screen.getByLabelText(/request type/i);
      await user.selectOptions(typeSelect, 'refund');

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const providerSelect = screen.getByLabelText(/provider/i);
      await user.selectOptions(providerSelect, 'P001');

      const claimInput = screen.getByLabelText(/claim id/i);
      await user.type(claimInput, 'CLM-2000');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '350');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/REQ-006 created successfully/i)).toBeInTheDocument();
    });

    it('navigates to the new request edit page after creation', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const typeSelect = screen.getByLabelText(/request type/i);
      await user.selectOptions(typeSelect, 'refund');

      const memberSelect = screen.getByLabelText(/member/i);
      await user.selectOptions(memberSelect, 'M001');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockNavigate).toHaveBeenCalledWith('/requests/REQ-006');
    });
  });

  describe('create mode - clear and cancel', () => {
    it('clears form fields when Clear button is clicked', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const typeSelect = screen.getByLabelText(/request type/i);
      await user.selectOptions(typeSelect, 'refund');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '500');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(typeSelect.value).toBe('');
      expect(amountInput.value).toBe('');
    });

    it('navigates to dashboard when Cancel is clicked in create mode', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('edit mode - pre-population', () => {
    it('renders the request ID in the heading', () => {
      renderEditPage('REQ-001');
      expect(screen.getByRole('heading', { name: /request REQ-001/i })).toBeInTheDocument();
    });

    it('pre-populates the Request Type field', () => {
      renderEditPage('REQ-001');
      const typeSelect = screen.getByLabelText(/request type/i);
      expect(typeSelect.value).toBe('refund');
    });

    it('pre-populates the Member field', () => {
      renderEditPage('REQ-001');
      const memberSelect = screen.getByLabelText(/member/i);
      expect(memberSelect.value).toBe('M001');
    });

    it('pre-populates the Provider field', () => {
      renderEditPage('REQ-001');
      const providerSelect = screen.getByLabelText(/provider/i);
      expect(providerSelect.value).toBe('P001');
    });

    it('pre-populates the Claim ID field', () => {
      renderEditPage('REQ-001');
      const claimInput = screen.getByLabelText(/claim id/i);
      expect(claimInput.value).toBe('CLM-1001');
    });

    it('pre-populates the Amount field', () => {
      renderEditPage('REQ-001');
      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput.value).toBe('250');
    });

    it('displays the Request ID in system info section', () => {
      renderEditPage('REQ-001');
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
    });

    it('displays the Created Date in system info section', () => {
      renderEditPage('REQ-001');
      expect(screen.getByText('Created Date')).toBeInTheDocument();
    });

    it('displays the Updated Date in system info section', () => {
      renderEditPage('REQ-001');
      expect(screen.getByText('Updated Date')).toBeInTheDocument();
    });

    it('renders the Update button in edit mode for New status', () => {
      renderEditPage('REQ-001');
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders the Delete button in edit mode for New status', () => {
      renderEditPage('REQ-001');
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('renders the Back to Requests button in edit mode', () => {
      renderEditPage('REQ-001');
      expect(screen.getByRole('button', { name: /back to requests/i })).toBeInTheDocument();
    });

    it('does not render the Save button in edit mode', () => {
      renderEditPage('REQ-001');
      expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    });
  });

  describe('edit mode - update request', () => {
    it('updates a request successfully', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '500');

      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      expect(screen.getByText(/request updated successfully/i)).toBeInTheDocument();
    });

    it('shows validation errors on update with invalid data', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);

      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      expect(screen.getByText(/please fix the validation errors before updating/i)).toBeInTheDocument();
    });
  });

  describe('edit mode - processed request read-only state', () => {
    it('disables form fields for a Processed request', () => {
      renderEditPage('REQ-003');

      const typeSelect = screen.getByLabelText(/request type/i);
      expect(typeSelect).toBeDisabled();

      const memberSelect = screen.getByLabelText(/member/i);
      expect(memberSelect).toBeDisabled();

      const providerSelect = screen.getByLabelText(/provider/i);
      expect(providerSelect).toBeDisabled();

      const claimInput = screen.getByLabelText(/claim id/i);
      expect(claimInput).toBeDisabled();

      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput).toBeDisabled();
    });

    it('shows a warning message for Processed request', () => {
      renderEditPage('REQ-003');
      expect(screen.getByText(/this request has status "Processed" and cannot be edited/i)).toBeInTheDocument();
    });

    it('does not render the Update button for Processed request', () => {
      renderEditPage('REQ-003');
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
    });

    it('does not render the Delete button for Processed request', () => {
      renderEditPage('REQ-003');
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('does not render the Clear button for Processed request', () => {
      renderEditPage('REQ-003');
      expect(screen.queryByRole('button', { name: /^clear$/i })).not.toBeInTheDocument();
    });
  });

  describe('edit mode - closed request read-only state', () => {
    it('disables form fields for a Closed request', () => {
      renderEditPage('REQ-004');

      const typeSelect = screen.getByLabelText(/request type/i);
      expect(typeSelect).toBeDisabled();

      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput).toBeDisabled();
    });

    it('shows a warning message for Closed request', () => {
      renderEditPage('REQ-004');
      expect(screen.getByText(/this request has status "Closed" and cannot be edited/i)).toBeInTheDocument();
    });

    it('does not render the Update button for Closed request', () => {
      renderEditPage('REQ-004');
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
    });

    it('does not render the Close Request button for Closed request', () => {
      renderEditPage('REQ-004');
      expect(screen.queryByRole('button', { name: /close request/i })).not.toBeInTheDocument();
    });
  });

  describe('edit mode - status change actions', () => {
    it('renders the Start Processing button for New status request', () => {
      renderEditPage('REQ-001');
      expect(screen.getByRole('button', { name: /start processing/i })).toBeInTheDocument();
    });

    it('renders the Close Request button for New status request', () => {
      renderEditPage('REQ-001');
      expect(screen.getByRole('button', { name: /close request/i })).toBeInTheDocument();
    });

    it('renders the Mark as Processed button for In Progress status request', () => {
      renderEditPage('REQ-002');
      expect(screen.getByRole('button', { name: /mark as processed/i })).toBeInTheDocument();
    });

    it('renders the Close Request button for In Progress status request', () => {
      renderEditPage('REQ-002');
      expect(screen.getByRole('button', { name: /close request/i })).toBeInTheDocument();
    });

    it('shows confirmation dialog when Start Processing is clicked', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      expect(screen.getByText(/process request/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to change the status/i)).toBeInTheDocument();
    });

    it('transitions from New to In Progress when confirmed', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      const confirmButton = screen.getByRole('button', { name: /^process$/i });
      await user.click(confirmButton);

      expect(screen.getByText(/request status changed to "In Progress" successfully/i)).toBeInTheDocument();
    });

    it('shows confirmation dialog when Close Request is clicked', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const closeButton = screen.getByRole('button', { name: /close request/i });
      await user.click(closeButton);

      expect(screen.getByText(/close request/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to close this request/i)).toBeInTheDocument();
    });

    it('transitions to Closed when confirmed', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const closeButton = screen.getByRole('button', { name: /close request/i });
      await user.click(closeButton);

      const confirmCloseButton = screen.getByRole('button', { name: /^close request$/i });
      await user.click(confirmCloseButton);

      expect(screen.getByText(/request closed successfully/i)).toBeInTheDocument();
    });

    it('cancels status change when Cancel is clicked in confirmation dialog', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const processButton = screen.getByRole('button', { name: /start processing/i });
      await user.click(processButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText(/request status changed/i)).not.toBeInTheDocument();
    });

    it('renders Close Request button for Processed status request', () => {
      renderEditPage('REQ-003');
      expect(screen.getByRole('button', { name: /close request/i })).toBeInTheDocument();
    });
  });

  describe('edit mode - delete request', () => {
    it('shows confirmation dialog when Delete is clicked', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText(/delete request/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete request REQ-001/i)).toBeInTheDocument();
    });

    it('deletes the request and navigates to search page when confirmed', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      expect(mockNavigate).toHaveBeenCalledWith('/requests');
    });

    it('cancels deletion when Cancel is clicked in confirmation dialog', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockNavigate).not.toHaveBeenCalledWith('/requests');
    });
  });

  describe('edit mode - request not found', () => {
    it('displays not found message for non-existent request', () => {
      renderEditPage('REQ-999');
      expect(screen.getByRole('heading', { name: /request not found/i })).toBeInTheDocument();
    });

    it('displays error alert for non-existent request', () => {
      renderEditPage('REQ-999');
      expect(screen.getByText(/request with id "REQ-999" not found/i)).toBeInTheDocument();
    });

    it('renders Back to Requests button on not found page', () => {
      renderEditPage('REQ-999');
      expect(screen.getByRole('button', { name: /back to requests/i })).toBeInTheDocument();
    });

    it('navigates to requests page when Back to Requests is clicked on not found page', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-999');

      const backButton = screen.getByRole('button', { name: /back to requests/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/requests');
    });
  });

  describe('edit mode - navigation', () => {
    it('navigates to /requests when Back to Requests is clicked', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const backButton = screen.getByRole('button', { name: /back to requests/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/requests');
    });
  });

  describe('error handling', () => {
    it('displays an error alert when data loading fails', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage failure');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderCreatePage();
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('edit mode - clear resets to original values', () => {
    it('resets form fields to original request values when Clear is clicked in edit mode', async () => {
      const user = userEvent.setup();
      renderEditPage('REQ-001');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '999');

      expect(amountInput.value).toBe('999');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(amountInput.value).toBe('250');
    });
  });
});