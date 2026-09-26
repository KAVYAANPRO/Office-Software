import { useState } from 'react';
import type { FormEvent } from 'react';
import { Building2, Calculator, Hash, Shield } from 'lucide-react';

type Tab = 'company' | 'tax' | 'numbering' | 'roles';

interface CompanyProfile {
  legalName: string;
  gstin: string;
  state: string;
  address: string;
  email: string;
  phone: string;
  financialYearStart: string;
}

interface TaxRule {
  id: string;
  hsn: string;
  description: string;
  valueBandMax: number | null;
  gstRate: number;
  effectiveFrom: string;
}

interface NumberSeries {
  module: string;
  prefix: string;
  separator: string;
  currentNumber: number;
  padLength: number;
  preview: string;
}

const mockCompany: CompanyProfile = {
  legalName: 'Ananya Garments Pvt. Ltd.',
  gstin: '27AABCA1234B1ZY',
  state: 'Maharashtra',
  address: '12, Textile Market, Surat Road, Mumbai – 400001',
  email: 'accounts@ananyagarments.in',
  phone: '+91 98765 43210',
  financialYearStart: '04-01',
};

const mockTaxRules: TaxRule[] = [
  { id: 't1', hsn: '6211', description: 'Readymade garments — up to ₹2,500/pc', valueBandMax: 2500, gstRate: 5, effectiveFrom: '22-09-2025' },
  { id: 't2', hsn: '6211', description: 'Readymade garments — above ₹2,500/pc', valueBandMax: null, gstRate: 18, effectiveFrom: '22-09-2025' },
  { id: 't3', hsn: '5007', description: 'Silk fabric', valueBandMax: null, gstRate: 5, effectiveFrom: '01-07-2017' },
];

const mockSeries: NumberSeries[] = [
  { module: 'Purchase Order', prefix: 'PO', separator: '/', currentNumber: 14, padLength: 5, preview: 'PO/26-27/00014' },
  { module: 'Inward', prefix: 'INW', separator: '/', currentNumber: 23, padLength: 5, preview: 'INW/26-27/00023' },
  { module: 'Job Slip', prefix: 'JS', separator: '-', currentNumber: 12, padLength: 3, preview: 'JS-26-012' },
  { module: 'Sales Invoice', prefix: 'INV', separator: '/', currentNumber: 13, padLength: 5, preview: 'INV/26-27/00013' },
  { module: 'Sales Order', prefix: 'SO', separator: '/', currentNumber: 8, padLength: 3, preview: 'SO/26-27/008' },
];

const mockRoles = [
  { id: 'r1', name: 'Super Admin', users: 1, description: 'Full access to all modules, users, settings, and audit log' },
  { id: 'r2', name: 'Purchase', users: 2, description: 'Manage suppliers, purchase orders, and inward' },
  { id: 'r3', name: 'Inventory', users: 2, description: 'Raw material stock, ledger, adjustments, lots' },
  { id: 'r4', name: 'Design', users: 1, description: 'Design master, BOM, design variants' },
  { id: 'r5', name: 'Production', users: 3, description: 'Job slips, material issue, receiving, costing' },
  { id: 'r6', name: 'Packing', users: 2, description: 'Ready stock and packing status, no cost data' },
  { id: 'r7', name: 'Sales', users: 2, description: 'Customers, sales orders, invoices, payments' },
  { id: 'r8', name: 'Factory User', users: 5, description: 'External — own jobs, material acknowledgement only' },
  { id: 'r9', name: 'Artisan User', users: 3, description: 'External — same as Factory User, party-scoped' },
];

export function Settings() {
  const [tab, setTab] = useState<Tab>('company');
  const [company, setCompany] = useState(mockCompany);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'company', label: 'Company Profile', icon: <Building2 size={15} /> },
    { id: 'tax', label: 'Tax & HSN Rules', icon: <Calculator size={15} /> },
    { id: 'numbering', label: 'Document Numbering', icon: <Hash size={15} /> },
    { id: 'roles', label: 'Roles & Permissions', icon: <Shield size={15} /> },
  ];

  const handleSaveCompany = (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Replace with API call — PUT /api/v1/settings/company
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 700);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Company profile, tax configuration, document numbering, and roles</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Company Profile */}
      {tab === 'company' && (
        <form onSubmit={handleSaveCompany} className="max-w-2xl">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Company Profile & Legal Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Legal Name <span className="text-red-500">*</span></label>
                <input type="text" value={company.legalName} onChange={e => setCompany(p => ({ ...p, legalName: e.target.value }))} required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN <span className="text-red-500">*</span></label>
                <input type="text" value={company.gstin} onChange={e => setCompany(p => ({ ...p, gstin: e.target.value }))} required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                <input type="text" value={company.state} onChange={e => setCompany(p => ({ ...p, state: e.target.value }))} required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={company.email} onChange={e => setCompany(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="text" value={company.phone} onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Financial Year Start (MM-DD)</label>
                <input type="text" value={company.financialYearStart} onChange={e => setCompany(p => ({ ...p, financialYearStart: e.target.value }))}
                  placeholder="04-01 = 1 April"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex gap-3 items-center">
              <button type="submit" disabled={isSaving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60">
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            </div>
          </div>
        </form>
      )}

      {/* Tax Rules */}
      {tab === 'tax' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Tax Rules (HSN × Value Band)</h2>
            <button className="text-sm text-blue-600 hover:underline">+ Add Rule</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['HSN', 'Description', 'Value Band Max (₹/pc)', 'GST Rate', 'Effective From', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockTaxRules.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.hsn}</td>
                  <td className="px-4 py-3">{r.description}</td>
                  <td className="px-4 py-3 text-right">{r.valueBandMax != null ? `₹${r.valueBandMax.toLocaleString('en-IN')}` : 'No cap'}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.gstRate}%</td>
                  <td className="px-4 py-3 text-slate-500">{r.effectiveFrom}</td>
                  <td className="px-4 py-3"><button className="text-blue-600 hover:underline text-xs">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-slate-400">
            Tax rules are effective-dated. Rates are applied based on per-piece taxable value at time of invoice.
            Consult your CA before modifying. — <em>Appendix B, prd.md</em>
          </p>
        </div>
      )}

      {/* Document Numbering */}
      {tab === 'numbering' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Document Number Series</h2>
            <p className="text-xs text-slate-400 mt-0.5">Invoice numbers must be at most 16 characters, gapless, and sequential per financial year (GST SAL-06)</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Module', 'Prefix', 'Sep', 'Current #', 'Pad', 'Preview'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockSeries.map(s => (
                <tr key={s.module} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{s.module}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.prefix}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.separator}</td>
                  <td className="px-4 py-3 text-right">{s.currentNumber}</td>
                  <td className="px-4 py-3 text-right">{s.padLength}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.preview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Roles */}
      {tab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Roles & Permission Bundles</h2>
              <p className="text-xs text-slate-400 mt-0.5">Nine default roles seeded (AUTH-04). Individual users can have extra grants or denials.</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Role', 'Type', '# Users', 'Description', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockRoles.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.name.includes('User') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {r.name.includes('User') ? 'External' : 'Internal'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{r.users}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{r.description}</td>
                  <td className="px-4 py-3"><button className="text-blue-600 hover:underline text-xs">View Permissions</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
