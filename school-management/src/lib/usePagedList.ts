import { useMemo, useState } from 'react';

/**
 * Client-side search + pagination for an in-memory list. Every list screen
 * in the app shares this so behavior (page reset on search, page size) stays
 * consistent.
 */
export function usePagedList<T>(items: T[], matches: (item: T, query: string) => boolean, pageSize = 10) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((item) => matches(item, q));
  }, [items, search, matches]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return { search, setSearch: updateSearch, page, setPage, filtered, paged, pageSize };
}
