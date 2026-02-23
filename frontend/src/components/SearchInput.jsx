import t from '../theme';
import { SearchIcon } from './Icons';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        <SearchIcon className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${t.input} pl-9`}
      />
    </div>
  );
}
