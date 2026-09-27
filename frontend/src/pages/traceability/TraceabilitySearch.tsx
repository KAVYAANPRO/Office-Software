import { useState } from 'react';
import { Search, ChevronRight, Package, Scissors, Factory, Truck, ShoppingCart } from 'lucide-react';
import { traceByReference, type TraceNode, seedJobSlip, seedLot, seedSalesOrder } from '../../lib/mock/db';

const iconMap: Record<TraceNode['icon'], React.ReactNode> = {
  purchase: <ShoppingCart size={14} />,
  inward: <Package size={14} />,
  stock: <Package size={14} />,
  design: <Scissors size={14} />,
  job: <Factory size={14} />,
  receive: <Truck size={14} />,
  sale: <ShoppingCart size={14} />,
};

const iconBg: Record<TraceNode['icon'], string> = {
  purchase: 'bg-blue-100 text-blue-600',
  inward: 'bg-green-100 text-green-600',
  stock: 'bg-slate-100 text-slate-600',
  design: 'bg-purple-100 text-purple-600',
  job: 'bg-amber-100 text-amber-600',
  receive: 'bg-teal-100 text-teal-600',
  sale: 'bg-rose-100 text-rose-600',
};

export function TraceabilitySearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ summary: string; nodes: TraceNode[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setNotFound(false);
    setResult(null);
    const found = await traceByReference(query);
    setResult(found);
    setNotFound(!found);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Traceability</h1>
        <p className="text-sm text-slate-500">Trace the complete lifecycle of a job slip, material lot, design, or sales order — from purchase to delivery.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Search by reference</div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Job Slip (${seedJobSlip.id}), Lot (${seedLot.id}), SO (${seedSalesOrder.id})…`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Searching…' : 'Trace'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[seedJobSlip.id, seedLot.id, seedSalesOrder.id].map(ex => (
            <button
              key={ex}
              onClick={() => setQuery(ex)}
              className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 font-mono"
            >
              {ex}
            </button>
          ))}
          <span className="text-xs text-slate-400 self-center">Try an example →</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {notFound && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-8 text-center text-slate-400 text-sm">
          No traceability record found for "{query}". Try a job slip number, lot ID, or sales order.
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-900 font-medium">
            {result.summary}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Lifecycle — {result.nodes.length} stages
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {result.nodes.map((node, idx) => (
                <div key={idx} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg[node.icon]}`}>
                      {iconMap[node.icon]}
                    </div>
                    {idx < result.nodes.length - 1 && (
                      <div className="w-px h-4 bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{node.stage}</span>
                      <span className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{node.refNo}</span>
                      {node.status && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{node.status}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{node.date} · {node.details}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
