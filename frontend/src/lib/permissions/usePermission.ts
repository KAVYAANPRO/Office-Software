import { useAuth } from '../auth/AuthContext';
import { roleHasPermission, type PermissionKey } from './permissions';

/**
 * Central permission check (frontend.md §8). Every place in the UI that
 * decides whether to show an action or a protected field (rate/cost/margin)
 * must go through this hook or the <Can> gate, never re-derive role checks
 * inline — that's how AUTH-07/CST-07/PKG-02 stayed unenforced before.
 *
 * User-level allow/deny overrides (AUTH-04) take precedence over the role
 * default when present on the logged-in user.
 */
export function usePermission() {
  const { user } = useAuth();

  const has = (key: PermissionKey): boolean => {
    if (!user) return false;
    if (user.deniedPermissions?.includes(key)) return false;
    if (user.grantedPermissions?.includes(key)) return true;
    return roleHasPermission(user.role, key);
  };

  const hasAny = (keys: PermissionKey[]) => keys.some(has);
  const hasAll = (keys: PermissionKey[]) => keys.every(has);

  return { has, hasAny, hasAll, role: user?.role };
}
