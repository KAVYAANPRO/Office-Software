import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Adjustment {
  id: string;
  date: string;
  item: string;
  lot: string;
  currentQty: number;
  adjustedQty: number;
  difference: number;
  unit: string;
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  createdBy: string;
}

// TODO: Replace with API call — GET /api/v1/stock/adjustments
const mockAdjustments: Adjustment[] = [
  { id: 'ADJ-001', date: '24-09-2026', item: 'Cotton Fabric — Navy Blue', lot: 'LOT-001', currentQty: 900, adjustedQty: 850, difference: -50, unit: 'm', reason: 'Physical count correction — weaving defect discovered', status: 'Approved', createdBy: 'Admin' },
  { id: 'ADJ-002', date: '25-09-2026', item: 'Lining Cloth — Black', lot: 'LOT-003', currentQty: 320, adjustedQty: 315, difference: -5, unit: 'm', reason: 'Damaged during shifting', status: 'Pending Approval', createdBy: 'Admin' },
  { id: 'ADJ-003', date: '26-09-2026', item: 'Buttons — White 12mm', lot: 'LOT-004', currentQty: 1200, adjustedQty: 1250, difference: 50, unit: 'pcs', reason: 'Recount — previous count was incorrect', status: 'Approved', createdBy: 'Admin' },
];

const statusColors: Record<Adjustment['status'], string> = {
  'Pending Approval': 'bg-yellow-100 text-yellow-800',
  'Approved': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
};

export function StockAdjustmentList() {
  const navigate = useNavigate();
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setAdjustments(mockAdjustments); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = adjustments.filter(a =>
    a.item.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Adj. ID', accessor: 'id' as keyof Adjustment },
    { header: 'Date', accessor: 'date' as keyof Adjustment },
    { header: 'Item', accessor: 'item' as keyof Adjustment },
    {
      header: 'Adjustment',
      accessor: (row: Adjustment) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">{row.currentQty.toLocaleString('en-IN')} {row.unit}</span>
          <span className="text-slate-400">→</span>
          <span className="font-semibold text-slate-900">{row.adjustedQty.toLocaleString('en-IN')} {row.unit}</span>
          <span className={`text-xs font-medium ${row.difference < 0 ? 'text-red-600' : 'text-green-600'}`}>
            ({row.difference > 0 ? '+' : ''}{row.difference} {row.unit})
          </span>
        </div>
      ),
    },
    { header: 'Reason', accessor: 'reason' as keyof Adjustment },
    {
      header: 'Status',
      accessor: (row: Adjustment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status]}`}>
          {row.status}
        </span>
      ),
    },
    { header: 'By', accessor: 'createdBy' as keyof Adjustment },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Adjustments</h1>
          <p className="text-sm text-slate-500">Record and track stock corrections. Large adjustments require approval.</p>
        </div>
        <Button onClick={() => navigate('/inventory/adjustments/new')}>
          <Plus size={16} /> New Adjustment
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search adjustments..."
        emptyMessage="No stock adjustments recorded yet."
        onRowClick={(row: Adjustment) => navigate(`/inventory/adjustments/${row.id}`)}
      />
    </div>
  );
}
