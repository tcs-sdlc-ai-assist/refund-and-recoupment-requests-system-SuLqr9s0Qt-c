import PropTypes from 'prop-types';
import { formatStatus } from '../utils/formatters.js';
import { getStatusBadgeColor } from '../utils/helpers.js';

/**
 * Small reusable component that renders a colored badge for request status.
 * New = blue, In Progress = yellow, Processed = green, Closed = gray.
 * @param {Object} props - Component props.
 * @param {string} props.status - The request status string to display.
 * @returns {JSX.Element} The status badge element.
 */
export default function StatusBadge({ status }) {
  const statusColors = getStatusBadgeColor(status);
  const displayStatus = formatStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
      {displayStatus}
    </span>
  );
}

StatusBadge.propTypes = {
  /** The request status string to display. */
  status: PropTypes.string.isRequired,
};