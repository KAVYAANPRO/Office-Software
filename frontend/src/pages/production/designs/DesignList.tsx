import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Design {
  id: string;
  designNo: string;
  name: string;
  category: string;
  type: 'Stitched' | 'Unstitched' | 'Accessory';
  variantCount: number;
  status: 'Active' | 'Draft' | 'Archived';
  updatedDate: string;
}

// TODO: Replace with API call — GET /api/v1/designs
const mockDesigns: Design[] = [
  { id: '1', designNo: 'DR-1024', name: 'Summer Floral Dress', category: 'Dress', type: 'Stitched', variantCount: 6, status: 'Active', updatedDate: '24-09-2026' },
  { id: '2', designNo: 'KU-5501', name: 'Cotton Block Print Kurti', category: 'Kurti', type: 'Stitched', variantCount: 4, status: 'Active', updatedDate: '23-09-2026' },
  { id: '3', designNo: 'SC-3301', name: 'Embroidered Dupatta Set', category: 'Sets', type: 'Unstitched', variantCount: 3, status: 'Draft', updatedDate: '22-09-2026' },
  { id: '4', designNo: 'LG-8092', name: 'Embroidered Leggings', category: 'Bottoms', type: 'Stitched', variantCount: 2, status: 'Archived', updatedDate: '10-08-2026' },
];

const statusColors: Record<Design['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  Draft: 'bg-yellow-100 text-yellow-800',
  Archived: 'bg-gray-100 text-gray-600',
};

export function DesignList() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDesigns(mockDesigns); setIsLoading(false); }, 700);
    return () => clearTimeout(t);
  }, []);

  const filtered = designs.filter(d =>
    d.designNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Design No.', accessor: 'designNo' as keyof Design },
    {
      header: 'Design Name',
      accessor: (row: Design) => (
        <div>
          <div className="text-sm font-medium text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.category} · {row.type}</div>
        </div>
      ),
    },
    {
      header: 'Variants',
      accessor: (row: Design) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {row.variantCount} variants
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Design) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status]}`}>
          {row.status}
        </span>
      ),
    },
    { header: 'Updated', accessor: 'updatedDate' as keyof Design },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Designs & BOM Catalog</h1>
          <p className="text-sm text-slate-500">Manage product designs, variants, and Bills of Material.</p>
        </div>
        <Button onClick={() => navigate('/production/designs/new')}>
          <Plus size={16} /> Create Design
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by design no., name or category..."
        emptyMessage="No designs found."
        onRowClick={(row: Design) => navigate(`/production/designs/${row.id}`)}
      />
    </div>
  );
}
