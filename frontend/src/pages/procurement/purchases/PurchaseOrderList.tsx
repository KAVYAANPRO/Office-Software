import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  status: 'Pending' | 'Partial' | 'Completed';
}

const mockOrders: PurchaseOrder[] = [
  { id: '1', poNumber: 'PO-24-001', supplierName: 'Alpha Fabrics', date: '12-10-2024', totalAmount: 45000, status: 'Completed' },
  { id: '2', poNumber: 'PO-24-002', supplierName: 'Zeta Dyeing', date: '15-10-2024', totalAmount: 12500, status: 'Partial' },
  { id: '3', poNumber: 'PO-24-003', supplierName: 'Premium Trims Ltd', date: '18-10-2024', totalAmount: 8400, status: 'Pending' },
];

export function PurchaseOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(mockOrders);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const filteredOrders = orders.filter(o => 
    o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { header: 'PO Number', accessor: 'poNumber' as keyof PurchaseOrder },
    { header: 'Supplier', accessor: 'supplierName' as keyof PurchaseOrder },
    { header: 'Date', accessor: 'date' as keyof PurchaseOrder },
    { 
      header: 'Total Amount', 
      accessor: (row: PurchaseOrder) => `₹ ${row.totalAmount.toLocaleString('en-IN')}`
    },
    { 
      header: 'Status', 
      accessor: (row: PurchaseOrder) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted">Manage material procurement and purchase history.</p>
        </div>
        <Button onClick={() => navigate('/procurement/purchases/new')}>
          <Plus size={16} /> Create PO
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by PO number or supplier..."
        onRowClick={(row: PurchaseOrder) => navigate(`/procurement/purchases/${row.id}`)}
      />
    </div>
  );
}
