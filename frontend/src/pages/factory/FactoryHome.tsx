import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Package, CheckCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';

interface ActiveJob {
  id: string;
  slipNumber: string;
  design: string;
  qty: number;
  dueDate: string;
  status: 'Material Received' | 'In Process' | 'Ready';
  action: string;
  overdue: boolean;
}

// TODO: Replace with API call — GET /api/v1/factory/dashboard
const mockJobs: ActiveJob[] = [
  { id: '1', slipNumber: 'JS-24-101', design: 'Summer Floral Dress (DR-1024)', qty: 500, dueDate: '25-10-2026', status: 'In Process', action: 'Mark Ready when done', overdue: false },
  { id: '2', slipNumber: 'JS-24-102', design: 'Cotton Block Print Kurti (KU-5501)', qty: 200, dueDate: '01-10-2026', status: 'Material Received', action: 'Acknowledge receipt & start', overdue: true },
];

export function FactoryHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setJobs(mockJobs); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const overdueCount = jobs.filter(j => j.overdue).length;
  const activeCount = jobs.filter(j => j.status === 'In Process').length;
  const readyCount = jobs.filter(j => j.status === 'Ready').length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hello, {user?.name} 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's your work summary for today.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-700">{activeCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">In Process</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{overdueCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Overdue</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{readyCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Ready</div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">{overdueCount} job{overdueCount > 1 ? 's are' : ' is'} past the due date. Please update the status or contact the office.</p>
        </div>
      )}

      {/* Active jobs */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Active Jobs</div>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            No active jobs assigned. Check back later.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => navigate(`/factory/jobs/${job.id}`)}
                className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 transition-all active:scale-[0.98] ${
                  job.overdue ? 'border-red-200' : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{job.slipNumber}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{job.design}</div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'Ready' ? 'bg-green-100 text-green-800' :
                    job.status === 'In Process' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{job.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><Package size={12} /> {job.qty.toLocaleString('en-IN')} pcs</span>
                  <span className={`flex items-center gap-1 ${job.overdue ? 'text-red-600 font-medium' : ''}`}>
                    <Clock size={12} /> Due {job.dueDate} {job.overdue && '⚠️'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                  <CheckCircle size={12} /> {job.action}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
