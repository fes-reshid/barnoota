import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface PageTitleContextValue {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | undefined>(undefined);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Dashboard');
  return <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>;
}

export function usePageTitle(title: string): void {
  const ctx = useContext(PageTitleContext);
  if (!ctx) throw new Error('usePageTitle must be used within a PageTitleProvider');
  useEffect(() => {
    ctx.setTitle(title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
}

export function usePageTitleValue(): string {
  const ctx = useContext(PageTitleContext);
  if (!ctx) throw new Error('usePageTitleValue must be used within a PageTitleProvider');
  return ctx.title;
}
