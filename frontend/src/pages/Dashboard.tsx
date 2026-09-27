import { AdminDashboard } from './dashboard/AdminDashboard';
import { PurchaseDashboard } from './dashboard/PurchaseDashboard';
import { RawMaterialDashboard } from './dashboard/RawMaterialDashboard';
import { DesignDashboard } from './dashboard/DesignDashboard';
import { ProductionDashboard } from './dashboard/ProductionDashboard';
import { PackingDashboardHome } from './dashboard/PackingDashboardHome';
import { SalesDashboard } from './dashboard/SalesDashboard';
import { useAuth } from '../lib/auth/AuthContext';
import type { Role } from '../lib/permissions/permissions';

/** DSH-01 — one dashboard per role (frontend.md §11). */
const DASHBOARD_BY_ROLE: Record<Role, () => React.ReactElement> = {
  super_admin: AdminDashboard,
  purchase: PurchaseDashboard,
  inventory: RawMaterialDashboard,
  design: DesignDashboard,
  production: ProductionDashboard,
  packing: PackingDashboardHome,
  sales: SalesDashboard,
  factory: AdminDashboard, // factory users land on the separate /factory portal, never here
};

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const DashboardComponent = DASHBOARD_BY_ROLE[user.role] ?? AdminDashboard;
  return <DashboardComponent />;
}
