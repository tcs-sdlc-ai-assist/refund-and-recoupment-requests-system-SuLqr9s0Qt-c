import DataStore from './dataStore.js';
import ValidationService from './validationService.js';
import {
  STORAGE_KEYS,
  ID_PREFIXES,
  REQUEST_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
} from '../constants.js';

/**
 * Repository for REQUEST_MASTER entity data access and business logic.
 * Provides CRUD operations, search/filtering, and status management
 * backed by localStorage via DataStore.
 */
const RequestRepository = {
  /**
   * Retrieves all requests from localStorage.
   * @returns {Array<Object>} Array of request objects.
   */
  getRequests() {
    return DataStore.getEntity(STORAGE_KEYS.REQUESTS);
  },

  /**
   * Retrieves a single request by its request_id.
   * @param {string} requestId - The request ID to look up.
   * @returns {Object|null} The request object, or null if not found.
   */
  getRequestById(requestId) {
    if (!requestId || typeof requestId !== 'string') {
      return null;
    }

    const requests = DataStore.getEntity(STORAGE_KEYS.REQUESTS);
    const request = requests.find((r) => r.request_id === requestId);
    return request || null;
  },

  /**
   * Creates a new request and persists it to localStorage.
   * Validates input data using ValidationService before creation.
   * @param {Object} requestData - The request data to create.
   * @param {string} requestData.request_type - The type of request ('refund' or 'recoupment').
   * @param {string} requestData.member_id - The member ID associated with the request.
   * @param {string} [requestData.provider_id] - The provider ID associated with the request.
   * @param {string} [requestData.claim_id] - The claim ID associated with the request.
   * @param {number} requestData.amount - The monetary amount of the request.
   * @returns {{ success: boolean, data?: Object, error?: string, errors?: Object }} Result of the create operation.
   */
  createRequest(requestData) {
    if (!requestData || typeof requestData !== 'object') {
      return { success: false, error: 'Request data is required.' };
    }

    const validation = ValidationService.validateRequestData(requestData);
    if (!validation.isValid) {
      return { success: false, error: 'Validation failed.', errors: validation.errors };
    }

    const requests = DataStore.getEntity(STORAGE_KEYS.REQUESTS);
    const nextId = this._generateNextId(requests);
    const now = new Date().toISOString();

    const newRequest = {
      request_id: nextId,
      request_type: requestData.request_type,
      member_id: requestData.member_id.trim(),
      provider_id: requestData.provider_id ? requestData.provider_id.trim() : '',
      claim_id: requestData.claim_id ? requestData.claim_id.trim() : '',
      amount: Number(requestData.amount),
      status: REQUEST_STATUSES.NEW,
      created_date: now,
      updated_date: now,
    };

    requests.push(newRequest);

    const written = DataStore.setEntity(STORAGE_KEYS.REQUESTS, requests);
    if (!written) {
      return { success: false, error: 'Failed to save request to localStorage.' };
    }

    return { success: true, data: newRequest };
  },

  /**
   * Updates an existing request by request_id and persists changes to localStorage.
   * Cannot edit requests with status 'Processed' or 'Closed'.
   * @param {string} requestId - The ID of the request to update.
   * @param {Object} updateData - The fields to update.
   * @returns {{ success: boolean, data?: Object, error?: string, errors?: Object }} Result of the update operation.
   */
  updateRequest(requestId, updateData) {
    if (!requestId || typeof requestId !== 'string') {
      return { success: false, error: 'Request ID is required and must be a non-empty string.' };
    }

    if (!updateData || typeof updateData !== 'object') {
      return { success: false, error: 'Update data is required.' };
    }

    const requests = DataStore.getEntity(STORAGE_KEYS.REQUESTS);
    const index = requests.findIndex((r) => r.request_id === requestId);

    if (index === -1) {
      return { success: false, error: `Request with ID "${requestId}" not found.` };
    }

    const existingRequest = requests[index];

    // Cannot edit processed or closed requests
    if (existingRequest.status === REQUEST_STATUSES.PROCESSED || existingRequest.status === REQUEST_STATUSES.CLOSED) {
      return { success: false, error: `Cannot edit a request with status "${existingRequest.status}".` };
    }

    // Build merged data for validation (merge existing with updates, excluding status)
    const mergedData = {
      request_type: updateData.request_type !== undefined ? updateData.request_type : existingRequest.request_type,
      member_id: updateData.member_id !== undefined ? updateData.member_id : existingRequest.member_id,
      provider_id: updateData.provider_id !== undefined ? updateData.provider_id : existingRequest.provider_id,
      claim_id: updateData.claim_id !== undefined ? updateData.claim_id : existingRequest.claim_id,
      amount: updateData.amount !== undefined ? updateData.amount : existingRequest.amount,
    };

    const validation = ValidationService.validateRequestData(mergedData);
    if (!validation.isValid) {
      return { success: false, error: 'Validation failed.', errors: validation.errors };
    }

    // Apply updates
    if (updateData.request_type !== undefined) {
      requests[index].request_type = updateData.request_type;
    }
    if (updateData.member_id !== undefined) {
      requests[index].member_id = typeof updateData.member_id === 'string' ? updateData.member_id.trim() : updateData.member_id;
    }
    if (updateData.provider_id !== undefined) {
      requests[index].provider_id = typeof updateData.provider_id === 'string' ? updateData.provider_id.trim() : updateData.provider_id;
    }
    if (updateData.claim_id !== undefined) {
      requests[index].claim_id = typeof updateData.claim_id === 'string' ? updateData.claim_id.trim() : updateData.claim_id;
    }
    if (updateData.amount !== undefined) {
      requests[index].amount = Number(updateData.amount);
    }

    requests[index].updated_date = new Date().toISOString();

    const written = DataStore.setEntity(STORAGE_KEYS.REQUESTS, requests);
    if (!written) {
      return { success: false, error: 'Failed to save updated request to localStorage.' };
    }

    return { success: true, data: { ...requests[index] } };
  },

  /**
   * Deletes a request by request_id from localStorage.
   * Cannot delete requests with status 'Processed' or 'Closed'.
   * @param {string} requestId - The ID of the request to delete.
   * @returns {{ success: boolean, error?: string }} Result of the delete operation.
   */
  deleteRequest(requestId) {
    if (!requestId || typeof requestId !== 'string') {
      return { success: false, error: 'Request ID is required and must be a non-empty string.' };
    }

    const requests = DataStore.getEntity(STORAGE_KEYS.REQUESTS);
    const index = requests.findIndex((r) => r.request_id === requestId);

    if (index === -1) {
      return { success: false, error: `Request with ID "${requestId}" not found.` };
    }

    const existingRequest = requests[index];

    if (existingRequest.status === REQUEST_STATUSES.PROCESSED || existingRequest.status === REQUEST_STATUSES.CLOSED) {
      return { success: false, error: `Cannot delete a request with status "${existingRequest.status}".` };
    }

    requests.splice(index, 1);

    const written = DataStore.setEntity(STORAGE_KEYS.REQUESTS, requests);
    if (!written) {
      return { success: false, error: 'Failed to save changes to localStorage.' };
    }

    return { success: true };
  },

  /**
   * Searches and filters requests based on provided filter criteria.
   * @param {Object} filters - The filter criteria.
   * @param {string} [filters.status] - Filter by request status.
   * @param {string} [filters.request_type] - Filter by request type.
   * @param {string} [filters.member_id] - Filter by member ID.
   * @param {string} [filters.provider_id] - Filter by provider ID.
   * @param {string} [filters.claim_id] - Filter by claim ID.
   * @param {string} [filters.search] - Free-text search across request_id, claim_id, member_id, provider_id.
   * @param {string} [filters.date_from] - Filter by created_date >= date_from (ISO string).
   * @param {string} [filters.date_to] - Filter by created_date <= date_to (ISO string).
   * @returns {Array<Object>} Array of request objects matching the filter criteria.
   */
  searchRequests(filters) {
    let requests = DataStore.getEntity(STORAGE_KEYS.REQUESTS);

    if (!filters || typeof filters !== 'object') {
      return requests;
    }

    if (filters.status && typeof filters.status === 'string') {
      requests = requests.filter((r) => r.status === filters.status);
    }

    if (filters.request_type && typeof filters.request_type === 'string') {
      requests = requests.filter((r) => r.request_type === filters.request_type);
    }

    if (filters.member_id && typeof filters.member_id === 'string') {
      requests = requests.filter((r) => r.member_id === filters.member_id);
    }

    if (filters.provider_id && typeof filters.provider_id === 'string') {
      requests = requests.filter((r) => r.provider_id === filters.provider_id);
    }

    if (filters.claim_id && typeof filters.claim_id === 'string') {
      requests = requests.filter((r) => r.claim_id === filters.claim_id);
    }

    if (filters.date_from && typeof filters.date_from === 'string') {
      const fromDate = new Date(filters.date_from);
      if (!isNaN(fromDate.getTime())) {
        requests = requests.filter((r) => new Date(r.created_date) >= fromDate);
      }
    }

    if (filters.date_to && typeof filters.date_to === 'string') {
      const toDate = new Date(filters.date_to);
      if (!isNaN(toDate.getTime())) {
        requests = requests.filter((r) => new Date(r.created_date) <= toDate);
      }
    }

    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim().toLowerCase();
      requests = requests.filter((r) => {
        const searchableFields = [
          r.request_id,
          r.claim_id,
          r.member_id,
          r.provider_id,
          r.request_type,
          r.status,
        ];
        return searchableFields.some(
          (field) => field && typeof field === 'string' && field.toLowerCase().includes(searchTerm)
        );
      });
    }

    return requests;
  },

  /**
   * Changes the status of a request, enforcing allowed status transitions.
   * @param {string} requestId - The ID of the request to update.
   * @param {string} newStatus - The new status to set.
   * @returns {{ success: boolean, data?: Object, error?: string }} Result of the status change operation.
   */
  changeRequestStatus(requestId, newStatus) {
    if (!requestId || typeof requestId !== 'string') {
      return { success: false, error: 'Request ID is required and must be a non-empty string.' };
    }

    if (!newStatus || typeof newStatus !== 'string') {
      return { success: false, error: 'New status is required and must be a non-empty string.' };
    }

    const requests = DataStore.getEntity(STORAGE_KEYS.REQUESTS);
    const index = requests.findIndex((r) => r.request_id === requestId);

    if (index === -1) {
      return { success: false, error: `Request with ID "${requestId}" not found.` };
    }

    const currentStatus = requests[index].status;

    // Check if the transition is allowed
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions && allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}.`,
      };
    }

    requests[index].status = newStatus;
    requests[index].updated_date = new Date().toISOString();

    const written = DataStore.setEntity(STORAGE_KEYS.REQUESTS, requests);
    if (!written) {
      return { success: false, error: 'Failed to save status change to localStorage.' };
    }

    return { success: true, data: { ...requests[index] } };
  },

  /**
   * Generates the next unique request ID based on existing requests.
   * @param {Array<Object>} requests - The current array of request objects.
   * @returns {string} The next request ID (e.g., "REQ-006").
   * @private
   */
  _generateNextId(requests) {
    const prefix = ID_PREFIXES.REQUEST;
    let maxNum = 0;

    for (const request of requests) {
      if (request.request_id && request.request_id.startsWith(prefix)) {
        const numPart = parseInt(request.request_id.slice(prefix.length), 10);
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

export default RequestRepository;