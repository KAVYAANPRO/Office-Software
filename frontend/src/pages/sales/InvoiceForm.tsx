import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

interface SOLine {
  id: string;
  designSku: string;
  colour: string;
  size: string;
  qty: number;
  rate: number;
  discount: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
}

interface SalesOrder {
  id: string;
  soNumber: string;
  customer: string;
  customerGstin: string;
  customerState: string;
  date: string;
  lines: SOLine[];
}

// TODO: Replace with API call — GET /api/v1/sales/orders/:id
const mockSO: SalesOrder = {
  id: 'so-1',
  soNumber: 'SO-26-005',
  customer: 'Fab India Retail',
  customerGstin: '27AABCF1234D1ZY',
  customerState: 'Maharashtra',
  date: '26-09-2026',
  lines: [
    { id: 'l1', designSku: 'D-1025 Kurti Set', colour: 'Blue', size: 'M', qty: 20, rate: 1400, discount: 5, taxableValue: 26600, gstRate: 5, cgst: 665, sgst: 665, igst: 0, lineTotal: 27930 },
    { id: 'l2', designSku: 'D-1025 Kurti Set', colour: 'Blue', size: 'L', qty: 15, rate: 1400, discount: 5, taxableValue: 19950, gstRate: 5, cgst: 498.75, sgst: 498.75, igst: 0, lineTotal: 20947.5 },
  ],
};

function fmtINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoiceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const soId = searchParams.get('soId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [so, setSo] = useState<SalesOrder | null>(null);

  const [form, setForm] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    placeOfSupply: '',
    notes: '',
    roundOff: '0',
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setSo(mockSO);
      setForm(prev => ({ ...prev, placeOfSupply: mockSO.customerState }));
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [soId]);

  const subtotal = so?.lines.reduce((s, l) => s + l.taxableValue, 0) ?? 0;
  const totalCgst = so?.lines.reduce((s, l) => s + l.cgst, 0) ?? 0;
  const totalSgst = so?.lines.reduce((s, l) => s + l.sgst, 0) ?? 0;
  const totalIgst = so?.lines.reduce((s, l) => s + l.igst, 0) ?? 0;
  const grandTotal = subtotal + totalCgst + totalSgst + totalIgst + Number(form.roundOff);

  const isSameState = so?.customerState === 'Maharashtra'; // company state

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Replace with API call — POST /api/v1/sales/invoices
    setTimeout(() => {
      setIsSaving(false);
      navigate('/sales/invoices');
    }, 900);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading sales order…</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales/invoices')} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
          {so && <p className="text-sm text-slate-500">From Sales Order: <span className="font-medium text-blue-600">{so.soNumber}</span></p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FileText size={15} className="text-blue-500" /> Invoice Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <input type="text" value={so?.customer ?? ''} disabled
                className="w-full border border-slate-100 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer GSTIN</label>
              <input type="text" value={so?.customerGstin ?? ''} disabled
                className="w-full border border-slate-100 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Date <span className="text-red-500">*</span></label>
              <input type="date" name="invoiceDate" value={form.invoiceDate}
                onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Place of Supply <span className="text-red-500">*</span></label>
              <input type="text" value={form.placeOfSupply}
                onChange={e => setForm(p => ({ ...p, placeOfSupply: e.target.value }))} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            {isSameState
              ? 'Same-state supply → CGST + SGST applicable'
              : 'Inter-state supply → IGST applicable'}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Invoice Lines</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {['Design / SKU', 'Colour', 'Size', 'Qty', 'Rate', 'Disc %', 'Taxable', 'HSN', 'GST %', isSameState ? 'CGST' : 'IGST', isSameState ? 'SGST' : '', 'Line Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {so?.lines.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{l.designSku}</td>
                    <td className="px-4 py-3">{l.colour}</td>
                    <td className="px-4 py-3">{l.size}</td>
                    <td className="px-4 py-3 text-right">{l.qty}</td>
                    <td className="px-4 py-3 text-right">{fmtINR(l.rate)}</td>
                    <td className="px-4 py-3 text-right">{l.discount}%</td>
                    <td className="px-4 py-3 text-right">{fmtINR(l.taxableValue)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">6211</td>
                    <td className="px-4 py-3 text-right">{l.gstRate}%</td>
                    <td className="px-4 py-3 text-right">{fmtINR(isSameState ? l.cgst : l.igst)}</td>
                    {isSameState && <td className="px-4 py-3 text-right">{fmtINR(l.sgst)}</td>}
                    <td className="px-4 py-3 text-right font-medium">{fmtINR(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-end">
            <div className="w-72 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount</span><span>{fmtINR(subtotal)}</span>
              </div>
              {isSameState ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST</span><span>{fmtINR(totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST</span><span>{fmtINR(totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>IGST</span><span>{fmtINR(totalIgst)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-600">
                <span>Round Off</span>
                <input type="number" step="0.01" value={form.roundOff}
                  onChange={e => setForm(p => ({ ...p, roundOff: e.target.value }))}
                  className="w-20 text-right border border-slate-200 rounded px-2 py-0.5 text-sm" />
              </div>
              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-1">
                <span>Grand Total</span><span className="text-blue-700">{fmtINR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
            placeholder="Terms, bank details, additional notes…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60">
            {isSaving ? 'Generating…' : 'Confirm Invoice'}
          </button>
          <button type="button" onClick={() => navigate('/sales/invoices')}
            className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
