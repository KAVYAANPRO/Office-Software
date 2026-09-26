import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  soNo: string;
  customer: string;
  total: number;
  paidAmt: number;
  balanceAmt: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  type: 'B2B' | 'B2C';
}

// TODO: Replace with API call — GET /api/v1/sales/invoices
const mockInvoices: Invoice[] = [
  { id: '1', invoiceNo: 'INV-26-010', date: '20-09-2026', soNo: 'SO-26-001', customer: 'Fab India Retail', total: 288000, paidAmt: 288000, balanceAmt: 0, paymentStatus: 'Paid', type: 'B2B' },
  { id: '2', invoiceNo: 'INV-26-011', date: '24-09-2026', soNo: 'SO-26-002', customer: 'Myntra Wholesale', total: 47880, paidAmt: 0, balanceAmt: 47880, paymentStatus: 'Unpaid', type: 'B2B' },
  { id: '3', invoiceNo: 'INV-26-012', date: '24-09-2026', soNo: 'SO-26-003', customer: 'Lifestyle Stores', total: 448000, paidAmt: 200000, balanceAmt: 248000, paymentStatus: 'Partially Paid', type: 'B2B' },
  { id: '4', invoiceNo: 'INV-26-013', date: '25-09-2026', soNo: 'SO-26-004', customer: 'Fab India Retail', total: 75000, paidAmt: 0, balanceAmt: 75000, paymentStatus: 'Unpaid', type: 'B2B' },
];

const payStatusCfg: Record<Invoice['paymentStatus'], { cls: string }> = {
  Unpaid: { cls: 'bg-red-100 text-red-700' },
  'Partially Paid': { cls: 'bg-amber-100 text-amber-700' },
  Paid: { cls: 'bg-green-100 text-green-700' },
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState<'All' | Invoice['paymentStatus']>('All');

  useEffect(() => {
    const t = setTimeout(() => { setInvoices(mockInvoices); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = invoices.filter(i =>
    (payFilter === 'All' || i.paymentStatus === payFilter) &&
    (i.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      i.customer.toLowerCase().includes(search.toLowerCase()) ||
      i.soNo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPending = invoices.filter(i => i.paymentStatus !== 'Paid').reduce((s, i) => s + i.balanceAmt, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">Tax invoices with GST breakdown. B2B invoices show GSTIN and supply state.</p>
        </div>
        <button
          onClick={() => navigate('/sales/invoices/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: inr(invoices.reduce((s, i) => s + i.total, 0)), cls: '' },
          { label: 'Collected', value: inr(invoices.reduce((s, i) => s + i.paidAmt, 0)), cls: 'text-green-700' },
          { label: 'Pending', value: inr(totalPending), cls: 'text-red-600' },
          { label: 'Invoices', value: invoices.length, cls: '' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.cls || 'text-slate-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search by invoice no., customer, SO..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="flex gap-1">
          {(['All', 'Unpaid', 'Partially Paid', 'Paid'] as const).map(s => (
            <button
              key={s}
              onClick={() => setPayFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                payFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Invoice No.', 'Date', 'SO No.', 'Customer', 'Total', 'Paid', 'Balance', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-200 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">No invoices found.</td></tr>
            ) : filtered.map(inv => {
              const cfg = payStatusCfg[inv.paymentStatus];
              return (
                <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/sales/invoices/${inv.id}`)}>
                  <td className="px-4 py-3 font-mono font-semibold text-blue-700">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.date}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{inv.soNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{inv.customer}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{inr(inv.total)}</td>
                  <td className="px-4 py-3 font-medium text-green-700">{inr(inv.paidAmt)}</td>
                  <td className="px-4 py-3 font-medium text-red-600">{inr(inv.balanceAmt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>{inv.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); navigate(`/sales/invoices/${inv.id}`); }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                      <FileText size={13} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
