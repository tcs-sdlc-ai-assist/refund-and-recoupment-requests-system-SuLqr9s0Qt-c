/**
 * Application-wide constants and configuration values
 * for the Refund & Recoupment Requests system.
 */

// ─── localStorage Keys ───────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  REQUESTS: 'requests',
  MEMBERS: 'members',
  PROVIDERS: 'providers',
  PAYMENTS: 'payments',
  DATA_VERSION: 'data_version',
};

// ─── Current Data Version ────────────────────────────────────────────────────

export const CURRENT_DATA_VERSION = '1.0.0';

// ─── Request Statuses ────────────────────────────────────────────────────────

export const REQUEST_STATUSES = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  PROCESSED: 'Processed',
  CLOSED: 'Closed',
};

export const REQUEST_STATUS_LIST = [
  REQUEST_STATUSES.NEW,
  REQUEST_STATUSES.IN_PROGRESS,
  REQUEST_STATUSES.PROCESSED,
  REQUEST_STATUSES.CLOSED,
];

// ─── Request Types ───────────────────────────────────────────────────────────

export const REQUEST_TYPES = {
  REFUND: 'refund',
  RECOUPMENT: 'recoupment',
};

export const REQUEST_TYPE_LIST = [
  REQUEST_TYPES.REFUND,
  REQUEST_TYPES.RECOUPMENT,
];

// ─── Request Type Display Labels ─────────────────────────────────────────────

export const REQUEST_TYPE_LABELS = {
  [REQUEST_TYPES.REFUND]: 'Refund',
  [REQUEST_TYPES.RECOUPMENT]: 'Recoupment',
};

// ─── Report Types ────────────────────────────────────────────────────────────

export const REPORT_TYPES = {
  SUMMARY: 'summary',
  MONTHLY: 'monthly',
};

// ─── Status Transitions ─────────────────────────────────────────────────────

export const ALLOWED_STATUS_TRANSITIONS = {
  [REQUEST_STATUSES.NEW]: [REQUEST_STATUSES.IN_PROGRESS, REQUEST_STATUSES.CLOSED],
  [REQUEST_STATUSES.IN_PROGRESS]: [REQUEST_STATUSES.PROCESSED, REQUEST_STATUSES.CLOSED],
  [REQUEST_STATUSES.PROCESSED]: [REQUEST_STATUSES.CLOSED],
  [REQUEST_STATUSES.CLOSED]: [],
};

// ─── ID Prefixes ─────────────────────────────────────────────────────────────

export const ID_PREFIXES = {
  REQUEST: 'REQ-',
  MEMBER: 'M',
  PROVIDER: 'P',
  PAYMENT: 'PAY',
};

// ─── Default Seed Data ───────────────────────────────────────────────────────

export const SEED_MEMBERS = [
  { member_id: 'M001', member_name: 'John Smith' },
  { member_id: 'M002', member_name: 'Jane Doe' },
  { member_id: 'M003', member_name: 'Robert Johnson' },
  { member_id: 'M004', member_name: 'Emily Davis' },
  { member_id: 'M005', member_name: 'Michael Wilson' },
];

export const SEED_PROVIDERS = [
  { provider_id: 'P001', provider_name: 'City General Hospital' },
  { provider_id: 'P002', provider_name: 'Sunrise Medical Center' },
  { provider_id: 'P003', provider_name: 'Valley Health Clinic' },
  { provider_id: 'P004', provider_name: 'Lakeside Family Practice' },
  { provider_id: 'P005', provider_name: 'Metro Specialty Care' },
];

export const SEED_PAYMENTS = [
  { payment_id: 'PAY001', claim_id: 'CLM-1001', amount_paid: 250.00, payment_date: '2024-01-15T10:00:00Z' },
  { payment_id: 'PAY002', claim_id: 'CLM-1002', amount_paid: 475.50, payment_date: '2024-02-10T14:30:00Z' },
  { payment_id: 'PAY003', claim_id: 'CLM-1003', amount_paid: 120.75, payment_date: '2024-03-05T09:15:00Z' },
  { payment_id: 'PAY004', claim_id: 'CLM-1001', amount_paid: 300.00, payment_date: '2024-03-20T11:45:00Z' },
  { payment_id: 'PAY005', claim_id: 'CLM-1004', amount_paid: 890.25, payment_date: '2024-04-01T08:00:00Z' },
  { payment_id: 'PAY006', claim_id: 'CLM-1005', amount_paid: 150.00, payment_date: '2024-04-15T16:20:00Z' },
  { payment_id: 'PAY007', claim_id: 'CLM-1002', amount_paid: 200.00, payment_date: '2024-05-01T13:00:00Z' },
  { payment_id: 'PAY008', claim_id: 'CLM-1006', amount_paid: 550.00, payment_date: '2024-05-18T10:30:00Z' },
];

export const SEED_REQUESTS = [
  {
    request_id: 'REQ-001',
    request_type: REQUEST_TYPES.REFUND,
    member_id: 'M001',
    provider_id: 'P001',
    claim_id: 'CLM-1001',
    amount: 250.00,
    status: REQUEST_STATUSES.NEW,
    created_date: '2024-05-01T12:00:00Z',
    updated_date: '2024-05-01T12:00:00Z',
  },
  {
    request_id: 'REQ-002',
    request_type: REQUEST_TYPES.RECOUPMENT,
    member_id: 'M002',
    provider_id: 'P002',
    claim_id: 'CLM-1002',
    amount: 475.50,
    status: REQUEST_STATUSES.IN_PROGRESS,
    created_date: '2024-05-10T09:30:00Z',
    updated_date: '2024-05-12T14:00:00Z',
  },
  {
    request_id: 'REQ-003',
    request_type: REQUEST_TYPES.REFUND,
    member_id: 'M003',
    provider_id: 'P003',
    claim_id: 'CLM-1003',
    amount: 120.75,
    status: REQUEST_STATUSES.PROCESSED,
    created_date: '2024-04-15T08:00:00Z',
    updated_date: '2024-05-20T16:45:00Z',
  },
  {
    request_id: 'REQ-004',
    request_type: REQUEST_TYPES.RECOUPMENT,
    member_id: 'M004',
    provider_id: 'P004',
    claim_id: 'CLM-1004',
    amount: 890.25,
    status: REQUEST_STATUSES.CLOSED,
    created_date: '2024-03-01T11:00:00Z',
    updated_date: '2024-04-28T10:00:00Z',
  },
  {
    request_id: 'REQ-005',
    request_type: REQUEST_TYPES.REFUND,
    member_id: 'M005',
    provider_id: 'P005',
    claim_id: 'CLM-1005',
    amount: 150.00,
    status: REQUEST_STATUSES.NEW,
    created_date: '2024-06-01T07:30:00Z',
    updated_date: '2024-06-01T07:30:00Z',
  },
];

// ─── Validation Constants ────────────────────────────────────────────────────

export const VALIDATION = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99,
  CLAIM_ID_PATTERN: /^CLM-\d+$/,
};

// ─── Status Color Mapping (Tailwind classes) ─────────────────────────────────

export const STATUS_COLORS = {
  [REQUEST_STATUSES.NEW]: {
    bg: 'bg-primary-100',
    text: 'text-primary-700',
    dot: 'bg-primary-500',
  },
  [REQUEST_STATUSES.IN_PROGRESS]: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    dot: 'bg-warning-500',
  },
  [REQUEST_STATUSES.PROCESSED]: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    dot: 'bg-success-500',
  },
  [REQUEST_STATUSES.CLOSED]: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    dot: 'bg-neutral-500',
  },
};