import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  type: 'Raw' | 'Ready';
  uom: string;
  category: string;
  minStock: number;
  status: 'Active' | 'Inactive';
}

const mockMaterials: Material[] = [
  { id: '1', name: 'Cotton Fabric - Blue', type: 'Raw', uom: 'meters', category: 'Fabric', minStock: 500, status: 'Active' },
  { id: '2', name: 'Silk Thread - Gold', type: 'Raw', uom: 'kg', category: 'Thread', minStock: 20, status: 'Active' },
  { id: '3', name: 'Kurti D-1025 XL', type: 'Ready', uom: 'pcs', category: 'Finished Goods', minStock: 50, status: 'Active' },
  { id: '4', name: 'Polyester Blend - Red', type: 'Raw', uom: 'meters', category: 'Fabric', minStock: 100, status: 'Inactive' },
];

export function MaterialList() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMaterials(mockMaterials);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Material Name', accessor: 'name' as keyof Material },
    { 
      header: 'Type', 
      accessor: (row: Material) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.type === 'Raw' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {row.type}
        </span>
      ) 
    },
    { header: 'Category', accessor: 'category' as keyof Material },
    { header: 'UOM', accessor: 'uom' as keyof Material },
    { header: 'Min Stock', accessor: 'minStock' as keyof Material },
    { 
      header: 'Status', 
      accessor: (row: Material) => (
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
          <h1 className="text-2xl font-bold">Materials</h1>
          <p className="text-muted">Manage raw materials and ready goods catalog.</p>
        </div>
        <Button onClick={() => navigate('/inventory/materials/new')}>
          <Plus size={16} /> Add Material
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filteredMaterials}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search materials by name or category..."
        onRowClick={(row: Material) => navigate(`/inventory/materials/${row.id}`)}
      />
    </div>
  );
}
