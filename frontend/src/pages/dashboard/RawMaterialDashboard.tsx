import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader } from '../../components/ui/Card';
import {
  Package,
  PackageMinus,
  Factory,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface LowStockItem {
  material: string;
  current: string;
  min: string;
}

const LOW_STOCK: LowStockItem[] = [
  { material: 'Cotton Fabric - Blue', current: '50 m', min: '100 m' },
  { material: 'Poly Thread - White', current: '12 kg', min: '30 kg' },
  { material: 'Elastic Band - 1"', current: '80 m', min: '150 m' },
];

export function RawMaterialDashboard() {
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
          <h1 className="text-2xl font-bold">Raw Material Dashboard</h1>
          <p className="text-muted">Track raw material stock, issues, and shortages.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Current Stock"
          value="12,500 m"
          icon={<Package size={20} />}
          isLoading={isLoading}
          trend={{ value: '500 m', isPositive: true, label: 'vs last week' }}
        />
        <KPICard
          title="Material Issued"
          value="2,340 m"
          icon={<PackageMinus size={20} />}
          isLoading={isLoading}
          trend={{ value: '180 m', isPositive: true, label: 'this week' }}
        />
        <KPICard
          title="Material with Factories"
          value="4,200 m"
          icon={<Factory size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Processed Material"
          value="3,150 m"
          icon={<CheckCircle2 size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Shortage"
          value="6%"
          icon={<AlertTriangle size={20} className="text-[var(--color-error)]" />}
          isLoading={isLoading}
          trend={{ value: 'Job JS-24-002', isPositive: false, label: 'Tolerance 3%' }}
        />
        <KPICard
          title="Low Stock Items"
          value={LOW_STOCK.length}
          icon={<AlertTriangle size={20} className="text-[var(--color-warning)]" />}
          isLoading={isLoading}
        />
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <CardHeader title="Shortage Alerts" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-red-50 border border-red-100 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-red-800">High Shortage Alert</p>
                  <p className="text-xs text-red-600">Job JS-24-002: Shortage 6% (Tolerance 3%)</p>
                </div>
                <Button variant="outline" className="!bg-white !text-red-700 !border-red-200">Review</Button>
              </div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-red-800">Shortage Alert</p>
                  <p className="text-xs text-red-600">Job JS-24-006: Shortage 4% (Tolerance 3%)</p>
                </div>
                <Button variant="outline" className="!bg-white !text-red-700 !border-red-200">Review</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader title="Low Stock Alerts" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {LOW_STOCK.map(item => (
                <div key={item.material} className="bg-yellow-50 border border-yellow-100 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Low Stock</p>
                    <p className="text-xs text-yellow-600">{item.material} (Current: {item.current}, Min: {item.min})</p>
                  </div>
                  <Button variant="outline" className="!bg-white !text-yellow-700 !border-yellow-200">Purchase</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
