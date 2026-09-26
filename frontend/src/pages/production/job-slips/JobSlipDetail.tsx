import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, Circle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface JobSlipData {
  id: string;
  slipNumber: string;
  date: string;
  factory: string;
  design: string;
  category: string;
  type: 'Manufacturing' | 'Processing';
  batchQty: number;
  targetDate: string;
  chargeBasis: 'Per Piece' | 'Per Metre' | 'Lump Sum';
  agreedRate: number;
  status: 'Draft' | 'Material Issued' | 'In Process' | 'Ready' | 'Partially Received' | 'Received' | 'Closed' | 'Cancelled';
  instructions: string;
  remarks: string;
  materials: { name: string; required: number; issued: number; unit: string }[];
}

// TODO: Replace with API call — GET /api/v1/production/job-slips/:id
const mockSlip: JobSlipData = {
  id: '1',
  slipNumber: 'JS-24-101',
  date: '20-09-2026',
  factory: 'Super Stitchers',
  design: 'DR-1024 — Summer Floral Dress',
  category: 'Dress',
  type: 'Manufacturing',
  batchQty: 500,
  targetDate: '25-10-2026',
  chargeBasis: 'Per Piece',
  agreedRate: 120,
  status: 'In Process',
  instructions: '1. Pre-wash before cutting.\n2. French seams on all edges.\n3. Hidden-stitch lining.',
  remarks: 'Rush order — priority delivery.',
  materials: [
    { name: 'Cotton Fabric — Navy Blue', required: 1250, issued: 1250, unit: 'm' },
    { name: 'Lining Cloth — Black', required: 600, issued: 600, unit: 'm' },
    { name: 'Buttons — White 12mm', required: 4000, issued: 3500, unit: 'pcs' },
  ],
};

const STATUS_STEPS = ['Draft', 'Material Issued', 'In Process', 'Ready', 'Partially Received', 'Received', 'Closed'] as const;

export function JobSlipDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [slip, setSlip] = useState<JobSlipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setSlip(mockSlip); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!slip) return <div className="p-6 text-slate-500">Job slip not found.</div>;

  const stepIndex = STATUS_STEPS.indexOf(slip.status as typeof STATUS_STEPS[number]);
  const isCancelled = slip.status === 'Cancelled';

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate('/production/job-slips')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{slip.slipNumber}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isCancelled ? 'bg-red-100 text-red-800' :
              slip.status === 'Closed' ? 'bg-gray-100 text-gray-600' :
              slip.status === 'In Process' ? 'bg-blue-100 text-blue-800' :
              slip.status === 'Ready' || slip.status === 'Received' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>{slip.status}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{slip.factory} · {slip.design}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/production/issuance/${id}`)}>Issue Materials</Button>
          <Button variant="secondary" onClick={() => navigate(`/production/job-slips/${id}/edit`)}>
            <Edit size={14} /> Edit
          </Button>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Progress</div>
        {isCancelled ? (
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
            <XCircle size={18} /> Job Slip Cancelled
          </div>
        ) : (
          <>
            {/* Desktop timeline */}
            <div className="hidden md:flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      {done ? (
                        <CheckCircle size={20} className="text-green-500 shrink-0" />
                      ) : active ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-200 shrink-0" />
                      ) : (
                        <Circle size={20} className="text-slate-300 shrink-0" />
                      )}
                      <span className={`text-[10px] font-medium text-center leading-tight max-w-[70px] ${active ? 'text-blue-700' : done ? 'text-green-700' : 'text-slate-400'}`}>
                        {step}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stepIndex ? 'bg-green-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Mobile compact */}
            <div className="md:hidden flex flex-col gap-2">
              {STATUS_STEPS.map((step, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${done ? 'bg-green-500' : active ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <span className={`text-sm ${active ? 'font-semibold text-blue-700' : done ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{step}</span>
                    {active && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Current</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Order Details</div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {[
              ['Job Slip', slip.slipNumber],
              ['Date', slip.date],
              ['Type', slip.type],
              ['Category', slip.category],
              ['Batch Qty', `${slip.batchQty.toLocaleString('en-IN')} pcs`],
              ['Target Date', slip.targetDate],
              ['Charge Basis', slip.chargeBasis],
              ['Agreed Rate', `₹${slip.agreedRate.toLocaleString('en-IN')} / ${slip.chargeBasis === 'Per Piece' ? 'pc' : slip.chargeBasis === 'Per Metre' ? 'm' : 'job'}`],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                <div className="font-medium text-slate-800">{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {slip.instructions && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Instructions</div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{slip.instructions}</pre>
            </div>
          )}
          {slip.remarks && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Remarks</div>
              <p className="text-sm text-amber-800">{slip.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Material Issuance Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Material Issuance</div>
        </div>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Material', 'Required', 'Issued', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slip.materials.map((m, i) => {
              const fulfilled = m.issued >= m.required;
              const partial = m.issued > 0 && m.issued < m.required;
              return (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.required.toLocaleString('en-IN')} {m.unit}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{m.issued.toLocaleString('en-IN')} {m.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${fulfilled ? 'bg-green-100 text-green-700' : partial ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {fulfilled ? 'Fulfilled' : partial ? 'Partial' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      {(slip.status === 'Received' || slip.status === 'Partially Received') && (
        <div className="flex gap-3">
          <Button onClick={() => navigate(`/production/reconciliation/${id}`)}>Open Reconciliation</Button>
        </div>
      )}
    </div>
  );
}
