import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';

interface MaterialLine {
  id: string;
  material: string;
  unit: string;
  issued: number;
  returned: number;
  consumed: number;
  writtenOff: number;
  shortage: number;
  status: 'Resolved' | 'Unresolved';
  reason: string;
}

interface ReconciliationData {
  jobSlip: string;
  factory: string;
  design: string;
  expectedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  materials: MaterialLine[];
  canClose: boolean;
}

// TODO: Replace with API call — GET /api/v1/production/reconciliation/:id
const mockData: ReconciliationData = {
  jobSlip: 'JS-24-099',
  factory: 'Super Stitchers',
  design: 'DR-1024 — Summer Floral Dress',
  expectedQty: 300,
  receivedQty: 295,
  acceptedQty: 290,
  rejectedQty: 5,
  materials: [
    { id: 'm1', material: 'Cotton Fabric — Navy Blue', unit: 'm', issued: 750, returned: 20, consumed: 720, writtenOff: 0, shortage: 10, status: 'Unresolved', reason: '' },
    { id: 'm2', material: 'Lining Cloth — Black', unit: 'm', issued: 360, returned: 15, consumed: 345, writtenOff: 0, shortage: 0, status: 'Resolved', reason: '' },
    { id: 'm3', material: 'Buttons — White 12mm', unit: 'pcs', issued: 2400, returned: 30, consumed: 2325, writtenOff: 45, shortage: 0, status: 'Resolved', reason: 'Defective buttons discarded' },
  ],
};

export function ReconciliationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [writeOffTarget, setWriteOffTarget] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = setTimeout(() => { setData(mockData); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="p-6 text-slate-500">Reconciliation not found.</div>;

  const unresolvedMaterials = data.materials.filter(m => m.status === 'Unresolved');
  const canClose = unresolvedMaterials.length === 0 || unresolvedMaterials.every(m => reasons[m.id]?.trim());

  const confirmWriteOff = () => {
    const materialId = writeOffTarget;
    setWriteOffTarget(null);
    if (!materialId) return;
    setData(d => d ? {
      ...d,
      materials: d.materials.map(m =>
        m.id === materialId ? { ...m, writtenOff: m.shortage, shortage: 0, status: 'Resolved', reason: reasons[materialId] || 'Written off' } : m
      ),
    } : d);
  };

  const writeOffMaterial = data.materials.find(m => m.id === writeOffTarget);

  const handleClose = async () => {
    setShowCloseConfirm(false);
    setIsClosing(true);
    await new Promise(r => setTimeout(r, 900));
    setIsClosing(false);
    navigate('/production/job-slips');
  };

  const diff = data.receivedQty - data.expectedQty;
  const diffPct = ((diff / data.expectedQty) * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Reconciliation — {data.jobSlip}</h1>
          <p className="text-sm text-slate-500">{data.factory} · {data.design}</p>
        </div>
      </div>

      {/* Production comparison */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Production Comparison</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Expected', value: data.expectedQty, cls: 'text-slate-900' },
            { label: 'Received', value: data.receivedQty, cls: diff < 0 ? 'text-red-600' : 'text-green-700' },
            { label: 'Accepted', value: data.acceptedQty, cls: 'text-green-700' },
            { label: 'Rejected', value: data.rejectedQty, cls: data.rejectedQty > 0 ? 'text-red-600' : 'text-slate-400' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${cls}`}>{value.toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-400">pcs</div>
            </div>
          ))}
        </div>
        {diff !== 0 && (
          <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${diff < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {diff < 0 ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
            Difference: {diff > 0 ? '+' : ''}{diff} pcs ({diff > 0 ? '+' : ''}{diffPct}%)
          </div>
        )}
      </div>

      {/* Unresolved alert */}
      {unresolvedMaterials.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">
            {unresolvedMaterials.length} material{unresolvedMaterials.length > 1 ? 's have' : ' has'} unresolved shortages.
            A job cannot be closed until all quantities are resolved (returned or written off with a reason).
          </p>
        </div>
      )}

      {/* Material reconciliation table */}
      <div className="flex flex-col gap-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Material Reconciliation</div>
        {data.materials.map(m => {
          const remaining = m.issued - m.returned - m.consumed - m.writtenOff;
          const isUnresolved = m.status === 'Unresolved';
          return (
            <div key={m.id} className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3 ${isUnresolved ? 'border-red-200' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-semibold text-slate-900">{m.material}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isUnresolved ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {isUnresolved ? <><XCircle size={12} /> Unresolved</> : <><CheckCircle size={12} /> Resolved</>}
                </span>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                {[
                  { label: 'Issued', value: m.issued, cls: 'text-slate-900' },
                  { label: 'Returned', value: m.returned, cls: 'text-blue-700' },
                  { label: 'Consumed', value: m.consumed, cls: 'text-slate-700' },
                  { label: 'Written Off', value: m.writtenOff, cls: m.writtenOff > 0 ? 'text-amber-700' : 'text-slate-400' },
                  { label: 'Remaining', value: remaining, cls: remaining > 0 ? 'text-orange-600 font-bold' : 'text-slate-400' },
                  { label: 'Shortage', value: m.shortage, cls: m.shortage > 0 ? 'text-red-600 font-bold' : 'text-slate-400' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-400 mb-0.5">{label}</div>
                    <div className={`text-base font-semibold ${cls}`}>{value.toLocaleString('en-IN')}</div>
                    <div className="text-slate-400">{m.unit}</div>
                  </div>
                ))}
              </div>

              {isUnresolved && m.shortage > 0 && (
                <div className="flex flex-col gap-2 border-t border-red-100 pt-3">
                  <div className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> {m.shortage} {m.unit} shortage — action required
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Reason for shortage (required to write off)"
                      value={reasons[m.id] || ''}
                      onChange={e => setReasons(r => ({ ...r, [m.id]: e.target.value }))}
                    />
                    <Button
                      variant="danger"
                      onClick={() => setWriteOffTarget(m.id)}
                      disabled={!reasons[m.id]?.trim()}
                    >
                      Write Off
                    </Button>
                  </div>
                </div>
              )}

              {m.reason && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  <Info size={12} /> {m.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Close job */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-semibold text-slate-900">Close Job</div>
          <p className="text-xs text-slate-400 mt-0.5">
            {canClose ? 'All materials resolved. You may close this job.' : 'Resolve all material shortages before closing.'}
          </p>
        </div>
        <Button
          variant="primary"
          disabled={!canClose}
          isLoading={isClosing}
          onClick={() => setShowCloseConfirm(true)}
        >
          Close Job
        </Button>
      </div>

      {/* Write-off confirmation */}
      <ConfirmDialog
        open={Boolean(writeOffTarget) && Boolean(writeOffMaterial)}
        title="Write Off Shortage"
        impact={
          writeOffMaterial
            ? `Write off ${writeOffMaterial.shortage} ${writeOffMaterial.unit} shortage of ${writeOffMaterial.material}? This permanently removes the shortage from stock records with reason: "${reasons[writeOffMaterial.id] || 'Written off'}". This cannot be undone.`
            : ''
        }
        confirmLabel="Write Off"
        danger
        onConfirm={confirmWriteOff}
        onCancel={() => setWriteOffTarget(null)}
      />

      {/* Close confirmation */}
      <ConfirmDialog
        open={showCloseConfirm}
        title={`Close Job ${data.jobSlip}?`}
        impact="Closing this job will lock and finalize it: all material custody will be cleared and no further material, receiving, or reconciliation entries can be made against it. This action cannot be undone."
        confirmLabel="Close Job"
        danger
        isLoading={isClosing}
        onConfirm={handleClose}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
}
