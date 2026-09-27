import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Card, CardHeader } from '../../components/ui/Card';
import {
  ShoppingCart,
  Truck,
  Package,
  IndianRupee,
} from 'lucide-react';

interface RecentPurchase {
  id: string;
  supplier: string;
  material: string;
  amount: number;
  date: string;
}

interface PendingInward {
  id: string;
  supplier: string;
  material: string;
  qty: string;
  expected: string;
}

interface SupplierPurchase {
  supplier: string;
  amount: number;
}

const RECENT_PURCHASES: RecentPurchase[] = [
  { id: 'PO-24-118', supplier: 'Shree Textiles', material: 'Cotton Fabric', amount: 85000, date: '25-09-2026' },
  { id: 'PO-24-117', supplier: 'Anand Yarns', material: 'Poly Thread', amount: 32000, date: '23-09-2026' },
  { id: 'PO-24-116', supplier: 'Mahalaxmi Prints', material: 'Printed Fabric', amount: 128000, date: '20-09-2026' },
  { id: 'PO-24-115', supplier: 'Shree Textiles', material: 'Cotton Fabric', amount: 46000, date: '18-09-2026' },
];

const PENDING_INWARD: PendingInward[] = [
  { id: 'PO-24-118', supplier: 'Shree Textiles', material: 'Cotton Fabric', qty: '500 m', expected: '29-09-2026' },
  { id: 'PO-24-119', supplier: 'Anand Yarns', material: 'Poly Thread', qty: '200 kg', expected: '30-09-2026' },
  { id: 'PO-24-120', supplier: 'Om Dyeing Works', material: 'Dyed Fabric', qty: '350 m', expected: '02-10-2026' },
];

const SUPPLIER_PURCHASES: SupplierPurchase[] = [
  { supplier: 'Shree Textiles', amount: 452000 },
  { supplier: 'Mahalaxmi Prints', amount: 318000 },
  { supplier: 'Anand Yarns', amount: 164000 },
  { supplier: 'Om Dyeing Works', amount: 97000 },
];

export function PurchaseDashboard() {
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
          <h1 className="text-2xl font-bold">Purchase Dashboard</h1>
          <p className="text-muted">Manage supplier purchases and track pending inward.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Purchases (Month)"
          value={`₹ ${(1031000).toLocaleString('en-IN')}`}
          icon={<IndianRupee size={20} />}
          isLoading={isLoading}
          trend={{ value: '8%', isPositive: true, label: 'vs last month' }}
        />
        <KPICard
          title="Pending Inward"
          value={PENDING_INWARD.length}
          icon={<Truck size={20} />}
          isLoading={isLoading}
        />
        <KPICard
          title="Material Purchased"
          value="1,050 m"
          icon={<Package size={20} />}
          isLoading={isLoading}
          trend={{ value: '120 m', isPositive: true, label: 'vs last week' }}
        />
        <KPICard
          title="Open Purchase Orders"
          value="12"
          icon={<ShoppingCart size={20} />}
          isLoading={isLoading}
        />
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <CardHeader title="Recent Purchases" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {RECENT_PURCHASES.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{p.id} · {p.supplier}</p>
                    <p className="text-xs text-muted">{p.material} · {p.date}</p>
                  </div>
                  <p className="text-sm font-semibold">₹ {p.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="min-h-[300px]">
          <CardHeader title="Pending Inward" />
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-[var(--color-border)] rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {PENDING_INWARD.map(p => (
                <div key={p.id} className="bg-yellow-50 border border-yellow-100 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">{p.id} · {p.supplier}</p>
                    <p className="text-xs text-yellow-600">{p.material} · {p.qty} · Expected {p.expected}</p>
                  </div>
                  <Button variant="outline" className="!bg-white !text-yellow-700 !border-yellow-200">Track</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="min-h-[200px]">
        <CardHeader title="Supplier-wise Purchases" />
        {isLoading ? (
          <div className="animate-pulse flex flex-col gap-3 mt-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-[var(--color-border)] rounded w-full"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {SUPPLIER_PURCHASES.map((s, idx) => (
              <div key={s.supplier} className="flex justify-between items-center border-b border-[var(--color-border)] py-2 last:border-0">
                <p className="text-sm font-medium">{idx + 1}. {s.supplier}</p>
                <p className="text-sm font-semibold">₹ {s.amount.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
