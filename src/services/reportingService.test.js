import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

describe('ReportingService', () => {
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

  describe('getSummaryMetrics', () => {
    it('returns correct summary metrics for seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.totalRequests).toBe(5);
      // Refund requests: REQ-001 (250), REQ-003 (120.75), REQ-005 (150) = 520.75
      expect(metrics.totalRefundAmount).toBe(520.75);
      // Recoupment requests: REQ-002 (475.50), REQ-004 (890.25) = 1365.75
      expect(metrics.totalRecoupmentAmount).toBe(1365.75);
      expect(metrics.totalPayments).toBe(8);
      // Payments: 250 + 475.50 + 120.75 + 300 + 890.25 + 150 + 200 + 550 = 2936.50
      expect(metrics.totalAmountPaid).toBe(2936.5);
    });

    it('returns correct count by status for seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.countByStatus[REQUEST_STATUSES.NEW]).toBe(2);
      expect(metrics.countByStatus[REQUEST_STATUSES.IN_PROGRESS]).toBe(1);
      expect(metrics.countByStatus[REQUEST_STATUSES.PROCESSED]).toBe(1);
      expect(metrics.countByStatus[REQUEST_STATUSES.CLOSED]).toBe(1);
    });

    it('returns correct count by type for seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.countByType[REQUEST_TYPES.REFUND]).toBe(3);
      expect(metrics.countByType[REQUEST_TYPES.RECOUPMENT]).toBe(2);
    });

    it('returns correct average amount for seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      // Total amount = 520.75 + 1365.75 = 1886.50, average = 1886.50 / 5 = 377.30
      expect(metrics.averageAmount).toBe(377.3);
    });

    it('returns zero metrics when no requests exist', async () => {
      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);

      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.totalRefundAmount).toBe(0);
      expect(metrics.totalRecoupmentAmount).toBe(0);
      expect(metrics.averageAmount).toBe(0);
      expect(metrics.totalPayments).toBe(0);
      expect(metrics.totalAmountPaid).toBe(0);
      expect(metrics.countByStatus[REQUEST_STATUSES.NEW]).toBe(0);
      expect(metrics.countByStatus[REQUEST_STATUSES.IN_PROGRESS]).toBe(0);
      expect(metrics.countByStatus[REQUEST_STATUSES.PROCESSED]).toBe(0);
      expect(metrics.countByStatus[REQUEST_STATUSES.CLOSED]).toBe(0);
      expect(metrics.countByType[REQUEST_TYPES.REFUND]).toBe(0);
      expect(metrics.countByType[REQUEST_TYPES.RECOUPMENT]).toBe(0);
    });

    it('returns correct metrics when only refund requests exist', async () => {
      const refundOnly = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M001',
          provider_id: 'P001',
          claim_id: 'CLM-1001',
          amount: 100,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-01T12:00:00Z',
          updated_date: '2024-05-01T12:00:00Z',
        },
        {
          request_id: 'REQ-002',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M002',
          provider_id: 'P002',
          claim_id: 'CLM-1002',
          amount: 200.50,
          status: REQUEST_STATUSES.PROCESSED,
          created_date: '2024-05-10T09:30:00Z',
          updated_date: '2024-05-12T14:00:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(refundOnly);

      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.totalRefundAmount).toBe(300.5);
      expect(metrics.totalRecoupmentAmount).toBe(0);
      expect(metrics.countByType[REQUEST_TYPES.REFUND]).toBe(2);
      expect(metrics.countByType[REQUEST_TYPES.RECOUPMENT]).toBe(0);
    });

    it('returns correct metrics when only recoupment requests exist', async () => {
      const recoupmentOnly = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.RECOUPMENT,
          member_id: 'M001',
          provider_id: 'P001',
          claim_id: 'CLM-1001',
          amount: 500,
          status: REQUEST_STATUSES.IN_PROGRESS,
          created_date: '2024-05-01T12:00:00Z',
          updated_date: '2024-05-01T12:00:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(recoupmentOnly);

      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.totalRefundAmount).toBe(0);
      expect(metrics.totalRecoupmentAmount).toBe(500);
      expect(metrics.countByType[REQUEST_TYPES.REFUND]).toBe(0);
      expect(metrics.countByType[REQUEST_TYPES.RECOUPMENT]).toBe(1);
      expect(metrics.countByStatus[REQUEST_STATUSES.IN_PROGRESS]).toBe(1);
      expect(metrics.averageAmount).toBe(500);
    });

    it('handles requests with zero or missing amount gracefully', async () => {
      const requestsWithBadAmounts = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M001',
          provider_id: 'P001',
          amount: 0,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-01T12:00:00Z',
          updated_date: '2024-05-01T12:00:00Z',
        },
        {
          request_id: 'REQ-002',
          request_type: REQUEST_TYPES.RECOUPMENT,
          member_id: 'M002',
          provider_id: 'P002',
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-10T09:30:00Z',
          updated_date: '2024-05-10T09:30:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(requestsWithBadAmounts);

      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.totalRefundAmount).toBe(0);
      expect(metrics.totalRecoupmentAmount).toBe(0);
      expect(metrics.averageAmount).toBe(0);
    });

    it('returns correct totalAmountPaid from payments', async () => {
      const payments = [
        { payment_id: 'PAY001', claim_id: 'CLM-1001', amount_paid: 100.25, payment_date: '2024-01-15T10:00:00Z' },
        { payment_id: 'PAY002', claim_id: 'CLM-1002', amount_paid: 200.75, payment_date: '2024-02-10T14:30:00Z' },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify(payments);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);

      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.totalPayments).toBe(2);
      expect(metrics.totalAmountPaid).toBe(301);
    });

    it('returns the correct structure with all expected properties', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('totalRefundAmount');
      expect(metrics).toHaveProperty('totalRecoupmentAmount');
      expect(metrics).toHaveProperty('countByStatus');
      expect(metrics).toHaveProperty('countByType');
      expect(metrics).toHaveProperty('averageAmount');
      expect(metrics).toHaveProperty('totalPayments');
      expect(metrics).toHaveProperty('totalAmountPaid');
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.totalRefundAmount).toBe('number');
      expect(typeof metrics.totalRecoupmentAmount).toBe('number');
      expect(typeof metrics.averageAmount).toBe('number');
      expect(typeof metrics.totalPayments).toBe('number');
      expect(typeof metrics.totalAmountPaid).toBe('number');
      expect(typeof metrics.countByStatus).toBe('object');
      expect(typeof metrics.countByType).toBe('object');
    });

    it('handles mixed request types with various statuses correctly', async () => {
      const mixedRequests = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M001',
          amount: 100,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-01T12:00:00Z',
          updated_date: '2024-05-01T12:00:00Z',
        },
        {
          request_id: 'REQ-002',
          request_type: REQUEST_TYPES.RECOUPMENT,
          member_id: 'M002',
          amount: 200,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-02T12:00:00Z',
          updated_date: '2024-05-02T12:00:00Z',
        },
        {
          request_id: 'REQ-003',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M003',
          amount: 300,
          status: REQUEST_STATUSES.IN_PROGRESS,
          created_date: '2024-05-03T12:00:00Z',
          updated_date: '2024-05-03T12:00:00Z',
        },
        {
          request_id: 'REQ-004',
          request_type: REQUEST_TYPES.RECOUPMENT,
          member_id: 'M004',
          amount: 400,
          status: REQUEST_STATUSES.CLOSED,
          created_date: '2024-05-04T12:00:00Z',
          updated_date: '2024-05-04T12:00:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(mixedRequests);

      const { default: ReportingService } = await import('./reportingService.js');
      const metrics = ReportingService.getSummaryMetrics();

      expect(metrics.totalRequests).toBe(4);
      expect(metrics.totalRefundAmount).toBe(400);
      expect(metrics.totalRecoupmentAmount).toBe(600);
      expect(metrics.countByStatus[REQUEST_STATUSES.NEW]).toBe(2);
      expect(metrics.countByStatus[REQUEST_STATUSES.IN_PROGRESS]).toBe(1);
      expect(metrics.countByStatus[REQUEST_STATUSES.PROCESSED]).toBe(0);
      expect(metrics.countByStatus[REQUEST_STATUSES.CLOSED]).toBe(1);
      expect(metrics.countByType[REQUEST_TYPES.REFUND]).toBe(2);
      expect(metrics.countByType[REQUEST_TYPES.RECOUPMENT]).toBe(2);
      expect(metrics.averageAmount).toBe(250);
    });
  });

  describe('getMonthlyReport', () => {
    it('returns correct monthly report for May 2024 from seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      expect(report.year).toBe(2024);
      expect(report.month).toBe(5);
      // REQ-001 (May 1, refund, 250) and REQ-002 (May 10, recoupment, 475.50)
      expect(report.totalRequests).toBe(2);
      expect(report.totalRefundAmount).toBe(250);
      expect(report.totalRecoupmentAmount).toBe(475.5);
      expect(report.requests.length).toBe(2);
    });

    it('returns correct monthly report for March 2024 from seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 3);

      expect(report.year).toBe(2024);
      expect(report.month).toBe(3);
      // REQ-004 (Mar 1, recoupment, 890.25)
      expect(report.totalRequests).toBe(1);
      expect(report.totalRefundAmount).toBe(0);
      expect(report.totalRecoupmentAmount).toBe(890.25);
      expect(report.requests.length).toBe(1);
      expect(report.requests[0].request_id).toBe('REQ-004');
    });

    it('returns correct monthly report for April 2024 from seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 4);

      expect(report.year).toBe(2024);
      expect(report.month).toBe(4);
      // REQ-003 (Apr 15, refund, 120.75)
      expect(report.totalRequests).toBe(1);
      expect(report.totalRefundAmount).toBe(120.75);
      expect(report.totalRecoupmentAmount).toBe(0);
    });

    it('returns correct monthly report for June 2024 from seeded data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 6);

      expect(report.year).toBe(2024);
      expect(report.month).toBe(6);
      // REQ-005 (Jun 1, refund, 150)
      expect(report.totalRequests).toBe(1);
      expect(report.totalRefundAmount).toBe(150);
      expect(report.totalRecoupmentAmount).toBe(0);
    });

    it('returns zero metrics for a month with no requests', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 12);

      expect(report.year).toBe(2024);
      expect(report.month).toBe(12);
      expect(report.totalRequests).toBe(0);
      expect(report.totalRefundAmount).toBe(0);
      expect(report.totalRecoupmentAmount).toBe(0);
      expect(report.totalPayments).toBe(0);
      expect(report.totalAmountPaid).toBe(0);
      expect(report.requests).toEqual([]);
      expect(report.payments).toEqual([]);
    });

    it('returns zero metrics for a year with no data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2020, 1);

      expect(report.totalRequests).toBe(0);
      expect(report.totalRefundAmount).toBe(0);
      expect(report.totalRecoupmentAmount).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('includes payments for the specified month', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 1);

      // PAY001 (Jan 15, 250)
      expect(report.totalPayments).toBe(1);
      expect(report.totalAmountPaid).toBe(250);
      expect(report.payments.length).toBe(1);
      expect(report.payments[0].payment_id).toBe('PAY001');
    });

    it('includes multiple payments for a month with several payments', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      // PAY007 (May 1, 200) and PAY008 (May 18, 550)
      expect(report.totalPayments).toBe(2);
      expect(report.totalAmountPaid).toBe(750);
      expect(report.payments.length).toBe(2);
    });

    it('returns correct count by status for monthly data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      // REQ-001 (New), REQ-002 (In Progress)
      expect(report.countByStatus[REQUEST_STATUSES.NEW]).toBe(1);
      expect(report.countByStatus[REQUEST_STATUSES.IN_PROGRESS]).toBe(1);
      expect(report.countByStatus[REQUEST_STATUSES.PROCESSED]).toBe(0);
      expect(report.countByStatus[REQUEST_STATUSES.CLOSED]).toBe(0);
    });

    it('returns correct count by type for monthly data', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      // REQ-001 (refund), REQ-002 (recoupment)
      expect(report.countByType[REQUEST_TYPES.REFUND]).toBe(1);
      expect(report.countByType[REQUEST_TYPES.RECOUPMENT]).toBe(1);
    });

    it('returns the correct structure with all expected properties', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      expect(report).toHaveProperty('year');
      expect(report).toHaveProperty('month');
      expect(report).toHaveProperty('totalRequests');
      expect(report).toHaveProperty('totalRefundAmount');
      expect(report).toHaveProperty('totalRecoupmentAmount');
      expect(report).toHaveProperty('countByStatus');
      expect(report).toHaveProperty('countByType');
      expect(report).toHaveProperty('totalPayments');
      expect(report).toHaveProperty('totalAmountPaid');
      expect(report).toHaveProperty('requests');
      expect(report).toHaveProperty('payments');
      expect(Array.isArray(report.requests)).toBe(true);
      expect(Array.isArray(report.payments)).toBe(true);
    });

    it('returns empty report when year is null', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(null, 5);

      expect(report.year).toBeNull();
      expect(report.month).toBeNull();
      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
      expect(report.payments).toEqual([]);
    });

    it('returns empty report when month is null', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, null);

      expect(report.year).toBeNull();
      expect(report.month).toBeNull();
      expect(report.totalRequests).toBe(0);
    });

    it('returns empty report when year is undefined', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(undefined, 5);

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('returns empty report when month is undefined', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, undefined);

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('returns empty report for invalid month (0)', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 0);

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('returns empty report for invalid month (13)', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 13);

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('returns empty report for invalid month (-1)', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, -1);

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('returns empty report for NaN year', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport('abc', 5);

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('returns empty report for NaN month', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 'abc');

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('handles empty requests and payments arrays', async () => {
      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);

      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      expect(report.totalRequests).toBe(0);
      expect(report.totalRefundAmount).toBe(0);
      expect(report.totalRecoupmentAmount).toBe(0);
      expect(report.totalPayments).toBe(0);
      expect(report.totalAmountPaid).toBe(0);
      expect(report.requests).toEqual([]);
      expect(report.payments).toEqual([]);
    });

    it('handles requests with missing created_date', async () => {
      const requestsWithMissingDate = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M001',
          amount: 100,
          status: REQUEST_STATUSES.NEW,
          updated_date: '2024-05-01T12:00:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(requestsWithMissingDate);

      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      expect(report.totalRequests).toBe(0);
      expect(report.requests).toEqual([]);
    });

    it('handles payments with missing payment_date', async () => {
      const paymentsWithMissingDate = [
        { payment_id: 'PAY001', claim_id: 'CLM-1001', amount_paid: 100 },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify(paymentsWithMissingDate);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify([]);

      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      expect(report.totalPayments).toBe(0);
      expect(report.totalAmountPaid).toBe(0);
      expect(report.payments).toEqual([]);
    });

    it('correctly filters requests at month boundaries', async () => {
      const boundaryRequests = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M001',
          amount: 100,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-04-30T23:59:59Z',
          updated_date: '2024-04-30T23:59:59Z',
        },
        {
          request_id: 'REQ-002',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M002',
          amount: 200,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-01T00:00:00Z',
          updated_date: '2024-05-01T00:00:00Z',
        },
        {
          request_id: 'REQ-003',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M003',
          amount: 300,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-31T23:59:59Z',
          updated_date: '2024-05-31T23:59:59Z',
        },
        {
          request_id: 'REQ-004',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M004',
          amount: 400,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-06-01T00:00:00Z',
          updated_date: '2024-06-01T00:00:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(boundaryRequests);

      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      // Should include REQ-002 and REQ-003 (May), not REQ-001 (April) or REQ-004 (June)
      expect(report.totalRequests).toBe(2);
      expect(report.requests.length).toBe(2);
      const requestIds = report.requests.map((r) => r.request_id);
      expect(requestIds).toContain('REQ-002');
      expect(requestIds).toContain('REQ-003');
      expect(requestIds).not.toContain('REQ-001');
      expect(requestIds).not.toContain('REQ-004');
    });

    it('accepts year and month as string numbers', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport('2024', '5');

      // Should work the same as numeric arguments
      expect(report.year).toBe(2024);
      expect(report.month).toBe(5);
      expect(report.totalRequests).toBe(2);
    });

    it('rounds monetary amounts to two decimal places', async () => {
      const requestsWithDecimals = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M001',
          amount: 33.333,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-01T12:00:00Z',
          updated_date: '2024-05-01T12:00:00Z',
        },
        {
          request_id: 'REQ-002',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M002',
          amount: 66.667,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-05-02T12:00:00Z',
          updated_date: '2024-05-02T12:00:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(requestsWithDecimals);

      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 5);

      expect(report.totalRefundAmount).toBe(100);
    });

    it('handles month 12 (December) correctly', async () => {
      const decemberRequests = [
        {
          request_id: 'REQ-001',
          request_type: REQUEST_TYPES.REFUND,
          member_id: 'M001',
          amount: 500,
          status: REQUEST_STATUSES.NEW,
          created_date: '2024-12-15T12:00:00Z',
          updated_date: '2024-12-15T12:00:00Z',
        },
      ];

      mockStorage._store[STORAGE_KEYS.DATA_VERSION] = CURRENT_DATA_VERSION;
      mockStorage._store[STORAGE_KEYS.MEMBERS] = JSON.stringify(SEED_MEMBERS);
      mockStorage._store[STORAGE_KEYS.PROVIDERS] = JSON.stringify(SEED_PROVIDERS);
      mockStorage._store[STORAGE_KEYS.PAYMENTS] = JSON.stringify([]);
      mockStorage._store[STORAGE_KEYS.REQUESTS] = JSON.stringify(decemberRequests);

      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 12);

      expect(report.totalRequests).toBe(1);
      expect(report.totalRefundAmount).toBe(500);
      expect(report.requests.length).toBe(1);
    });

    it('handles month 1 (January) correctly', async () => {
      const { default: ReportingService } = await import('./reportingService.js');
      const report = ReportingService.getMonthlyReport(2024, 1);

      // From seeded data: no requests in January, but PAY001 is in January
      expect(report.totalRequests).toBe(0);
      expect(report.totalPayments).toBe(1);
      expect(report.totalAmountPaid).toBe(250);
    });
  });
});