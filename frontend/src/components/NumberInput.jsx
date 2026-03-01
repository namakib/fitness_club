import { PlusIcon, MinusIcon } from './Icons';
import t from '../theme';

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
  fullWidth,
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
        <label className={`mb-1 block text-sm font-medium ${t.label}`}>
          {label}
          {required && <span className={`${t.requiredAsterisk} ml-0.5`}>*</span>}
        </label>
      )}
      <div className={`overflow-hidden ${fullWidth ? 'w-full flex' : 'inline-flex'} ${t.numberInputWrap}`}>
        <input
          type="number"
          value={displayValue}
          onChange={onChange}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          className={`min-w-0 flex-1 border-0 bg-transparent px-3 py-2 ${fullWidth ? 'text-left' : 'w-20 text-center'} text-sm ${t.pageText} [appearance:textfield] focus:ring-0 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          aria-label={label}
          {...props}
        />
        <div className={`flex border-l ${t.numberInputBorder}`}>
          <button
            type="button"
            onClick={decrement}
            disabled={min != null && (Number.isNaN(num) ? min : num) <= min}
            className={`flex h-full min-w-[2.5rem] items-center justify-center border-0 ${t.cardBg} ${t.numberInputButton} transition`}
            aria-label="Decrement"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={increment}
            disabled={max != null && (Number.isNaN(num) ? max : num) >= max}
            className={`flex h-full min-w-[2.5rem] items-center justify-center border-0 border-l ${t.numberInputBorder} ${t.cardBg} ${t.numberInputButton} transition`}
            aria-label="Increment"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {(helperText || showMaxHelper) && (
        <p className={`mt-1 text-xs ${t.pageTextMuted}`}>
          {helperText ?? (showMaxHelper ? `Maximum of ${max}` : null)}
        </p>
      )}
    </div>
  );
}
