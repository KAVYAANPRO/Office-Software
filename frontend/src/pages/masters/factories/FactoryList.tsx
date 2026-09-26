import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Factory {
  id: string;
  name: string;
  contact: string;
  specialty: string;
  address: string;
  status: 'Active' | 'Inactive';
}

const mockFactories: Factory[] = [
  { id: '1', name: 'Krishna Dyeing Works', contact: 'Kishore (9876500001)', specialty: 'Dyeing', address: 'Plot 45, GIDC', status: 'Active' },
  { id: '2', name: 'Super Stitchers', contact: 'Ramesh (9876500002)', specialty: 'Stitching', address: 'Unit 2, Industrial Area', status: 'Active' },
  { id: '3', name: 'Precision Cutters', contact: 'Amit (9876500003)', specialty: 'Cutting', address: 'Shed 12, Main Road', status: 'Inactive' },
];

export function FactoryList() {
  const navigate = useNavigate();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFactories(mockFactories);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredFactories = factories.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Factory/Artisan Name', accessor: 'name' as keyof Factory },
    { header: 'Contact', accessor: 'contact' as keyof Factory },
    { 
      header: 'Specialty', 
      accessor: (row: Factory) => (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
          {row.specialty}
        </span>
      ) 
    },
    { header: 'Address', accessor: 'address' as keyof Factory },
    { 
      header: 'Status', 
      accessor: (row: Factory) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Factories & Artisans</h1>
          <p className="text-muted">Manage production partners and their specialties.</p>
        </div>
        <Button onClick={() => navigate('/masters/factories/new')}>
          <Plus size={16} /> Add Factory
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filteredFactories}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or specialty..."
        onRowClick={(row: Factory) => navigate(`/masters/factories/${row.id}`)}
      />
    </div>
  );
}
