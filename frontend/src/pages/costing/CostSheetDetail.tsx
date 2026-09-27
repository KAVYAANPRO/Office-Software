import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, TrendingUp, TrendingDown } from 'lucide-react';
import { Can } from '../../lib/permissions/Can';

interface CostLine {
  label: string;
  amount: number;
  detail?: string;
}

interface CostSheetData {
  id: string;
  jobSlip: string;
  design: string;
  factory: string;
  date: string;
  type: 'Provisional' | 'Final';
  acceptedQty: number;
  materialLines: CostLine[];
  manufacturingCost: number;
  processingCost: number;
  otherCosts: CostLine[];
  sellingRate: number;
}

// TODO: Replace with API call — GET /api/v1/costing/cost-sheets/:id
const mockSheet: CostSheetData = {
  id: '1',
  jobSlip: 'JS-24-099',
  design: 'DR-1024 — Summer Floral Dress',
  factory: 'Super Stitchers',
  date: '02-10-2026',
  type: 'Final',
  acceptedQty: 290,
  materialLines: [
    { label: 'Cotton Fabric — Navy Blue', amount: 56000, detail: '800 m × ₹70/m' },
    { label: 'Lining Cloth — Black', amount: 17400, detail: '348 m × ₹50/m' },
    { label: 'Buttons — White 12mm', amount: 6750, detail: '2,700 pcs × ₹2.50/pc' },
    { label: 'Thread & Accessories', amount: 1075, detail: 'Misc' },
  ],
  manufacturingCost: 34800,
  processingCost: 0,
  otherCosts: [
    { label: 'Transport (inward)', amount: 1500 },
    { label: 'Quality inspection', amount: 800 },
  ],
  sellingRate: 1250,
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CostSheetDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sheet, setSheet] = useState<CostSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setSheet(mockSheet); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!sheet) return <div className="p-6 text-slate-500">Cost sheet not found.</div>;

  const totalMaterialCost = sheet.materialLines.reduce((s, l) => s + l.amount, 0);
  const totalOtherCost = sheet.otherCosts.reduce((s, l) => s + l.amount, 0);
  const totalProductionCost = totalMaterialCost + sheet.manufacturingCost + sheet.processingCost + totalOtherCost;
  const costPerGarment = sheet.acceptedQty > 0 ? totalProductionCost / sheet.acceptedQty : 0;
  const marginPerGarment = sheet.sellingRate - costPerGarment;
  const marginPct = sheet.sellingRate > 0 ? (marginPerGarment / sheet.sellingRate) * 100 : 0;
  const positiveMargin = marginPerGarment >= 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate('/costing')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">Cost Sheet — {sheet.jobSlip}</h1>
            <Lock size={15} className="text-slate-400" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${sheet.type === 'Final' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {sheet.type}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{sheet.design} · {sheet.factory} · {sheet.date}</p>
        </div>
      </div>

      <Can
        perm="costing.view"
        fallback={
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            You don't have permission to view costing data.
          </div>
        }
      >
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Accepted</div>
          <div className="text-2xl font-bold text-slate-900">{sheet.acceptedQty.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-400">pcs</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Total Cost</div>
          <div className="text-xl font-bold text-slate-900">{inr(totalProductionCost)}</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4 text-center">
          <div className="text-xs text-blue-500 mb-1">Cost / Garment</div>
          <div className="text-xl font-bold text-blue-700">{inr(costPerGarment)}</div>
        </div>
        <div className={`rounded-xl border shadow-sm p-4 text-center ${positiveMargin ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-xs mb-1 ${positiveMargin ? 'text-green-500' : 'text-red-500'}`}>Margin / Garment</div>
          <div className={`text-xl font-bold flex items-center justify-center gap-1 ${positiveMargin ? 'text-green-700' : 'text-red-600'}`}>
            {positiveMargin ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {inr(Math.abs(marginPerGarment))}
          </div>
          <div className={`text-xs font-medium ${positiveMargin ? 'text-green-600' : 'text-red-500'}`}>{marginPct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost Breakdown</div>
        </div>

        {/* Materials */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Material Cost</div>
          <div className="flex flex-col gap-1">
            {sheet.materialLines.map((line, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <div>
                  <span className="text-slate-800">{line.label}</span>
                  {line.detail && <span className="text-xs text-slate-400 ml-2">{line.detail}</span>}
                </div>
                <span className="font-medium text-slate-900">{inr(line.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-slate-100 mt-1">
              <span className="text-slate-600">Material Subtotal</span>
              <span className="text-slate-900">{inr(totalMaterialCost)}</span>
            </div>
          </div>
        </div>

        {/* Manufacturing */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Manufacturing Cost</div>
              <span className="text-slate-800">{sheet.factory}</span>
            </div>
            <span className="font-medium text-slate-900">{inr(sheet.manufacturingCost)}</span>
          </div>
        </div>

        {/* Processing */}
        {sheet.processingCost > 0 && (
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Processing Cost</div>
              </div>
              <span className="font-medium text-slate-900">{inr(sheet.processingCost)}</span>
            </div>
          </div>
        )}

        {/* Other costs */}
        {sheet.otherCosts.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Other Costs</div>
            {sheet.otherCosts.map((line, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-800">{line.label}</span>
                <span className="font-medium text-slate-900">{inr(line.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="px-5 py-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Total Production Cost</span>
            <span className="text-xl font-bold text-slate-900">{inr(totalProductionCost)}</span>
          </div>
        </div>

        {/* Per garment calculation */}
        <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Total Cost ÷ Accepted Qty ({sheet.acceptedQty} pcs)</span>
              <span className="font-bold text-blue-800">{inr(costPerGarment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Selling Rate</span>
              <span className="font-medium text-slate-900">{inr(sheet.sellingRate)}</span>
            </div>
            <div className={`flex justify-between border-t pt-2 ${positiveMargin ? 'border-green-200' : 'border-red-200'}`}>
              <span className={`font-semibold ${positiveMargin ? 'text-green-700' : 'text-red-600'}`}>
                {positiveMargin ? 'Margin' : 'Loss'} per Garment
              </span>
              <span className={`font-bold text-lg ${positiveMargin ? 'text-green-700' : 'text-red-600'}`}>
                {positiveMargin ? '' : '-'}{inr(Math.abs(marginPerGarment))} ({marginPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {sheet.type === 'Provisional' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          This is a <span className="font-semibold">provisional</span> cost sheet. Costs will be finalised once the job is closed and all charges are confirmed.
        </div>
      )}
      </Can>
    </div>
  );
}
