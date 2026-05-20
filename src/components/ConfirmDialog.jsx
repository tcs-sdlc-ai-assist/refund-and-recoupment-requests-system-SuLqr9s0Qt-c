import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable modal confirmation dialog for destructive or important actions.
 * Renders an accessible modal overlay with title, message, and confirm/cancel buttons.
 * Traps focus within the dialog when open and supports Escape key to cancel.
 * @param {Object} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is currently visible.
 * @param {string} props.title - The dialog title displayed at the top.
 * @param {string} props.message - The dialog message/body text.
 * @param {Function} props.onConfirm - Callback invoked when the confirm button is clicked.
 * @param {Function} props.onCancel - Callback invoked when the cancel button is clicked or the dialog is dismissed.
 * @param {string} [props.confirmLabel='Confirm'] - Label text for the confirm button.
 * @param {string} [props.cancelLabel='Cancel'] - Label text for the cancel button.
 * @param {boolean} [props.destructive=false] - Whether the confirm action is destructive (renders confirm button in danger color).
 * @returns {JSX.Element|null} The confirmation dialog element, or null if not open.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  destructive,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Focus the cancel button when the dialog opens
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    /**
     * Handles keydown events for Escape key dismissal and focus trapping.
     * @param {KeyboardEvent} event - The keyboard event.
     */
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll while dialog is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const confirmButtonClasses = destructive
    ? 'inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-danger-500 hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-2'
    : 'inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

  const cancelButtonClasses =
    'inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/50 transition-opacity"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative z-10 w-full max-w-md rounded-healthcare border border-neutral-200 bg-white p-6 shadow-card-hover mx-4"
      >
        {/* Icon */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
              destructive ? 'bg-danger-100' : 'bg-primary-100'
            }`}
          >
            {destructive ? (
              <svg
                className="h-5 w-5 text-danger-500"
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
            ) : (
              <svg
                className="h-5 w-5 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-neutral-800"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-message"
              className="mt-2 text-sm text-neutral-600"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            className={cancelButtonClasses}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmButtonClasses}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmDialog.propTypes = {
  /** Whether the dialog is currently visible. */
  isOpen: PropTypes.bool.isRequired,
  /** The dialog title displayed at the top. */
  title: PropTypes.string.isRequired,
  /** The dialog message/body text. */
  message: PropTypes.string.isRequired,
  /** Callback invoked when the confirm button is clicked. */
  onConfirm: PropTypes.func.isRequired,
  /** Callback invoked when the cancel button is clicked or the dialog is dismissed. */
  onCancel: PropTypes.func.isRequired,
  /** Label text for the confirm button. */
  confirmLabel: PropTypes.string,
  /** Label text for the cancel button. */
  cancelLabel: PropTypes.string,
  /** Whether the confirm action is destructive (renders confirm button in danger color). */
  destructive: PropTypes.bool,
};

ConfirmDialog.defaultProps = {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
};