import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader } from '../../components/ui/Card';
import {
  ShoppingBag,
  PackageOpen,
  PackageCheck,
  ArrowRight,
} from 'lucide-react';

interface DesignStock {
  design: string;
  stock: string;
}

const DESIGN_WISE_STOCK: DesignStock[] = [
  { design: 'Kurti D-1025', stock: '85 pcs' },
  { design: 'Top D-1540', stock: '60 pcs' },
  { design: 'Dress D-2031', stock: '42 pcs' },
  { design: 'Kurti D-1102', stock: '15 pcs' },
];

export function PackingDashboardHome() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
          <h1 className="text-2xl font-bold">Packing Dashboard</h1>
          <p className="text-muted">Track ready stock, packing progress, and design-wise stock.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/ready-stock/packing')}>
          Go to Packing Worklist <ArrowRight size={16} />
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ready Stock"
          value="3,240 pcs"
          icon={<ShoppingBag size={20} />}
          isLoading={isLoading}
          trend={{ value: '120 pcs', isPositive: true, label: 'vs last week' }}
        />
        <KPICard
          title="Pending Packing"
          value="410 pcs"
          icon={<PackageOpen size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Packed Quantity"
          value="2,830 pcs"
          icon={<PackageCheck size={20} />}
          isLoading={isLoading}
          trend={{ value: '9%', isPositive: true, label: 'this month' }}
        />
      </div>

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
                <p className="text-sm font-semibold">{d.stock}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
