import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface Variant {
  id: string;
  colour: string;
  size: string;
  sku: string;
  stock: number;
}

interface BOMLine {
  id: string;
  role: string;
  material: string;
  unit: string;
  qtyPerGarment: number;
  allowancePct: number;
  available: number;
}

interface DesignDetail {
  id: string;
  designNo: string;
  name: string;
  category: string;
  type: string;
  status: string;
  description: string;
  colours: string[];
  sizes: string[];
  variants: Variant[];
  bom: BOMLine[];
  manufacturingInstructions: string;
}

// TODO: Replace with API call — GET /api/v1/designs/:id
const mockDesign: DesignDetail = {
  id: '1',
  designNo: 'DR-1024',
  name: 'Summer Floral Dress',
  category: 'Dress',
  type: 'Stitched',
  status: 'Active',
  description: 'A light summer dress with hand-block floral prints. Single-layer fabric with contrast lining.',
  colours: ['Navy Blue', 'Ivory White'],
  sizes: ['S', 'M', 'L', 'XL'],
  variants: [
    { id: 'v1', colour: 'Navy Blue', size: 'S', sku: 'DR-1024-NB-S', stock: 12 },
    { id: 'v2', colour: 'Navy Blue', size: 'M', sku: 'DR-1024-NB-M', stock: 8 },
    { id: 'v3', colour: 'Navy Blue', size: 'L', sku: 'DR-1024-NB-L', stock: 0 },
    { id: 'v4', colour: 'Ivory White', size: 'M', sku: 'DR-1024-IW-M', stock: 4 },
  ],
  bom: [
    { id: 'b1', role: 'Main Fabric', material: 'Cotton Fabric — Navy Blue', unit: 'm', qtyPerGarment: 2.5, allowancePct: 5, available: 800 },
    { id: 'b2', role: 'Lining', material: 'Lining Cloth — Black', unit: 'm', qtyPerGarment: 1.2, allowancePct: 3, available: 320 },
    { id: 'b3', role: 'Fastening', material: 'Buttons — White 12mm', unit: 'pcs', qtyPerGarment: 8, allowancePct: 10, available: 1200 },
  ],
  manufacturingInstructions: '1. Pre-wash fabric before cutting.\n2. Use French seams for all edges.\n3. Attach lining with hidden stitch.\n4. Quality check: seam alignment, button placement, hem straightness.',
};

const TABS = ['Overview', 'Variants', 'BOM', 'Instructions'] as const;
type Tab = typeof TABS[number];

function stockStatus(required: number, available: number) {
  if (available >= required) return { label: 'Available', cls: 'text-green-600', icon: <CheckCircle size={14} /> };
  if (available > 0) return { label: 'Shortfall', cls: 'text-orange-600', icon: <AlertTriangle size={14} /> };
  return { label: 'Out of Stock', cls: 'text-red-600', icon: <XCircle size={14} /> };
}

export function DesignDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [design, setDesign] = useState<DesignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [planQty, setPlanQty] = useState(100);

  useEffect(() => {
    const t = setTimeout(() => { setDesign(mockDesign); setIsLoading(false); }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!design) return <div className="p-6 text-slate-500">Design not found.</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate('/production/designs')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{design.name}</h1>
            <span className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{design.designNo}</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{design.status}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{design.category} · {design.type} · {design.variants.length} variants</p>
        </div>
        <Button onClick={() => navigate(`/production/designs/${id}/edit`)} variant="secondary">
          <Edit size={15} /> Edit
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide text-slate-500">Design Info</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[
                ['Design No.', design.designNo],
                ['Category', design.category],
                ['Type', design.type],
                ['Status', design.status],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                  <div className="font-medium text-slate-800">{val}</div>
                </div>
              ))}
            </div>
            {design.description && (
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-400 mb-1">Description</div>
                <p className="text-sm text-slate-700">{design.description}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Colours</div>
              <div className="flex flex-wrap gap-2">
                {design.colours.map(c => (
                  <span key={c} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">{c}</span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Sizes</div>
              <div className="flex flex-wrap gap-2">
                {design.sizes.map(s => (
                  <span key={s} className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold flex items-center justify-center">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Variants */}
      {activeTab === 'Variants' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Each variant is a unique <span className="font-medium">Design / Colour / Size</span> combination with its own SKU and stock.</p>
            <Button variant="outline" onClick={() => {}}>
              <Plus size={15} /> Add Variant
            </Button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['SKU', 'Colour', 'Size', 'Ready Stock', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {design.variants.map(v => (
                  <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{v.sku}</td>
                    <td className="px-4 py-3 text-slate-800">{v.colour}</td>
                    <td className="px-4 py-3">
                      <span className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">{v.size}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${v.stock > 0 ? 'text-green-700' : 'text-red-500'}`}>
                        {v.stock > 0 ? v.stock : 'Nil'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: BOM */}
      {activeTab === 'BOM' && (
        <div className="flex flex-col gap-5">
          {/* Planning qty input */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap">
            <div className="text-sm font-medium text-blue-800">Plan for</div>
            <input
              type="number"
              min={1}
              value={planQty}
              onChange={e => setPlanQty(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-1.5 text-sm border border-blue-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-sm font-medium text-blue-800">garments — live material requirement below</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Role', 'Material', 'Unit', 'Qty / garment', 'Allowance', 'Required', 'Available', 'Status'].map(h => (
                    <th key={h} className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {design.bom.map(line => {
                  const required = Math.ceil(planQty * line.qtyPerGarment * (1 + line.allowancePct / 100));
                  const shortage = line.available - required;
                  const status = stockStatus(required, line.available);
                  return (
                    <tr key={line.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-3 text-xs font-medium text-slate-500">{line.role}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{line.material}</td>
                      <td className="px-3 py-3 text-slate-600">{line.unit}</td>
                      <td className="px-3 py-3 text-slate-700">{line.qtyPerGarment}</td>
                      <td className="px-3 py-3 text-slate-500">{line.allowancePct}%</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{required.toLocaleString('en-IN')} {line.unit}</td>
                      <td className="px-3 py-3 text-slate-700">{line.available.toLocaleString('en-IN')} {line.unit}</td>
                      <td className="px-3 py-3">
                        <div className={`flex items-center gap-1 text-xs font-medium ${status.cls}`}>
                          {status.icon} {status.label}
                          {shortage < 0 && (
                            <span className="ml-1 text-red-500">({Math.abs(shortage).toLocaleString('en-IN')} {line.unit} short)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">Formula: garments × qty per garment × (1 + allowance%) = required</p>
            <Button variant="outline" onClick={() => {}}>
              <Plus size={15} /> Add BOM Line
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Instructions */}
      {activeTab === 'Instructions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Manufacturing Instructions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Step-by-step notes sent with every job slip for this design.</p>
            </div>
            <Button variant="secondary" onClick={() => {}}>
              <Edit size={14} /> Edit
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
            {design.manufacturingInstructions || 'No manufacturing instructions added yet.'}
          </pre>
        </div>
      )}
    </div>
  );
}
