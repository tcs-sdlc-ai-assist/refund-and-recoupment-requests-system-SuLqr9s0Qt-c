import {
  REQUEST_TYPE_LIST,
  VALIDATION,
} from '../constants.js';

/**
 * Validation service for request data.
 * Provides field-level validation with descriptive error messages.
 */
const ValidationService = {
  /**
   * Validates request data for creating or updating a request.
   * @param {Object} requestData - The request data to validate.
   * @param {string} requestData.request_type - The type of request ('refund' or 'recoupment').
   * @param {string} requestData.member_id - The member ID associated with the request.
   * @param {string} [requestData.provider_id] - The provider ID associated with the request.
   * @param {string} [requestData.claim_id] - The claim ID associated with the request.
   * @param {number} requestData.amount - The monetary amount of the request.
   * @returns {{ isValid: boolean, errors: Object }} Validation result with field-level error messages.
   */
  validateRequestData(requestData) {
    const errors = {};

    // Validate request_type
    if (!requestData.request_type) {
      errors.request_type = 'Request type is required.';
    } else if (!REQUEST_TYPE_LIST.includes(requestData.request_type)) {
      errors.request_type = `Request type must be one of: ${REQUEST_TYPE_LIST.join(', ')}.`;
    }

    // Validate member_id
    if (!requestData.member_id) {
      errors.member_id = 'Member ID is required.';
    } else if (typeof requestData.member_id !== 'string' || requestData.member_id.trim() === '') {
      errors.member_id = 'Member ID must be a non-empty string.';
    }

    // Validate provider_id (required if provided, must be non-empty string)
    if (requestData.provider_id !== undefined && requestData.provider_id !== null) {
      if (typeof requestData.provider_id !== 'string' || requestData.provider_id.trim() === '') {
        errors.provider_id = 'Provider ID must be a non-empty string.';
      }
    }

    // Validate claim_id format if provided
    if (requestData.claim_id !== undefined && requestData.claim_id !== null && requestData.claim_id !== '') {
      if (typeof requestData.claim_id !== 'string') {
        errors.claim_id = 'Claim ID must be a string.';
      } else if (!VALIDATION.CLAIM_ID_PATTERN.test(requestData.claim_id)) {
        errors.claim_id = 'Claim ID must follow the format CLM-<number> (e.g., CLM-1001).';
      }
    }

    // Validate amount
    if (requestData.amount === undefined || requestData.amount === null || requestData.amount === '') {
      errors.amount = 'Amount is required.';
    } else {
      const numericAmount = Number(requestData.amount);
      if (isNaN(numericAmount)) {
        errors.amount = 'Amount must be a valid number.';
      } else if (numericAmount < VALIDATION.MIN_AMOUNT) {
        errors.amount = `Amount must be greater than 0.`;
      } else if (numericAmount > VALIDATION.MAX_AMOUNT) {
        errors.amount = `Amount must not exceed ${VALIDATION.MAX_AMOUNT.toLocaleString()}.`;
      }
    }

    const isValid = Object.keys(errors).length === 0;

    return { isValid, errors };
  },
};

export default ValidationService;