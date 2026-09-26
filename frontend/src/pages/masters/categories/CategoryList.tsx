import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'Material' | 'Product';
  description: string;
  status: 'Active' | 'Inactive';
}

const mockCategories: Category[] = [
  { id: '1', name: 'Fabric', type: 'Material', description: 'Woven and knitted fabrics', status: 'Active' },
  { id: '2', name: 'Trim', type: 'Material', description: 'Buttons, zippers, laces', status: 'Active' },
  { id: '3', name: 'Lining', type: 'Material', description: 'Inner lining materials', status: 'Active' },
  { id: '4', name: 'Salwar Kameez', type: 'Product', description: 'Ethnic wear suits', status: 'Active' },
  { id: '5', name: 'Kurti', type: 'Product', description: 'Women kurtas and tops', status: 'Active' },
  { id: '6', name: 'Dupatta', type: 'Product', description: 'Matching dupattas', status: 'Active' },
  { id: '7', name: 'Saree', type: 'Product', description: 'Traditional sarees', status: 'Active' },
];

export function CategoryList() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Material' | 'Product'>('All');

  useEffect(() => {
    const timer = setTimeout(() => { setCategories(mockCategories); setIsLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || c.type === filterType;
    return matchSearch && matchType;
  });

  const columns = [
    { header: 'Category Name', accessor: 'name' as keyof Category },
    {
      header: 'Type',
      accessor: (row: Category) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.type === 'Material' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {row.type}
        </span>
      ),
    },
    { header: 'Description', accessor: 'description' as keyof Category },
    {
      header: 'Status',
      accessor: (row: Category) => (
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
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-[var(--color-text-muted)]">Manage material and product category groups.</p>
        </div>
        <Button onClick={() => navigate('/masters/categories/new')}>
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {(['All', 'Material', 'Product'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              filterType === t
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'bg-white text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-background)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        onRowClick={(row) => navigate(`/masters/categories/${row.id}`)}
      />
    </div>
  );
}
