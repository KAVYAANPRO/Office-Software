import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/tables/DataTable';
import { Lock } from 'lucide-react';
import { Can } from '../../lib/permissions/Can';

interface CostSheet {
  id: string;
  jobSlip: string;
  design: string;
  factory: string;
  acceptedQty: number;
  totalCost: number;
  costPerGarment: number;
  sellingRate: number;
  margin: number;
  marginPct: number;
  type: 'Provisional' | 'Final';
  date: string;
}

// TODO: Replace with API call — GET /api/v1/costing/cost-sheets
const mockCostSheets: CostSheet[] = [
  { id: '1', jobSlip: 'JS-24-099', design: 'DR-1024 — Summer Floral Dress', factory: 'Super Stitchers', acceptedQty: 290, totalCost: 271150, costPerGarment: 934.99, sellingRate: 1250, margin: 315.01, marginPct: 25.2, type: 'Final', date: '02-10-2026' },
  { id: '2', jobSlip: 'JS-24-100', design: 'KU-5501 — Cotton Block Print Kurti', factory: 'Precision Cutters', acceptedQty: 148, totalCost: 88800, costPerGarment: 600, sellingRate: 850, margin: 250, marginPct: 29.4, type: 'Provisional', date: '01-10-2026' },
  { id: '3', jobSlip: 'JS-24-101', design: 'DR-1024 — Summer Floral Dress', factory: 'Super Stitchers', acceptedQty: 0, totalCost: 0, costPerGarment: 0, sellingRate: 1250, margin: 0, marginPct: 0, type: 'Provisional', date: '—' },
];

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CostSheetList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CostSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setItems(mockCostSheets); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = items.filter(c =>
    c.jobSlip.toLowerCase().includes(search.toLowerCase()) ||
    c.design.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Job Slip', accessor: 'jobSlip' as keyof CostSheet },
    { header: 'Design', accessor: 'design' as keyof CostSheet },
    { header: 'Factory', accessor: 'factory' as keyof CostSheet },
    {
      header: 'Accepted Qty',
      accessor: (row: CostSheet) => (
        <span className="font-medium text-slate-900">{row.acceptedQty > 0 ? row.acceptedQty.toLocaleString('en-IN') + ' pcs' : '—'}</span>
      ),
    },
    {
      header: 'Total Cost',
      accessor: (row: CostSheet) => (
        <span className="font-semibold text-slate-900">{row.totalCost > 0 ? inr(row.totalCost) : '—'}</span>
      ),
    },
    {
      header: 'Cost / Garment',
      accessor: (row: CostSheet) => (
        <span className="font-semibold text-blue-700">{row.costPerGarment > 0 ? inr(row.costPerGarment) : '—'}</span>
      ),
    },
    {
      header: 'Margin',
      accessor: (row: CostSheet) => row.margin > 0 ? (
        <div>
          <span className={`font-semibold ${row.marginPct >= 20 ? 'text-green-700' : row.marginPct >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
            {inr(row.margin)} <span className="text-xs">({row.marginPct}%)</span>
          </span>
        </div>
      ) : <span className="text-slate-400">—</span>,
    },
    {
      header: 'Type',
      accessor: (row: CostSheet) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.type === 'Final' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>{row.type}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Cost Sheets</h1>
            <Lock size={16} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">Provisional and final cost sheets per job slip. Visible to authorised users only.</p>
        </div>
      </div>
      <Can
        perm="costing.view"
        fallback={
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            You don't have permission to view costing data.
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by job slip or design..."
          emptyMessage="No cost sheets found."
          onRowClick={(row: CostSheet) => navigate(`/costing/${row.id}`)}
        />
      </Can>
    </div>
  );
}
