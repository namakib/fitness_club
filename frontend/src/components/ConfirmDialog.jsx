import Modal from './Modal';

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
      await onConfirm();
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={
              isDanger
                ? 'rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 transition disabled:opacity-50'
                : 'rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50 transition dark:bg-orange-500 dark:hover:bg-orange-400'
            }
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
