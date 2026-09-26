import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    mobile: '',
    email: '',
    gstin: '',
    paymentTerms: 'Net 30',
    defaultDiscount: '',
    billingAddress: '',
    shippingAddress: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Customer name is required.';
    if (!formData.mobile.trim()) errs.mobile = 'Mobile number is required.';
    else if (!/^\d{10}$/.test(formData.mobile)) errs.mobile = 'Enter a valid 10-digit mobile number.';
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin))
      errs.gstin = 'Enter a valid GSTIN.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    navigate('/masters/customers');
  };

  const selectClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const textareaClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const sectionClass = 'bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4';

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/masters/customers')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Customer' : 'Add Customer'}</h1>
          <p className="text-sm text-slate-500">{isEdit ? 'Update customer details.' : 'Create a new customer account.'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contact Name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Mehta" error={errors.name} required />
            <Input label="Business / Trade Name" value={formData.businessName} onChange={e => setFormData(f => ({ ...f, businessName: e.target.value }))} placeholder="e.g. Mehta Fashion House" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Mobile Number" type="tel" value={formData.mobile} onChange={e => setFormData(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit mobile" error={errors.mobile} required />
            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">GST & Payment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="GSTIN" value={formData.gstin} onChange={e => setFormData(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="e.g. 27AADCM2230M1Z2" error={errors.gstin} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Payment Terms</label>
              <select className={selectClass} value={formData.paymentTerms} onChange={e => setFormData(f => ({ ...f, paymentTerms: e.target.value }))}>
                {['Advance', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <Input label="Default Discount (%)" type="number" value={formData.defaultDiscount} onChange={e => setFormData(f => ({ ...f, defaultDiscount: e.target.value }))} placeholder="0" />
        </div>

        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Addresses</h2>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Billing Address</label>
            <textarea className={textareaClass} rows={3} value={formData.billingAddress} onChange={e => setFormData(f => ({ ...f, billingAddress: e.target.value }))} placeholder="Full billing address..." />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Shipping Address</label>
            <textarea className={textareaClass} rows={3} value={formData.shippingAddress} onChange={e => setFormData(f => ({ ...f, shippingAddress: e.target.value }))} placeholder="Leave blank if same as billing..." />
          </div>
        </div>

        <div className="flex flex-col gap-1 max-w-48">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select className={selectClass} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={isLoading}>{isEdit ? 'Update Customer' : 'Create Customer'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/masters/customers')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
