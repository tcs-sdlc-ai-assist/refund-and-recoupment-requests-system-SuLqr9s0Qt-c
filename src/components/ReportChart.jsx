import PropTypes from 'prop-types';
import { formatCurrency } from '../utils/formatters.js';

/**
 * Simple visual report display component that renders bar-style metrics using Tailwind CSS.
 * Displays monthly or summary data as horizontal bars with labels and values.
 * No external chart library required — uses pure Tailwind CSS for bar rendering.
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.data - Array of data items to display as bars.
 * @param {string} props.title - The title displayed above the chart.
 * @param {'summary'|'monthly'} [props.type='summary'] - The type of report chart to render.
 * @returns {JSX.Element} The report chart element.
 */
export default function ReportChart({ data, title, type }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-healthcare border border-neutral-200 bg-white p-6 shadow-card">
        {title && (
          <h3 className="mb-4 text-lg font-semibold text-neutral-800">{title}</h3>
        )}
        <div className="flex flex-col items-center justify-center py-8">
          <svg
            className="h-12 w-12 text-neutral-400"
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
          <p className="mt-4 text-sm font-medium text-neutral-600">No data available</p>
          <p className="mt-1 text-sm text-neutral-400">
            There is no report data to display at this time.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Computes the maximum value from the data array for calculating bar widths.
   * @returns {number} The maximum value, or 1 if all values are zero or invalid.
   */
  function getMaxValue() {
    let max = 0;
    for (const item of data) {
      const numericValue = Number(item.value);
      if (!isNaN(numericValue) && numericValue > max) {
        max = numericValue;
      }
    }
    return max > 0 ? max : 1;
  }

  /**
   * Calculates the bar width percentage relative to the maximum value.
   * @param {number|string} value - The value for this bar.
   * @param {number} maxValue - The maximum value across all bars.
   * @returns {number} The width percentage (0-100).
   */
  function getBarWidthPercent(value, maxValue) {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      return 0;
    }
    return Math.round((numericValue / maxValue) * 100);
  }

  /**
   * Returns the Tailwind CSS bar color class based on the item's color prop or index.
   * @param {Object} item - The data item.
   * @param {number} index - The index of the item in the data array.
   * @returns {string} The Tailwind CSS background color class for the bar.
   */
  function getBarColor(item, index) {
    if (item.color && typeof item.color === 'string') {
      return item.color;
    }

    const colors = [
      'bg-primary-500',
      'bg-secondary-500',
      'bg-success-500',
      'bg-warning-500',
      'bg-danger-500',
      'bg-primary-400',
      'bg-secondary-400',
      'bg-success-400',
      'bg-warning-400',
      'bg-danger-400',
    ];

    return colors[index % colors.length];
  }

  /**
   * Formats the display value based on the item's format property or the chart type.
   * @param {Object} item - The data item.
   * @returns {string} The formatted display value.
   */
  function formatDisplayValue(item) {
    if (item.format === 'currency') {
      return formatCurrency(item.value);
    }

    if (item.format === 'number') {
      const numericValue = Number(item.value);
      if (isNaN(numericValue)) {
        return '0';
      }
      return numericValue.toLocaleString('en-US');
    }

    if (type === 'summary') {
      const numericValue = Number(item.value);
      if (!isNaN(numericValue) && numericValue !== 0) {
        if (item.label && (item.label.toLowerCase().includes('amount') || item.label.toLowerCase().includes('paid'))) {
          return formatCurrency(item.value);
        }
        return numericValue.toLocaleString('en-US');
      }
    }

    if (type === 'monthly') {
      const numericValue = Number(item.value);
      if (!isNaN(numericValue) && numericValue !== 0) {
        if (item.label && (item.label.toLowerCase().includes('amount') || item.label.toLowerCase().includes('paid'))) {
          return formatCurrency(item.value);
        }
        return numericValue.toLocaleString('en-US');
      }
    }

    const numericValue = Number(item.value);
    if (!isNaN(numericValue)) {
      return numericValue.toLocaleString('en-US');
    }

    return String(item.value);
  }

  const maxValue = getMaxValue();

  return (
    <div className="rounded-healthcare border border-neutral-200 bg-white p-6 shadow-card">
      {title && (
        <h3 className="mb-6 text-lg font-semibold text-neutral-800">{title}</h3>
      )}
      <div className="flex flex-col gap-4">
        {data.map((item, index) => {
          const widthPercent = getBarWidthPercent(item.value, maxValue);
          const barColor = getBarColor(item, index);
          const displayValue = formatDisplayValue(item);

          return (
            <div key={item.label || index} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 truncate">
                  {item.label || '—'}
                </span>
                <span className="ml-2 flex-shrink-0 text-sm font-semibold text-neutral-800">
                  {displayValue}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                  style={{ width: `${widthPercent}%` }}
                  role="meter"
                  aria-valuenow={Number(item.value) || 0}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                  aria-label={`${item.label || 'Metric'}: ${displayValue}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {type === 'monthly' && (
        <div className="mt-6 flex items-center gap-4 border-t border-neutral-200 pt-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
            <span className="text-xs text-neutral-500">Refund</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-500" />
            <span className="text-xs text-neutral-500">Recoupment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
            <span className="text-xs text-neutral-500">Payments</span>
          </div>
        </div>
      )}
    </div>
  );
}

ReportChart.propTypes = {
  /** Array of data items to display as bars. Each item should have a label and value. */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      /** The label displayed for this bar. */
      label: PropTypes.string.isRequired,
      /** The numeric value for this bar. */
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      /** Optional Tailwind CSS background color class for the bar (e.g., "bg-primary-500"). */
      color: PropTypes.string,
      /** Optional format hint: 'currency' or 'number'. */
      format: PropTypes.oneOf(['currency', 'number']),
    })
  ).isRequired,
  /** The title displayed above the chart. */
  title: PropTypes.string,
  /** The type of report chart to render. */
  type: PropTypes.oneOf(['summary', 'monthly']),
};

ReportChart.defaultProps = {
  title: '',
  type: 'summary',
};