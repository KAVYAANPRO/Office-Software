import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  type: 'Length' | 'Weight' | 'Piece' | 'Volume' | 'Other';
  status: 'Active' | 'Inactive';
}

const mockUnits: Unit[] = [
  { id: '1', name: 'Metre', abbreviation: 'm', type: 'Length', status: 'Active' },
  { id: '2', name: 'Kilogram', abbreviation: 'kg', type: 'Weight', status: 'Active' },
  { id: '3', name: 'Piece', abbreviation: 'pcs', type: 'Piece', status: 'Active' },
  { id: '4', name: 'Set', abbreviation: 'set', type: 'Piece', status: 'Active' },
  { id: '5', name: 'Gram', abbreviation: 'g', type: 'Weight', status: 'Active' },
];

export function UnitList() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setUnits(mockUnits); setIsLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = units.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Unit Name', accessor: 'name' as keyof Unit },
    { header: 'Abbreviation', accessor: 'abbreviation' as keyof Unit },
    { header: 'Type', accessor: 'type' as keyof Unit },
    {
      header: 'Status',
      accessor: (row: Unit) => (
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
          <h1 className="text-2xl font-bold">Units of Measure</h1>
          <p className="text-[var(--color-text-muted)]">Manage measurement units for materials and stock.</p>
        </div>
        <Button onClick={() => navigate('/masters/units/new')}>
          <Plus size={16} /> Add Unit
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search units..."
        onRowClick={(row) => navigate(`/masters/units/${row.id}`)}
      />
    </div>
  );
}
