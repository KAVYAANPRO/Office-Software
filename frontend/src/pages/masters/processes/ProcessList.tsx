import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Process {
  id: string;
  name: string;
  description: string;
  defaultCost: number;
  status: 'Active' | 'Inactive';
}

const mockProcesses: Process[] = [
  { id: '1', name: 'Cutting', description: 'Raw material cutting based on pattern', defaultCost: 15, status: 'Active' },
  { id: '2', name: 'Dyeing', description: 'Color treatment for fabric', defaultCost: 45, status: 'Active' },
  { id: '3', name: 'Stitching', description: 'Garment assembly', defaultCost: 120, status: 'Active' },
  { id: '4', name: 'Embroidery', description: 'Custom thread work', defaultCost: 250, status: 'Active' },
  { id: '5', name: 'Finishing', description: 'Ironing, quality check and packing', defaultCost: 25, status: 'Active' },
];

export function ProcessList() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setProcesses(mockProcesses);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredProcesses = processes.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Process Name', accessor: 'name' as keyof Process },
    { header: 'Description', accessor: 'description' as keyof Process },
    { 
      header: 'Default Cost (₹)', 
      accessor: (row: Process) => `₹ ${row.defaultCost.toFixed(2)}`
    },
    { 
      header: 'Status', 
      accessor: (row: Process) => (
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
          <h1 className="text-2xl font-bold">Manufacturing Processes</h1>
          <p className="text-muted">Define standard processes and default piece rates.</p>
        </div>
        <Button onClick={() => navigate('/masters/processes/new')}>
          <Plus size={16} /> Add Process
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filteredProcesses}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search processes by name..."
        onRowClick={(row: Process) => navigate(`/masters/processes/${row.id}`)}
      />
    </div>
  );
}
