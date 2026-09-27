import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { ROLES, ROLE_LABELS, type Role } from '../../lib/permissions/permissions';

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export function Header({ toggleMobileMenu }: HeaderProps) {
  const { user, logout, switchRole } = useAuth();
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <header className="flex items-center justify-between px-4 h-16 bg-white border-b border-slate-200 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-semibold text-slate-700 lg:hidden">Office ERP</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Dev-only role switcher — exercises permission gating before the backend issues real roles/sessions. Remove once AUTH-01..04 are backed by a real API. */}
        <select
          value={user?.role}
          onChange={e => switchRole(e.target.value as Role)}
          className="text-xs border border-amber-300 bg-amber-50 text-amber-800 rounded-lg px-2 py-1.5 font-medium focus:outline-none"
          title="Dev only: preview the app as a different role"
        >
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold select-none">
            {initials}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-32 truncate">
            {user?.name ?? 'User'}
          </span>

          <button
            onClick={logout}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
