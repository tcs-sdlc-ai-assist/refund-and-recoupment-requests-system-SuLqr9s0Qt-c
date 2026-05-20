import { useState, useCallback } from 'react';
import ReportChart from '../components/ReportChart.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import ReportingService from '../services/reportingService.js';
import { formatCurrency } from '../utils/formatters.js';
import { REQUEST_STATUSES, REQUEST_TYPES, REQUEST_TYPE_LABELS } from '../constants.js';

/**
 * Reports and analytics page component.
 * Provides a report type dropdown (Summary Report, Monthly Report, Status Breakdown, Type Breakdown).
 * On Generate Report click, fetches data from ReportingService and displays results
 * in a table/metrics format using ReportChart. Includes date range selector for monthly reports.
 * @returns {JSX.Element} The reports page element.
 */
export default function Reports() {
  const [reportType, setReportType] = useState('summary');
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartTitle, setChartTitle] = useState('');
  const [chartType, setChartType] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const reportTypeOptions = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'status_breakdown', label: 'Status Breakdown' },
    { value: 'type_breakdown', label: 'Type Breakdown' },
  ];

  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  /**
   * Generates year options for the year dropdown.
   * Provides a range from 2020 to the current year + 1.
   * @returns {Array<{value: string, label: string}>} Array of year option objects.
   */
  function getYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= 2020; y--) {
      years.push({ value: String(y), label: String(y) });
    }
    return years;
  }

  /**
   * Builds chart data for a summary report from the summary metrics.
   * @param {Object} metrics - The summary metrics from ReportingService.
   * @returns {Array<Object>} Array of chart data items.
   */
  function buildSummaryChartData(metrics) {
    return [
      { label: 'Total Requests', value: metrics.totalRequests, format: 'number', color: 'bg-primary-500' },
      { label: 'Total Refund Amount', value: metrics.totalRefundAmount, format: 'currency', color: 'bg-success-500' },
      { label: 'Total Recoupment Amount', value: metrics.totalRecoupmentAmount, format: 'currency', color: 'bg-warning-500' },
      { label: 'Total Amount Paid', value: metrics.totalAmountPaid, format: 'currency', color: 'bg-secondary-500' },
      { label: 'Average Amount', value: metrics.averageAmount, format: 'currency', color: 'bg-primary-400' },
      { label: 'Total Payments', value: metrics.totalPayments, format: 'number', color: 'bg-secondary-400' },
    ];
  }

  /**
   * Builds chart data for a status breakdown report from the summary metrics.
   * @param {Object} metrics - The summary metrics from ReportingService.
   * @returns {Array<Object>} Array of chart data items.
   */
  function buildStatusBreakdownChartData(metrics) {
    return [
      { label: REQUEST_STATUSES.NEW, value: metrics.countByStatus[REQUEST_STATUSES.NEW] || 0, format: 'number', color: 'bg-primary-500' },
      { label: REQUEST_STATUSES.IN_PROGRESS, value: metrics.countByStatus[REQUEST_STATUSES.IN_PROGRESS] || 0, format: 'number', color: 'bg-warning-500' },
      { label: REQUEST_STATUSES.PROCESSED, value: metrics.countByStatus[REQUEST_STATUSES.PROCESSED] || 0, format: 'number', color: 'bg-success-500' },
      { label: REQUEST_STATUSES.CLOSED, value: metrics.countByStatus[REQUEST_STATUSES.CLOSED] || 0, format: 'number', color: 'bg-neutral-500' },
    ];
  }

  /**
   * Builds chart data for a type breakdown report from the summary metrics.
   * @param {Object} metrics - The summary metrics from ReportingService.
   * @returns {Array<Object>} Array of chart data items.
   */
  function buildTypeBreakdownChartData(metrics) {
    return [
      { label: REQUEST_TYPE_LABELS[REQUEST_TYPES.REFUND] || 'Refund', value: metrics.countByType[REQUEST_TYPES.REFUND] || 0, format: 'number', color: 'bg-primary-500' },
      { label: REQUEST_TYPE_LABELS[REQUEST_TYPES.RECOUPMENT] || 'Recoupment', value: metrics.countByType[REQUEST_TYPES.RECOUPMENT] || 0, format: 'number', color: 'bg-secondary-500' },
    ];
  }

  /**
   * Builds chart data for a monthly report from the monthly report data.
   * @param {Object} monthlyData - The monthly report from ReportingService.
   * @returns {Array<Object>} Array of chart data items.
   */
  function buildMonthlyChartData(monthlyData) {
    return [
      { label: 'Total Requests', value: monthlyData.totalRequests, format: 'number', color: 'bg-primary-500' },
      { label: 'Refund Amount', value: monthlyData.totalRefundAmount, format: 'currency', color: 'bg-success-500' },
      { label: 'Recoupment Amount', value: monthlyData.totalRecoupmentAmount, format: 'currency', color: 'bg-warning-500' },
      { label: 'Amount Paid', value: monthlyData.totalAmountPaid, format: 'currency', color: 'bg-secondary-500' },
      { label: 'Total Payments', value: monthlyData.totalPayments, format: 'number', color: 'bg-secondary-400' },
    ];
  }

  /**
   * Returns the month name for a given month number (1-12).
   * @param {number} month - The month number.
   * @returns {string} The month name.
   */
  function getMonthName(month) {
    const option = monthOptions.find((m) => m.value === String(month));
    return option ? option.label : String(month);
  }

  /**
   * Handles the Generate Report button click.
   * Fetches data from ReportingService based on the selected report type
   * and builds chart data for display.
   */
  const handleGenerateReport = useCallback(() => {
    setLoading(true);
    setError('');
    setGenerated(false);

    try {
      if (reportType === 'summary') {
        const metrics = ReportingService.getSummaryMetrics();
        setReportData(metrics);
        setChartData(buildSummaryChartData(metrics));
        setChartTitle('Summary Report');
        setChartType('summary');
      } else if (reportType === 'monthly') {
        const year = Number(reportYear);
        const month = Number(reportMonth);

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          setError('Please select a valid year and month.');
          setLoading(false);
          return;
        }

        const monthlyData = ReportingService.getMonthlyReport(year, month);
        setReportData(monthlyData);
        setChartData(buildMonthlyChartData(monthlyData));
        setChartTitle(`Monthly Report — ${getMonthName(month)} ${year}`);
        setChartType('monthly');
      } else if (reportType === 'status_breakdown') {
        const metrics = ReportingService.getSummaryMetrics();
        setReportData(metrics);
        setChartData(buildStatusBreakdownChartData(metrics));
        setChartTitle('Status Breakdown');
        setChartType('summary');
      } else if (reportType === 'type_breakdown') {
        const metrics = ReportingService.getSummaryMetrics();
        setReportData(metrics);
        setChartData(buildTypeBreakdownChartData(metrics));
        setChartTitle('Type Breakdown');
        setChartType('summary');
      }

      setGenerated(true);
    } catch (e) {
      console.error('Reports: Failed to generate report.', e);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [reportType, reportYear, reportMonth]);

  /**
   * Handles the Clear button click to reset the report form and results.
   */
  function handleClear() {
    setReportType('summary');
    setReportYear(String(new Date().getFullYear()));
    setReportMonth(String(new Date().getMonth() + 1));
    setReportData(null);
    setChartData([]);
    setChartTitle('');
    setGenerated(false);
    setError('');
  }

  const inputClasses =
    'block w-full rounded-healthcare border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0';

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-neutral-800">Reports</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Generate and view reports for refund and recoupment request activity.
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

      {/* Report configuration panel */}
      <div className="rounded-healthcare border border-neutral-200 bg-white p-5 shadow-card">
        <h3 className="mb-4 text-lg font-semibold text-neutral-800">Report Configuration</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Report Type */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="report-type"
              className="block text-sm font-medium text-neutral-700"
            >
              Report Type
            </label>
            <select
              id="report-type"
              name="report_type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={inputClasses}
            >
              {reportTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year (visible for monthly report) */}
          {reportType === 'monthly' && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="report-year"
                className="block text-sm font-medium text-neutral-700"
              >
                Year
              </label>
              <select
                id="report-year"
                name="report_year"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className={inputClasses}
              >
                {getYearOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month (visible for monthly report) */}
          {reportType === 'monthly' && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="report-month"
                className="block text-sm font-medium text-neutral-700"
              >
                Month
              </label>
              <select
                id="report-month"
                name="report_month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className={inputClasses}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            type="button"
            className="inline-flex items-center justify-center rounded-healthcare px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={handleGenerateReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="mr-1.5 h-4 w-4 animate-spin"
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
                Generating...
              </>
            ) : (
              <>
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
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report results */}
      {generated && reportData && (
        <div className="flex flex-col gap-6">
          {/* Summary metrics cards */}
          {(reportType === 'summary' || reportType === 'monthly') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Total Requests
                </p>
                <p className="mt-1 text-xl font-semibold text-primary-600">
                  {reportData.totalRequests}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Refund Amount
                </p>
                <p className="mt-1 text-xl font-semibold text-success-600">
                  {formatCurrency(reportData.totalRefundAmount)}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Recoupment Amount
                </p>
                <p className="mt-1 text-xl font-semibold text-warning-600">
                  {formatCurrency(reportData.totalRecoupmentAmount)}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Amount Paid
                </p>
                <p className="mt-1 text-xl font-semibold text-secondary-600">
                  {formatCurrency(reportData.totalAmountPaid)}
                </p>
              </div>
            </div>
          )}

          {/* Status breakdown cards for summary and monthly */}
          {(reportType === 'summary' || reportType === 'monthly') && reportData.countByStatus && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">New</p>
                <p className="mt-1 text-xl font-semibold text-primary-600">
                  {reportData.countByStatus[REQUEST_STATUSES.NEW] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">In Progress</p>
                <p className="mt-1 text-xl font-semibold text-warning-600">
                  {reportData.countByStatus[REQUEST_STATUSES.IN_PROGRESS] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Processed</p>
                <p className="mt-1 text-xl font-semibold text-success-600">
                  {reportData.countByStatus[REQUEST_STATUSES.PROCESSED] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Closed</p>
                <p className="mt-1 text-xl font-semibold text-neutral-600">
                  {reportData.countByStatus[REQUEST_STATUSES.CLOSED] || 0}
                </p>
              </div>
            </div>
          )}

          {/* Type breakdown cards for status_breakdown */}
          {reportType === 'status_breakdown' && reportData.countByStatus && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">New</p>
                <p className="mt-1 text-xl font-semibold text-primary-600">
                  {reportData.countByStatus[REQUEST_STATUSES.NEW] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">In Progress</p>
                <p className="mt-1 text-xl font-semibold text-warning-600">
                  {reportData.countByStatus[REQUEST_STATUSES.IN_PROGRESS] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Processed</p>
                <p className="mt-1 text-xl font-semibold text-success-600">
                  {reportData.countByStatus[REQUEST_STATUSES.PROCESSED] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Closed</p>
                <p className="mt-1 text-xl font-semibold text-neutral-600">
                  {reportData.countByStatus[REQUEST_STATUSES.CLOSED] || 0}
                </p>
              </div>
            </div>
          )}

          {/* Type breakdown cards for type_breakdown */}
          {reportType === 'type_breakdown' && reportData.countByType && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Refund Requests</p>
                <p className="mt-1 text-xl font-semibold text-primary-600">
                  {reportData.countByType[REQUEST_TYPES.REFUND] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Recoupment Requests</p>
                <p className="mt-1 text-xl font-semibold text-secondary-600">
                  {reportData.countByType[REQUEST_TYPES.RECOUPMENT] || 0}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Total Refund Amount</p>
                <p className="mt-1 text-xl font-semibold text-success-600">
                  {formatCurrency(reportData.totalRefundAmount)}
                </p>
              </div>
              <div className="rounded-healthcare border border-neutral-200 bg-white p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Total Recoupment Amount</p>
                <p className="mt-1 text-xl font-semibold text-warning-600">
                  {formatCurrency(reportData.totalRecoupmentAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Chart visualization */}
          <ReportChart
            data={chartData}
            title={chartTitle}
            type={chartType}
          />

          {/* Detailed data table for monthly reports */}
          {reportType === 'monthly' && reportData.requests && reportData.requests.length > 0 && (
            <div className="rounded-healthcare border border-neutral-200 bg-white shadow-card">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                  Requests in {getMonthName(Number(reportMonth))} {reportYear}
                </h3>
              </div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {reportData.requests.map((request) => (
                      <tr key={request.request_id} className="hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-primary-600">
                          {request.request_id || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                          {REQUEST_TYPE_LABELS[request.request_type] || request.request_type || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700 text-right">
                          {formatCurrency(request.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                          {request.status || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed payments table for monthly reports */}
          {reportType === 'monthly' && reportData.payments && reportData.payments.length > 0 && (
            <div className="rounded-healthcare border border-neutral-200 bg-white shadow-card">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                  Payments in {getMonthName(Number(reportMonth))} {reportYear}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        Payment ID
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        Claim ID
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        Amount Paid
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {reportData.payments.map((payment) => (
                      <tr key={payment.payment_id} className="hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-primary-600">
                          {payment.payment_id || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700">
                          {payment.claim_id || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700 text-right">
                          {formatCurrency(payment.amount_paid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no report has been generated */}
      {!generated && !loading && (
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
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-neutral-600">No report generated</p>
          <p className="mt-1 text-sm text-neutral-400">
            Select a report type and click &quot;Generate Report&quot; to view analytics.
          </p>
        </div>
      )}
    </div>
  );
}