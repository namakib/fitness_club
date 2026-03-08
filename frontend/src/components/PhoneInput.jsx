import { useState, useEffect } from 'react';
import t from '../theme';

/** Format digits to US/Canada: (XXX) XXX-XXXX */
function formatPhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length <= 3) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// eslint-disable-next-line react-refresh/only-export-components
export { formatPhone as formatPhoneDisplay };

export default function PhoneInput({ label, value, onChange, placeholder = '(555) 555-5555', required, className, ...props }) {
  const [display, setDisplay] = useState(() => formatPhone(value));

  useEffect(() => {
    const formatted = formatPhone(value);
    setDisplay(formatted);
  }, [value]);

  function handleChange(e) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    const formatted = formatPhone(digits);
    setDisplay(formatted);
    onChange({ target: { value: formatted } });
  }

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        maxLength={14}
        className={`${className || t.input} ${props.disabled ? 'bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : ''}`}
        {...props}
      />
    </div>
  );
}
