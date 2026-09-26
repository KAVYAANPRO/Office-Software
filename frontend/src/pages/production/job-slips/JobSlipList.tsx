import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/tables/DataTable';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';

interface JobSlip {
  id: string;
  slipNumber: string;
  designSku: string;
  factoryName: string;
  batchQty: number;
  targetDate: string;
  status: 'Draft' | 'Issued' | 'In Progress' | 'Completed' | 'Cancelled';
}

const mockJobSlips: JobSlip[] = [
  { id: '1', slipNumber: 'JS-24-101', designSku: 'DR-1024', factoryName: 'Super Stitchers', batchQty: 500, targetDate: '25-10-2024', status: 'In Progress' },
  { id: '2', slipNumber: 'JS-24-102', designSku: 'KU-5501', factoryName: 'Krishna Dyeing Works', batchQty: 1000, targetDate: '30-10-2024', status: 'Issued' },
  { id: '3', slipNumber: 'JS-24-103', designSku: 'LG-8092', factoryName: 'Precision Cutters', batchQty: 200, targetDate: '05-11-2024', status: 'Draft' },
];

export function JobSlipList() {
  const navigate = useNavigate();
  const [jobSlips, setJobSlips] = useState<JobSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setJobSlips(mockJobSlips);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const filteredSlips = jobSlips.filter(js => 
    js.slipNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    js.designSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    js.factoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Issued': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { header: 'Slip Number', accessor: 'slipNumber' as keyof JobSlip },
    { header: 'Design SKU', accessor: 'designSku' as keyof JobSlip },
    { header: 'Assigned Factory', accessor: 'factoryName' as keyof JobSlip },
    { header: 'Batch Qty', accessor: 'batchQty' as keyof JobSlip },
    { header: 'Target Date', accessor: 'targetDate' as keyof JobSlip },
    { 
      header: 'Status', 
      accessor: (row: JobSlip) => (
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
          <h1 className="text-2xl font-bold">Job Slips</h1>
          <p className="text-muted">Manage production orders and track factory progress.</p>
        </div>
        <Button onClick={() => navigate('/production/job-slips/new')}>
          <Plus size={16} /> Create Job Slip
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filteredSlips}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by slip number, SKU, or factory..."
        onRowClick={(row: JobSlip) => navigate(`/production/job-slips/${row.id}`)}
      />
    </div>
  );
}
