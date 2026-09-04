import { Building2, ShieldCheck, Wallet, GraduationCap } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { schoolsRepo, usersRepo, studentsRepo } from '@/lib/services';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

export default function SuperAdminDashboard() {
  usePageTitle('System Overview');
  const { data: schools, loading: l1 } = useRepoList(schoolsRepo);
  const { data: users, loading: l2 } = useRepoList(usersRepo);
  const { data: students, loading: l3 } = useRepoList(studentsRepo);

  if (l1 || l2 || l3) return <Spinner />;

  const admins = users.filter((u) => u.role === 'school_admin' || u.role === 'super_admin');
  const activeSubs = schools.filter((s) => s.subscriptionStatus === 'active').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Schools" value={schools.length} icon={Building2} tone="brand" />
        <StatCard label="Administrators" value={admins.length} icon={ShieldCheck} tone="sky" />
        <StatCard label="Active subscriptions" value={activeSubs} icon={Wallet} tone="violet" />
        <StatCard label="Total students (all schools)" value={students.length} icon={GraduationCap} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Schools" subtitle="Every school registered on this platform" />
        <CardBody className="!p-0 divide-y divide-slate-100">
          {schools.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{s.name}</p>
                <p className="text-xs text-slate-500">{s.email} · {s.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="violet">{s.subscriptionPlan}</Badge>
                <Badge tone={s.subscriptionStatus === 'active' ? 'green' : 'rose'}>{s.subscriptionStatus}</Badge>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
