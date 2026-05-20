import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilters from '../components/SearchFilters.jsx';
import RequestTable from '../components/RequestTable.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import RequestRepository from '../services/requestRepository.js';
import MemberRepository from '../services/memberRepository.js';
import ProviderRepository from '../services/providerRepository.js';
import { REQUEST_STATUS_LIST } from '../constants.js';

/**
 * Search and filter requests page component.
 * Renders a SearchFilters panel and RequestTable for results.
 * Loads all requests on mount, applies client-side filtering by Request ID,
 * Member, Status, and Date Range. Supports View/Edit navigation on row click.
 * Includes a Refresh button to reload data from localStorage.
 * @returns {JSX.Element} The search requests page element.
 */
export default function SearchRequests() {
  const navigate = useNavigate();

  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    request_id: '',
    member_id: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  /**
   * Loads all requests, members, and providers from localStorage.
   */
  const loadData = useCallback(() => {
    setLoading(true);
    setError('');

    try {
      const requests = RequestRepository.getRequests();
      const membersList = MemberRepository.getMembers();
      const providersList = ProviderRepository.getProviders();

      setAllRequests(requests);
      setMembers(membersList);
      setProviders(providersList);
    } catch (e) {
      console.error('SearchRequests: Failed to load data.', e);
      setError('Failed to load requests. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Applies the current filters to the full request list and updates filtered results.
   * @param {Array<Object>} requests - The full list of requests to filter.
   * @param {Object} currentFilters - The current filter values.
   * @returns {Array<Object>} The filtered list of requests.
   */
  const applyFilters = useCallback((requests, currentFilters) => {
    let results = [...requests];

    // Filter by request_id (case-insensitive partial match)
    if (currentFilters.request_id && currentFilters.request_id.trim() !== '') {
      const searchTerm = currentFilters.request_id.trim().toLowerCase();
      results = results.filter(
        (r) => r.request_id && r.request_id.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by member_id (exact match)
    if (currentFilters.member_id && currentFilters.member_id.trim() !== '') {
      results = results.filter((r) => r.member_id === currentFilters.member_id);
    }

    // Filter by status (exact match)
    if (currentFilters.status && currentFilters.status.trim() !== '') {
      results = results.filter((r) => r.status === currentFilters.status);
    }

    // Filter by date_from (created_date >= date_from)
    if (currentFilters.date_from && currentFilters.date_from.trim() !== '') {
      const fromDate = new Date(currentFilters.date_from);
      if (!isNaN(fromDate.getTime())) {
        results = results.filter((r) => {
          if (!r.created_date) return false;
          const createdDate = new Date(r.created_date);
          return !isNaN(createdDate.getTime()) && createdDate >= fromDate;
        });
      }
    }

    // Filter by date_to (created_date <= date_to end of day)
    if (currentFilters.date_to && currentFilters.date_to.trim() !== '') {
      const toDate = new Date(currentFilters.date_to);
      if (!isNaN(toDate.getTime())) {
        // Set to end of day to include the entire day
        toDate.setHours(23, 59, 59, 999);
        results = results.filter((r) => {
          if (!r.created_date) return false;
          const createdDate = new Date(r.created_date);
          return !isNaN(createdDate.getTime()) && createdDate <= toDate;
        });
      }
    }

    return results;
  }, []);

  // Apply filters whenever allRequests changes (initial load or refresh)
  useEffect(() => {
    const results = applyFilters(allRequests, filters);
    setFilteredRequests(results);
  }, [allRequests, applyFilters, filters]);

  /**
   * Handles changes to individual filter fields.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - The change event.
   */
  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /**
   * Handles the Search button click to apply current filters.
   */
  function handleSearch() {
    const results = applyFilters(allRequests, filters);
    setFilteredRequests(results);
  }

  /**
   * Handles the Clear button click to reset all filters and show all requests.
   */
  function handleClear() {
    const clearedFilters = {
      request_id: '',
      member_id: '',
      status: '',
      date_from: '',
      date_to: '',
    };
    setFilters(clearedFilters);
    setFilteredRequests([...allRequests]);
  }

  /**
   * Handles the Refresh button click to reload data from localStorage.
   */
  function handleRefresh() {
    loadData();
  }

  /**
   * Handles row click on the request table to navigate to the request detail/edit page.
   * @param {Object} request - The request object for the clicked row.
   */
  function handleRowClick(request) {
    if (request && request.request_id) {
      navigate(`/requests/${request.request_id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg
          className="h-10 w-10 animate-spin text-primary-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-neutral-600">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Search Requests</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Search and filter refund and recoupment requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={handleRefresh}
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
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => navigate('/requests/create')}
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create Request
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <AlertMessage
          type="error"
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      {/* Search filters panel */}
      <SearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={handleClear}
        members={members}
        statuses={REQUEST_STATUS_LIST}
      />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {filteredRequests.length === allRequests.length
            ? `Showing all ${allRequests.length} request${allRequests.length !== 1 ? 's' : ''}`
            : `Showing ${filteredRequests.length} of ${allRequests.length} request${allRequests.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Request results table */}
      <RequestTable
        requests={filteredRequests}
        onRowClick={handleRowClick}
        members={members}
        providers={providers}
      />
    </div>
  );
}