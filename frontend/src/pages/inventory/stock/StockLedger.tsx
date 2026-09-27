import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { listStockLedger } from '../../../lib/mock/db';
import type { StockLedgerEntry, StockMovementType } from '../../../types/domain';

const movementColors: Record<StockMovementType, string> = {
  Opening: 'bg-slate-100 text-slate-800',
  Inward: 'bg-green-100 text-green-800',
  Issue: 'bg-orange-100 text-orange-800',
  'Return-from-factory': 'bg-blue-100 text-blue-800',
  Consumption: 'bg-indigo-100 text-indigo-800',
  'Process-output': 'bg-cyan-100 text-cyan-800',
  'Production-receipt': 'bg-teal-100 text-teal-800',
  Rejection: 'bg-rose-100 text-rose-800',
  'Shortage-write-off': 'bg-red-100 text-red-800',
  'Adjustment-in': 'bg-purple-100 text-purple-800',
  'Adjustment-out': 'bg-purple-100 text-purple-800',
  Sale: 'bg-emerald-100 text-emerald-800',
  'Sales-return': 'bg-blue-100 text-blue-800',
  'Purchase-return': 'bg-orange-100 text-orange-800',
  Transfer: 'bg-sky-100 text-sky-800',
  Reversal: 'bg-red-100 text-red-800',
};

/** STK-02 — movements out of a location are shown as negative for readability. */
const OUTBOUND: Partial<Record<StockMovementType, boolean>> = {
  Issue: true, Consumption: true, Rejection: true, 'Shortage-write-off': true,
  'Adjustment-out': true, Sale: true, 'Purchase-return': true, Transfer: true,
};

export function StockLedger() {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    listStockLedger().then(rows => {
      if (active) { setEntries(rows); setIsLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const filtered = entries.filter(e =>
    e.itemName.toLowerCase().includes(search.toLowerCase()) ||
    e.reference.toLowerCase().includes(search.toLowerCase()) ||
    (e.lotId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock Ledger</h1>
        <p className="text-sm text-slate-500">Complete history of all stock movements. Posted entries cannot be edited or deleted.</p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          This ledger is <span className="font-semibold">append-only</span>. Corrections are made through reversals and new entries — existing rows are never modified or deleted.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by item, reference, or lot..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Transaction ID', 'Date', 'Type', 'Item', 'Lot', 'Qty', 'Reference', 'Source → Destination', 'User', 'Remarks'].map(h => (
                <th key={h} className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-3 bg-slate-200 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">No ledger entries found.</td>
                </tr>
              )
              : filtered.map(row => {
                  const outbound = OUTBOUND[row.type];
                  return (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{row.txnId}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.date}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movementColors[row.type]}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-900 max-w-[180px]">
                      <div className="truncate">{row.itemName}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{row.lotId ?? '—'}</td>
                    <td className={`px-3 py-3 font-semibold whitespace-nowrap ${outbound ? 'text-red-600' : 'text-green-700'}`}>
                      {outbound ? '-' : '+'}{row.quantity.toLocaleString('en-IN')} {row.unit}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{row.reference}</td>
                    <td className="px-3 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {row.fromLocation} → {row.toLocation}
                    </td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{row.user}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs max-w-[140px]">
                      <div className="truncate">{row.remarks ?? '—'}</div>
                    </td>
                  </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Showing {filtered.length} of {entries.length} entries. Pagination will be added when connected to backend.
      </p>
    </div>
  );
}
