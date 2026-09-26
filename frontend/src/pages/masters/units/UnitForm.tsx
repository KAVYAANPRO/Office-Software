import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

const UNIT_TYPES = ['Length', 'Weight', 'Piece', 'Volume', 'Other'] as const;

export function UnitForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    type: 'Piece' as typeof UNIT_TYPES[number],
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Unit name is required.';
    if (!formData.abbreviation.trim()) errs.abbreviation = 'Abbreviation is required.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    navigate('/masters/units');
  };

  const selectClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/masters/units')} className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Unit' : 'Add Unit'}</h1>
          <p className="text-sm text-slate-500">{isEdit ? 'Update unit details.' : 'Add a new unit of measure.'}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
        <Input label="Unit Name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Metre" error={errors.name} required />
        <Input label="Abbreviation" value={formData.abbreviation} onChange={e => setFormData(f => ({ ...f, abbreviation: e.target.value }))} placeholder="e.g. m" error={errors.abbreviation} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Type</label>
          <select className={selectClass} value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value as typeof UNIT_TYPES[number] }))}>
            {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select className={selectClass} value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isLoading}>{isEdit ? 'Update Unit' : 'Create Unit'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/masters/units')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
