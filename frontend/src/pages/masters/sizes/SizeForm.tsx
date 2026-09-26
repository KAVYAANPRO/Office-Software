import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export function SizeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({ name: '', code: '', sortOrder: '', status: 'Active' as 'Active' | 'Inactive' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Size name is required.';
    if (!formData.code.trim()) errs.code = 'Size code is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    navigate('/masters/sizes');
  };

  const selectClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/masters/sizes')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Size' : 'Add Size'}</h1>
          <p className="text-sm text-slate-500">{isEdit ? 'Update size details.' : 'Create a new garment size.'}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
        <Input label="Size Name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Medium" error={errors.name} required />
        <Input label="Code" value={formData.code} onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. M" error={errors.code} required />
        <Input label="Sort Order" type="number" value={formData.sortOrder} onChange={e => setFormData(f => ({ ...f, sortOrder: e.target.value }))} placeholder="e.g. 3" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select className={selectClass} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isLoading}>{isEdit ? 'Update Size' : 'Create Size'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/masters/sizes')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
