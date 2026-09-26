import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

// TODO: Replace with API call — GET /api/v1/sales/invoices (for balance lookup)
const invoiceLookup: Record<string, { customer: string; total: number; balance: number }> = {
  'INV-26-011': { customer: 'Myntra Wholesale', total: 47880, balance: 47880 },
  'INV-26-012': { customer: 'Lifestyle Stores', total: 448000, balance: 248000 },
  'INV-26-013': { customer: 'Fab India Retail', total: 75000, balance: 75000 },
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PaymentForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [invoiceNo, setInvoiceNo] = useState(params.get('invoiceId') ? 'INV-26-011' : '');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB').split('/').join('-'));
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI'>('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const invoiceInfo = invoiceLookup[invoiceNo] || null;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/sales/payments');
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales/payments')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Record Payment</h1>
          <p className="text-sm text-slate-500">Record a customer payment against an invoice.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Invoice No. *</label>
          <select value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select invoice…</option>
            {Object.entries(invoiceLookup).map(([no, info]) => (
              <option key={no} value={no}>{no} — {info.customer} (Balance: {inr(info.balance)})</option>
            ))}
          </select>
        </div>

        {invoiceInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Invoice Total</span>
              <span className="font-semibold text-blue-900">{inr(invoiceInfo.total)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-blue-700">Outstanding Balance</span>
              <span className="font-bold text-blue-900">{inr(invoiceInfo.balance)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Payment Date *</label>
            <input type="text" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={invoiceInfo ? invoiceInfo.balance.toString() : '0'}
                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {invoiceInfo && amount && Number(amount) > invoiceInfo.balance && (
              <div className="text-xs text-red-600 mt-1">Exceeds outstanding balance</div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Payment Mode *</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Cash', 'Bank Transfer', 'Cheque', 'UPI'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  mode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reference / Cheque No.</label>
          <input type="text" value={reference} onChange={e => setReference(e.target.value)}
            placeholder="NEFT/UTR, cheque number, UPI ref…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate('/sales/payments')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!invoiceNo || !amount || !date || saving}
          className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <CheckCircle size={15} />
          {saving ? 'Saving…' : 'Record Payment'}
        </button>
      </div>
    </div>
  );
}
