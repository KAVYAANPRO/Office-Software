import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';

const mockFactories = [
  { id: 'f1', name: 'Krishna Dyeing Works' },
  { id: 'f2', name: 'Artex Printing House' },
  { id: 'f3', name: 'Fine Embroidery Works' },
];

const mockProcessTypes = ['Dyeing', 'Printing', 'Embroidery', 'Washing', 'Finishing'];

const mockMaterials = [
  { id: 'm1', name: 'Cotton Fabric - White' },
  { id: 'm2', name: 'Dupatta Fabric - White' },
  { id: 'm3', name: 'Poly Blend - Green' },
  { id: 'm4', name: 'Silk Fabric - White' },
];

interface FormData {
  processType: string;
  factoryId: string;
  inputMaterialId: string;
  inputQty: string;
  inputUnit: string;
  outputMaterialName: string;
  expectedOutputQty: string;
  processingCharges: string;
  chargeBasis: 'per_metre' | 'per_kg' | 'lump_sum';
  issueDate: string;
  expectedReturnDate: string;
  notes: string;
  // Receiving fields (only shown when editing and status allows)
  actualOutputQty: string;
  shortageReason: string;
}

export function ProcessingJobForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  const [form, setForm] = useState<FormData>({
    processType: '',
    factoryId: '',
    inputMaterialId: '',
    inputQty: '',
    inputUnit: 'm',
    outputMaterialName: '',
    expectedOutputQty: '',
    processingCharges: '',
    chargeBasis: 'per_metre',
    issueDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
    actualOutputQty: '',
    shortageReason: '',
  });

  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => {
        setForm({
          processType: 'Dyeing',
          factoryId: 'f1',
          inputMaterialId: 'm1',
          inputQty: '200',
          inputUnit: 'm',
          outputMaterialName: 'Cotton Fabric - Blue',
          expectedOutputQty: '195',
          processingCharges: '18',
          chargeBasis: 'per_metre',
          issueDate: '2026-09-05',
          expectedReturnDate: '2026-09-12',
          notes: '',
          actualOutputQty: '',
          shortageReason: '',
        });
        setIsReceiving(true);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const shortage = form.actualOutputQty && form.inputQty
    ? Number(form.inputQty) - Number(form.actualOutputQty)
    : null;
  const shortagePercent = shortage != null && Number(form.inputQty) > 0
    ? ((shortage / Number(form.inputQty)) * 100).toFixed(2)
    : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Replace with API call — POST /api/v1/production/processing-jobs
    setTimeout(() => {
      setIsSaving(false);
      navigate('/production/processing');
    }, 800);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/production/processing')} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Processing Job' : 'New Processing Job'}</h1>
          <p className="text-sm text-slate-500">Track material sent for dyeing, printing, or other processing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Job Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FlaskConical size={15} className="text-blue-500" /> Job Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Process Type <span className="text-red-500">*</span></label>
              <select name="processType" value={form.processType} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select process type</option>
                {mockProcessTypes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Factory / Artisan <span className="text-red-500">*</span></label>
              <select name="factoryId" value={form.factoryId} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select factory</option>
                {mockFactories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date <span className="text-red-500">*</span></label>
              <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Return Date <span className="text-red-500">*</span></label>
              <input type="date" name="expectedReturnDate" value={form.expectedReturnDate} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Input Material */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Input Material</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Material <span className="text-red-500">*</span></label>
              <select name="inputMaterialId" value={form.inputMaterialId} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select material to send</option>
                {mockMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity <span className="text-red-500">*</span></label>
              <div className="flex gap-1">
                <input type="number" name="inputQty" value={form.inputQty} onChange={handleChange} required min="0" step="0.001" placeholder="0.000"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select name="inputUnit" value={form.inputUnit} onChange={handleChange}
                  className="w-16 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="m">m</option>
                  <option value="kg">kg</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Output Material */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Output / Processed Material</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Output Material Name <span className="text-red-500">*</span></label>
              <input type="text" name="outputMaterialName" value={form.outputMaterialName} onChange={handleChange} required
                placeholder="e.g. Cotton Fabric - Blue"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Output Qty <span className="text-red-500">*</span></label>
              <input type="number" name="expectedOutputQty" value={form.expectedOutputQty} onChange={handleChange} required min="0" step="0.001" placeholder="0.000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Charges */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Processing Charges</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Charge Basis</label>
              <select name="chargeBasis" value={form.chargeBasis} onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="per_metre">Per Metre</option>
                <option value="per_kg">Per Kg</option>
                <option value="lump_sum">Lump Sum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rate (₹ {form.chargeBasis === 'lump_sum' ? 'total' : `/${form.chargeBasis.replace('per_', '')}`})
              </label>
              <input type="number" name="processingCharges" value={form.processingCharges} onChange={handleChange} min="0" step="0.01" placeholder="0.00"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {form.processingCharges && form.inputQty && form.chargeBasis !== 'lump_sum' && (
            <p className="text-xs text-slate-500 mt-2">
              Estimated charge: ₹{(Number(form.processingCharges) * Number(form.inputQty)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Receiving section (edit mode) */}
        {isEditing && isReceiving && (
          <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-amber-700 mb-4">Record Receipt</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actual Quantity Received</label>
                <input type="number" name="actualOutputQty" value={form.actualOutputQty} onChange={handleChange} min="0" step="0.001" placeholder="0.000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {shortage != null && (
                <div className="flex flex-col gap-1 justify-end pb-2">
                  <span className="text-xs text-slate-500">Shortage: <strong>{shortage.toFixed(3)} m</strong></span>
                  <span className={`text-xs font-medium ${Number(shortagePercent) > 5 ? 'text-red-600' : 'text-slate-600'}`}>
                    Shortage %: {shortagePercent}%
                  </span>
                </div>
              )}
              {shortage != null && Number(shortagePercent) > 0 && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shortage Reason</label>
                  <input type="text" name="shortageReason" value={form.shortageReason} onChange={handleChange} placeholder="Reason for shortage…"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Additional notes…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60">
            {isSaving ? 'Saving…' : isEditing ? 'Update Job' : 'Create Processing Job'}
          </button>
          <button type="button" onClick={() => navigate('/production/processing')}
            className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
