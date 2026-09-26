import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  gstin: string;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
}

// TODO: Replace with API call — GET /api/v1/suppliers
const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Alpha Fabrics', contact: 'Ramesh Kumar · 98765 43210', gstin: '27AADCB2230M1Z2', paymentTerms: 'Net 30', status: 'Active' },
  { id: '2', name: 'Zeta Dyeing', contact: 'Sunil Sharma · 98765 43211', gstin: '27BBACB1230M1Z3', paymentTerms: 'Advance', status: 'Active' },
  { id: '3', name: 'Premium Trims Ltd', contact: 'Anita Patel · 98765 43212', gstin: '24CCACB3230M1Z4', paymentTerms: 'Net 15', status: 'Inactive' },
];

export function SupplierList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setSuppliers(mockSuppliers); setIsLoading(false); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Supplier Name', accessor: 'name' as keyof Supplier },
    { header: 'Contact', accessor: 'contact' as keyof Supplier },
    { header: 'GSTIN', accessor: 'gstin' as keyof Supplier },
    { header: 'Payment Terms', accessor: 'paymentTerms' as keyof Supplier },
    {
      header: 'Status',
      accessor: (row: Supplier) => (
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
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-[var(--color-text-muted)]">Manage raw material vendors and dyeing partners.</p>
        </div>
        <Button onClick={() => navigate('/procurement/suppliers/new')}>
          <Plus size={16} /> Add Supplier
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search suppliers by name or GSTIN..."
        onRowClick={(row: Supplier) => navigate(`/procurement/suppliers/${row.id}`)}
      />
    </div>
  );
}
