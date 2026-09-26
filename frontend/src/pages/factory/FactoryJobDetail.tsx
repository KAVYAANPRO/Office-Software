import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface FactoryJob {
  id: string;
  slipNumber: string;
  design: string;
  instructions: string;
  expectedOutput: { colour: string; size: string; qty: number }[];
  materialsReceived: { name: string; qty: number; unit: string }[];
  status: 'Material Received' | 'In Process' | 'Ready' | 'Dispatched';
  dueDate: string;
}

// TODO: Replace with API call — GET /api/v1/factory/jobs/:id
const mockJob: FactoryJob = {
  id: '1',
  slipNumber: 'JS-24-101',
  design: 'Summer Floral Dress (DR-1024)',
  instructions: '1. Pre-wash fabric before cutting.\n2. Use French seams on all edges.\n3. Attach lining with hidden stitch.\n4. Quality check before dispatch.',
  expectedOutput: [
    { colour: 'Navy Blue', size: 'S', qty: 60 },
    { colour: 'Navy Blue', size: 'M', qty: 80 },
    { colour: 'Navy Blue', size: 'L', qty: 60 },
    { colour: 'Navy Blue', size: 'XL', qty: 50 },
  ],
  materialsReceived: [
    { name: 'Cotton Fabric — Navy Blue', qty: 1250, unit: 'm' },
    { name: 'Lining Cloth — Black', qty: 600, unit: 'm' },
    { name: 'Buttons — White 12mm', qty: 3500, unit: 'pcs' },
  ],
  status: 'In Process',
  dueDate: '25-10-2026',
};

const ACTIONS: Record<FactoryJob['status'], { label: string; next: FactoryJob['status'] | null; variant: 'primary' | 'secondary' }> = {
  'Material Received': { label: 'Acknowledge & Start Processing', next: 'In Process', variant: 'primary' },
  'In Process': { label: 'Mark as Ready for Dispatch', next: 'Ready', variant: 'primary' },
  'Ready': { label: 'Declare Dispatch', next: 'Dispatched', variant: 'primary' },
  'Dispatched': { label: 'Dispatched', next: null, variant: 'secondary' },
};

export function FactoryJobDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<FactoryJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setJob(mockJob); setIsLoading(false); }, 500);
    return () => clearTimeout(t);
  }, [id]);

  const handleAction = async () => {
    if (!job) return;
    setShowConfirm(false);
    setIsActing(true);
    await new Promise(r => setTimeout(r, 800));
    const next = ACTIONS[job.status].next;
    if (next) setJob(j => j ? { ...j, status: next } : j);
    setIsActing(false);
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!job) return <div className="p-6 text-slate-500">Job not found.</div>;

  const action = ACTIONS[job.status];
  const totalExpected = job.expectedOutput.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/factory/jobs')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{job.slipNumber}</h2>
          <p className="text-sm text-slate-500">{job.design}</p>
        </div>
      </div>

      {/* Status + due */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div>
          <div className="text-xs text-slate-400 mb-1">Status</div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            job.status === 'Ready' || job.status === 'Dispatched' ? 'bg-green-100 text-green-800' :
            job.status === 'In Process' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>{job.status}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 mb-1">Due Date</div>
          <div className="font-semibold text-slate-800">{job.dueDate}</div>
        </div>
      </div>

      {/* Expected output */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expected Output</div>
          <span className="text-sm font-bold text-slate-900">{totalExpected.toLocaleString('en-IN')} pcs total</span>
        </div>
        <div className="divide-y divide-slate-100">
          {job.expectedOutput.map((row, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{row.colour}</span>
                <span className="w-7 h-7 rounded bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">{row.size}</span>
              </div>
              <span className="font-semibold text-slate-900">{row.qty} pcs</span>
            </div>
          ))}
        </div>
      </div>

      {/* Materials received */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Materials Received</div>
        </div>
        <div className="divide-y divide-slate-100">
          {job.materialsReceived.map((m, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Package size={14} className="text-slate-400" /> {m.name}
              </div>
              <span className="font-semibold text-slate-900">{m.qty.toLocaleString('en-IN')} {m.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Manufacturing Instructions</div>
        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{job.instructions}</pre>
      </div>

      {/* Action button */}
      {action.next !== null && (
        <Button variant="primary" className="w-full py-3 text-base" onClick={() => setShowConfirm(true)} isLoading={isActing}>
          <CheckCircle size={18} /> {action.label}
        </Button>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">Confirm Status Update</h3>
                <p className="text-sm text-slate-500 mt-1">You are marking <span className="font-medium">{job.slipNumber}</span> as <span className="font-medium">{ACTIONS[job.status].next}</span>. This will notify the office team.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1" onClick={handleAction}>Confirm</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
