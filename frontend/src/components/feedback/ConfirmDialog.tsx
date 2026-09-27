import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  /** Short action title, e.g. "Confirm Invoice". */
  title: string;
  /**
   * The actual business impact, stated plainly (frontend.md §45):
   * "Confirm invoice and deduct 20 pieces from ready stock?" — never a bare
   * "Are you sure?".
   */
  impact: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  isLoading?: boolean;
  /** Disables the confirm button without affecting cancel — e.g. a required reason field is empty. */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  impact,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  isLoading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-slate-900">{title}</h2>
            <div className="text-sm text-slate-600 mt-1">{impact}</div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading} disabled={confirmDisabled}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
