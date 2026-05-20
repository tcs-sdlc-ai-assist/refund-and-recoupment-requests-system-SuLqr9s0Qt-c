import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  STORAGE_KEYS,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  SEED_MEMBERS,
  SEED_PROVIDERS,
  SEED_PAYMENTS,
  SEED_REQUESTS,
} from '../constants.js';

describe('RequestRepository', () => {
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

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    mockStorage = createMockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('getRequests', () => {
    it('returns all seeded requests when no custom data is set', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const requests = RequestRepository.getRequests();
      expect(requests).toEqual(SEED_REQUESTS);
      expect(requests.length).toBe(5);
    });

    it('returns an empty array when no requests exist in storage', async () => {
      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = '1.0.0';
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify(SEED_PAYMENTS);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);
      const { default: RequestRepository } = await import('./requestRepository.js');
      const requests = RequestRepository.getRequests();
      expect(requests).toEqual([]);
    });
  });

  describe('getRequestById', () => {
    it('returns the correct request for a valid request_id', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const request = RequestRepository.getRequestById('REQ-001');
      expect(request).not.toBeNull();
      expect(request.request_id).toBe('REQ-001');
      expect(request.request_type).toBe(REQUEST_TYPES.REFUND);
      expect(request.member_id).toBe('M001');
    });

    it('returns null for a non-existent request_id', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const request = RequestRepository.getRequestById('REQ-999');
      expect(request).toBeNull();
    });

    it('returns null when requestId is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const request = RequestRepository.getRequestById(null);
      expect(request).toBeNull();
    });

    it('returns null when requestId is undefined', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const request = RequestRepository.getRequestById(undefined);
      expect(request).toBeNull();
    });

    it('returns null when requestId is an empty string', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const request = RequestRepository.getRequestById('');
      expect(request).toBeNull();
    });

    it('returns null when requestId is a number', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const request = RequestRepository.getRequestById(123);
      expect(request).toBeNull();
    });
  });

  describe('createRequest', () => {
    it('creates a new request with valid data and returns success', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M001',
        provider_id: 'P001',
        claim_id: 'CLM-2000',
        amount: 350.00,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.request_id).toBe('REQ-006');
      expect(result.data.request_type).toBe(REQUEST_TYPES.REFUND);
      expect(result.data.member_id).toBe('M001');
      expect(result.data.provider_id).toBe('P001');
      expect(result.data.claim_id).toBe('CLM-2000');
      expect(result.data.amount).toBe(350.00);
      expect(result.data.status).toBe(REQUEST_STATUSES.NEW);
      expect(result.data.created_date).toBeDefined();
      expect(result.data.updated_date).toBeDefined();
    });

    it('creates a request with only required fields', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.RECOUPMENT,
        member_id: 'M002',
        amount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data.request_type).toBe(REQUEST_TYPES.RECOUPMENT);
      expect(result.data.member_id).toBe('M002');
      expect(result.data.amount).toBe(100);
      expect(result.data.status).toBe(REQUEST_STATUSES.NEW);
      expect(result.data.provider_id).toBe('');
      expect(result.data.claim_id).toBe('');
    });

    it('persists the new request to storage', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M003',
        amount: 200,
      });

      const allRequests = RequestRepository.getRequests();
      expect(allRequests.length).toBe(6);
      const newRequest = allRequests.find((r) => r.request_id === 'REQ-006');
      expect(newRequest).toBeDefined();
      expect(newRequest.member_id).toBe('M003');
    });

    it('generates sequential IDs for multiple creates', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');

      const result1 = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M001',
        amount: 100,
      });
      expect(result1.data.request_id).toBe('REQ-006');

      const result2 = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.RECOUPMENT,
        member_id: 'M002',
        amount: 200,
      });
      expect(result2.data.request_id).toBe('REQ-007');
    });

    it('fails when requestData is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request data is required.');
    });

    it('fails when requestData is undefined', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest(undefined);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request data is required.');
    });

    it('fails validation when request_type is missing', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        member_id: 'M001',
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed.');
      expect(result.errors.request_type).toBeDefined();
    });

    it('fails validation when member_id is missing', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.errors.member_id).toBeDefined();
    });

    it('fails validation when amount is missing', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M001',
      });

      expect(result.success).toBe(false);
      expect(result.errors.amount).toBeDefined();
    });

    it('fails validation when amount is zero', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M001',
        amount: 0,
      });

      expect(result.success).toBe(false);
      expect(result.errors.amount).toBeDefined();
    });

    it('fails validation when amount is negative', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M001',
        amount: -50,
      });

      expect(result.success).toBe(false);
      expect(result.errors.amount).toBeDefined();
    });

    it('fails validation when request_type is invalid', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: 'invalid_type',
        member_id: 'M001',
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.errors.request_type).toBeDefined();
    });

    it('fails validation when claim_id has invalid format', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M001',
        claim_id: 'INVALID',
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.errors.claim_id).toBeDefined();
    });
  });

  describe('updateRequest', () => {
    it('updates an existing request with valid data', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-001', {
        amount: 500.00,
        claim_id: 'CLM-9999',
      });

      expect(result.success).toBe(true);
      expect(result.data.request_id).toBe('REQ-001');
      expect(result.data.amount).toBe(500.00);
      expect(result.data.claim_id).toBe('CLM-9999');
    });

    it('updates the updated_date on successful update', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const before = RequestRepository.getRequestById('REQ-001');
      const originalUpdatedDate = before.updated_date;

      const result = RequestRepository.updateRequest('REQ-001', {
        amount: 300,
      });

      expect(result.success).toBe(true);
      expect(result.data.updated_date).not.toBe(originalUpdatedDate);
    });

    it('updates request_type successfully', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-001', {
        request_type: REQUEST_TYPES.RECOUPMENT,
      });

      expect(result.success).toBe(true);
      expect(result.data.request_type).toBe(REQUEST_TYPES.RECOUPMENT);
    });

    it('updates member_id successfully', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-001', {
        member_id: 'M005',
      });

      expect(result.success).toBe(true);
      expect(result.data.member_id).toBe('M005');
    });

    it('updates provider_id successfully', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-001', {
        provider_id: 'P003',
      });

      expect(result.success).toBe(true);
      expect(result.data.provider_id).toBe('P003');
    });

    it('fails when requestId is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest(null, { amount: 100 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request ID is required and must be a non-empty string.');
    });

    it('fails when requestId is empty string', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('', { amount: 100 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request ID is required and must be a non-empty string.');
    });

    it('fails when updateData is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-001', null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Update data is required.');
    });

    it('fails when request does not exist', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-999', { amount: 100 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request with ID "REQ-999" not found.');
    });

    it('cannot edit a request with Processed status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      // REQ-003 has status Processed
      const result = RequestRepository.updateRequest('REQ-003', {
        amount: 999,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot edit a request with status "Processed".');
    });

    it('cannot edit a request with Closed status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      // REQ-004 has status Closed
      const result = RequestRepository.updateRequest('REQ-004', {
        amount: 999,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot edit a request with status "Closed".');
    });

    it('can edit a request with New status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      // REQ-001 has status New
      const result = RequestRepository.updateRequest('REQ-001', {
        amount: 300,
      });

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(300);
    });

    it('can edit a request with In Progress status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      // REQ-002 has status In Progress
      const result = RequestRepository.updateRequest('REQ-002', {
        amount: 600,
      });

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(600);
    });

    it('fails validation when updated amount is invalid', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-001', {
        amount: -100,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.amount).toBeDefined();
    });

    it('fails validation when updated claim_id has invalid format', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.updateRequest('REQ-001', {
        claim_id: 'BAD-FORMAT',
      });

      expect(result.success).toBe(false);
      expect(result.errors.claim_id).toBeDefined();
    });
  });

  describe('deleteRequest', () => {
    it('deletes an existing request with New status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.deleteRequest('REQ-001');

      expect(result.success).toBe(true);

      const deleted = RequestRepository.getRequestById('REQ-001');
      expect(deleted).toBeNull();
    });

    it('deletes an existing request with In Progress status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.deleteRequest('REQ-002');

      expect(result.success).toBe(true);

      const deleted = RequestRepository.getRequestById('REQ-002');
      expect(deleted).toBeNull();
    });

    it('reduces the total request count after deletion', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const beforeCount = RequestRepository.getRequests().length;
      RequestRepository.deleteRequest('REQ-001');
      const afterCount = RequestRepository.getRequests().length;

      expect(afterCount).toBe(beforeCount - 1);
    });

    it('cannot delete a request with Processed status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.deleteRequest('REQ-003');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete a request with status "Processed".');
    });

    it('cannot delete a request with Closed status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.deleteRequest('REQ-004');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete a request with status "Closed".');
    });

    it('fails when requestId is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.deleteRequest(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request ID is required and must be a non-empty string.');
    });

    it('fails when requestId is empty string', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.deleteRequest('');
      expect(result.success).toBe(false);
    });

    it('fails when request does not exist', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.deleteRequest('REQ-999');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request with ID "REQ-999" not found.');
    });
  });

  describe('searchRequests', () => {
    it('returns all requests when no filters are provided', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({});
      expect(results.length).toBe(5);
    });

    it('returns all requests when filters is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests(null);
      expect(results.length).toBe(5);
    });

    it('returns all requests when filters is undefined', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests(undefined);
      expect(results.length).toBe(5);
    });

    it('filters by status correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ status: REQUEST_STATUSES.NEW });
      expect(results.length).toBe(2);
      results.forEach((r) => {
        expect(r.status).toBe(REQUEST_STATUSES.NEW);
      });
    });

    it('filters by request_type correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ request_type: REQUEST_TYPES.REFUND });
      expect(results.length).toBe(3);
      results.forEach((r) => {
        expect(r.request_type).toBe(REQUEST_TYPES.REFUND);
      });
    });

    it('filters by member_id correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ member_id: 'M001' });
      expect(results.length).toBe(1);
      expect(results[0].request_id).toBe('REQ-001');
    });

    it('filters by provider_id correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ provider_id: 'P002' });
      expect(results.length).toBe(1);
      expect(results[0].request_id).toBe('REQ-002');
    });

    it('filters by claim_id correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ claim_id: 'CLM-1001' });
      expect(results.length).toBe(1);
      expect(results[0].request_id).toBe('REQ-001');
    });

    it('filters by date_from correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ date_from: '2024-05-01T00:00:00Z' });
      // REQ-001 (May 1), REQ-002 (May 10), REQ-005 (Jun 1)
      expect(results.length).toBe(3);
    });

    it('filters by date_to correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ date_to: '2024-04-01T00:00:00Z' });
      // REQ-004 (Mar 1)
      expect(results.length).toBe(1);
      expect(results[0].request_id).toBe('REQ-004');
    });

    it('filters by date range correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({
        date_from: '2024-04-01T00:00:00Z',
        date_to: '2024-05-15T00:00:00Z',
      });
      // REQ-003 (Apr 15), REQ-001 (May 1), REQ-002 (May 10)
      expect(results.length).toBe(3);
    });

    it('filters by free-text search on request_id', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ search: 'REQ-003' });
      expect(results.length).toBe(1);
      expect(results[0].request_id).toBe('REQ-003');
    });

    it('filters by free-text search case-insensitively', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ search: 'req-001' });
      expect(results.length).toBe(1);
      expect(results[0].request_id).toBe('REQ-001');
    });

    it('filters by free-text search on claim_id', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ search: 'CLM-1003' });
      expect(results.length).toBe(1);
      expect(results[0].request_id).toBe('REQ-003');
    });

    it('combines multiple filters correctly', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({
        status: REQUEST_STATUSES.NEW,
        request_type: REQUEST_TYPES.REFUND,
      });
      // REQ-001 (New, Refund) and REQ-005 (New, Refund)
      expect(results.length).toBe(2);
      results.forEach((r) => {
        expect(r.status).toBe(REQUEST_STATUSES.NEW);
        expect(r.request_type).toBe(REQUEST_TYPES.REFUND);
      });
    });

    it('returns empty array when no requests match filters', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({
        status: REQUEST_STATUSES.NEW,
        request_type: REQUEST_TYPES.RECOUPMENT,
      });
      expect(results.length).toBe(0);
    });

    it('ignores empty string search filter', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ search: '' });
      expect(results.length).toBe(5);
    });

    it('ignores whitespace-only search filter', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const results = RequestRepository.searchRequests({ search: '   ' });
      expect(results.length).toBe(5);
    });
  });

  describe('changeRequestStatus', () => {
    it('transitions from New to In Progress', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.IN_PROGRESS);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.IN_PROGRESS);
      expect(result.data.request_id).toBe('REQ-001');
    });

    it('transitions from New to Closed', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.CLOSED);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.CLOSED);
    });

    it('transitions from In Progress to Processed', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      // REQ-002 is In Progress
      const result = RequestRepository.changeRequestStatus('REQ-002', REQUEST_STATUSES.PROCESSED);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.PROCESSED);
    });

    it('transitions from In Progress to Closed', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-002', REQUEST_STATUSES.CLOSED);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.CLOSED);
    });

    it('transitions from Processed to Closed', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      // REQ-003 is Processed
      const result = RequestRepository.changeRequestStatus('REQ-003', REQUEST_STATUSES.CLOSED);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.CLOSED);
    });

    it('updates the updated_date on status change', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const before = RequestRepository.getRequestById('REQ-001');
      const originalUpdatedDate = before.updated_date;

      const result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.IN_PROGRESS);

      expect(result.success).toBe(true);
      expect(result.data.updated_date).not.toBe(originalUpdatedDate);
    });

    it('persists the status change to storage', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.IN_PROGRESS);

      const updated = RequestRepository.getRequestById('REQ-001');
      expect(updated.status).toBe(REQUEST_STATUSES.IN_PROGRESS);
    });

    it('rejects transition from New to Processed (not allowed)', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.PROCESSED);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition from');
    });

    it('rejects transition from Closed to any status', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      // REQ-004 is Closed
      const result = RequestRepository.changeRequestStatus('REQ-004', REQUEST_STATUSES.NEW);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition from');
    });

    it('rejects transition from Closed to In Progress', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-004', REQUEST_STATUSES.IN_PROGRESS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition from');
    });

    it('rejects transition from Processed to New', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-003', REQUEST_STATUSES.NEW);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition from');
    });

    it('rejects transition from Processed to In Progress', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-003', REQUEST_STATUSES.IN_PROGRESS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition from');
    });

    it('rejects transition from In Progress to New', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-002', REQUEST_STATUSES.NEW);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition from');
    });

    it('fails when requestId is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus(null, REQUEST_STATUSES.IN_PROGRESS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request ID is required and must be a non-empty string.');
    });

    it('fails when requestId is empty string', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('', REQUEST_STATUSES.IN_PROGRESS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request ID is required and must be a non-empty string.');
    });

    it('fails when newStatus is null', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-001', null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('New status is required and must be a non-empty string.');
    });

    it('fails when newStatus is empty string', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-001', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('New status is required and must be a non-empty string.');
    });

    it('fails when request does not exist', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const result = RequestRepository.changeRequestStatus('REQ-999', REQUEST_STATUSES.IN_PROGRESS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request with ID "REQ-999" not found.');
    });

    it('supports full lifecycle: New -> In Progress -> Processed -> Closed', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');

      // New -> In Progress
      let result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.IN_PROGRESS);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.IN_PROGRESS);

      // In Progress -> Processed
      result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.PROCESSED);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.PROCESSED);

      // Processed -> Closed
      result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.CLOSED);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(REQUEST_STATUSES.CLOSED);

      // Closed -> anything should fail
      result = RequestRepository.changeRequestStatus('REQ-001', REQUEST_STATUSES.NEW);
      expect(result.success).toBe(false);
    });
  });

  describe('_generateNextId', () => {
    it('generates REQ-001 for an empty array', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const nextId = RequestRepository._generateNextId([]);
      expect(nextId).toBe('REQ-001');
    });

    it('generates the next sequential ID based on existing requests', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const requests = [
        { request_id: 'REQ-001' },
        { request_id: 'REQ-002' },
        { request_id: 'REQ-010' },
      ];
      const nextId = RequestRepository._generateNextId(requests);
      expect(nextId).toBe('REQ-011');
    });

    it('handles requests with non-standard IDs gracefully', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');
      const requests = [
        { request_id: 'REQ-005' },
        { request_id: 'INVALID-ID' },
        { request_id: null },
      ];
      const nextId = RequestRepository._generateNextId(requests);
      expect(nextId).toBe('REQ-006');
    });
  });

  describe('localStorage write failure handling', () => {
    it('returns failure when localStorage write fails on create', async () => {
      const { default: RequestRepository } = await import('./requestRepository.js');

      // Make setItem fail for non-test keys after initial seed
      let callCount = 0;
      const originalSetItem = mockStorage.setItem;
      mockStorage.setItem = vi.fn((key, value) => {
        if (key === STORAGE_KEYS.REQUESTS) {
          callCount++;
          // Allow the seed write but fail subsequent writes
          if (callCount > 1) {
            throw new Error('QuotaExceededError');
          }
        }
        originalSetItem(key, value);
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = RequestRepository.createRequest({
        request_type: REQUEST_TYPES.REFUND,
        member_id: 'M001',
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save request to localStorage.');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});