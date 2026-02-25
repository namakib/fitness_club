import { PlusIcon, MinusIcon } from './Icons';

export default function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder,
  helperText,
  required,
  ...props
}) {
  const num = parseFloat(value);
  const stepNum = parseFloat(step) || 1;

  function increment() {
    const next = (Number.isNaN(num) ? (min ?? 0) : num) + stepNum;
    const clamped = max != null && next > max ? max : next;
    onChange({ target: { value: String(clamped) } });
  }

  function decrement() {
    const next = (Number.isNaN(num) ? (min ?? 0) : num) - stepNum;
    const clamped = min != null && next < min ? min : next;
    onChange({ target: { value: String(clamped) } });
  }

  const displayValue = value === '' || value == null ? '' : value;
  const showMaxHelper = max != null && (helperText === undefined || helperText === '');

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700">
        <input
          type="number"
          value={displayValue}
          onChange={onChange}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          className="w-20 min-w-0 border-0 bg-transparent px-3 py-2 text-center text-sm text-gray-900 dark:text-gray-100 [appearance:textfield] focus:ring-0 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={label}
          {...props}
        />
        <div className="flex border-l border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={decrement}
            disabled={min != null && (Number.isNaN(num) ? min : num) <= min}
            className="flex h-full min-w-[2.5rem] items-center justify-center border-0 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition"
            aria-label="Decrement"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={increment}
            disabled={max != null && (Number.isNaN(num) ? max : num) >= max}
            className="flex h-full min-w-[2.5rem] items-center justify-center border-0 border-l border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition"
            aria-label="Increment"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {(helperText || showMaxHelper) && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText ?? (showMaxHelper ? `Maximum of ${max}` : null)}
        </p>
      )}
    </div>
  );
}
