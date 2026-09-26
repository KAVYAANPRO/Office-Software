import { AdminDashboard } from './dashboard/AdminDashboard';
import { useAuth } from '../lib/auth/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  // In a full implementation, we'd switch between different dashboards 
  // based on the user.role (Admin, Purchase, Factory, etc).
  // For Phase 2, we are explicitly instructed to only build the Admin Dashboard.
  
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
      <p className="text-muted">You do not have access to the Admin Dashboard.</p>
    </div>
  );
}
