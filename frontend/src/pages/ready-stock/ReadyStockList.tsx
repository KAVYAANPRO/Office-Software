import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

interface StockEntry {
  id: string;
  design: string;
  designNo: string;
  category: string;
  colour: string;
  location: string;
  factory: string;
  receivedDate: string;
  sizes: { size: string; onHand: number; reserved: number; atp: number }[];
}

// TODO: Replace with API call — GET /api/v1/ready-stock
const mockStock: StockEntry[] = [
  {
    id: '1', design: 'Summer Floral Dress', designNo: 'DR-1024', category: 'Dress', colour: 'Navy Blue',
    location: 'Main Warehouse', factory: 'Super Stitchers', receivedDate: '02-10-2026',
    sizes: [
      { size: 'S', onHand: 60, reserved: 10, atp: 50 },
      { size: 'M', onHand: 80, reserved: 20, atp: 60 },
      { size: 'L', onHand: 55, reserved: 5, atp: 50 },
      { size: 'XL', onHand: 45, reserved: 0, atp: 45 },
    ],
  },
  {
    id: '2', design: 'Cotton Block Print Kurti', designNo: 'KU-5501', category: 'Kurti', colour: 'Ivory White',
    location: 'Main Warehouse', factory: 'Precision Cutters', receivedDate: '01-10-2026',
    sizes: [
      { size: 'M', onHand: 70, reserved: 15, atp: 55 },
      { size: 'L', onHand: 50, reserved: 8, atp: 42 },
      { size: 'XL', onHand: 28, reserved: 0, atp: 28 },
    ],
  },
  {
    id: '3', design: 'Summer Floral Dress', designNo: 'DR-1024', category: 'Dress', colour: 'Ivory White',
    location: 'Main Warehouse', factory: 'Super Stitchers', receivedDate: '30-09-2026',
    sizes: [
      { size: 'S', onHand: 20, reserved: 0, atp: 20 },
      { size: 'M', onHand: 35, reserved: 12, atp: 23 },
    ],
  },
];

export function ReadyStockList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    const t = setTimeout(() => { setItems(mockStock); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const categories = ['All', ...Array.from(new Set(mockStock.map(s => s.category)))];

  const filtered = items.filter(s =>
    (categoryFilter === 'All' || s.category === categoryFilter) &&
    (s.design.toLowerCase().includes(search.toLowerCase()) ||
      s.designNo.toLowerCase().includes(search.toLowerCase()) ||
      s.colour.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ready Stock</h1>
        <p className="text-sm text-slate-500">Finished garments ready for sale. On Hand = total; Reserved = confirmed sales orders; ATP = available to promise.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search by design, no., or colour..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="flex gap-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map(i => <div key={i} className="bg-white rounded-xl border border-slate-200 h-32 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">No ready stock found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(entry => {
            const totalOnHand = entry.sizes.reduce((s, r) => s + r.onHand, 0);
            const totalReserved = entry.sizes.reduce((s, r) => s + r.reserved, 0);
            const totalATP = entry.sizes.reduce((s, r) => s + r.atp, 0);

            return (
              <div
                key={entry.id}
                onClick={() => navigate(`/ready-stock/${entry.id}`)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors cursor-pointer"
              >
                {/* Card header */}
                <div className="px-5 py-4 flex items-start justify-between gap-3 flex-wrap border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{entry.design}</span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{entry.designNo}</span>
                      <span className="text-xs text-slate-500">/ {entry.colour}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{entry.category} · {entry.factory} · Received {entry.receivedDate} · {entry.location}</div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">On Hand</div>
                      <div className="text-lg font-bold text-slate-900">{totalOnHand.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Reserved</div>
                      <div className="text-lg font-bold text-amber-600">{totalReserved.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">ATP</div>
                      <div className={`text-lg font-bold ${totalATP > 0 ? 'text-green-700' : 'text-red-500'}`}>{totalATP.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Size breakdown */}
                <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
                  <Package size={13} className="text-slate-400 shrink-0" />
                  <div className="flex gap-3 flex-wrap">
                    {entry.sizes.map(s => (
                      <div key={s.size} className="flex items-center gap-1.5 text-sm">
                        <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">{s.size}</span>
                        <div className="text-xs">
                          <div className="font-semibold text-slate-900">{s.onHand}</div>
                          <div className={`${s.atp > 0 ? 'text-green-600' : 'text-red-400'}`}>{s.atp} ATP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
