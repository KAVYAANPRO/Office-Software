import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserCog } from 'lucide-react';

const roles = [
  'Super Admin', 'Purchase', 'Inventory', 'Design', 'Production', 'Packing', 'Sales', 'Factory User', 'Artisan User',
];

const mockFactories = [
  { id: 'f1', name: 'Krishna Dyeing Works' },
  { id: 'f2', name: 'Artex Printing House' },
  { id: 'f3', name: 'Fine Embroidery Works' },
  { id: 'f4', name: 'Super Stitchers' },
];

interface FormData {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  partyId: string;
  status: 'Active' | 'Inactive';
  newPassword: string;
  confirmPassword: string;
}

export function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const [form, setForm] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'Production',
    partyId: '',
    status: 'Active',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => {
        setForm({
          name: 'Krishna Factory',
          username: 'krishna_fac',
          email: 'accounts@krishnadyeing.com',
          phone: '+91 98400 11223',
          role: 'Factory User',
          partyId: 'f1',
          status: 'Active',
          newPassword: '',
          confirmPassword: '',
        });
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  const isExternal = form.role === 'Factory User' || form.role === 'Artisan User';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isEditing && form.newPassword !== form.confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    if (!isEditing && form.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setPwError('');
    setIsSaving(true);
    // TODO: Replace with API call — POST/PUT /api/v1/admin/users
    setTimeout(() => {
      setIsSaving(false);
      navigate('/admin/users');
    }, 800);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/users')} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit User' : 'New User'}</h1>
          <p className="text-sm text-slate-500">Create internal staff or link an external factory / artisan account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Identity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <UserCog size={15} className="text-blue-500" /> User Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username / Mobile <span className="text-red-500">*</span></label>
              <input type="text" name="username" value={form.username} onChange={handleChange} required
                placeholder="e.g. rpatel or 9876543210"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Role & Party */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Role & Access</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role <span className="text-red-500">*</span></label>
              <select name="role" value={form.role} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {isExternal && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Factory / Artisan Party <span className="text-red-500">*</span></label>
                <select name="partyId" value={form.partyId} onChange={handleChange} required={isExternal}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select party</option>
                  {mockFactories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive (deactivate — never delete)</option>
              </select>
            </div>
          </div>
          {isExternal && (
            <p className="text-xs text-slate-400 mt-3">
              External users are party-scoped (AUTH-06). They can only see their own party's jobs and material.
            </p>
          )}
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            {isEditing ? 'Reset Password (leave blank to keep current)' : 'Set Password'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isEditing ? 'New Password' : 'Password'} {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange}
                required={!isEditing} minLength={8} placeholder="Min 8 characters"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                required={!isEditing}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {pwError && <p className="text-xs text-red-600 mt-2">{pwError}</p>}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60">
            {isSaving ? 'Saving…' : isEditing ? 'Update User' : 'Create User'}
          </button>
          <button type="button" onClick={() => navigate('/admin/users')}
            className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
