import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  partyName: string | null;
  lastLogin: string | null;
  status: 'Active' | 'Inactive';
}

// TODO: Replace with API call — GET /api/v1/admin/users
const mockUsers: User[] = [
  { id: 'u1', name: 'Admin User', username: 'admin', role: 'Super Admin', partyName: null, lastLogin: '26-09-2026 09:15', status: 'Active' },
  { id: 'u2', name: 'Ramesh Patel', username: 'rpatel', role: 'Purchase', partyName: null, lastLogin: '25-09-2026 14:30', status: 'Active' },
  { id: 'u3', name: 'Kavya Singh', username: 'ksingh', role: 'Inventory', partyName: null, lastLogin: '26-09-2026 11:00', status: 'Active' },
  { id: 'u4', name: 'Priya Mehta', username: 'pmehta', role: 'Sales', partyName: null, lastLogin: '26-09-2026 08:45', status: 'Active' },
  { id: 'u5', name: 'Krishna Factory', username: 'krishna_fac', role: 'Factory User', partyName: 'Krishna Dyeing Works', lastLogin: '24-09-2026 16:20', status: 'Active' },
  { id: 'u6', name: 'Artex Printing', username: 'artex_usr', role: 'Factory User', partyName: 'Artex Printing House', lastLogin: '20-09-2026 10:00', status: 'Active' },
  { id: 'u7', name: 'Old Staff', username: 'old_staff', role: 'Inventory', partyName: null, lastLogin: '01-06-2026 09:00', status: 'Inactive' },
];

export function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  useEffect(() => {
    const t = setTimeout(() => { setUsers(mockUsers); setIsLoading(false); }, 500);
    return () => clearTimeout(t);
  }, []);

  const roles = Array.from(new Set(mockUsers.map(u => u.role)));

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.partyName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter ? u.role === roleFilter : true;
    const matchStatus = statusFilter ? u.status === statusFilter : true;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage internal and external (factory/artisan) users</p>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} /> New User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <input
            type="text" placeholder="Search by name, username, or party…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
            <Users size={32} />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {['Name', 'Username', 'Role', 'Party (External)', 'Last Login', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                        u.role.includes('User') ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.partyName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.lastLogin ?? 'Never'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="text-blue-600 hover:underline text-xs">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
