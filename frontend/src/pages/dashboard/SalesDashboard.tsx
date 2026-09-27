import { useState, useEffect } from 'react';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader } from '../../components/ui/Card';
import {
  ShoppingCart,
  Users,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';

interface RecentSale {
  id: string;
  customer: string;
  amount: number;
  date: string;
}

interface SalesHistoryEntry {
  label: string;
  detail: string;
  date: string;
}

const RECENT_SALES: RecentSale[] = [
  { id: 'SO-24-105', customer: 'Radhika Garments', amount: 245000, date: '25-09-2026' },
  { id: 'SO-24-104', customer: 'Vishal Retail', amount: 98000, date: '23-09-2026' },
  { id: 'SO-24-103', customer: 'Sunrise Fashion', amount: 176000, date: '20-09-2026' },
  { id: 'SO-24-102', customer: 'Radhika Garments', amount: 62000, date: '17-09-2026' },
];

const SALES_HISTORY: SalesHistoryEntry[] = [
  { label: 'Sales Order Confirmed', detail: 'SO-24-105 confirmed for 120 pcs', date: '25-09-2026' },
  { label: 'Invoice Generated', detail: 'INV-24-089 for Vishal Retail', date: '23-09-2026' },
  { label: 'Payment Received', detail: '₹ 1,20,000 from Sunrise Fashion', date: '21-09-2026' },
  { label: 'Sales Order Confirmed', detail: 'SO-24-103 confirmed for 90 pcs', date: '20-09-2026' },
];

export function SalesDashboard() {
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
          <h1 className="text-2xl font-bold">Sales Dashboard</h1>
          <p className="text-muted">Track sales orders, customers, and pending payments.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Sales Orders"
          value="46"
          icon={<ShoppingCart size={20} />}
          isLoading={isLoading}
          trend={{ value: '6', isPositive: true, label: 'this month' }}
        />
        <KPICard
          title="Active Customers"
          value="28"
          icon={<Users size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Available Ready Stock"
          value="3,240 pcs"
          icon={<ShoppingBag size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Pending Payments"
          value={`₹ ${(245000).toLocaleString('en-IN')}`}
          icon={<CreditCard size={20} />}
          isLoading={isLoading}
          trend={{ value: '₹ 15,000', isPositive: false, label: 'overdue' }}
        />
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <CardHeader title="Recent Sales" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {RECENT_SALES.map(s => (
                <div key={s.id} className="flex justify-between items-center border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{s.id} · {s.customer}</p>
                    <p className="text-xs text-muted">{s.date}</p>
                  </div>
                  <p className="text-sm font-semibold">₹ {s.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader title="Sales History" />
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
              {SALES_HISTORY.map((entry, idx) => (
                <div key={idx} className="flex gap-4 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">{entry.label}</p>
                    <p className="text-xs text-muted">{entry.detail}</p>
                    <p className="text-xs text-muted mt-1">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
