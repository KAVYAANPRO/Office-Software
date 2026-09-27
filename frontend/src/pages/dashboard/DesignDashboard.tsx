import { useState, useEffect } from 'react';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader } from '../../components/ui/Card';
import {
  Shirt,
  Sparkles,
} from 'lucide-react';

interface DesignStat {
  design: string;
  value: string;
}

const DESIGN_WISE_PRODUCTION: DesignStat[] = [
  { design: 'Kurti D-1025', value: '420 pcs' },
  { design: 'Dress D-2031', value: '310 pcs' },
  { design: 'Top D-1540', value: '265 pcs' },
  { design: 'Kurti D-1102', value: '198 pcs' },
];

const DESIGN_WISE_STOCK: DesignStat[] = [
  { design: 'Kurti D-1025', value: '85 pcs' },
  { design: 'Top D-1540', value: '60 pcs' },
  { design: 'Dress D-2031', value: '42 pcs' },
  { design: 'Kurti D-1102', value: '15 pcs' },
];

export function DesignDashboard() {
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
          <h1 className="text-2xl font-bold">Design Dashboard</h1>
          <p className="text-muted">Track designs, production and stock by design.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Designs"
          value="86"
          icon={<Shirt size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Active Designs"
          value="34"
          icon={<Sparkles size={20} />}
          isLoading={isLoading}
          trend={{ value: '4', isPositive: true, label: 'new this month' }}
        />
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <CardHeader title="Design-wise Production" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {DESIGN_WISE_PRODUCTION.map((d, idx) => (
                <div key={d.design} className="flex justify-between items-center border-b border-[var(--color-border)] py-2 last:border-0">
                  <p className="text-sm font-medium">{idx + 1}. {d.design}</p>
                  <p className="text-sm font-semibold">{d.value}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader title="Design-wise Stock" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {DESIGN_WISE_STOCK.map((d, idx) => (
                <div key={d.design} className="flex justify-between items-center border-b border-[var(--color-border)] py-2 last:border-0">
                  <p className="text-sm font-medium">{idx + 1}. {d.design}</p>
                  <p className="text-sm font-semibold">{d.value}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
