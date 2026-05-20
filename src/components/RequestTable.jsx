import PropTypes from 'prop-types';
import { formatCurrency, formatDate, formatRequestType, formatStatus } from '../utils/formatters.js';
import { getStatusBadgeColor } from '../utils/helpers.js';

/**
 * Reusable table component for displaying request records.
 * Columns: Request ID, Type, Member, Provider, Amount, Status, Created Date.
 * Supports row click for view/edit navigation. Includes empty state message.
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.requests - Array of request objects to display.
 * @param {Function} [props.onRowClick] - Callback invoked with the request object when a row is clicked.
 * @param {Array<Object>} [props.members] - Array of member objects for resolving member names.
 * @param {Array<Object>} [props.providers] - Array of provider objects for resolving provider names.
 * @returns {JSX.Element} The request table element.
 */
export default function RequestTable({ requests, onRowClick, members, providers }) {
  /**
   * Resolves a member ID to the member's display name.
   * @param {string} memberId - The member ID to resolve.
   * @returns {string} The member name, or the raw ID if not found.
   */
  function getMemberName(memberId) {
    if (!memberId) return '—';
    if (!members || members.length === 0) return memberId;
    const member = members.find((m) => m.member_id === memberId);
    return member ? member.member_name : memberId;
  }

  /**
   * Resolves a provider ID to the provider's display name.
   * @param {string} providerId - The provider ID to resolve.
   * @returns {string} The provider name, or the raw ID if not found.
   */
  function getProviderName(providerId) {
    if (!providerId) return '—';
    if (!providers || providers.length === 0) return providerId;
    const provider = providers.find((p) => p.provider_id === providerId);
    return provider ? provider.provider_name : providerId;
  }

  /**
   * Handles a row click event, invoking the onRowClick callback if provided.
   * @param {Object} request - The request object for the clicked row.
   */
  function handleRowClick(request) {
    if (typeof onRowClick === 'function') {
      onRowClick(request);
    }
  }

  /**
   * Handles keyboard interaction on a row for accessibility.
   * @param {React.KeyboardEvent} event - The keyboard event.
   * @param {Object} request - The request object for the focused row.
   */
  function handleRowKeyDown(event, request) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(request);
    }
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="rounded-healthcare border border-neutral-200 bg-white p-8 text-center shadow-card">
        <svg
          className="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008h-.008V15zm-3 0h.008v.008H9.75V15zm0-3h.008v.008H9.75V12zm3 0h.008v.008h-.008V12zM5.625 5.25H9.75m-4.125 0A2.625 2.625 0 003 7.875v8.25A2.625 2.625 0 005.625 18.75h12.75A2.625 2.625 0 0021 16.125V7.875a2.625 2.625 0 00-2.625-2.625H5.625z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-neutral-600">No requests found</p>
        <p className="mt-1 text-sm text-neutral-400">
          There are no requests matching your criteria. Try adjusting your filters or create a new request.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-healthcare border border-neutral-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Request ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Member
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Provider
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Created Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {requests.map((request) => {
              const statusColors = getStatusBadgeColor(request.status);

              return (
                <tr
                  key={request.request_id}
                  className={`transition-colors hover:bg-neutral-50 ${
                    typeof onRowClick === 'function' ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => handleRowClick(request)}
                  onKeyDown={(e) => handleRowKeyDown(e, request)}
                  tabIndex={typeof onRowClick === 'function' ? 0 : undefined}
                  role={typeof onRowClick === 'function' ? 'button' : undefined}
                  aria-label={
                    typeof onRowClick === 'function'
                      ? `View request ${request.request_id}`
                      : undefined
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-primary-600">
                    {request.request_id || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                    {formatRequestType(request.request_type)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                    {getMemberName(request.member_id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                    {getProviderName(request.provider_id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700 text-right">
                    {formatCurrency(request.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
                      {formatStatus(request.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-500">
                    {formatDate(request.created_date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

RequestTable.propTypes = {
  /** Array of request objects to display in the table. */
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      request_id: PropTypes.string,
      request_type: PropTypes.string,
      member_id: PropTypes.string,
      provider_id: PropTypes.string,
      amount: PropTypes.number,
      status: PropTypes.string,
      created_date: PropTypes.string,
    })
  ),
  /** Callback invoked with the request object when a row is clicked. */
  onRowClick: PropTypes.func,
  /** Array of member objects for resolving member names. */
  members: PropTypes.arrayOf(
    PropTypes.shape({
      member_id: PropTypes.string,
      member_name: PropTypes.string,
    })
  ),
  /** Array of provider objects for resolving provider names. */
  providers: PropTypes.arrayOf(
    PropTypes.shape({
      provider_id: PropTypes.string,
      provider_name: PropTypes.string,
    })
  ),
};

RequestTable.defaultProps = {
  requests: [],
  onRowClick: null,
  members: [],
  providers: [],
};