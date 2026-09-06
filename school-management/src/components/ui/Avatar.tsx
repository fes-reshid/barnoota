import { useEffect, useState } from 'react';
import { resolveFileUrl } from '@/lib/fileStorage';

interface AvatarProps {
  photoUrl?: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'brand' | 'sky';
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
};

const TONES: Record<NonNullable<AvatarProps['tone']>, string> = {
  brand: 'bg-brand-100 text-brand-700',
  sky: 'bg-sky-100 text-sky-700',
};

// A photoUrl can be a real Storage download URL (usable directly as <img
// src>) or, in demo mode, an `idb://` reference that first needs resolving
// to an object URL from IndexedDB.
export function Avatar({ photoUrl, initials, size = 'sm', tone = 'brand' }: AvatarProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(
    photoUrl && !photoUrl.startsWith('idb://') ? photoUrl : undefined,
  );

  useEffect(() => {
    if (!photoUrl || !photoUrl.startsWith('idb://')) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    resolveFileUrl(photoUrl)
      .then((url) => {
        if (cancelled) return;
        objectUrl = url;
        setResolvedSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoUrl]);

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={initials} className={`${SIZES[size]} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${TONES[tone]}`}>
      {initials}
    </div>
  );
}
