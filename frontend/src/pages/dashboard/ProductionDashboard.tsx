import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader } from '../../components/ui/Card';
import {
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  Factory,
  RotateCcw,
} from 'lucide-react';

interface OverdueJob {
  id: string;
  factory: string;
  daysOverdue: number;
}

interface ReconciliationJob {
  id: string;
  factory: string;
  issuedOn: string;
}

const OVERDUE_JOBS: OverdueJob[] = [
  { id: 'JS-24-002', factory: 'Factory A', daysOverdue: 4 },
  { id: 'JS-24-009', factory: 'Factory C', daysOverdue: 2 },
];

const RECONCILIATION_JOBS: ReconciliationJob[] = [
  { id: 'JS-24-011', factory: 'Factory B', issuedOn: '10-09-2026' },
  { id: 'JS-24-013', factory: 'Factory A', issuedOn: '15-09-2026' },
  { id: 'JS-24-014', factory: 'Factory D', issuedOn: '18-09-2026' },
];

export function ProductionDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Production Dashboard</h1>
          <p className="text-muted">Monitor job progress, overdue jobs, and reconciliation.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Jobs in Progress"
          value="15"
          icon={<Activity size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Pending Jobs"
          value="8"
          icon={<Clock size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Overdue Jobs"
          value={OVERDUE_JOBS.length}
          icon={<AlertTriangle size={20} className="text-[var(--color-error)]" />}
          isLoading={isLoading}
          trend={{ value: 'Action Required', isPositive: false, label: 'past due date' }}
        />
        <KPICard
          title="Production Completed"
          value="850 pcs"
          icon={<TrendingUp size={20} />}
          isLoading={isLoading}
          trend={{ value: '12%', isPositive: true, label: 'this month' }}
        />
        <KPICard
          title="Material with Factories"
          value="4,200 m"
          icon={<Factory size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Awaiting Reconciliation"
          value={RECONCILIATION_JOBS.length}
          icon={<RotateCcw size={20} />}
          isLoading={isLoading}
        />
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <CardHeader title="Overdue Jobs" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {OVERDUE_JOBS.map(job => (
                <div key={job.id} className="bg-red-50 border border-red-100 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-red-800">{job.id} · {job.factory}</p>
                    <p className="text-xs text-red-600">{job.daysOverdue} days overdue</p>
                  </div>
                  <Button variant="outline" className="!bg-white !text-red-700 !border-red-200">Follow Up</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader title="Jobs Awaiting Reconciliation" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {RECONCILIATION_JOBS.map(job => (
                <div key={job.id} className="flex justify-between items-center border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{job.id} · {job.factory}</p>
                    <p className="text-xs text-muted">Issued on {job.issuedOn}</p>
                  </div>
                  <Button variant="outline">Reconcile</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
