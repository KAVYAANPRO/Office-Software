import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';

interface Lot {
  id: string;
  lotNumber: string;
  material: string;
  variant: string;
  inwardDate: string;
  supplier: string;
  totalQty: number;
  remainingQty: number;
  unit: string;
  location: string;
  status: 'Active' | 'Exhausted' | 'Quarantine';
}

// TODO: Replace with API call — GET /api/v1/stock/lots
const mockLots: Lot[] = [
  { id: '1', lotNumber: 'LOT-001', material: 'Cotton Fabric', variant: 'Cotton Fabric — Navy Blue', inwardDate: '24-09-2026', supplier: 'Alpha Fabrics', totalQty: 1000, remainingQty: 800, unit: 'm', location: 'Main Warehouse', status: 'Active' },
  { id: '2', lotNumber: 'LOT-002', material: 'Cotton Fabric', variant: 'Cotton Fabric — Ivory White', inwardDate: '23-09-2026', supplier: 'Alpha Fabrics', totalQty: 200, remainingQty: 45, unit: 'm', location: 'Main Warehouse', status: 'Active' },
  { id: '3', lotNumber: 'LOT-003', material: 'Lining Cloth', variant: 'Lining Cloth — Black', inwardDate: '25-09-2026', supplier: 'Premium Trims Ltd', totalQty: 320, remainingQty: 320, unit: 'm', location: 'Main Warehouse', status: 'Active' },
  { id: '4', lotNumber: 'LOT-004', material: 'Buttons', variant: 'Buttons — White 12mm', inwardDate: '22-09-2026', supplier: 'Alpha Fabrics', totalQty: 1200, remainingQty: 1200, unit: 'pcs', location: 'Main Warehouse', status: 'Active' },
];

const statusColors: Record<Lot['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  Exhausted: 'bg-gray-100 text-gray-600',
  Quarantine: 'bg-red-100 text-red-800',
};

export function LotList() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setLots(mockLots); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = lots.filter(l =>
    l.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
    l.material.toLowerCase().includes(search.toLowerCase()) ||
    l.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Lot Number', accessor: 'lotNumber' as keyof Lot },
    {
      header: 'Material / Variant',
      accessor: (row: Lot) => (
        <div>
          <div className="text-sm font-medium text-slate-900">{row.variant}</div>
          <div className="text-xs text-slate-500">{row.supplier} · {row.inwardDate}</div>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: (row: Lot) => (
        <div className="text-sm">
          <span className="font-semibold text-slate-900">{row.remainingQty.toLocaleString('en-IN')}</span>
          <span className="text-slate-400"> / {row.totalQty.toLocaleString('en-IN')} {row.unit}</span>
        </div>
      ),
    },
    {
      header: 'Usage',
      accessor: (row: Lot) => {
        const pct = Math.round(((row.totalQty - row.remainingQty) / row.totalQty) * 100);
        return (
          <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-500">{pct}%</span>
          </div>
        );
      },
    },
    { header: 'Location', accessor: 'location' as keyof Lot },
    {
      header: 'Status',
      accessor: (row: Lot) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status]}`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lots</h1>
        <p className="text-sm text-slate-500">Track raw material lots. Each inward creates a traceable lot.</p>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by lot, material, or supplier..."
        emptyMessage="No lots found."
        onRowClick={(row: Lot) => navigate(`/inventory/lots/${row.lotNumber}`)}
      />
    </div>
  );
}
