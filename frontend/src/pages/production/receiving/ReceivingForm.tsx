import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface RowEntry {
  colour: string;
  size: string;
  expected: number;
  accepted: number;
  rejected: number;
  damaged: number;
}

// TODO: Replace with API call — GET /api/v1/production/job-slips (open slips)
const mockJobSlips = [
  { id: 'JS-24-101', factory: 'Super Stitchers', design: 'DR-1024 — Summer Floral Dress', expected: 500 },
  { id: 'JS-24-102', factory: 'Krishna Dyeing Works', design: 'KU-5501 — Cotton Block Print Kurti', expected: 200 },
];

const selectClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

function emptyRow(): RowEntry {
  return { colour: '', size: '', expected: 0, accepted: 0, rejected: 0, damaged: 0 };
}

export function ReceivingForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({ jobSlip: '', date: '', mfgCharges: '', remarks: '' });
  const [rows, setRows] = useState<RowEntry[]>([emptyRow()]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSlip = mockJobSlips.find(s => s.id === form.jobSlip);

  const addRow = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof RowEntry, val: string | number) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const totals = rows.reduce(
    (acc, r) => ({ expected: acc.expected + r.expected, accepted: acc.accepted + r.accepted, rejected: acc.rejected + r.rejected, damaged: acc.damaged + r.damaged }),
    { expected: 0, accepted: 0, rejected: 0, damaged: 0 }
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.jobSlip) e.jobSlip = 'Select a job slip.';
    if (!form.date) e.date = 'Date is required.';
    if (rows.some(r => !r.colour || !r.size)) e.rows = 'All rows need colour and size.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setIsSaving(false);
    navigate('/production/receiving');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/production/receiving')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Receiving' : 'New Finished Goods Receiving'}</h1>
          <p className="text-sm text-slate-500">Record accepted, rejected, and damaged quantities by colour and size.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Receiving Details</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Job Slip *</label>
            <select
              className={`${selectClass} ${errors.jobSlip ? 'border-red-400' : ''}`}
              value={form.jobSlip}
              onChange={e => { setForm(f => ({ ...f, jobSlip: e.target.value })); setErrors({}); }}
            >
              <option value="">— Select job slip —</option>
              {mockJobSlips.map(s => <option key={s.id} value={s.id}>{s.id} — {s.factory} — {s.design}</option>)}
            </select>
            {errors.jobSlip && <span className="text-xs text-red-500">{errors.jobSlip}</span>}
          </div>

          {selectedSlip && (
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm flex flex-wrap gap-4">
              <div><span className="text-slate-400">Factory:</span> <span className="font-medium text-slate-800">{selectedSlip.factory}</span></div>
              <div><span className="text-slate-400">Design:</span> <span className="font-medium text-slate-800">{selectedSlip.design}</span></div>
              <div><span className="text-slate-400">Expected:</span> <span className="font-semibold text-slate-900">{selectedSlip.expected} pcs</span></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Receiving Date *" type="text" placeholder="DD-MM-YYYY" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} error={errors.date} />
            <Input label="Mfg. Charges (₹)" type="number" min="0" step="0.01" value={form.mfgCharges} onChange={e => setForm(f => ({ ...f, mfgCharges: e.target.value }))} placeholder="0.00" />
            <Input label="Remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" />
          </div>
        </div>

        {/* Qty by colour & size */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Quantity by Colour & Size</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enter each colour/size combination separately.</p>
            </div>
            <Button type="button" variant="outline" onClick={addRow}>
              <Plus size={14} /> Add Row
            </Button>
          </div>

          {errors.rows && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {errors.rows}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Colour', 'Size', 'Expected', 'Accepted', 'Rejected', 'Damaged', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-2">
                      <input className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Navy Blue" value={row.colour} onChange={e => updateRow(i, 'colour', e.target.value)} />
                    </td>
                    <td className="px-2 py-2 w-20">
                      <input className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="M" value={row.size} onChange={e => updateRow(i, 'size', e.target.value)} />
                    </td>
                    {(['expected', 'accepted', 'rejected', 'damaged'] as const).map(field => (
                      <td key={field} className="px-2 py-2 w-24">
                        <input
                          type="number" min="0"
                          className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right ${
                            field === 'accepted' ? 'border-green-200 bg-green-50' :
                            field === 'rejected' || field === 'damaged' ? 'border-red-200 bg-red-50' :
                            'border-slate-200'
                          }`}
                          value={row[field] === 0 ? '' : row[field]}
                          onChange={e => updateRow(i, field, parseInt(e.target.value) || 0)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2 w-10">
                      <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1} className="flex items-center justify-center w-7 h-7 rounded text-red-400 hover:bg-red-50 disabled:opacity-30">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-3 py-2 font-semibold text-xs text-slate-500 uppercase" colSpan={2}>Totals</td>
                  {(['expected', 'accepted', 'rejected', 'damaged'] as const).map(f => (
                    <td key={f} className="px-3 py-2 font-bold text-slate-900 text-right text-sm">{totals[f].toLocaleString('en-IN')}</td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Inventory impact preview */}
          {totals.accepted > 0 || totals.rejected > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                After confirmation: <span className="font-semibold text-green-700">{totals.accepted} pcs → Ready Stock</span>
                {totals.rejected + totals.damaged > 0 && (
                  <>, <span className="font-semibold text-red-600">{totals.rejected + totals.damaged} pcs → Quarantine</span></>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={isSaving}>Save Receiving</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/production/receiving')}>Cancel</Button>
        </div>
      </form>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Confirm Receiving</h2>
            <div className="bg-slate-50 rounded-lg p-4 text-sm flex flex-col gap-2">
              <div><span className="text-slate-500">Job Slip:</span> <span className="font-medium">{form.jobSlip}</span></div>
              <div><span className="text-green-600 font-medium">{totals.accepted} pcs accepted</span> → Ready Stock</div>
              {totals.rejected + totals.damaged > 0 && (
                <div><span className="text-red-500 font-medium">{totals.rejected + totals.damaged} pcs rejected/damaged</span> → Quarantine</div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={confirmSave} className="flex-1">Confirm & Post</Button>
              <Button variant="secondary" onClick={() => setShowConfirm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
