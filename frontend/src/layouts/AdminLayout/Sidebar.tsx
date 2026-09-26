import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Settings, Menu,
  ChevronLeft, ChevronDown, X, Factory, Activity, FileText,
  ClipboardCheck, Scissors, FileCog, Truck, Palette, Ruler,
  MapPin, Tag, Boxes, TrendingUp, Search, Shield, BarChart2, CreditCard,
  FlaskConical, UserCog,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

interface NavItem { path: string; label: string; icon: React.ReactNode }
interface NavGroup { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }],
  },
  {
    label: 'Procurement',
    items: [
      { path: '/procurement/suppliers', label: 'Suppliers', icon: <Users size={18} /> },
      { path: '/procurement/purchases', label: 'Purchases', icon: <FileText size={18} /> },
      { path: '/procurement/inward', label: 'Pending Inward', icon: <ClipboardCheck size={18} /> },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { path: '/inventory/stock', label: 'Stock Overview', icon: <Boxes size={18} /> },
      { path: '/inventory/ledger', label: 'Stock Ledger', icon: <FileText size={18} /> },
      { path: '/inventory/lots', label: 'Lots', icon: <Package size={18} /> },
      { path: '/inventory/adjustments', label: 'Adjustments', icon: <Activity size={18} /> },
      { path: '/inventory/materials', label: 'Materials', icon: <Ruler size={18} /> },
    ],
  },
  {
    label: 'Design & Production',
    items: [
      { path: '/production/designs', label: 'Designs & BOM', icon: <Scissors size={18} /> },
      { path: '/production/requirements', label: 'Prod. Requirements', icon: <ClipboardCheck size={18} /> },
      { path: '/production/job-slips', label: 'Job Slips', icon: <FileCog size={18} /> },
      { path: '/production/processing', label: 'Processing Jobs', icon: <FlaskConical size={18} /> },
      { path: '/production/issuance', label: 'Material Issuance', icon: <Truck size={18} /> },
      { path: '/production/receiving', label: 'Receiving', icon: <Package size={18} /> },
    ],
  },
  {
    label: 'Costing',
    items: [
      { path: '/costing', label: 'Cost Sheets', icon: <TrendingUp size={18} /> },
    ],
  },
  {
    label: 'Ready Stock',
    items: [
      { path: '/ready-stock', label: 'Ready Stock', icon: <Package size={18} /> },
      { path: '/ready-stock/packing', label: 'Packing', icon: <Boxes size={18} /> },
    ],
  },
  {
    label: 'Sales',
    items: [
      { path: '/sales/orders', label: 'Sales Orders', icon: <ShoppingCart size={18} /> },
      { path: '/sales/invoices', label: 'Invoices', icon: <FileText size={18} /> },
      { path: '/sales/payments', label: 'Payments', icon: <CreditCard size={18} /> },
    ],
  },
  {
    label: 'Reports & Traceability',
    items: [
      { path: '/reports', label: 'Reports', icon: <BarChart2 size={18} /> },
      { path: '/traceability', label: 'Traceability', icon: <Search size={18} /> },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { path: '/masters/customers', label: 'Customers', icon: <Users size={18} /> },
      { path: '/masters/factories', label: 'Factories / Artisans', icon: <Factory size={18} /> },
      { path: '/masters/categories', label: 'Categories', icon: <Tag size={18} /> },
      { path: '/masters/colours', label: 'Colours', icon: <Palette size={18} /> },
      { path: '/masters/sizes', label: 'Sizes', icon: <Ruler size={18} /> },
      { path: '/masters/units', label: 'Units', icon: <Boxes size={18} /> },
      { path: '/masters/locations', label: 'Locations', icon: <MapPin size={18} /> },
      { path: '/masters/processes', label: 'Processing Types', icon: <Activity size={18} /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/admin/users', label: 'Users', icon: <UserCog size={18} /> },
      { path: '/audit-log', label: 'Audit Log', icon: <Shield size={18} /> },
      { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
    ],
  },
];

export function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(navGroups.map(g => g.label))
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          sidebarWidth,
          'bg-slate-800 text-slate-100 flex flex-col shrink-0 transition-all duration-300',
          'fixed lg:static inset-y-0 left-0 z-30',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          {!collapsed && (
            <span className="font-bold text-base truncate">Office ERP</span>
          )}

          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-auto"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {navGroups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400/70 hover:text-slate-300 transition-colors mt-2"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={12}
                    className="transition-transform duration-200"
                    style={{ transform: expandedGroups.has(group.label) ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  />
                </button>
              )}

              {(collapsed || expandedGroups.has(group.label)) &&
                group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        collapsed ? 'justify-center' : '',
                        isActive
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white',
                      ].join(' ')
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))
              }
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
