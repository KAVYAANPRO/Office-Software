import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FlaskConical } from 'lucide-react';

interface ProcessingJob {
  id: string;
  jobNumber: string;
  processType: string;
  factoryName: string;
  inputMaterial: string;
  inputQty: number;
  outputMaterial: string;
  expectedOutputQty: number;
  actualOutputQty: number | null;
  shortage: number | null;
  shortagePercent: number | null;
  issueDate: string;
  expectedReturnDate: string;
  status: 'Draft' | 'Material Issued' | 'In Process' | 'Received' | 'Closed' | 'Cancelled';
}

// TODO: Replace with API call — GET /api/v1/production/processing-jobs
const mockJobs: ProcessingJob[] = [
  {
    id: 'pj-1',
    jobNumber: 'PJ-26-001',
    processType: 'Dyeing',
    factoryName: 'Krishna Dyeing Works',
    inputMaterial: 'Cotton Fabric - White',
    inputQty: 200,
    outputMaterial: 'Cotton Fabric - Blue',
    expectedOutputQty: 195,
    actualOutputQty: 192,
    shortage: 8,
    shortagePercent: 4.0,
    issueDate: '05-09-2026',
    expectedReturnDate: '12-09-2026',
    status: 'Received',
  },
  {
    id: 'pj-2',
    jobNumber: 'PJ-26-002',
    processType: 'Printing',
    factoryName: 'Artex Printing House',
    inputMaterial: 'Dupatta Fabric - White',
    inputQty: 150,
    outputMaterial: 'Printed Dupatta - Blue',
    expectedOutputQty: 147,
    actualOutputQty: null,
    shortage: null,
    shortagePercent: null,
    issueDate: '15-09-2026',
    expectedReturnDate: '22-09-2026',
    status: 'In Process',
  },
  {
    id: 'pj-3',
    jobNumber: 'PJ-26-003',
    processType: 'Embroidery',
    factoryName: 'Fine Embroidery Works',
    inputMaterial: 'Poly Blend - Green',
    inputQty: 100,
    outputMaterial: 'Embroidered Poly - Green',
    expectedOutputQty: 98,
    actualOutputQty: null,
    shortage: null,
    shortagePercent: null,
    issueDate: '20-09-2026',
    expectedReturnDate: '27-09-2026',
    status: 'Material Issued',
  },
];

const statusCfg: Record<ProcessingJob['status'], { cls: string }> = {
  Draft: { cls: 'bg-gray-100 text-gray-700' },
  'Material Issued': { cls: 'bg-yellow-100 text-yellow-700' },
  'In Process': { cls: 'bg-blue-100 text-blue-700' },
  Received: { cls: 'bg-green-100 text-green-700' },
  Closed: { cls: 'bg-slate-100 text-slate-600' },
  Cancelled: { cls: 'bg-red-100 text-red-700' },
};

export function ProcessingJobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setJobs(mockJobs); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = jobs.filter(j => {
    const matchSearch =
      j.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
      j.processType.toLowerCase().includes(search.toLowerCase()) ||
      j.factoryName.toLowerCase().includes(search.toLowerCase()) ||
      j.inputMaterial.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? j.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processing Jobs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Dyeing, printing, embroidery and other material transformation jobs</p>
        </div>
        <button
          onClick={() => navigate('/production/processing/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} /> New Processing Job
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <input
            type="text"
            placeholder="Search by job number, process, factory or material…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.keys(statusCfg).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
            <FlaskConical size={32} />
            <p>No processing jobs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  {['Job #', 'Process Type', 'Factory', 'Input Material', 'Qty In', 'Output Material', 'Expected Out', 'Actual Out', 'Shortage %', 'Issue Date', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600">{j.jobNumber}</td>
                    <td className="px-4 py-3">{j.processType}</td>
                    <td className="px-4 py-3">{j.factoryName}</td>
                    <td className="px-4 py-3 text-slate-600">{j.inputMaterial}</td>
                    <td className="px-4 py-3 text-right">{j.inputQty} m</td>
                    <td className="px-4 py-3 text-slate-600">{j.outputMaterial}</td>
                    <td className="px-4 py-3 text-right">{j.expectedOutputQty} m</td>
                    <td className="px-4 py-3 text-right">{j.actualOutputQty != null ? `${j.actualOutputQty} m` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {j.shortagePercent != null ? (
                        <span className={j.shortagePercent > 5 ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {j.shortagePercent.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{j.issueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg[j.status].cls}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/production/processing/${j.id}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
