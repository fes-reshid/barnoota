import { useRef, useState } from "react";
import { useToast } from "../components/ui/Toast";

/**
 * Wraps an async action with a `pending` flag and re-entrancy guard, so a
 * button can disable itself while a request is in flight and never fire a
 * second submission from a double click or an eager tap on mobile. Errors
 * are surfaced as a toast by default.
 */
export function useAsyncAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<void>,
  options?: { successMessage?: string; onError?: (e: unknown) => void },
) {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const toast = useToast();

  const run = async (...args: Args) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      await action(...args);
      if (options?.successMessage) toast.success(options.successMessage);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      if (options?.onError) options.onError(e);
      else toast.error(message);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { run, pending };
}
