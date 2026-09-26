import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';

interface SalesOrder {
  id: string;
  soNo: string;
  date: string;
  customer: string;
  itemCount: number;
  totalQty: number;
  total: number;
  status: 'Draft' | 'Confirmed' | 'Partially Invoiced' | 'Invoiced' | 'Cancelled';
}

// TODO: Replace with API call — GET /api/v1/sales/orders
const mockOrders: SalesOrder[] = [
  { id: '1', soNo: 'SO-26-001', date: '20-09-2026', customer: 'Fab India Retail', itemCount: 3, totalQty: 240, total: 288000, status: 'Invoiced' },
  { id: '2', soNo: 'SO-26-002', date: '22-09-2026', customer: 'Myntra Wholesale', itemCount: 2, totalQty: 180, total: 216000, status: 'Partially Invoiced' },
  { id: '3', soNo: 'SO-26-003', date: '23-09-2026', customer: 'Lifestyle Stores', itemCount: 4, totalQty: 320, total: 448000, status: 'Confirmed' },
  { id: '4', soNo: 'SO-26-004', date: '25-09-2026', customer: 'Fab India Retail', itemCount: 1, totalQty: 60, total: 75000, status: 'Draft' },
];

const statusCfg: Record<SalesOrder['status'], { cls: string; label: string }> = {
  Draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
  Confirmed: { cls: 'bg-blue-100 text-blue-700', label: 'Confirmed' },
  'Partially Invoiced': { cls: 'bg-amber-100 text-amber-700', label: 'Partially Invoiced' },
  Invoiced: { cls: 'bg-green-100 text-green-700', label: 'Invoiced' },
  Cancelled: { cls: 'bg-red-100 text-red-600', label: 'Cancelled' },
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SalesOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | SalesOrder['status']>('All');

  useEffect(() => {
    const t = setTimeout(() => { setOrders(mockOrders); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = orders.filter(o =>
    (statusFilter === 'All' || o.status === statusFilter) &&
    (o.soNo.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const totalValue = orders.reduce((s, o) => s + o.total, 0);
  const confirmedValue = orders.filter(o => o.status !== 'Draft' && o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
          <p className="text-sm text-slate-500">Confirming a sales order reserves stock (ATP) but does not reduce on-hand.</p>
        </div>
        <button
          onClick={() => navigate('/sales/orders/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> New Sales Order
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All Orders', value: orders.length, sub: 'total' },
          { label: 'Confirmed', value: orders.filter(o => o.status === 'Confirmed').length, sub: 'awaiting invoice' },
          { label: 'Invoiced', value: orders.filter(o => o.status === 'Invoiced').length, sub: 'complete' },
          { label: 'Total Value', value: inr(confirmedValue), sub: 'confirmed orders' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search by SO no. or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1">
          {(['All', 'Draft', 'Confirmed', 'Partially Invoiced', 'Invoiced', 'Cancelled'] as const).map(s => (
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
              {['SO No.', 'Date', 'Customer', 'Items', 'Qty', 'Total', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-200 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No sales orders found.</td></tr>
            ) : filtered.map(o => {
              const cfg = statusCfg[o.status];
              return (
                <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/sales/orders/${o.id}`)}>
                  <td className="px-4 py-3 font-mono font-semibold text-blue-700">{o.soNo}</td>
                  <td className="px-4 py-3 text-slate-600">{o.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{o.customer}</td>
                  <td className="px-4 py-3 text-slate-600">{o.itemCount}</td>
                  <td className="px-4 py-3 text-slate-700">{o.totalQty.toLocaleString('en-IN')} pcs</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{inr(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/sales/orders/${o.id}`); }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
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
