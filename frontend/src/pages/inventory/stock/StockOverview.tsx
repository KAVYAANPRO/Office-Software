import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle } from 'lucide-react';

type StockLocation = 'Warehouse' | 'Factory Custody' | 'Quarantine' | 'Reserved' | 'Available (ATP)';

interface StockItem {
  id: string;
  material: string;
  variant: string;
  location: string;
  quantity: number;
  unit: string;
  lot: string;
  status: 'Available' | 'Reserved' | 'Low Stock' | 'Quarantine';
}

// TODO: Replace with API call — GET /api/v1/stock/raw?tab=...
const mockStock: Record<string, StockItem[]> = {
  'Warehouse': [
    { id: '1', material: 'Cotton Fabric', variant: 'Cotton Fabric — Navy Blue', location: 'Main Warehouse', quantity: 850, unit: 'm', lot: 'LOT-001', status: 'Available' },
    { id: '2', material: 'Cotton Fabric', variant: 'Cotton Fabric — Ivory White', location: 'Main Warehouse', quantity: 45, unit: 'm', lot: 'LOT-002', status: 'Low Stock' },
    { id: '3', material: 'Lining Cloth', variant: 'Lining Cloth — Black', location: 'Main Warehouse', quantity: 320, unit: 'm', lot: 'LOT-003', status: 'Available' },
    { id: '4', material: 'Buttons', variant: 'Buttons — White 12mm', location: 'Main Warehouse', quantity: 1200, unit: 'pcs', lot: 'LOT-004', status: 'Available' },
  ],
  'Factory Custody': [
    { id: '5', material: 'Cotton Fabric', variant: 'Cotton Fabric — Brick Red', location: 'Krishna Dyeing Works', quantity: 200, unit: 'm', lot: 'LOT-001', status: 'Reserved' },
    { id: '6', material: 'Lining Cloth', variant: 'Lining Cloth — Cream', location: 'Super Stitchers', quantity: 150, unit: 'm', lot: 'LOT-003', status: 'Reserved' },
  ],
  'Quarantine': [
    { id: '7', material: 'Cotton Fabric', variant: 'Cotton Fabric — Olive Green', location: 'Quarantine Bay A', quantity: 30, unit: 'm', lot: 'LOT-005', status: 'Quarantine' },
  ],
  'Reserved': [
    { id: '8', material: 'Cotton Fabric', variant: 'Cotton Fabric — Navy Blue', location: 'Main Warehouse', quantity: 100, unit: 'm', lot: 'LOT-001', status: 'Reserved' },
  ],
  'Available (ATP)': [
    { id: '1', material: 'Cotton Fabric', variant: 'Cotton Fabric — Navy Blue', location: 'Main Warehouse', quantity: 750, unit: 'm', lot: 'LOT-001', status: 'Available' },
    { id: '3', material: 'Lining Cloth', variant: 'Lining Cloth — Black', location: 'Main Warehouse', quantity: 320, unit: 'm', lot: 'LOT-003', status: 'Available' },
    { id: '4', material: 'Buttons', variant: 'Buttons — White 12mm', location: 'Main Warehouse', quantity: 1200, unit: 'pcs', lot: 'LOT-004', status: 'Available' },
  ],
};

const TABS: StockLocation[] = ['Warehouse', 'Factory Custody', 'Quarantine', 'Reserved', 'Available (ATP)'];

const statusBadge: Record<StockItem['status'], string> = {
  Available: 'bg-green-100 text-green-800',
  Reserved: 'bg-blue-100 text-blue-800',
  'Low Stock': 'bg-orange-100 text-orange-800',
  Quarantine: 'bg-red-100 text-red-800',
};

export function StockOverview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StockLocation>('Warehouse');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const items = (mockStock[activeTab] ?? []).filter(i =>
    i.material.toLowerCase().includes(search.toLowerCase()) ||
    i.variant.toLowerCase().includes(search.toLowerCase()) ||
    i.lot.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = mockStock['Warehouse'].filter(i => i.status === 'Low Stock').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raw Material Stock</h1>
          <p className="text-sm text-slate-500">View stock across warehouse, factory custody, quarantine, and reserved quantities.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/inventory/adjustments/new')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Stock Adjustment
          </button>
          <button
            onClick={() => navigate('/inventory/ledger')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Package size={16} />
            Stock Ledger
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{lowStockCount} material{lowStockCount > 1 ? 's' : ''}</span> in warehouse are below minimum stock level.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
            ].join(' ')}
          >
            {tab}
            <span className={[
              'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
              activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
            ].join(' ')}>
              {mockStock[tab]?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by material, variant, or lot..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Material Variant', 'Location', 'Lot', 'Quantity', 'Unit', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No stock found in this category.
                  </td>
                </tr>
              )
              : items.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/inventory/lots/${row.lot}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{row.variant}</div>
                      <div className="text-xs text-slate-500">{row.material}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.location}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{row.lot}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.quantity.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
