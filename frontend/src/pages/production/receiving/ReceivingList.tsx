import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Receiving {
  id: string;
  recNo: string;
  date: string;
  jobSlip: string;
  factory: string;
  design: string;
  expected: number;
  accepted: number;
  rejected: number;
  status: 'Draft' | 'Confirmed';
}

// TODO: Replace with API call — GET /api/v1/production/receiving
const mockReceiving: Receiving[] = [
  { id: '1', recNo: 'RCV-001', date: '28-09-2026', jobSlip: 'JS-24-099', factory: 'Super Stitchers', design: 'DR-1024 Summer Floral Dress', expected: 300, accepted: 290, rejected: 10, status: 'Confirmed' },
  { id: '2', recNo: 'RCV-002', date: '30-09-2026', jobSlip: 'JS-24-100', factory: 'Precision Cutters', design: 'KU-5501 Cotton Block Print Kurti', expected: 150, accepted: 148, rejected: 2, status: 'Draft' },
  { id: '3', recNo: 'RCV-003', date: '01-10-2026', jobSlip: 'JS-24-101', factory: 'Super Stitchers', design: 'DR-1024 Summer Floral Dress', expected: 500, accepted: 0, rejected: 0, status: 'Draft' },
];

export function ReceivingList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Receiving[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setItems(mockReceiving); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = items.filter(r =>
    r.recNo.toLowerCase().includes(search.toLowerCase()) ||
    r.jobSlip.toLowerCase().includes(search.toLowerCase()) ||
    r.factory.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Rec. No.', accessor: 'recNo' as keyof Receiving },
    { header: 'Date', accessor: 'date' as keyof Receiving },
    {
      header: 'Job Slip / Factory',
      accessor: (row: Receiving) => (
        <div>
          <div className="text-sm font-medium text-slate-900">{row.jobSlip}</div>
          <div className="text-xs text-slate-500">{row.factory}</div>
        </div>
      ),
    },
    { header: 'Design', accessor: 'design' as keyof Receiving },
    {
      header: 'Qty (Exp / Acc / Rej)',
      accessor: (row: Receiving) => (
        <div className="text-sm">
          <span className="text-slate-500">{row.expected}</span>
          {' / '}
          <span className="text-green-700 font-medium">{row.accepted}</span>
          {' / '}
          <span className="text-red-500 font-medium">{row.rejected}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Receiving) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>{row.status}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finished Goods Receiving</h1>
          <p className="text-sm text-slate-500">Receive completed garments from factories. Accepted goes to Ready Stock; rejected to Quarantine.</p>
        </div>
        <Button onClick={() => navigate('/production/receiving/new')}>
          <Plus size={16} /> New Receiving
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by rec. no., job slip or factory..."
        emptyMessage="No receiving records found."
        onRowClick={(row: Receiving) => navigate(`/production/receiving/${row.id}`)}
      />
    </div>
  );
}
