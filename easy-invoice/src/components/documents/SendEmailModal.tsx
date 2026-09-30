import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Spinner } from "../ui/Spinner";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { isEmailSendingConfigured, sendEmailFunctionUrl } from "../../lib/firebase";
import { Mail, TriangleAlert } from "lucide-react";

export function SendEmailModal({
  open,
  onClose,
  defaultTo,
  defaultSubject,
  defaultBody,
}: {
  open: boolean;
  onClose: () => void;
  defaultTo: string;
  defaultSubject: string;
  defaultBody: string;
}) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  useEffect(() => {
    if (open) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
  }, [open, defaultTo, defaultSubject, defaultBody]);

  const send = useAsyncAction(
    async () => {
      if (!isEmailSendingConfigured) throw new Error("No email provider is configured for this account.");
      const res = await fetch(sendEmailFunctionUrl as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!res.ok) throw new Error("The email provider rejected the request.");
      onClose();
    },
    { successMessage: "Email sent." },
  );

  const openMailClient = () => {
    const params = new URLSearchParams({ subject, body });
    window.location.href = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
  };

  return (
    <Modal open={open} onClose={onClose} title="Send by email" maxWidth="max-w-lg">
      {!isEmailSendingConfigured && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No email provider is connected to this account, so Easy Invoice can't send this for you. Download the PDF and attach it in
            your own email app, or use "Open in email app" below to prefill a draft from your own address.
          </span>
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="field-label">To</label>
          <input className="field-input" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Subject</label>
          <input className="field-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Message</label>
          <textarea className="field-input" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-secondary" onClick={openMailClient}>
          <Mail className="h-4 w-4" /> Open in email app
        </button>
        {isEmailSendingConfigured && (
          <button className="btn-primary" onClick={() => send.run()} disabled={send.pending}>
            {send.pending && <Spinner className="h-4 w-4" />}
            Send email
          </button>
        )}
      </div>
    </Modal>
  );
}
