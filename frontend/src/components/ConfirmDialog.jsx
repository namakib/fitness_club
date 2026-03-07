import Modal from './Modal';
import t from '../theme';

export default function ConfirmDialog({
  open,
  onClose,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default', // 'default' | 'danger'
  loading = false,
}) {
  const isDanger = variant === 'danger';

  async function handleConfirm() {
    if (typeof onConfirm === 'function') {
      try {
        await onConfirm();
      } catch {
        return;
      }
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {message && (
          <p className={`text-sm ${t.pageTextMuted}`}>{message}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={t.cancelButton}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={isDanger ? t.dangerButtonBg : t.btn}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
