import { useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  requireReason = false,
  reasonLabel = "Reason",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void> | void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) return null;

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm(requireReason ? reason : undefined);
      setReason("");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="text-sm text-ink-600">{description}</div>
      {requireReason && (
        <div className="mt-4">
          <label className="field-label">{reasonLabel}</label>
          <textarea className="field-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose} disabled={pending}>
          Cancel
        </button>
        <button
          className={danger ? "btn-danger" : "btn-primary"}
          onClick={handleConfirm}
          disabled={pending || (requireReason && !reason.trim())}
        >
          {pending && <Spinner className="h-4 w-4" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
