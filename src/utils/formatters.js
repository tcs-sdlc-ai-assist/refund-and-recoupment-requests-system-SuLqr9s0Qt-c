import { REQUEST_TYPE_LABELS } from '../constants.js';

/**
 * Utility functions for formatting display values.
 * Used across all UI components for consistent data presentation.
 */

/**
 * Formats a numeric amount as a US dollar currency string.
 * @param {number|string} amount - The monetary amount to format.
 * @returns {string} The formatted currency string (e.g., "$1,234.56"), or "$0.00" if invalid.
 */
export function formatCurrency(amount) {
  const numericAmount = Number(amount);

  if (isNaN(numericAmount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Formats an ISO date string into a human-readable date string.
 * @param {string} dateString - The ISO 8601 date string to format.
 * @param {Object} [options] - Optional Intl.DateTimeFormat options.
 * @returns {string} The formatted date string (e.g., "Jan 15, 2024"), or "—" if invalid.
 */
export function formatDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return '—';
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats a date string into a human-readable date and time string.
 * @param {string} dateString - The ISO 8601 date string to format.
 * @returns {string} The formatted date/time string (e.g., "Jan 15, 2024, 10:00 AM"), or "—" if invalid.
 */
export function formatDateTime(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return '—';
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a request ID for display purposes.
 * Returns the ID as-is if valid, or "—" if invalid.
 * @param {string} id - The request ID to format (e.g., "REQ-001").
 * @returns {string} The formatted request ID, or "—" if invalid.
 */
export function formatRequestId(id) {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return '—';
  }

  return id.trim();
}

/**
 * Formats a request status for display purposes.
 * Returns the status string as-is if valid, or "Unknown" if invalid.
 * @param {string} status - The status string to format.
 * @returns {string} The formatted status string, or "Unknown" if invalid.
 */
export function formatStatus(status) {
  if (!status || typeof status !== 'string' || status.trim() === '') {
    return 'Unknown';
  }

  return status.trim();
}

/**
 * Formats a request type key into its display label.
 * @param {string} requestType - The request type key (e.g., "refund", "recoupment").
 * @returns {string} The display label (e.g., "Refund", "Recoupment"), or "Unknown" if invalid.
 */
export function formatRequestType(requestType) {
  if (!requestType || typeof requestType !== 'string') {
    return 'Unknown';
  }

  return REQUEST_TYPE_LABELS[requestType] || 'Unknown';
}

/**
 * Formats a numeric value as a percentage string.
 * @param {number|string} value - The numeric value to format as a percentage.
 * @param {number} [decimals=1] - The number of decimal places.
 * @returns {string} The formatted percentage string (e.g., "45.5%"), or "0%" if invalid.
 */
export function formatPercentage(value, decimals = 1) {
  const numericValue = Number(value);

  if (isNaN(numericValue)) {
    return '0%';
  }

  return `${numericValue.toFixed(decimals)}%`;
}