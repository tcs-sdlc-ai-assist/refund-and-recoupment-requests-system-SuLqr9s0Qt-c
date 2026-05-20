import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard.jsx';
import RequestTable from '../components/RequestTable.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import ReportingService from '../services/reportingService.js';
import RequestRepository from '../services/requestRepository.js';
import MemberRepository from '../services/memberRepository.js';
import ProviderRepository from '../services/providerRepository.js';
import { formatCurrency } from '../utils/formatters.js';

/**
 * Main dashboard page component.
 * Displays summary metrics (total requests, total refund amount, total recoupment amount,
 * counts by status) using SummaryCard components. Includes quick action buttons for
 * Create Request, Search Requests, and Reports. Loads data from ReportingService on mount.
 * Shows a recent requests table.
 * @returns {JSX.Element} The dashboard page element.
 */
export default function Dashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const summaryMetrics = ReportingService.getSummaryMetrics();
      setMetrics(summaryMetrics);

      const allRequests = RequestRepository.getRequests();
      const sorted = [...allRequests].sort((a, b) => {
        const dateA = new Date(a.created_date);
        const dateB = new Date(b.created_date);
        return dateB - dateA;
      });
      setRecentRequests(sorted.slice(0, 5));

      setMembers(MemberRepository.getMembers());
      setProviders(ProviderRepository.getProviders());
    } catch (e) {
      console.error('Dashboard: Failed to load data.', e);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles row click on the recent requests table to navigate to request detail.
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
        <p className="mt-4 text-sm font-medium text-neutral-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-neutral-800">Dashboard</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Overview of refund and recoupment request activity.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <AlertMessage
          type="error"
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      {/* Summary metric cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Requests"
            value={metrics.totalRequests}
            icon={TotalRequestsIcon}
            colorClass="text-primary-500"
          />
          <SummaryCard
            title="Total Refund Amount"
            value={formatCurrency(metrics.totalRefundAmount)}
            icon={RefundIcon}
            colorClass="text-success-500"
          />
          <SummaryCard
            title="Total Recoupment Amount"
            value={formatCurrency(metrics.totalRecoupmentAmount)}
            icon={RecoupmentIcon}
            colorClass="text-warning-500"
          />
          <SummaryCard
            title="Total Amount Paid"
            value={formatCurrency(metrics.totalAmountPaid)}
            icon={PaymentsIcon}
            colorClass="text-secondary-500"
          />
        </div>
      )}

      {/* Status breakdown cards */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">New</p>
            <p className="mt-1 text-xl font-semibold text-primary-600">
              {metrics.countByStatus['New'] || 0}
            </p>
          </div>
          <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">In Progress</p>
            <p className="mt-1 text-xl font-semibold text-warning-600">
              {metrics.countByStatus['In Progress'] || 0}
            </p>
          </div>
          <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Processed</p>
            <p className="mt-1 text-xl font-semibold text-success-600">
              {metrics.countByStatus['Processed'] || 0}
            </p>
          </div>
          <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Closed</p>
            <p className="mt-1 text-xl font-semibold text-neutral-600">
              {metrics.countByStatus['Closed'] || 0}
            </p>
          </div>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="flex flex-wrap items-center gap-3">
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Request
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={() => navigate('/requests')}
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
          Search Requests
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors bg-white border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={() => navigate('/reports')}
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
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          Reports
        </button>
      </div>

      {/* Recent requests table */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-neutral-800">Recent Requests</h3>
        <RequestTable
          requests={recentRequests}
          onRowClick={handleRowClick}
          members={members}
          providers={providers}
        />
      </div>
    </div>
  );
}

/**
 * Total requests summary icon.
 * @param {Object} props - SVG element props.
 * @returns {JSX.Element}
 */
function TotalRequestsIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

/**
 * Refund amount summary icon.
 * @param {Object} props - SVG element props.
 * @returns {JSX.Element}
 */
function RefundIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

/**
 * Recoupment amount summary icon.
 * @param {Object} props - SVG element props.
 * @returns {JSX.Element}
 */
function RecoupmentIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Payments summary icon.
 * @param {Object} props - SVG element props.
 * @returns {JSX.Element}
 */
function PaymentsIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    </svg>
  );
}