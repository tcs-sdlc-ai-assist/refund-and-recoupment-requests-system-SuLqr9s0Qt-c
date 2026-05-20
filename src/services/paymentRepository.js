import DataStore from './dataStore.js';
import { STORAGE_KEYS, ID_PREFIXES } from '../constants.js';

/**
 * Repository for PAYMENT entity data access.
 * Provides CRUD operations backed by localStorage via DataStore.
 */
const PaymentRepository = {
  /**
   * Retrieves all payments from localStorage.
   * @returns {Array<Object>} Array of payment objects.
   */
  getPayments() {
    return DataStore.getEntity(STORAGE_KEYS.PAYMENTS);
  },

  /**
   * Retrieves a single payment by its payment_id.
   * @param {string} paymentId - The payment ID to look up.
   * @returns {Object|null} The payment object, or null if not found.
   */
  getPaymentById(paymentId) {
    if (!paymentId || typeof paymentId !== 'string') {
      return null;
    }

    const payments = DataStore.getEntity(STORAGE_KEYS.PAYMENTS);
    const payment = payments.find((p) => p.payment_id === paymentId);
    return payment || null;
  },

  /**
   * Retrieves all payments associated with a given claim ID.
   * @param {string} claimId - The claim ID to filter by.
   * @returns {Array<Object>} Array of payment objects matching the claim ID.
   */
  getPaymentsByClaimId(claimId) {
    if (!claimId || typeof claimId !== 'string') {
      return [];
    }

    const payments = DataStore.getEntity(STORAGE_KEYS.PAYMENTS);
    return payments.filter((p) => p.claim_id === claimId);
  },

  /**
   * Creates a new payment and persists it to localStorage.
   * @param {Object} paymentData - The payment data to create.
   * @param {string} paymentData.claim_id - The claim ID associated with the payment.
   * @param {number} paymentData.amount_paid - The amount paid.
   * @param {string} [paymentData.payment_date] - The payment date (ISO string). Defaults to current time.
   * @returns {{ success: boolean, data?: Object, error?: string }} Result of the create operation.
   */
  createPayment(paymentData) {
    if (!paymentData || typeof paymentData !== 'object') {
      return { success: false, error: 'Payment data is required.' };
    }

    if (!paymentData.claim_id || typeof paymentData.claim_id !== 'string' || paymentData.claim_id.trim() === '') {
      return { success: false, error: 'Claim ID is required and must be a non-empty string.' };
    }

    if (paymentData.amount_paid === undefined || paymentData.amount_paid === null) {
      return { success: false, error: 'Amount paid is required.' };
    }

    const numericAmount = Number(paymentData.amount_paid);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { success: false, error: 'Amount paid must be a positive number.' };
    }

    const payments = DataStore.getEntity(STORAGE_KEYS.PAYMENTS);

    const nextId = this._generateNextId(payments);

    const newPayment = {
      payment_id: nextId,
      claim_id: paymentData.claim_id.trim(),
      amount_paid: numericAmount,
      payment_date: paymentData.payment_date || new Date().toISOString(),
    };

    payments.push(newPayment);

    const written = DataStore.setEntity(STORAGE_KEYS.PAYMENTS, payments);
    if (!written) {
      return { success: false, error: 'Failed to save payment to localStorage.' };
    }

    return { success: true, data: newPayment };
  },

  /**
   * Generates the next unique payment ID based on existing payments.
   * @param {Array<Object>} payments - The current array of payment objects.
   * @returns {string} The next payment ID (e.g., "PAY009").
   * @private
   */
  _generateNextId(payments) {
    const prefix = ID_PREFIXES.PAYMENT;
    let maxNum = 0;

    for (const payment of payments) {
      if (payment.payment_id && payment.payment_id.startsWith(prefix)) {
        const numPart = parseInt(payment.payment_id.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `${prefix}${padded}`;
  },
};

export default PaymentRepository;