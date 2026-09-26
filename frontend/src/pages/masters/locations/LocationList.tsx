import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  code: string;
  type: 'Warehouse' | 'Factory' | 'Quarantine' | 'Other';
  status: 'Active' | 'Inactive';
}

const mockLocations: Location[] = [
  { id: '1', name: 'Main Warehouse', code: 'WH-MAIN', type: 'Warehouse', status: 'Active' },
  { id: '2', name: 'Quarantine Bay A', code: 'QA-A', type: 'Quarantine', status: 'Active' },
  { id: '3', name: 'Factory Floor 1', code: 'FF-01', type: 'Factory', status: 'Active' },
];

export function LocationList() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setLocations(mockLocations); setIsLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    Warehouse: 'bg-blue-100 text-blue-800',
    Factory: 'bg-orange-100 text-orange-800',
    Quarantine: 'bg-red-100 text-red-800',
    Other: 'bg-gray-100 text-gray-700',
  };

  const columns = [
    { header: 'Location Name', accessor: 'name' as keyof Location },
    { header: 'Code', accessor: 'code' as keyof Location },
    {
      header: 'Type',
      accessor: (row: Location) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[row.type]}`}>
          {row.type}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Location) => (
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
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-[var(--color-text-muted)]">Manage warehouses, factory zones, and storage locations.</p>
        </div>
        <Button onClick={() => navigate('/masters/locations/new')}>
          <Plus size={16} /> Add Location
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search locations..."
        onRowClick={(row) => navigate(`/masters/locations/${row.id}`)}
      />
    </div>
  );
}
