import React from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useI18n } from '../i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// In-app replacement for window.confirm: focus-trapped, Escape-to-cancel,
// glass styling consistent with the rest of the app.
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useI18n();
  const dialogRef = useFocusTrap<HTMLDivElement>(open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-sm bg-white dark:bg-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-ink dark:text-white mb-1">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-ink dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {cancelLabel || t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              destructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-500'
            }`}
          >
            {confirmLabel || t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
