import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, BarChart2, Package, Scissors, Factory, ShoppingCart, TrendingUp, FileText, AlertTriangle } from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  csvAvailable: boolean;
  href: string;
}

const reports: ReportCard[] = [
  { id: 'r1', title: 'Purchase Summary', description: 'Supplier-wise purchase totals, pending inward, and value received.', category: 'Procurement', icon: <ShoppingCart size={20} />, csvAvailable: true, href: '#' },
  { id: 'r2', title: 'Pending Inward Report', description: 'All confirmed POs with outstanding inward quantities.', category: 'Procurement', icon: <Package size={20} />, csvAvailable: true, href: '#' },
  { id: 'r3', title: 'Stock Position Report', description: 'Current stock by material, colour, location, and lot.', category: 'Inventory', icon: <Package size={20} />, csvAvailable: true, href: '#' },
  { id: 'r4', title: 'Stock Movement Ledger', description: 'All inward and outward movements with source documents.', category: 'Inventory', icon: <BarChart2 size={20} />, csvAvailable: true, href: '#' },
  { id: 'r5', title: 'Low Stock Alert', description: 'Materials below minimum stock levels requiring reorder.', category: 'Inventory', icon: <AlertTriangle size={20} />, csvAvailable: true, href: '#' },
  { id: 'r6', title: 'Production Summary', description: 'Job-wise: issued, returned, accepted, rejected, and reconciliation status.', category: 'Production', icon: <Factory size={20} />, csvAvailable: true, href: '#' },
  { id: 'r7', title: 'Design-wise Production', description: 'Production quantities by design, colour, and size.', category: 'Production', icon: <Scissors size={20} />, csvAvailable: true, href: '#' },
  { id: 'r8', title: 'Factory Performance', description: 'Accepted vs rejected by factory/artisan across job slips.', category: 'Production', icon: <Factory size={20} />, csvAvailable: false, href: '#' },
  { id: 'r9', title: 'Costing Summary', description: 'Cost per garment, margin, and selling rate across all cost sheets.', category: 'Costing', icon: <TrendingUp size={20} />, csvAvailable: true, href: '#' },
  { id: 'r10', title: 'Material Consumption Report', description: 'Issued vs consumed vs written off per material per job.', category: 'Costing', icon: <FileText size={20} />, csvAvailable: true, href: '#' },
  { id: 'r11', title: 'Sales Order Register', description: 'All sales orders with status, value, and invoicing progress.', category: 'Sales', icon: <ShoppingCart size={20} />, csvAvailable: true, href: '/sales/orders' },
  { id: 'r12', title: 'Invoice Register', description: 'All invoices with payment status and GST breakdown.', category: 'Sales', icon: <FileText size={20} />, csvAvailable: true, href: '/sales/invoices' },
  { id: 'r13', title: 'Outstanding Receivables', description: 'Customer-wise pending payment amounts and aging.', category: 'Sales', icon: <AlertTriangle size={20} />, csvAvailable: true, href: '#' },
  { id: 'r14', title: 'Design-wise Sales', description: 'Revenue, quantities sold, and average rate by design.', category: 'Sales', icon: <BarChart2 size={20} />, csvAvailable: false, href: '#' },
];

const ALL_CATEGORIES = ['All', 'Procurement', 'Inventory', 'Production', 'Costing', 'Sales'];

const catColors: Record<string, string> = {
  Procurement: 'bg-blue-100 text-blue-700',
  Inventory: 'bg-green-100 text-green-700',
  Production: 'bg-amber-100 text-amber-700',
  Costing: 'bg-purple-100 text-purple-700',
  Sales: 'bg-rose-100 text-rose-700',
};

export function ReportsList() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = reports.filter(r => activeCategory === 'All' || r.category === activeCategory);

  const grouped = ALL_CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filtered.filter(r => r.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {} as Record<string, ReportCard[]>);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Operational reports with CSV export. Charts and analytics available in the dashboard.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === c ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColors[cat] || 'bg-slate-100 text-slate-600'}`}>{cat}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(r => (
              <div
                key={r.id}
                onClick={() => { if (r.href !== '#') navigate(r.href); }}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4 hover:border-blue-200 transition-colors ${r.href !== '#' ? 'cursor-pointer' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${catColors[r.category] || 'bg-slate-100 text-slate-600'}`}>
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{r.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.description}</div>
                </div>
                {r.csvAvailable && (
                  <button
                    onClick={e => { e.stopPropagation(); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 shrink-0"
                  >
                    <Download size={12} /> CSV
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
