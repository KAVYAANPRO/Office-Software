import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface PackingRow {
  id: string;
  design: string;
  designNo: string;
  category: string;
  colour: string;
  size: string;
  available: number;
  packed: number;
  pending: number;
  packingStatus: 'Fully Packed' | 'Partially Packed' | 'Unpacked';
}

// TODO: Replace with API call — GET /api/v1/ready-stock/packing
const mockPacking: PackingRow[] = [
  { id: '1', design: 'Summer Floral Dress', designNo: 'DR-1024', category: 'Dress', colour: 'Navy Blue', size: 'S', available: 60, packed: 60, pending: 0, packingStatus: 'Fully Packed' },
  { id: '2', design: 'Summer Floral Dress', designNo: 'DR-1024', category: 'Dress', colour: 'Navy Blue', size: 'M', available: 80, packed: 40, pending: 40, packingStatus: 'Partially Packed' },
  { id: '3', design: 'Summer Floral Dress', designNo: 'DR-1024', category: 'Dress', colour: 'Navy Blue', size: 'L', available: 55, packed: 0, pending: 55, packingStatus: 'Unpacked' },
  { id: '4', design: 'Summer Floral Dress', designNo: 'DR-1024', category: 'Dress', colour: 'Navy Blue', size: 'XL', available: 45, packed: 45, pending: 0, packingStatus: 'Fully Packed' },
  { id: '5', design: 'Cotton Block Print Kurti', designNo: 'KU-5501', category: 'Kurti', colour: 'Ivory White', size: 'M', available: 70, packed: 30, pending: 40, packingStatus: 'Partially Packed' },
  { id: '6', design: 'Cotton Block Print Kurti', designNo: 'KU-5501', category: 'Kurti', colour: 'Ivory White', size: 'L', available: 50, packed: 0, pending: 50, packingStatus: 'Unpacked' },
];

const statusConfig = {
  'Fully Packed': { cls: 'bg-green-100 text-green-800', icon: <CheckCircle size={13} /> },
  'Partially Packed': { cls: 'bg-amber-100 text-amber-700', icon: <Clock size={13} /> },
  'Unpacked': { cls: 'bg-slate-100 text-slate-600', icon: <AlertTriangle size={13} /> },
};

export function PackingDashboard() {
  const [rows, setRows] = useState<PackingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PackingRow['packingStatus']>('All');

  useEffect(() => {
    const t = setTimeout(() => { setRows(mockPacking); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = rows.filter(r =>
    (statusFilter === 'All' || r.packingStatus === statusFilter) &&
    (r.design.toLowerCase().includes(search.toLowerCase()) ||
      r.colour.toLowerCase().includes(search.toLowerCase()))
  );

  const totalAvailable = rows.reduce((s, r) => s + r.available, 0);
  const totalPacked = rows.reduce((s, r) => s + r.packed, 0);
  const totalPending = rows.reduce((s, r) => s + r.pending, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Packing Dashboard</h1>
        <p className="text-sm text-slate-500">Track packing progress by design, colour and size. Packing is a status — it does not move stock.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Available</div>
          <div className="text-2xl font-bold text-slate-900">{totalAvailable.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-400">pcs</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4 text-center">
          <div className="text-xs text-green-500 mb-1">Packed</div>
          <div className="text-2xl font-bold text-green-700">{totalPacked.toLocaleString('en-IN')}</div>
          <div className="text-xs text-green-400">pcs</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4 text-center">
          <div className="text-xs text-amber-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-700">{totalPending.toLocaleString('en-IN')}</div>
          <div className="text-xs text-amber-400">pcs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search by design or colour..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="flex gap-1">
          {(['All', 'Unpacked', 'Partially Packed', 'Fully Packed'] as const).map(s => (
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
              {['Design', 'Category', 'Colour', 'Size', 'Available', 'Packed', 'Pending', 'Status'].map(h => (
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
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No packing records found.</td></tr>
            ) : filtered.map(row => {
              const pct = row.available > 0 ? Math.round((row.packed / row.available) * 100) : 0;
              const cfg = statusConfig[row.packingStatus];
              return (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.design}</div>
                    <div className="text-xs text-slate-400 font-mono">{row.designNo}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.category}</td>
                  <td className="px-4 py-3 text-slate-700">{row.colour}</td>
                  <td className="px-4 py-3">
                    <span className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">{row.size}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.available.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">{row.packed.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-semibold text-amber-600">{row.pending.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${cfg.cls}`}>
                        {cfg.icon} {row.packingStatus}
                      </span>
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
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
