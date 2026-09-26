import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Share } from 'lucide-react';

interface PendingIssuance {
  id: string; // Job Slip ID
  slipNumber: string;
  factoryName: string;
  designSku: string;
  totalMaterialsNeeded: number;
  status: 'Pending Issuance' | 'Partial Issuance';
}

const mockIssuances: PendingIssuance[] = [
  { id: '1', slipNumber: 'JS-24-101', factoryName: 'Super Stitchers', designSku: 'DR-1024', totalMaterialsNeeded: 2, status: 'Partial Issuance' },
  { id: '2', slipNumber: 'JS-24-102', factoryName: 'Krishna Dyeing Works', designSku: 'KU-5501', totalMaterialsNeeded: 4, status: 'Pending Issuance' },
];

export function PendingIssuanceList() {
  const navigate = useNavigate();
  const [issuances, setIssuances] = useState<PendingIssuance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIssuances(mockIssuances);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const filteredIssuances = issuances.filter(i => 
    i.slipNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.factoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Job Slip', accessor: 'slipNumber' as keyof PendingIssuance },
    { header: 'Factory / Artisan', accessor: 'factoryName' as keyof PendingIssuance },
    { header: 'Design SKU', accessor: 'designSku' as keyof PendingIssuance },
    { 
      header: 'Materials Needed', 
      accessor: (row: PendingIssuance) => `${row.totalMaterialsNeeded} items` 
    },
    { 
      header: 'Status', 
      accessor: (row: PendingIssuance) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Pending Issuance' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: (row: PendingIssuance) => (
        <Button onClick={(e) => {
          e.stopPropagation();
          navigate(`/production/issuance/${row.id}`);
        }}>
          <Share size={14} className="mr-1" /> Issue
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Material Issuance</h1>
        <p className="text-muted">Issue raw materials from inventory to factories against Job Slips.</p>
      </div>

      <DataTable 
        columns={columns}
        data={filteredIssuances}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by job slip or factory..."
        onRowClick={(row: PendingIssuance) => navigate(`/production/issuance/${row.id}`)}
      />
    </div>
  );
}
