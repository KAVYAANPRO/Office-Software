import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Requirement {
  id: string;
  reqNo: string;
  design: string;
  colour: string;
  size: string;
  quantity: number;
  plannedDate: string;
  status: 'Draft' | 'Stock OK' | 'Shortfall' | 'In Production';
}

// TODO: Replace with API call — GET /api/v1/production/requirements
const mockRequirements: Requirement[] = [
  { id: '1', reqNo: 'PR-001', design: 'DR-1024 Summer Floral Dress', colour: 'Navy Blue', size: 'All Sizes', quantity: 100, plannedDate: '10-10-2026', status: 'Stock OK' },
  { id: '2', reqNo: 'PR-002', design: 'KU-5501 Cotton Block Print Kurti', colour: 'Ivory White', size: 'M, L', quantity: 50, plannedDate: '15-10-2026', status: 'Shortfall' },
  { id: '3', reqNo: 'PR-003', design: 'DR-1024 Summer Floral Dress', colour: 'Ivory White', size: 'S, M', quantity: 30, plannedDate: '20-10-2026', status: 'Draft' },
];

const statusColors: Record<Requirement['status'], string> = {
  Draft: 'bg-slate-100 text-slate-600',
  'Stock OK': 'bg-green-100 text-green-800',
  Shortfall: 'bg-red-100 text-red-800',
  'In Production': 'bg-blue-100 text-blue-800',
};

export function ProductionRequirementList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setItems(mockRequirements); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = items.filter(r =>
    r.reqNo.toLowerCase().includes(search.toLowerCase()) ||
    r.design.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Req. No.', accessor: 'reqNo' as keyof Requirement },
    {
      header: 'Design',
      accessor: (row: Requirement) => (
        <div>
          <div className="text-sm font-medium text-slate-900">{row.design}</div>
          <div className="text-xs text-slate-500">{row.colour} · {row.size}</div>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: (row: Requirement) => (
        <span className="font-semibold text-slate-900">{row.quantity.toLocaleString('en-IN')} pcs</span>
      ),
    },
    { header: 'Planned Date', accessor: 'plannedDate' as keyof Requirement },
    {
      header: 'Status',
      accessor: (row: Requirement) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status]}`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Requirements</h1>
          <p className="text-sm text-slate-500">Plan production runs and verify stock availability before starting.</p>
        </div>
        <Button onClick={() => navigate('/production/requirements/new')}>
          <Plus size={16} /> New Requirement
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by requirement no. or design..."
        emptyMessage="No production requirements found."
        onRowClick={(row: Requirement) => navigate(`/production/requirements/${row.id}`)}
      />
    </div>
  );
}
