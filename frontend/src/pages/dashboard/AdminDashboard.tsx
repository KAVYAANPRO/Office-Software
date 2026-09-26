import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader } from '../../components/ui/Card';
import { 
  Package, 
  ShoppingBag, 
  Factory, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Clock
} from 'lucide-react';

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-muted">Welcome to the Admin Dashboard.</p>
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Raw Stock"
          value="12,500 m"
          icon={<Package size={20} />}
          isLoading={isLoading}
          trend={{ value: '500 m', isPositive: true, label: 'vs last week' }}
        />
        <KPICard
          title="Total Ready Stock"
          value="3,240 pcs"
          icon={<ShoppingBag size={20} />}
          isLoading={isLoading}
          trend={{ value: '120 pcs', isPositive: true, label: 'vs last week' }}
        />
        <KPICard
          title="Material with Factories"
          value="4,200 m"
          icon={<Factory size={20} />}
          isLoading={isLoading}
        />
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
          title="Production Completed"
          value="850 pcs"
          icon={<TrendingUp size={20} />}
          isLoading={isLoading}
          trend={{ value: '12%', isPositive: true, label: 'this month' }}
        />
        <KPICard
          title="Pending Payments"
          value="₹ 2,45,000"
          icon={<CreditCard size={20} />}
          isLoading={isLoading}
          trend={{ value: '₹ 15,000', isPositive: false, label: 'overdue' }}
        />
        <KPICard
          title="Alerts"
          value="3"
          icon={<AlertTriangle size={20} className="text-[var(--color-error)]" />}
          isLoading={isLoading}
          trend={{ value: 'Action Required', isPositive: false, label: 'Low stock & Shortage' }}
        />
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <CardHeader title="Recent Activity" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-border)] mt-2"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--color-border)] rounded w-3/4"></div>
                    <div className="h-3 bg-[var(--color-border)] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 border-b border-[var(--color-border)] pb-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)] mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Finished Goods Received</p>
                  <p className="text-xs text-muted">Job #JS-24-001 (50 pcs) received from Factory A</p>
                  <p className="text-xs text-muted mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-4 border-b border-[var(--color-border)] pb-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Material Issued</p>
                  <p className="text-xs text-muted">200 m Cotton Fabric issued to Artisan B</p>
                  <p className="text-xs text-muted mt-1">5 hours ago</p>
                </div>
              </div>
              <div className="flex gap-4 border-b border-[var(--color-border)] pb-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-warning)] mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Sales Order Confirmed</p>
                  <p className="text-xs text-muted">SO-24-105 confirmed for 120 pcs</p>
                  <p className="text-xs text-muted mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader title="Shortage & Low Stock Alerts" />
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
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Low Stock</p>
                  <p className="text-xs text-yellow-600">Cotton Fabric - Blue (Current: 50m, Min: 100m)</p>
                </div>
                <Button variant="outline" className="!bg-white !text-yellow-700 !border-yellow-200">Purchase</Button>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Low Stock</p>
                  <p className="text-xs text-yellow-600">Kurti D-1025 XL (Current: 5, Min: 20)</p>
                </div>
                <Button variant="outline" className="!bg-white !text-yellow-700 !border-yellow-200">Plan Job</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
