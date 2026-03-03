import toast from 'react-hot-toast';

const MIN_MS = 2500;
const MS_PER_CHAR = 50;
const MAX_MS = 10000;

function calcDuration(text) {
  const len = typeof text === 'string' ? text.length : 60;
  return Math.min(MAX_MS, Math.max(MIN_MS, len * MS_PER_CHAR));
}

export function toastError(msgOrJsx, details) {
  if (details && details.length > 1) {
    const fullText = details.join(' ');
    toast.error(
      () => (
        <div className="text-sm space-y-1">
          {details.map((d, i) => (
            <div key={i}>{i < details.length - 1 ? `• ${d}` : d}</div>
          ))}
        </div>
      ),
      { duration: calcDuration(fullText) },
    );
  } else {
    const text = typeof msgOrJsx === 'string' ? msgOrJsx : '';
    toast.error(msgOrJsx, { duration: calcDuration(text) });
  }
}

export function toastSuccess(msg) {
  toast.success(msg, { duration: calcDuration(msg) });
}
