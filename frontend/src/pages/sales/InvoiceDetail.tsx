import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, CreditCard, Ban } from 'lucide-react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Can } from '../../lib/permissions/Can';
import { appendStockLedger, appendAuditLog } from '../../lib/mock/db';

interface InvoiceLine {
  id: string;
  design: string;
  designNo: string;
  colour: string;
  size: string;
  hsnCode: string;
  qty: number;
  rate: number;
  discountPct: number;
  discountAmt: number;
  taxableAmt: number;
  cgstPct: number;
  cgstAmt: number;
  sgstPct: number;
  sgstAmt: number;
  igstPct: number;
  igstAmt: number;
  lineTotal: number;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  date: string;
  soNo: string;
  customer: string;
  customerAddress: string;
  customerGstin: string;
  placeOfSupply: string;
  supplierGstin: string;
  isInterstate: boolean;
  lines: InvoiceLine[];
  subtotal: number;
  totalDiscount: number;
  taxableAmt: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  finalAmt: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  paidAmt: number;
  balanceAmt: number;
  payments: { id: string; date: string; amount: number; mode: string; reference: string }[];
  status: 'Confirmed' | 'Cancelled';
  totalQty: number;
}

// TODO: Replace with API call — GET /api/v1/sales/invoices/:id
const mockInvoice: InvoiceData = {
  id: '1',
  invoiceNo: 'INV-26-010',
  date: '20-09-2026',
  soNo: 'SO-26-001',
  customer: 'Fab India Retail Pvt Ltd',
  customerAddress: '42 MG Road, Bengaluru, Karnataka — 560001',
  customerGstin: '29AABCF1234R1ZX',
  placeOfSupply: 'Karnataka (29)',
  supplierGstin: '27AABCU9603R1ZP',
  isInterstate: true,
  lines: [
    {
      id: '1', design: 'Summer Floral Dress', designNo: 'DR-1024', colour: 'Navy Blue', size: 'S',
      hsnCode: '62044200', qty: 60, rate: 1200, discountPct: 5, discountAmt: 3600,
      taxableAmt: 68400, cgstPct: 0, cgstAmt: 0, sgstPct: 0, sgstAmt: 0, igstPct: 5, igstAmt: 3420, lineTotal: 71820,
    },
    {
      id: '2', design: 'Summer Floral Dress', designNo: 'DR-1024', colour: 'Navy Blue', size: 'M',
      hsnCode: '62044200', qty: 80, rate: 1200, discountPct: 5, discountAmt: 4800,
      taxableAmt: 91200, cgstPct: 0, cgstAmt: 0, sgstPct: 0, sgstAmt: 0, igstPct: 5, igstAmt: 4560, lineTotal: 95760,
    },
    {
      id: '3', design: 'Summer Floral Dress', designNo: 'DR-1024', colour: 'Navy Blue', size: 'L',
      hsnCode: '62044200', qty: 55, rate: 1200, discountPct: 5, discountAmt: 3300,
      taxableAmt: 62700, cgstPct: 0, cgstAmt: 0, sgstPct: 0, sgstAmt: 0, igstPct: 5, igstAmt: 3135, lineTotal: 65835,
    },
  ],
  subtotal: 264000,
  totalDiscount: 13200,
  taxableAmt: 222300,
  cgstTotal: 0,
  sgstTotal: 0,
  igstTotal: 11115,
  roundOff: -0.15,
  finalAmt: 233415,
  paymentStatus: 'Paid',
  paidAmt: 233415,
  balanceAmt: 0,
  payments: [
    { id: 'p1', date: '22-09-2026', amount: 233415, mode: 'Bank Transfer', reference: 'NEFT/REF2026092201' },
  ],
  status: 'Confirmed',
  totalQty: 195,
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const payStatusCls: Record<InvoiceData['paymentStatus'], string> = {
  Unpaid: 'bg-red-100 text-red-700',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Paid: 'bg-green-100 text-green-700',
};

export function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setInvoice(mockInvoice); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!invoice) return <div className="p-6 text-slate-500">Invoice not found.</div>;

  const handleCancelInvoice = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    // SAL-08 / BR-09: cancelling reverses the sale's stock movement with a new
    // reversal entry and keeps the invoice number — it never deletes the original.
    await appendStockLedger({
      date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
      type: 'Reversal',
      itemName: `${invoice.lines[0]?.design ?? 'Invoice items'} (${invoice.totalQty} pcs)`,
      quantity: invoice.totalQty,
      unit: 'pcs',
      fromLocation: 'Customer (virtual)',
      toLocation: 'Main Warehouse',
      reference: invoice.invoiceNo,
      user: 'Karan (Sales)',
      remarks: `Invoice cancelled — reason: ${cancelReason.trim()}`,
    });
    await appendAuditLog({
      user: 'Karan (Sales)', module: 'Invoices', action: 'Cancelled', recordId: invoice.invoiceNo,
      previousValue: 'Confirmed', newValue: `Cancelled — ${cancelReason.trim()}`,
    });
    setInvoice(prev => (prev ? { ...prev, status: 'Cancelled' } : prev));
    setIsCancelling(false);
    setCancelOpen(false);
    setCancelReason('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate('/sales/invoices')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{invoice.invoiceNo}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'Cancelled' ? 'bg-red-100 text-red-700' : payStatusCls[invoice.paymentStatus]}`}>
              {invoice.status === 'Cancelled' ? 'Cancelled' : invoice.paymentStatus}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {invoice.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{invoice.customer} · {invoice.date} · SO: {invoice.soNo}</p>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'Confirmed' && invoice.paymentStatus !== 'Paid' && (
            <button onClick={() => navigate(`/sales/payments/new?invoiceId=${invoice.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              <CreditCard size={15} /> Record Payment
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">
            <Printer size={15} /> Print
          </button>
          {invoice.status === 'Confirmed' && (
            <Can perm="invoices.cancel">
              <button onClick={() => setCancelOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50">
                <Ban size={15} /> Cancel Invoice
              </button>
            </Can>
          )}
        </div>
      </div>

      {invoice.status === 'Cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
          This invoice was cancelled. Its stock effect has been reversed with a new ledger entry — the original invoice and its number are kept, never deleted (BR-09).
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        danger
        title="Cancel Invoice"
        confirmLabel="Cancel Invoice"
        isLoading={isCancelling}
        confirmDisabled={!cancelReason.trim()}
        onCancel={() => { setCancelOpen(false); setCancelReason(''); }}
        onConfirm={handleCancelInvoice}
        impact={
          <div className="flex flex-col gap-2">
            <p>
              Cancelling <strong>{invoice.invoiceNo}</strong> will reverse the stock deduction —{' '}
              <strong>{invoice.totalQty} pcs</strong> return to Main Warehouse — and mark the invoice Cancelled.
              The invoice number is kept and the original record is never deleted.
            </p>
            <label className="text-xs font-medium text-slate-600">Reason (required)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
              placeholder="e.g. Customer returned full order"
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        }
      />

      {/* Tax invoice card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Invoice header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-lg font-bold text-slate-900">TAX INVOICE</div>
              <div className="text-sm text-slate-500 mt-0.5">GSTIN: {invoice.supplierGstin}</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-slate-900">{invoice.invoiceNo}</div>
              <div className="text-sm text-slate-500">{invoice.date}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Bill To</div>
              <div className="font-semibold text-slate-900">{invoice.customer}</div>
              <div className="text-slate-600">{invoice.customerAddress}</div>
              <div className="text-slate-500 text-xs mt-1">GSTIN: {invoice.customerGstin}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Details</div>
              <div className="text-slate-700"><span className="font-medium">Place of Supply:</span> {invoice.placeOfSupply}</div>
              <div className="text-slate-700"><span className="font-medium">SO Reference:</span> {invoice.soNo}</div>
              <div className="text-slate-700"><span className="font-medium">Tax Type:</span> {invoice.isInterstate ? 'IGST' : 'CGST + SGST'}</div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-3 py-2 text-left text-xs text-slate-500 font-semibold">#</th>
                <th className="px-3 py-2 text-left text-xs text-slate-500 font-semibold">Item Description</th>
                <th className="px-3 py-2 text-left text-xs text-slate-500 font-semibold">HSN</th>
                <th className="px-3 py-2 text-center text-xs text-slate-500 font-semibold">Qty</th>
                <th className="px-3 py-2 text-right text-xs text-slate-500 font-semibold">Rate</th>
                <th className="px-3 py-2 text-right text-xs text-slate-500 font-semibold">Disc.</th>
                <th className="px-3 py-2 text-right text-xs text-slate-500 font-semibold">Taxable</th>
                {invoice.isInterstate ? (
                  <th className="px-3 py-2 text-right text-xs text-slate-500 font-semibold">IGST</th>
                ) : (
                  <>
                    <th className="px-3 py-2 text-right text-xs text-slate-500 font-semibold">CGST</th>
                    <th className="px-3 py-2 text-right text-xs text-slate-500 font-semibold">SGST</th>
                  </>
                )}
                <th className="px-3 py-2 text-right text-xs text-slate-500 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l, idx) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{l.design} / {l.colour} / {l.size}</div>
                    <div className="text-xs text-slate-400 font-mono">{l.designNo}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-600">{l.hsnCode}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{l.qty}</td>
                  <td className="px-3 py-3 text-right text-slate-700">{inr(l.rate)}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{inr(l.discountAmt)}</td>
                  <td className="px-3 py-3 text-right font-medium text-slate-900">{inr(l.taxableAmt)}</td>
                  {invoice.isInterstate ? (
                    <td className="px-3 py-3 text-right text-slate-700">
                      <div>{inr(l.igstAmt)}</div>
                      <div className="text-xs text-slate-400">{l.igstPct}%</div>
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-right text-slate-700">
                        <div>{inr(l.cgstAmt)}</div>
                        <div className="text-xs text-slate-400">{l.cgstPct}%</div>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        <div>{inr(l.sgstAmt)}</div>
                        <div className="text-xs text-slate-400">{l.sgstPct}%</div>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">{inr(l.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-900">{inr(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-red-600">−{inr(invoice.totalDiscount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Taxable Amount</span><span className="font-medium text-slate-900">{inr(invoice.taxableAmt)}</span></div>
            {invoice.isInterstate
              ? <div className="flex justify-between"><span className="text-slate-500">IGST</span><span className="font-medium text-slate-900">{inr(invoice.igstTotal)}</span></div>
              : <>
                  <div className="flex justify-between"><span className="text-slate-500">CGST</span><span className="font-medium text-slate-900">{inr(invoice.cgstTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">SGST</span><span className="font-medium text-slate-900">{inr(invoice.sgstTotal)}</span></div>
                </>
            }
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Round Off</span><span className="font-medium text-slate-600">{invoice.roundOff > 0 ? '+' : ''}{inr(invoice.roundOff)}</span></div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">Invoice Total</span>
              <span className="font-bold text-xl text-slate-900">{inr(invoice.finalAmt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Status</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${payStatusCls[invoice.paymentStatus]}`}>{invoice.paymentStatus}</span>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-0.5">Invoice Amount</div>
              <div className="text-lg font-bold text-slate-900">{inr(invoice.finalAmt)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-0.5">Paid</div>
              <div className="text-lg font-bold text-green-700">{inr(invoice.paidAmt)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-0.5">Balance</div>
              <div className={`text-lg font-bold ${invoice.balanceAmt > 0 ? 'text-red-600' : 'text-slate-400'}`}>{inr(invoice.balanceAmt)}</div>
            </div>
          </div>
          {invoice.payments.length > 0 && (
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Date', 'Amount', 'Mode', 'Reference'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2 text-slate-700">{p.date}</td>
                      <td className="px-3 py-2 font-semibold text-green-700">{inr(p.amount)}</td>
                      <td className="px-3 py-2 text-slate-600">{p.mode}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">{p.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
