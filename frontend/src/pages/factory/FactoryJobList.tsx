import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, ChevronRight } from 'lucide-react';

interface FactoryJob {
  id: string;
  slipNumber: string;
  design: string;
  qty: number;
  dueDate: string;
  status: 'Material Received' | 'In Process' | 'Ready' | 'Dispatched';
  overdue: boolean;
}

// TODO: Replace with API call — GET /api/v1/factory/jobs
const mockJobs: FactoryJob[] = [
  { id: '1', slipNumber: 'JS-24-101', design: 'Summer Floral Dress (DR-1024)', qty: 500, dueDate: '25-10-2026', status: 'In Process', overdue: false },
  { id: '2', slipNumber: 'JS-24-102', design: 'Cotton Block Print Kurti (KU-5501)', qty: 200, dueDate: '01-10-2026', status: 'Material Received', overdue: true },
  { id: '3', slipNumber: 'JS-24-099', design: 'Summer Floral Dress (DR-1024)', qty: 300, dueDate: '15-09-2026', status: 'Dispatched', overdue: false },
];

const statusColors: Record<FactoryJob['status'], string> = {
  'Material Received': 'bg-yellow-100 text-yellow-800',
  'In Process': 'bg-blue-100 text-blue-800',
  'Ready': 'bg-green-100 text-green-800',
  'Dispatched': 'bg-gray-100 text-gray-600',
};

export function FactoryJobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<FactoryJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'Active' | 'All'>('Active');

  useEffect(() => {
    const t = setTimeout(() => { setJobs(mockJobs); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = filter === 'Active'
    ? jobs.filter(j => j.status !== 'Dispatched')
    : jobs;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-sm text-slate-500">All job slips assigned to your factory.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        {(['Active', 'All'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-xl border border-slate-200 h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          No {filter === 'Active' ? 'active' : ''} jobs found.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(job => (
            <button
              key={job.id}
              onClick={() => navigate(`/factory/jobs/${job.id}`)}
              className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 transition-all active:scale-[0.98] ${
                job.overdue ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm">{job.slipNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                    {job.status}
                  </span>
                  {job.overdue && <span className="text-xs text-red-600 font-medium">⚠️ Overdue</span>}
                </div>
                <div className="text-xs text-slate-500 truncate mb-2">{job.design}</div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Package size={11} /> {job.qty.toLocaleString('en-IN')} pcs</span>
                  <span className={`flex items-center gap-1 ${job.overdue ? 'text-red-500' : ''}`}>
                    <Clock size={11} /> Due {job.dueDate}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
