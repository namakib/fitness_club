import { ChevronUpIcon, ChevronDownIcon } from './Icons';
import t from '../theme';

export default function NumberInput({ label, value, onChange, step = 1, min, max, placeholder, ...props }) {
  const num = parseFloat(value);
  const stepNum = parseFloat(step) || 1;

  function increment() {
    const next = (Number.isNaN(num) ? 0 : num) + stepNum;
    onChange({ target: { value: max != null && next > max ? String(max) : String(next) } });
  }

  function decrement() {
    const next = (Number.isNaN(num) ? 0 : num) - stepNum;
    onChange({ target: { value: min != null && next < min ? String(min) : String(next) } });
  }

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <div className="relative flex">
        <input
          type="number"
          value={value}
          onChange={onChange}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          className={`${t.input} pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          {...props}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 py-0.5">
          <button
            type="button"
            onClick={increment}
            className="flex h-4 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200 transition"
            tabIndex={-1}
            aria-label="Increment"
          >
            <ChevronUpIcon className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={decrement}
            className="flex h-4 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200 transition"
            tabIndex={-1}
            aria-label="Decrement"
          >
            <ChevronDownIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
