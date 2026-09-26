import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';

interface PendingInward {
  id: string; // PO ID
  poNumber: string;
  supplierName: string;
  expectedDate: string;
  pendingItems: number;
}

const mockPending: PendingInward[] = [
  { id: '2', poNumber: 'PO-24-002', supplierName: 'Zeta Dyeing', expectedDate: '15-10-2024', pendingItems: 2 },
  { id: '3', poNumber: 'PO-24-003', supplierName: 'Premium Trims Ltd', expectedDate: '18-10-2024', pendingItems: 5 },
];

export function PendingInwardList() {
  const navigate = useNavigate();
  const [inwards, setInwards] = useState<PendingInward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setInwards(mockPending);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredInwards = inwards.filter(i => 
    i.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'PO Number', accessor: 'poNumber' as keyof PendingInward },
    { header: 'Supplier', accessor: 'supplierName' as keyof PendingInward },
    { header: 'Expected Delivery', accessor: 'expectedDate' as keyof PendingInward },
    { 
      header: 'Pending Items', 
      accessor: (row: PendingInward) => (
        <span className="bg-yellow-100 text-yellow-800 font-medium px-2 py-1 rounded-full text-xs">
          {row.pendingItems} items
        </span>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Inward</h1>
        <p className="text-muted">Receive raw materials against pending Purchase Orders.</p>
      </div>

      <DataTable 
        columns={columns}
        data={filteredInwards}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by PO number or supplier..."
        onRowClick={(row: PendingInward) => navigate(`/procurement/inward/${row.id}`)}
      />
    </div>
  );
}
