import { useAuth } from '@/context/AuthContext';
import { useRepoList } from './useRepoList';
import { schoolsRepo } from './services';
import type { School } from '@/types';

/** The signed-in user's own school record, or null for a super admin
 * (who isn't scoped to one school) or while still loading. */
export function useMySchool(): { school: School | null; loading: boolean } {
  const { schoolId } = useAuth();
  const { data: schools, loading } = useRepoList(schoolsRepo);
  const school = schools.find((s) => s.id === schoolId) ?? null;
  return { school, loading };
}
