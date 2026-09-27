import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';

// Approval threshold: if abs(difference) > 100 units, require approval
const APPROVAL_THRESHOLD = 100;

// TODO: these would come from API — GET /api/v1/stock/raw (current balances)
const mockCurrentStock: Record<string, { quantity: number; unit: string; lot: string }> = {
  'Cotton Fabric — Navy Blue': { quantity: 850, unit: 'm', lot: 'LOT-001' },
  'Lining Cloth — Black': { quantity: 320, unit: 'm', lot: 'LOT-003' },
  'Buttons — White 12mm': { quantity: 1200, unit: 'pcs', lot: 'LOT-004' },
};

export function StockAdjustmentForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    item: '',
    adjustedQty: '',
    reason: '',
    date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const currentStock = mockCurrentStock[formData.item];
  const adjustedNum = parseFloat(formData.adjustedQty) || 0;
  const difference = currentStock ? adjustedNum - currentStock.quantity : 0;
  const needsApproval = Math.abs(difference) > APPROVAL_THRESHOLD;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.item) errs.item = 'Please select a material.';
    if (!formData.adjustedQty) errs.adjustedQty = 'Adjusted quantity is required.';
    else if (adjustedNum < 0) errs.adjustedQty = 'Quantity cannot be negative.';
    if (!formData.reason.trim()) errs.reason = 'Reason is required for all adjustments.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setShowConfirm(true);
  };

  const confirmAdjustment = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setIsLoading(false);
    navigate('/inventory/adjustments');
  };

  const selectClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/inventory/adjustments')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Stock Adjustment</h1>
          <p className="text-sm text-slate-500">Correct physical discrepancies. Every adjustment creates an audit record.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Item selection */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Material *</label>
            <select
              className={`${selectClass} ${errors.item ? 'border-red-400' : ''}`}
              value={formData.item}
              onChange={e => { setFormData(f => ({ ...f, item: e.target.value, adjustedQty: '' })); setErrors({}); }}
            >
              <option value="">— Select material —</option>
              {Object.keys(mockCurrentStock).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            {errors.item && <span className="text-xs text-red-500">{errors.item}</span>}
          </div>

          {/* Current stock display */}
          {currentStock && (
            <div className="bg-slate-50 rounded-lg p-4 flex flex-col gap-2 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Stock</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{currentStock.quantity.toLocaleString('en-IN')}</span>
                <span className="text-slate-500">{currentStock.unit}</span>
                <span className="text-xs font-mono text-slate-400 ml-2">{currentStock.lot}</span>
              </div>
            </div>
          )}

          <Input
            label="Adjusted Quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.adjustedQty}
            onChange={e => setFormData(f => ({ ...f, adjustedQty: e.target.value }))}
            placeholder="Enter corrected quantity"
            error={errors.adjustedQty}
            required
            disabled={!formData.item}
          />

          {/* Live difference preview */}
          {currentStock && formData.adjustedQty && (
            <div className={`rounded-lg p-4 border ${
              difference === 0 ? 'bg-slate-50 border-slate-200' :
              difference < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Effect</div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-slate-700">{currentStock.quantity.toLocaleString('en-IN')} {currentStock.unit}</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-slate-900">{adjustedNum.toLocaleString('en-IN')} {currentStock.unit}</span>
                {difference !== 0 && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${difference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {difference < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {difference > 0 ? '+' : ''}{difference.toLocaleString('en-IN')} {currentStock.unit}
                  </span>
                )}
              </div>

              {needsApproval && (
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-700">
                  <AlertTriangle size={13} />
                  This adjustment exceeds the approval threshold ({APPROVAL_THRESHOLD} {currentStock.unit}). It will require manager approval before posting.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Reason *</label>
            <textarea
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.reason ? 'border-red-400' : 'border-slate-200'}`}
              rows={3}
              value={formData.reason}
              onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))}
              placeholder="Explain why this adjustment is needed (e.g. physical count, damage, entry error)..."
            />
            {errors.reason && <span className="text-xs text-red-500">{errors.reason}</span>}
          </div>

          <Input
            label="Adjustment Date"
            type="text"
            value={formData.date}
            onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
            placeholder="DD-MM-YYYY"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {needsApproval ? 'Submit for Approval' : 'Post Adjustment'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/inventory/adjustments')}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Confirmation dialog */}
      {currentStock && (
        <ConfirmDialog
          open={showConfirm}
          title="Confirm Stock Adjustment"
          impact={
            <>
              {formData.item}: <strong>{currentStock.quantity} {currentStock.unit}</strong> → <strong>{adjustedNum} {currentStock.unit}</strong>{' '}
              (<span className={difference < 0 ? 'text-red-600' : 'text-green-600'}>{difference > 0 ? '+' : ''}{difference} {currentStock.unit}</span>).
              {needsApproval && (
                <>
                  {' '}<AlertTriangle size={12} className="inline text-orange-700 -mt-0.5" /> This exceeds the approval threshold and will be sent for manager approval before posting.
                </>
              )}
            </>
          }
          confirmLabel={needsApproval ? 'Submit for Approval' : 'Confirm & Post'}
          isLoading={isLoading}
          onConfirm={confirmAdjustment}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
