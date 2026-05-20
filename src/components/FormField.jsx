import PropTypes from 'prop-types';

/**
 * Reusable form field wrapper component with label, input/select rendering,
 * and error message display. Supports text, number, select, and date input types.
 * @param {Object} props - Component props.
 * @param {string} props.label - The label text displayed above the input.
 * @param {string} props.name - The name attribute for the input element.
 * @param {string} [props.type='text'] - The input type: 'text', 'number', 'select', or 'date'.
 * @param {string|number} [props.value=''] - The current value of the input.
 * @param {Function} props.onChange - Callback invoked when the input value changes.
 * @param {string} [props.error] - Error message to display below the input.
 * @param {Array<{value: string, label: string}>} [props.options] - Options for select type inputs.
 * @param {boolean} [props.required=false] - Whether the field is required.
 * @param {boolean} [props.disabled=false] - Whether the field is disabled.
 * @param {string} [props.placeholder] - Placeholder text for the input.
 * @returns {JSX.Element} The form field element.
 */
export default function FormField({
  label,
  name,
  type,
  value,
  onChange,
  error,
  options,
  required,
  disabled,
  placeholder,
}) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const hasError = !!error;

  const baseInputClasses =
    'block w-full rounded-healthcare border px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500';

  const inputClasses = hasError
    ? `${baseInputClasses} border-danger-300 focus:border-danger-500 focus:ring-danger-500`
    : `${baseInputClasses} border-neutral-300 focus:border-primary-500 focus:ring-primary-500`;

  /**
   * Renders the appropriate input element based on the type prop.
   * @returns {JSX.Element} The input or select element.
   */
  function renderInput() {
    if (type === 'select') {
      return (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={hasError ? errorId : undefined}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options &&
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      );
    }

    return (
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClasses}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError ? errorId : undefined}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-neutral-700"
      >
        {label}
        {required && <span className="ml-0.5 text-danger-500">*</span>}
      </label>
      {renderInput()}
      {hasError && (
        <p id={errorId} className="text-xs text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

FormField.propTypes = {
  /** The label text displayed above the input. */
  label: PropTypes.string.isRequired,
  /** The name attribute for the input element. */
  name: PropTypes.string.isRequired,
  /** The input type: 'text', 'number', 'select', or 'date'. */
  type: PropTypes.oneOf(['text', 'number', 'select', 'date']),
  /** The current value of the input. */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Callback invoked when the input value changes. */
  onChange: PropTypes.func.isRequired,
  /** Error message to display below the input. */
  error: PropTypes.string,
  /** Options for select type inputs. */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  /** Whether the field is required. */
  required: PropTypes.bool,
  /** Whether the field is disabled. */
  disabled: PropTypes.bool,
  /** Placeholder text for the input. */
  placeholder: PropTypes.string,
};

FormField.defaultProps = {
  type: 'text',
  value: '',
  error: '',
  options: [],
  required: false,
  disabled: false,
  placeholder: '',
};