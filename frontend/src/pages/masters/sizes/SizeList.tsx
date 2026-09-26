import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Size {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  status: 'Active' | 'Inactive';
}

const mockSizes: Size[] = [
  { id: '1', name: 'Extra Small', code: 'XS', sortOrder: 1, status: 'Active' },
  { id: '2', name: 'Small', code: 'S', sortOrder: 2, status: 'Active' },
  { id: '3', name: 'Medium', code: 'M', sortOrder: 3, status: 'Active' },
  { id: '4', name: 'Large', code: 'L', sortOrder: 4, status: 'Active' },
  { id: '5', name: 'Extra Large', code: 'XL', sortOrder: 5, status: 'Active' },
  { id: '6', name: 'Double Extra Large', code: 'XXL', sortOrder: 6, status: 'Active' },
];

export function SizeList() {
  const navigate = useNavigate();
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setSizes(mockSizes); setIsLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = sizes.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Size Name', accessor: 'name' as keyof Size },
    { header: 'Code', accessor: 'code' as keyof Size },
    { header: 'Sort Order', accessor: 'sortOrder' as keyof Size },
    {
      header: 'Status',
      accessor: (row: Size) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sizes</h1>
          <p className="text-[var(--color-text-muted)]">Manage garment size options (XS, S, M, L, XL, etc.).</p>
        </div>
        <Button onClick={() => navigate('/masters/sizes/new')}>
          <Plus size={16} /> Add Size
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search sizes..."
        onRowClick={(row) => navigate(`/masters/sizes/${row.id}`)}
      />
    </div>
  );
}
