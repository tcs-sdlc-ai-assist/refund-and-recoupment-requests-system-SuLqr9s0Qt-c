import PropTypes from 'prop-types';

/**
 * Reusable summary card component displaying a metric label, value, and optional icon.
 * Used on the dashboard for total requests, refund amount, recoupment amount, etc.
 * @param {Object} props - Component props.
 * @param {string} props.title - The metric label displayed above the value.
 * @param {string|number} props.value - The metric value to display prominently.
 * @param {React.ComponentType} [props.icon] - Optional icon component to render alongside the metric.
 * @param {string} [props.colorClass] - Optional Tailwind color class string for accent styling (e.g., "text-primary-500").
 * @returns {JSX.Element} The summary card element.
 */
export default function SummaryCard({ title, value, icon: Icon, colorClass }) {
  const accentColor = colorClass || 'text-primary-500';

  return (
    <div className="rounded-healthcare border border-neutral-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 truncate">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${accentColor} truncate`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`ml-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-healthcare bg-neutral-50 ${accentColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  /** The metric label displayed above the value. */
  title: PropTypes.string.isRequired,
  /** The metric value to display prominently. */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Optional icon component to render alongside the metric. */
  icon: PropTypes.elementType,
  /** Optional Tailwind color class string for accent styling. */
  colorClass: PropTypes.string,
};

SummaryCard.defaultProps = {
  icon: null,
  colorClass: 'text-primary-500',
};