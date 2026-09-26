import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';

interface OrderLine {
  id: string;
  design: string;
  designNo: string;
  colour: string;
  size: string;
  qty: number;
  rate: number;
  discountPct: number;
  discountAmt: number;
  taxPct: number;
  taxAmt: number;
  total: number;
  invoicedQty: number;
}

interface SalesOrderData {
  id: string;
  soNo: string;
  date: string;
  customer: string;
  customerGstin: string;
  status: 'Draft' | 'Confirmed' | 'Partially Invoiced' | 'Invoiced' | 'Cancelled';
  lines: OrderLine[];
  notes: string;
  invoices: { invoiceNo: string; date: string; amount: number; id: string }[];
}

// TODO: Replace with API call — GET /api/v1/sales/orders/:id
const mockOrder: SalesOrderData = {
  id: '2',
  soNo: 'SO-26-002',
  date: '22-09-2026',
  customer: 'Myntra Wholesale',
  customerGstin: '27AABCU9603R1ZX',
  status: 'Partially Invoiced',
  notes: 'Urgent — dispatch by 28-09',
  lines: [
    { id: '1', design: 'Summer Floral Dress', designNo: 'DR-1024', colour: 'Navy Blue', size: 'M', qty: 80, rate: 1200, discountPct: 5, discountAmt: 4800, taxPct: 5, taxAmt: 4560, total: 95760, invoicedQty: 40 },
    { id: '2', design: 'Summer Floral Dress', designNo: 'DR-1024', colour: 'Navy Blue', size: 'L', qty: 100, rate: 1200, discountPct: 5, discountAmt: 6000, taxPct: 5, taxAmt: 5700, total: 119700, invoicedQty: 0 },
  ],
  invoices: [
    { id: 'inv1', invoiceNo: 'INV-26-011', date: '24-09-2026', amount: 47880 },
  ],
};

const statusCfg: Record<SalesOrderData['status'], { cls: string }> = {
  Draft: { cls: 'bg-slate-100 text-slate-600' },
  Confirmed: { cls: 'bg-blue-100 text-blue-700' },
  'Partially Invoiced': { cls: 'bg-amber-100 text-amber-700' },
  Invoiced: { cls: 'bg-green-100 text-green-700' },
  Cancelled: { cls: 'bg-red-100 text-red-600' },
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SalesOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<SalesOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setOrder(mockOrder); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="p-6 text-slate-500">Sales order not found.</div>;

  const subtotal = order.lines.reduce((s, l) => s + l.qty * l.rate * (1 - l.discountPct / 100), 0);
  const taxTotal = order.lines.reduce((s, l) => s + l.taxAmt, 0);
  const grandTotal = subtotal + taxTotal;
  const cfg = statusCfg[order.status];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate('/sales/orders')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{order.soNo}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>{order.status}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{order.customer} · {order.date}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'Confirmed' && (
            <button
              onClick={() => navigate(`/sales/invoices/new?soId=${order.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <FileText size={15} /> Create Invoice
            </button>
          )}
          {order.status === 'Partially Invoiced' && (
            <button
              onClick={() => navigate(`/sales/invoices/new?soId=${order.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <FileText size={15} /> Invoice Remaining
            </button>
          )}
          {order.status === 'Draft' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              <CheckCircle size={15} /> Confirm Order
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Lines</div>
          <div className="text-2xl font-bold text-slate-900">{order.lines.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Total Qty</div>
          <div className="text-2xl font-bold text-slate-900">{order.lines.reduce((s, l) => s + l.qty, 0)} pcs</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Order Value</div>
          <div className="text-xl font-bold text-slate-900">{inr(grandTotal)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Invoiced</div>
          <div className="text-xl font-bold text-green-700">{inr(order.invoices.reduce((s, i) => s + i.amount, 0))}</div>
        </div>
      </div>

      {/* Lines table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Lines</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Design', 'Colour', 'Size', 'Ordered', 'Invoiced', 'Pending', 'Rate', 'Disc', 'Tax', 'Amount'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.lines.map(l => {
                const pending = l.qty - l.invoicedQty;
                return (
                  <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{l.design}</div>
                      <div className="text-xs text-slate-400 font-mono">{l.designNo}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{l.colour}</td>
                    <td className="px-3 py-3">
                      <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">{l.size}</span>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{l.qty}</td>
                    <td className="px-3 py-3 font-medium text-green-700">{l.invoicedQty}</td>
                    <td className="px-3 py-3">
                      <span className={`font-medium ${pending > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{pending}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{inr(l.rate)}</td>
                    <td className="px-3 py-3 text-slate-600">{l.discountPct}%</td>
                    <td className="px-3 py-3 text-slate-600">{l.taxPct}%</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{inr(l.total)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr><td colSpan={9} className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Subtotal</td><td className="px-3 py-2 font-semibold text-slate-900">{inr(subtotal)}</td></tr>
              <tr><td colSpan={9} className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Tax</td><td className="px-3 py-2 font-semibold text-slate-900">{inr(taxTotal)}</td></tr>
              <tr><td colSpan={9} className="px-3 py-2 text-right text-sm font-bold text-slate-700">Grand Total</td><td className="px-3 py-2 text-lg font-bold text-slate-900">{inr(grandTotal)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Linked invoices */}
      {order.invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoices ({order.invoices.length})</span>
          </div>
          <div className="divide-y divide-slate-100">
            {order.invoices.map(inv => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-blue-700 text-sm">{inv.invoiceNo}</span>
                  <span className="text-xs text-slate-400 ml-3">{inv.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-900">{inr(inv.amount)}</span>
                  <Link to={`/sales/invoices/${inv.id}`} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <FileText size={13} /> View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.notes && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700">
          <span className="font-medium">Notes: </span>{order.notes}
        </div>
      )}
    </div>
  );
}
