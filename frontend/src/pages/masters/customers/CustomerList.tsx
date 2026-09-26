import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  gstin: string;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
}

const mockCustomers: Customer[] = [
  { id: '1', name: 'Rahul Mehta', businessName: 'Mehta Fashion House', mobile: '9876543210', gstin: '27AADCM2230M1Z2', paymentTerms: 'Net 30', status: 'Active' },
  { id: '2', name: 'Sunita Agarwal', businessName: 'Agarwal Garments', mobile: '9876543211', gstin: '27BBACG1230M1Z3', paymentTerms: 'Advance', status: 'Active' },
  { id: '3', name: 'Priya Shah', businessName: 'Shah Collections', mobile: '9876543212', gstin: '', paymentTerms: 'Net 15', status: 'Active' },
];

export function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setCustomers(mockCustomers); setIsLoading(false); }, 700);
    return () => clearTimeout(timer);
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    c.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Customer',
      accessor: (row: Customer) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{row.businessName}</div>
        </div>
      ),
    },
    { header: 'Mobile', accessor: 'mobile' as keyof Customer },
    {
      header: 'GSTIN',
      accessor: (row: Customer) => (
        <span className="font-mono text-xs">{row.gstin || '—'}</span>
      ),
    },
    { header: 'Payment Terms', accessor: 'paymentTerms' as keyof Customer },
    {
      header: 'Status',
      accessor: (row: Customer) => (
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
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-[var(--color-text-muted)]">Manage customer accounts and billing information.</p>
        </div>
        <Button onClick={() => navigate('/masters/customers/new')}>
          <Plus size={16} /> Add Customer
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, business, mobile, or GSTIN..."
        onRowClick={(row) => navigate(`/masters/customers/${row.id}`)}
      />
    </div>
  );
}
