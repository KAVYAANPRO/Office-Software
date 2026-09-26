import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard } from 'lucide-react';

interface Payment {
  id: string;
  paymentNo: string;
  date: string;
  customer: string;
  invoiceNo: string;
  amount: number;
  mode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI';
  reference: string;
  status: 'Cleared' | 'Pending';
}

// TODO: Replace with API call — GET /api/v1/sales/payments
const mockPayments: Payment[] = [
  { id: '1', paymentNo: 'PMT-26-001', date: '22-09-2026', customer: 'Fab India Retail', invoiceNo: 'INV-26-010', amount: 233415, mode: 'Bank Transfer', reference: 'NEFT/REF2026092201', status: 'Cleared' },
  { id: '2', paymentNo: 'PMT-26-002', date: '24-09-2026', customer: 'Lifestyle Stores', invoiceNo: 'INV-26-012', amount: 200000, mode: 'Bank Transfer', reference: 'RTGS/REF2026092401', status: 'Cleared' },
  { id: '3', paymentNo: 'PMT-26-003', date: '25-09-2026', customer: 'Myntra Wholesale', invoiceNo: 'INV-26-011', amount: 47880, mode: 'Cheque', reference: 'CHQ-004521', status: 'Pending' },
];

const modeCls: Record<Payment['mode'], string> = {
  Cash: 'bg-green-100 text-green-700',
  'Bank Transfer': 'bg-blue-100 text-blue-700',
  Cheque: 'bg-amber-100 text-amber-700',
  UPI: 'bg-purple-100 text-purple-700',
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PaymentList() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Payment['status']>('All');

  useEffect(() => {
    const t = setTimeout(() => { setPayments(mockPayments); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = payments.filter(p =>
    (statusFilter === 'All' || p.status === statusFilter) &&
    (p.paymentNo.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCleared = payments.filter(p => p.status === 'Cleared').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500">Payment receipts from customers against invoices.</p>
        </div>
        <button
          onClick={() => navigate('/sales/payments/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Total Collected</div>
          <div className="text-xl font-bold text-slate-900">{inr(payments.reduce((s, p) => s + p.amount, 0))}</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4 text-center">
          <div className="text-xs text-green-500 mb-1">Cleared</div>
          <div className="text-xl font-bold text-green-700">{inr(totalCleared)}</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4 text-center">
          <div className="text-xs text-amber-500 mb-1">Pending Clearance</div>
          <div className="text-xl font-bold text-amber-700">{inr(totalPending)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search by payment no., customer, invoice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="flex gap-1">
          {(['All', 'Cleared', 'Pending'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
              {['Payment No.', 'Date', 'Customer', 'Invoice', 'Amount', 'Mode', 'Reference', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-200 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No payments found.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-semibold text-blue-700">{p.paymentNo}</td>
                <td className="px-4 py-3 text-slate-600">{p.date}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.customer}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/sales/invoices/${p.id}`)}
                    className="font-mono text-xs text-blue-600 hover:underline"
                  >
                    {p.invoiceNo}
                  </button>
                </td>
                <td className="px-4 py-3 font-bold text-green-700">{inr(p.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${modeCls[p.mode]}`}>
                    {p.mode}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.reference || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                    p.status === 'Cleared' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <CreditCard size={11} /> {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
