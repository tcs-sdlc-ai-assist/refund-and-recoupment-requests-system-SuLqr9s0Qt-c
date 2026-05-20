import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable alert/notification component for success, error, warning, and info messages.
 * Supports auto-dismiss after a configurable timeout and manual dismissal via close button.
 * @param {Object} props - Component props.
 * @param {'success'|'error'|'warning'|'info'} [props.type='info'] - The type of alert, which determines the color scheme and icon.
 * @param {string} props.message - The alert message text to display.
 * @param {Function} [props.onDismiss] - Callback invoked when the alert is dismissed (either manually or via auto-dismiss).
 * @param {boolean} [props.autoDismiss=false] - Whether the alert should automatically dismiss after the timeout.
 * @param {number} [props.autoDismissTimeout=5000] - The auto-dismiss timeout in milliseconds.
 * @returns {JSX.Element|null} The alert message element, or null if no message is provided.
 */
export default function AlertMessage({
  type,
  message,
  onDismiss,
  autoDismiss,
  autoDismissTimeout,
}) {
  const timerRef = useRef(null);

  const handleDismiss = useCallback(() => {
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismiss && message) {
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, autoDismissTimeout);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoDismiss, autoDismissTimeout, message, handleDismiss]);

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return null;
  }

  /**
   * Returns the Tailwind CSS classes for the alert based on its type.
   * @returns {{ container: string, icon: string, text: string, closeButton: string }} Class strings for each part of the alert.
   */
  function getAlertClasses() {
    switch (type) {
      case 'success':
        return {
          container: 'bg-success-50 border-success-300',
          icon: 'text-success-500',
          text: 'text-success-700',
          closeButton: 'text-success-500 hover:bg-success-100 focus:ring-success-500',
        };
      case 'error':
        return {
          container: 'bg-danger-50 border-danger-300',
          icon: 'text-danger-500',
          text: 'text-danger-700',
          closeButton: 'text-danger-500 hover:bg-danger-100 focus:ring-danger-500',
        };
      case 'warning':
        return {
          container: 'bg-warning-50 border-warning-300',
          icon: 'text-warning-500',
          text: 'text-warning-700',
          closeButton: 'text-warning-500 hover:bg-warning-100 focus:ring-warning-500',
        };
      case 'info':
      default:
        return {
          container: 'bg-primary-50 border-primary-300',
          icon: 'text-primary-500',
          text: 'text-primary-700',
          closeButton: 'text-primary-500 hover:bg-primary-100 focus:ring-primary-500',
        };
    }
  }

  /**
   * Renders the appropriate icon SVG based on the alert type.
   * @param {string} className - Additional class names for the SVG element.
   * @returns {JSX.Element} The icon SVG element.
   */
  function renderIcon(className) {
    switch (type) {
      case 'success':
        return (
          <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        );
    }
  }

  const classes = getAlertClasses();

  return (
    <div
      className={`flex items-start gap-3 rounded-healthcare border p-4 shadow-card ${classes.container}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        {renderIcon(`h-5 w-5 ${classes.icon}`)}
      </div>
      <p className={`flex-1 text-sm font-medium ${classes.text}`}>
        {message}
      </p>
      {typeof onDismiss === 'function' && (
        <button
          type="button"
          className={`flex-shrink-0 rounded-healthcare p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${classes.closeButton}`}
          onClick={handleDismiss}
          aria-label="Dismiss alert"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

AlertMessage.propTypes = {
  /** The type of alert, which determines the color scheme and icon. */
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  /** The alert message text to display. */
  message: PropTypes.string.isRequired,
  /** Callback invoked when the alert is dismissed. */
  onDismiss: PropTypes.func,
  /** Whether the alert should automatically dismiss after the timeout. */
  autoDismiss: PropTypes.bool,
  /** The auto-dismiss timeout in milliseconds. */
  autoDismissTimeout: PropTypes.number,
};

AlertMessage.defaultProps = {
  type: 'info',
  onDismiss: null,
  autoDismiss: false,
  autoDismissTimeout: 5000,
};