import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { BaseRecord } from '@/types';
import type { Repository } from './repository';

/**
 * Loads every record for the current school from a repository, with
 * loading state and a `reload` callback for use after mutations.
 */
export function useRepoList<T extends BaseRecord>(repo: Repository<T>) {
  const { schoolId } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const items = await repo.list(schoolId);
      setData(items);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload, setData };
}
