import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface MaterialLine {
  material: string;
  unit: string;
  qtyPerGarment: number;
  allowancePct: number;
  available: number;
}

// TODO: Replace with API call — GET /api/v1/materials/stock
const mockBOMByDesign: Record<string, MaterialLine[]> = {
  'DR-1024': [
    { material: 'Cotton Fabric — Navy Blue', unit: 'm', qtyPerGarment: 2.5, allowancePct: 5, available: 800 },
    { material: 'Lining Cloth — Black', unit: 'm', qtyPerGarment: 1.2, allowancePct: 3, available: 320 },
    { material: 'Buttons — White 12mm', unit: 'pcs', qtyPerGarment: 8, allowancePct: 10, available: 1200 },
  ],
  'KU-5501': [
    { material: 'Cotton Fabric — Ivory White', unit: 'm', qtyPerGarment: 2.0, allowancePct: 5, available: 45 },
    { material: 'Lining Cloth — Black', unit: 'm', qtyPerGarment: 0.8, allowancePct: 3, available: 320 },
  ],
};

const mockDesigns = [
  { id: 'DR-1024', name: 'DR-1024 — Summer Floral Dress' },
  { id: 'KU-5501', name: 'KU-5501 — Cotton Block Print Kurti' },
];

const selectClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

export function ProductionRequirementForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    design: '',
    colour: '',
    size: '',
    quantity: '',
    plannedStartDate: '',
    plannedEndDate: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const qty = parseInt(form.quantity) || 0;
  const bom = mockBOMByDesign[form.design] ?? [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.design) e.design = 'Select a design.';
    if (!form.colour.trim()) e.colour = 'Colour is required.';
    if (!form.quantity || qty <= 0) e.quantity = 'Enter a valid quantity.';
    if (!form.plannedStartDate) e.plannedStartDate = 'Planned start date is required.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    navigate('/production/requirements');
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/production/requirements')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Requirement' : 'New Production Requirement'}</h1>
          <p className="text-sm text-slate-500">Define what to produce and how many. Stock availability is checked against the BOM.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Design + Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Production Plan</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Design *</label>
            <select
              className={`${selectClass} ${errors.design ? 'border-red-400' : ''}`}
              value={form.design}
              onChange={e => { setForm(f => ({ ...f, design: e.target.value })); setErrors({}); }}
            >
              <option value="">— Select design —</option>
              {mockDesigns.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.design && <span className="text-xs text-red-500">{errors.design}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Colour *"
              value={form.colour}
              onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}
              placeholder="e.g. Navy Blue"
              error={errors.colour}
            />
            <Input
              label="Size(s)"
              value={form.size}
              onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
              placeholder="e.g. S, M, L or All"
            />
            <Input
              label="Quantity (pcs) *"
              type="number"
              min="1"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 100"
              error={errors.quantity}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Planned Start Date *"
              type="text"
              value={form.plannedStartDate}
              onChange={e => setForm(f => ({ ...f, plannedStartDate: e.target.value }))}
              placeholder="DD-MM-YYYY"
              error={errors.plannedStartDate}
            />
            <Input
              label="Planned End Date"
              type="text"
              value={form.plannedEndDate}
              onChange={e => setForm(f => ({ ...f, plannedEndDate: e.target.value }))}
              placeholder="DD-MM-YYYY"
            />
          </div>
        </div>

        {/* Material Requirement Calculation */}
        {form.design && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-slate-900">Material Requirements</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {qty > 0
                  ? `Calculated for ${qty.toLocaleString('en-IN')} garments from BOM.`
                  : 'Enter a quantity above to see required materials.'}
              </p>
            </div>

            {bom.length === 0 ? (
              <p className="text-sm text-slate-400">No BOM defined for this design. Add materials in the Design detail.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {bom.map((line, i) => {
                  const required = qty > 0 ? Math.ceil(qty * line.qtyPerGarment * (1 + line.allowancePct / 100)) : 0;
                  const shortage = line.available - required;
                  const ok = shortage >= 0;
                  const partialOk = shortage < 0 && line.available > 0;

                  return (
                    <div key={i} className={`rounded-lg p-4 border ${ok ? 'bg-green-50 border-green-200' : partialOk ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{line.material}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {line.qtyPerGarment} {line.unit}/garment · {line.allowancePct}% allowance
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${ok ? 'text-green-700' : partialOk ? 'text-orange-700' : 'text-red-700'}`}>
                          {ok
                            ? <><CheckCircle size={14} /> Available</>
                            : partialOk
                            ? <><AlertTriangle size={14} /> Partial shortfall</>
                            : <><XCircle size={14} /> Out of stock</>
                          }
                        </div>
                      </div>

                      {qty > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white/60 rounded p-2">
                            <div className="text-slate-400 mb-0.5">Required</div>
                            <div className="font-bold text-slate-900">{required.toLocaleString('en-IN')} {line.unit}</div>
                          </div>
                          <div className="bg-white/60 rounded p-2">
                            <div className="text-slate-400 mb-0.5">Available</div>
                            <div className="font-bold text-slate-900">{line.available.toLocaleString('en-IN')} {line.unit}</div>
                          </div>
                          <div className="bg-white/60 rounded p-2">
                            <div className="text-slate-400 mb-0.5">{ok ? 'Surplus' : 'Shortfall'}</div>
                            <div className={`font-bold ${ok ? 'text-green-700' : 'text-red-600'}`}>
                              {ok ? '+' : ''}{shortage.toLocaleString('en-IN')} {line.unit}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={isSaving}>Save Requirement</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/production/requirements')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
