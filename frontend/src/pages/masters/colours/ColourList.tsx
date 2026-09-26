import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Colour {
  id: string;
  name: string;
  code: string;
  hexValue: string;
  status: 'Active' | 'Inactive';
}

const mockColours: Colour[] = [
  { id: '1', name: 'Navy Blue', code: 'NB', hexValue: '#1a3a5c', status: 'Active' },
  { id: '2', name: 'Ivory White', code: 'IW', hexValue: '#f5f0e8', status: 'Active' },
  { id: '3', name: 'Brick Red', code: 'BR', hexValue: '#b5321a', status: 'Active' },
  { id: '4', name: 'Olive Green', code: 'OG', hexValue: '#4a5240', status: 'Active' },
  { id: '5', name: 'Charcoal', code: 'CH', hexValue: '#36454f', status: 'Inactive' },
];

export function ColourList() {
  const navigate = useNavigate();
  const [colours, setColours] = useState<Colour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setColours(mockColours);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = colours.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Colour',
      accessor: (row: Colour) => (
        <div className="flex items-center gap-3">
          <span
            className="inline-block w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: row.hexValue }}
          />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { header: 'Code', accessor: 'code' as keyof Colour },
    { header: 'Hex Value', accessor: 'hexValue' as keyof Colour },
    {
      header: 'Status',
      accessor: (row: Colour) => (
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
          <h1 className="text-2xl font-bold">Colours</h1>
          <p className="text-[var(--color-text-muted)]">Manage colour options used for materials and designs.</p>
        </div>
        <Button onClick={() => navigate('/masters/colours/new')}>
          <Plus size={16} /> Add Colour
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search colours..."
        onRowClick={(row) => navigate(`/masters/colours/${row.id}`)}
      />
    </div>
  );
}
