import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { schoolsRepo } from '@/lib/services';
import type { School } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const PLANS: School['subscriptionPlan'][] = ['trial', 'basic', 'standard', 'premium'];
const STATUSES: School['subscriptionStatus'][] = ['active', 'past_due', 'canceled'];

export default function SubscriptionsPage() {
  usePageTitle('Subscriptions');
  const { data: schools, loading, reload } = useRepoList(schoolsRepo);
  const { showToast } = useToast();

  async function updatePlan(school: School, plan: School['subscriptionPlan']) {
    await schoolsRepo.update(school.id, { subscriptionPlan: plan });
    showToast('Subscription plan updated.');
    reload();
  }

  async function updateStatus(school: School, status: School['subscriptionStatus']) {
    await schoolsRepo.update(school.id, { subscriptionStatus: status });
    showToast('Subscription status updated.');
    reload();
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {schools.map((school) => (
        <Card key={school.id}>
          <CardHeader title={school.name} subtitle={school.email}
            action={<Badge tone={school.subscriptionStatus === 'active' ? 'green' : school.subscriptionStatus === 'past_due' ? 'amber' : 'rose'}>{school.subscriptionStatus}</Badge>}
          />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="label">Plan</p>
              <select className="input" value={school.subscriptionPlan} onChange={(e) => updatePlan(school, e.target.value as School['subscriptionPlan'])}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p className="label">Status</p>
              <select className="input" value={school.subscriptionStatus} onChange={(e) => updateStatus(school, e.target.value as School['subscriptionStatus'])}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
