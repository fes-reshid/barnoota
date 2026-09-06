import { useState } from 'react';
import { Loader2, Paperclip } from 'lucide-react';
import { resolveFileUrl } from '@/lib/fileStorage';
import { useToast } from './Toast';

interface FileLinkProps {
  url: string;
  name: string;
  className?: string;
}

/**
 * A clickable file reference that works for both a real Firebase Storage
 * download URL and a demo-mode `idb://` reference — resolving the latter
 * to a fresh object URL just before opening it.
 */
export function FileLink({ url, name, className }: FileLinkProps) {
  const [opening, setOpening] = useState(false);
  const { showToast } = useToast();

  async function handleClick() {
    setOpening(true);
    try {
      const resolved = await resolveFileUrl(url);
      window.open(resolved, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open this file.', 'error');
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={opening}
      className={className ?? 'flex w-fit items-center gap-1 text-xs font-medium text-brand-700 hover:underline disabled:opacity-60'}
    >
      {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
      {name}
    </button>
  );
}
