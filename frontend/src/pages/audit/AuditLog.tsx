import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  refNo: string;
  description: string;
  ipAddress: string;
}

// TODO: Replace with API call — GET /api/v1/audit-log
const mockAudit: AuditEntry[] = [
  { id: '1', timestamp: '25-09-2026 14:32:05', user: 'admin', action: 'CONFIRM', module: 'Sales', refNo: 'SO-26-004', description: 'Sales order SO-26-004 confirmed. 60 pcs reserved for Fab India Retail.', ipAddress: '192.168.1.12' },
  { id: '2', timestamp: '25-09-2026 13:18:44', user: 'admin', action: 'CREATE', module: 'Invoice', refNo: 'INV-26-013', description: 'Invoice INV-26-013 created for SO-26-004. Amount ₹75,000.', ipAddress: '192.168.1.12' },
  { id: '3', timestamp: '25-09-2026 11:55:02', user: 'admin', action: 'POST', module: 'Reconciliation', refNo: 'JS-24-099', description: 'Reconciliation closed for JS-24-099. 10 m fabric written off — reason: cutting waste.', ipAddress: '192.168.1.12' },
  { id: '4', timestamp: '24-09-2026 16:22:11', user: 'admin', action: 'POST', module: 'Receiving', refNo: 'RCV-24-099', description: 'Finished goods received: 290 accepted, 10 rejected → Quarantine.', ipAddress: '192.168.1.12' },
  { id: '5', timestamp: '24-09-2026 10:05:33', user: 'admin', action: 'CONFIRM', module: 'Sales', refNo: 'SO-26-003', description: 'Sales order SO-26-003 confirmed for Lifestyle Stores. 320 pcs reserved.', ipAddress: '192.168.1.15' },
  { id: '6', timestamp: '23-09-2026 09:41:19', user: 'admin', action: 'ADJUST', module: 'Inventory', refNo: 'ADJ-26-004', description: 'Stock adjustment: Cotton Fabric (Navy Blue) −5 m. Reason: Physical recount.', ipAddress: '192.168.1.12' },
  { id: '7', timestamp: '22-09-2026 15:00:00', user: 'admin', action: 'PAYMENT', module: 'Payments', refNo: 'PMT-26-001', description: 'Payment ₹2,33,415 recorded for INV-26-010. Mode: NEFT.', ipAddress: '192.168.1.12' },
  { id: '8', timestamp: '22-09-2026 08:30:00', user: 'admin', action: 'ISSUE', module: 'Production', refNo: 'ISS-24-099', description: 'Material issued for JS-24-099: 800 m cotton + 348 m lining.', ipAddress: '192.168.1.12' },
];

const actionCls: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-700',
  CONFIRM: 'bg-green-100 text-green-700',
  POST: 'bg-purple-100 text-purple-700',
  ISSUE: 'bg-amber-100 text-amber-700',
  ADJUST: 'bg-orange-100 text-orange-700',
  PAYMENT: 'bg-teal-100 text-teal-700',
  CANCEL: 'bg-red-100 text-red-700',
  EDIT: 'bg-slate-100 text-slate-600',
};

const modules = ['All', 'Sales', 'Invoice', 'Payments', 'Production', 'Receiving', 'Reconciliation', 'Inventory'];

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  useEffect(() => {
    const t = setTimeout(() => { setEntries(mockAudit); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = entries.filter(e =>
    (moduleFilter === 'All' || e.module === moduleFilter) &&
    (e.refNo.toLowerCase().includes(search.toLowerCase()) ||
      e.user.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500">Immutable record of all system actions. Rows cannot be edited or deleted.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search by ref no., user, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1">
          {modules.map(m => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                moduleFilter === m ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Timestamp', 'User', 'Action', 'Module', 'Reference', 'Description', 'IP'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-200 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No audit entries found.</td></tr>
            ) : filtered.map(e => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{e.timestamp}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{e.user}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${actionCls[e.action] || 'bg-slate-100 text-slate-600'}`}>
                    {e.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{e.module}</td>
                <td className="px-4 py-3 font-mono text-xs text-blue-700">{e.refNo}</td>
                <td className="px-4 py-3 text-slate-700 max-w-xs">{e.description}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{e.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
