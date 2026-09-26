import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface OrderLine {
  id: string;
  design: string;
  designNo: string;
  colour: string;
  size: string;
  onHand: number;
  reserved: number;
  atp: number;
  qty: number;
  rate: number;
  discountPct: number;
  taxPct: number;
}

// TODO: Replace with API call — GET /api/v1/ready-stock (for ATP check)
const stockLookup: Record<string, { onHand: number; reserved: number; atp: number }> = {
  'DR-1024-Navy Blue-S': { onHand: 60, reserved: 10, atp: 50 },
  'DR-1024-Navy Blue-M': { onHand: 80, reserved: 20, atp: 60 },
  'DR-1024-Navy Blue-L': { onHand: 55, reserved: 5, atp: 50 },
  'DR-1024-Navy Blue-XL': { onHand: 45, reserved: 0, atp: 45 },
  'KU-5501-Ivory White-M': { onHand: 70, reserved: 15, atp: 55 },
  'KU-5501-Ivory White-L': { onHand: 50, reserved: 8, atp: 42 },
};

const designOptions = [
  { designNo: 'DR-1024', design: 'Summer Floral Dress', colours: ['Navy Blue', 'Ivory White'], sizes: ['S', 'M', 'L', 'XL'] },
  { designNo: 'KU-5501', design: 'Cotton Block Print Kurti', colours: ['Ivory White'], sizes: ['M', 'L', 'XL'] },
];

// TODO: Replace with API call — GET /api/v1/masters/customers
const customerOptions = ['Fab India Retail', 'Myntra Wholesale', 'Lifestyle Stores', 'Pantaloons'];

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let lineId = 1;

export function SalesOrderForm() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB').split('/').join('-'));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const addLine = () => {
    setLines(prev => [...prev, {
      id: String(lineId++),
      design: '',
      designNo: '',
      colour: '',
      size: '',
      onHand: 0,
      reserved: 0,
      atp: 0,
      qty: 0,
      rate: 0,
      discountPct: 0,
      taxPct: 5,
    }]);
  };

  const updateLine = (id: string, field: keyof OrderLine, value: string | number) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };

      if (field === 'designNo') {
        const d = designOptions.find(d => d.designNo === value);
        if (d) { updated.design = d.design; updated.colour = ''; updated.size = ''; }
        updated.onHand = 0; updated.reserved = 0; updated.atp = 0;
      }

      if (field === 'colour' || field === 'size' || field === 'designNo') {
        const key = `${updated.designNo}-${updated.colour}-${updated.size}`;
        const stock = stockLookup[key];
        if (stock) {
          updated.onHand = stock.onHand;
          updated.reserved = stock.reserved;
          updated.atp = stock.atp;
        } else {
          updated.onHand = 0; updated.reserved = 0; updated.atp = 0;
        }
      }
      return updated;
    }));
  };

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  const lineAmount = (l: OrderLine) => {
    const base = l.qty * l.rate * (1 - l.discountPct / 100);
    return base;
  };
  const lineTax = (l: OrderLine) => lineAmount(l) * (l.taxPct / 100);
  const lineTotal = (l: OrderLine) => lineAmount(l) + lineTax(l);

  const subtotal = lines.reduce((s, l) => s + lineAmount(l), 0);
  const taxTotal = lines.reduce((s, l) => s + lineTax(l), 0);
  const grandTotal = subtotal + taxTotal;

  const hasAtpViolation = lines.some(l => l.qty > l.atp && l.atp > 0);
  const hasZeroAtp = lines.some(l => l.atp === 0 && l.designNo && l.colour && l.size);

  const handleSave = (confirm: boolean) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/sales/orders');
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/sales/orders')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Sales Order</h1>
          <p className="text-sm text-slate-500">Confirming reserves ATP. Stock on-hand is deducted only when invoiced.</p>
        </div>
      </div>

      {/* Header fields */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customer *</label>
            <select value={customer} onChange={e => setCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select customer…</option>
              {customerOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
            <input type="text" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* ATP Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
        <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          ATP (Available-to-Promise) = On Hand − Reserved. Confirming this order will reserve the ordered quantities without reducing physical stock.
        </p>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Line Items</span>
          <button onClick={addLine} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-800">
            <Plus size={14} /> Add Line
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 text-sm">
            No lines yet. Click "Add Line" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Design</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Colour</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Size</th>
                  <th className="px-3 py-2 text-center text-xs text-slate-500 font-medium">ATP</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Qty</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Rate (₹)</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Disc %</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Tax %</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Amount</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => {
                  const designInfo = designOptions.find(d => d.designNo === l.designNo);
                  const atpWarning = l.qty > l.atp && l.atp > 0;
                  const noStock = l.atp === 0 && l.designNo && l.colour && l.size;
                  return (
                    <tr key={l.id} className={`border-b border-slate-100 last:border-0 ${atpWarning ? 'bg-amber-50' : noStock ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2">
                        <select value={l.designNo} onChange={e => updateLine(l.id, 'designNo', e.target.value)}
                          className="w-36 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
                          <option value="">Select…</option>
                          {designOptions.map(d => <option key={d.designNo} value={d.designNo}>{d.designNo}</option>)}
                        </select>
                        {l.design && <div className="text-xs text-slate-400 mt-0.5">{l.design}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.colour} onChange={e => updateLine(l.id, 'colour', e.target.value)}
                          disabled={!designInfo}
                          className="w-28 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50">
                          <option value="">—</option>
                          {designInfo?.colours.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.size} onChange={e => updateLine(l.id, 'size', e.target.value)}
                          disabled={!l.colour}
                          className="w-16 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50">
                          <option value="">—</option>
                          {designInfo?.sizes.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {l.designNo && l.colour && l.size ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-xs font-bold ${l.atp > 0 ? 'text-green-700' : 'text-red-600'}`}>{l.atp}</span>
                            <span className="text-[10px] text-slate-400">of {l.onHand}</span>
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.qty || ''} onChange={e => updateLine(l.id, 'qty', Number(e.target.value))}
                          className={`w-16 px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 ${atpWarning ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`} />
                        {atpWarning && <div className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5"><AlertTriangle size={9} /> Exceeds ATP</div>}
                        {noStock && <div className="text-[10px] text-red-600 mt-0.5">No stock</div>}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.rate || ''} onChange={e => updateLine(l.id, 'rate', Number(e.target.value))}
                          className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} max={100} value={l.discountPct || ''} onChange={e => updateLine(l.id, 'discountPct', Number(e.target.value))}
                          className="w-14 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.taxPct} onChange={e => updateLine(l.id, 'taxPct', Number(e.target.value))}
                          className="w-16 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
                          {[0, 5, 12, 18, 28].map(t => <option key={t} value={t}>{t}%</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900 whitespace-nowrap">{inr(lineTotal(l))}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeLine(l.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={8} className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Subtotal</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">{inr(subtotal)}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={8} className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Tax</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">{inr(taxTotal)}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={8} className="px-3 py-2 text-right text-sm font-bold text-slate-700">Grand Total</td>
                  <td className="px-3 py-2 text-right text-lg font-bold text-slate-900 whitespace-nowrap">{inr(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ATP Warning */}
      {(hasAtpViolation || hasZeroAtp) && (
        <div className={`rounded-xl border px-4 py-3 flex items-start gap-2 ${hasZeroAtp ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${hasZeroAtp ? 'text-red-500' : 'text-amber-500'}`} />
          <p className={`text-sm ${hasZeroAtp ? 'text-red-800' : 'text-amber-800'}`}>
            {hasZeroAtp
              ? 'Some lines have no stock available. You can save as Draft but cannot confirm until ATP is available.'
              : 'Some line quantities exceed current ATP. Review quantities or proceed with backorder.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate('/sales/orders')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={!customer || lines.length === 0 || saving}
            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-medium"
          >
            Save as Draft
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!customer || lines.length === 0 || hasZeroAtp || saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            <CheckCircle size={15} /> Confirm Order
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Sales Order</h3>
            <p className="text-sm text-slate-600 mb-4">
              Confirming will <strong>reserve {lines.reduce((s, l) => s + l.qty, 0)} pieces</strong> across {lines.length} line(s) for <strong>{customer}</strong>.
              <br /><br />
              Total: <strong>{inr(grandTotal)}</strong>
              <br /><br />
              Stock on-hand is <strong>not reduced</strong> until invoiced.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => { setShowConfirm(false); handleSave(true); }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
