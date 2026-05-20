import {
  REQUEST_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  STATUS_COLORS,
} from '../constants.js';

/**
 * General utility helper functions shared across components and services.
 */

/**
 * Generates a unique ID string with the given prefix and a timestamp-based suffix.
 * @param {string} prefix - The prefix for the generated ID (e.g., "REQ-", "M", "P").
 * @returns {string} A unique ID string (e.g., "REQ-1718901234567").
 */
export function generateId(prefix) {
  if (!prefix || typeof prefix !== 'string') {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Returns the current date and time as an ISO 8601 string.
 * @returns {string} The current date/time in ISO format (e.g., "2024-06-15T12:30:00.000Z").
 */
export function getCurrentDate() {
  return new Date().toISOString();
}

/**
 * Determines whether a request with the given status can be edited.
 * Requests with status "Processed" or "Closed" cannot be edited.
 * @param {string} status - The current status of the request.
 * @returns {boolean} True if the request can be edited, false otherwise.
 */
export function isEditableStatus(status) {
  if (!status || typeof status !== 'string') {
    return false;
  }

  if (status === REQUEST_STATUSES.PROCESSED || status === REQUEST_STATUSES.CLOSED) {
    return false;
  }

  // Check that the status has allowed transitions (meaning it's not a terminal state)
  const transitions = ALLOWED_STATUS_TRANSITIONS[status];
  if (!transitions || transitions.length === 0) {
    return false;
  }

  return true;
}

/**
 * Returns the Tailwind CSS color classes for a given request status.
 * @param {string} status - The request status string.
 * @returns {{ bg: string, text: string, dot: string }} An object containing Tailwind class strings for background, text, and dot colors.
 */
export function getStatusBadgeColor(status) {
  if (!status || typeof status !== 'string') {
    return {
      bg: 'bg-neutral-100',
      text: 'text-neutral-700',
      dot: 'bg-neutral-500',
    };
  }

  const colors = STATUS_COLORS[status];

  if (!colors) {
    return {
      bg: 'bg-neutral-100',
      text: 'text-neutral-700',
      dot: 'bg-neutral-500',
    };
  }

  return colors;
}

/**
 * Creates a debounced version of the provided function that delays invocation
 * until after `delay` milliseconds have elapsed since the last call.
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {Function} A debounced version of the provided function with a `cancel` method.
 */
export function debounce(fn, delay) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected the first argument to be a function.');
  }

  const numericDelay = Number(delay);
  const resolvedDelay = isNaN(numericDelay) || numericDelay < 0 ? 0 : numericDelay;

  let timerId = null;

  function debounced(...args) {
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      timerId = null;
      fn.apply(this, args);
    }, resolvedDelay);
  }

  /**
   * Cancels any pending debounced invocation.
   */
  debounced.cancel = function cancel() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}