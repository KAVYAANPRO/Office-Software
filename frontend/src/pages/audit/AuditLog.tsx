import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { listAuditLog } from '../../lib/mock/db';
import type { AuditLogEntry } from '../../types/domain';

const actionCls: Record<string, string> = {
  Created: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-green-100 text-green-700',
  Posted: 'bg-purple-100 text-purple-700',
  Issued: 'bg-amber-100 text-amber-700',
  Adjusted: 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-red-100 text-red-700',
  Edited: 'bg-slate-100 text-slate-600',
};

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  useEffect(() => {
    let active = true;
    listAuditLog().then(rows => {
      if (active) { setEntries(rows); setIsLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const modules = ['All', ...Array.from(new Set(entries.map(e => e.module)))];

  const filtered = entries.filter(e =>
    (moduleFilter === 'All' || e.module === moduleFilter) &&
    (e.recordId.toLowerCase().includes(search.toLowerCase()) ||
      e.user.toLowerCase().includes(search.toLowerCase()) ||
      (e.newValue ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500">Append-only record of every business-table change. Nobody can edit or delete an entry through the application (AUD-01/AUD-02).</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search by reference, user, description..."
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Timestamp', 'User', 'Action', 'Module', 'Reference', 'Change'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-200 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No audit entries found.</td></tr>
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
                <td className="px-4 py-3 font-mono text-xs text-blue-700">{e.recordId}</td>
                <td className="px-4 py-3 text-slate-700 max-w-xs">
                  {e.previousValue && <span className="text-slate-400 line-through mr-1">{e.previousValue}</span>}
                  {e.newValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
