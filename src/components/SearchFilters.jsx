import PropTypes from 'prop-types';

/**
 * Search filter panel component for the Search Requests page.
 * Includes inputs for Request ID, Member (dropdown), Status (dropdown),
 * Date Range (from/to). Exports filter values and provides Search and Clear buttons.
 * @param {Object} props - Component props.
 * @param {Object} props.filters - The current filter values.
 * @param {string} [props.filters.request_id] - Filter by request ID.
 * @param {string} [props.filters.member_id] - Filter by member ID.
 * @param {string} [props.filters.status] - Filter by request status.
 * @param {string} [props.filters.date_from] - Filter by created date from.
 * @param {string} [props.filters.date_to] - Filter by created date to.
 * @param {Function} props.onFilterChange - Callback invoked when a filter value changes. Receives the event.
 * @param {Function} props.onSearch - Callback invoked when the Search button is clicked.
 * @param {Function} props.onClear - Callback invoked when the Clear button is clicked.
 * @param {Array<Object>} [props.members] - Array of member objects for the member dropdown.
 * @param {Array<string>} [props.statuses] - Array of status strings for the status dropdown.
 * @returns {JSX.Element} The search filter panel element.
 */
export default function SearchFilters({
  filters,
  onFilterChange,
  onSearch,
  onClear,
  members,
  statuses,
}) {
  /**
   * Handles form submission to trigger search.
   * @param {React.FormEvent} event - The form submit event.
   */
  function handleSubmit(event) {
    event.preventDefault();
    if (typeof onSearch === 'function') {
      onSearch();
    }
  }

  /**
   * Handles the clear button click to reset all filters.
   */
  function handleClear() {
    if (typeof onClear === 'function') {
      onClear();
    }
  }

  const inputClasses =
    'block w-full rounded-healthcare border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0';

  return (
    <div className="rounded-healthcare border border-neutral-200 bg-white p-5 shadow-card">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Request ID */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-request_id"
              className="block text-sm font-medium text-neutral-700"
            >
              Request ID
            </label>
            <input
              id="filter-request_id"
              name="request_id"
              type="text"
              value={filters.request_id || ''}
              onChange={onFilterChange}
              placeholder="e.g. REQ-001"
              className={inputClasses}
            />
          </div>

          {/* Member */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-member_id"
              className="block text-sm font-medium text-neutral-700"
            >
              Member
            </label>
            <select
              id="filter-member_id"
              name="member_id"
              value={filters.member_id || ''}
              onChange={onFilterChange}
              className={inputClasses}
            >
              <option value="">All Members</option>
              {members &&
                members.map((member) => (
                  <option key={member.member_id} value={member.member_id}>
                    {member.member_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-status"
              className="block text-sm font-medium text-neutral-700"
            >
              Status
            </label>
            <select
              id="filter-status"
              name="status"
              value={filters.status || ''}
              onChange={onFilterChange}
              className={inputClasses}
            >
              <option value="">All Statuses</option>
              {statuses &&
                statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-date_from"
              className="block text-sm font-medium text-neutral-700"
            >
              Date From
            </label>
            <input
              id="filter-date_from"
              name="date_from"
              type="date"
              value={filters.date_from || ''}
              onChange={onFilterChange}
              className={inputClasses}
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-date_to"
              className="block text-sm font-medium text-neutral-700"
            >
              Date To
            </label>
            <input
              id="filter-date_to"
              name="date_to"
              type="date"
              value={filters.date_to || ''}
              onChange={onFilterChange}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            Search
          </button>
        </div>
      </form>
    </div>
  );
}

SearchFilters.propTypes = {
  /** The current filter values. */
  filters: PropTypes.shape({
    request_id: PropTypes.string,
    member_id: PropTypes.string,
    status: PropTypes.string,
    date_from: PropTypes.string,
    date_to: PropTypes.string,
  }).isRequired,
  /** Callback invoked when a filter value changes. Receives the event. */
  onFilterChange: PropTypes.func.isRequired,
  /** Callback invoked when the Search button is clicked. */
  onSearch: PropTypes.func.isRequired,
  /** Callback invoked when the Clear button is clicked. */
  onClear: PropTypes.func.isRequired,
  /** Array of member objects for the member dropdown. */
  members: PropTypes.arrayOf(
    PropTypes.shape({
      member_id: PropTypes.string.isRequired,
      member_name: PropTypes.string.isRequired,
    })
  ),
  /** Array of status strings for the status dropdown. */
  statuses: PropTypes.arrayOf(PropTypes.string),
};

SearchFilters.defaultProps = {
  members: [],
  statuses: [],
};