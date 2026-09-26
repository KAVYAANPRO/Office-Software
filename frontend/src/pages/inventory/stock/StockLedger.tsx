import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

interface LedgerEntry {
  id: string;
  date: string;
  movementType: 'Inward' | 'Issue' | 'Return' | 'Adjustment' | 'Receiving' | 'Reversal';
  item: string;
  lot: string;
  quantity: number;
  unit: string;
  reference: string;
  user: string;
  source: string;
  destination: string;
  remarks: string;
}

// TODO: Replace with API call — GET /api/v1/stock/ledger
const mockLedger: LedgerEntry[] = [
  { id: 'TXN-2024-001', date: '24-09-2026', movementType: 'Inward', item: 'Cotton Fabric — Navy Blue', lot: 'LOT-001', quantity: 1000, unit: 'm', reference: 'INW-001', user: 'Admin', source: 'Supplier', destination: 'Main Warehouse', remarks: 'Alpha Fabrics PO-001' },
  { id: 'TXN-2024-002', date: '25-09-2026', movementType: 'Issue', item: 'Cotton Fabric — Navy Blue', lot: 'LOT-001', quantity: -200, unit: 'm', reference: 'JS-001', user: 'Admin', source: 'Main Warehouse', destination: 'Krishna Dyeing Works', remarks: 'Job slip JS-001' },
  { id: 'TXN-2024-003', date: '25-09-2026', movementType: 'Inward', item: 'Lining Cloth — Black', lot: 'LOT-003', quantity: 320, unit: 'm', reference: 'INW-002', user: 'Admin', source: 'Supplier', destination: 'Main Warehouse', remarks: 'Zeta Dyeing PO-002' },
  { id: 'TXN-2024-004', date: '26-09-2026', movementType: 'Adjustment', item: 'Cotton Fabric — Navy Blue', lot: 'LOT-001', quantity: -50, unit: 'm', reference: 'ADJ-001', user: 'Admin', source: 'Main Warehouse', destination: '—', remarks: 'Physical count correction' },
];

const movementColors: Record<LedgerEntry['movementType'], string> = {
  Inward: 'bg-green-100 text-green-800',
  Issue: 'bg-orange-100 text-orange-800',
  Return: 'bg-blue-100 text-blue-800',
  Adjustment: 'bg-purple-100 text-purple-800',
  Receiving: 'bg-teal-100 text-teal-800',
  Reversal: 'bg-red-100 text-red-800',
};

export function StockLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setEntries(mockLedger); setIsLoading(false); }, 700);
    return () => clearTimeout(t);
  }, []);

  const filtered = entries.filter(e =>
    e.item.toLowerCase().includes(search.toLowerCase()) ||
    e.reference.toLowerCase().includes(search.toLowerCase()) ||
    e.lot.toLowerCase().includes(search.toLowerCase())
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
              : filtered.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{row.id}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.date}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movementColors[row.movementType]}`}>
                        {row.movementType}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-900 max-w-[180px]">
                      <div className="truncate">{row.item}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{row.lot}</td>
                    <td className={`px-3 py-3 font-semibold whitespace-nowrap ${row.quantity > 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {row.quantity > 0 ? '+' : ''}{row.quantity.toLocaleString('en-IN')} {row.unit}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{row.reference}</td>
                    <td className="px-3 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {row.source} → {row.destination}
                    </td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{row.user}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs max-w-[140px]">
                      <div className="truncate">{row.remarks}</div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Showing {filtered.length} of {entries.length} entries. Pagination will be added when connected to backend.
      </p>
    </div>
  );
}
