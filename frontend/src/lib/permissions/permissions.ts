// Frontend permission model. Mirrors prd.md §2.2's proposed permission matrix.
//
// IMPORTANT: this is a UX convenience layer only (frontend.md §8). Hiding an
// action or field here must never be the only thing standing between a user
// and protected data — the backend must re-check every one of these keys
// server-side once it exists. Field-level protected values (rates, costs,
// margins) must additionally never be fetched for a user lacking the key,
// once real API calls replace the mock data layer.

export const ROLES = [
  'super_admin',
  'purchase',
  'inventory',
  'design',
  'production',
  'packing',
  'sales',
  'factory',
] as const;
export type Role = typeof ROLES[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin / Owner',
  purchase: 'Purchase Department',
  inventory: 'Raw Material / Inventory',
  design: 'Design Department',
  production: 'Production Department',
  packing: 'Packing Department',
  sales: 'Sales Department',
  factory: 'Factory / Artisan',
};

export const PERMISSION_KEYS = [
  // Purchase
  'purchases.view', 'purchases.rate.view', 'purchases.create', 'purchases.edit', 'purchases.confirm', 'purchases.cancel',
  // Suppliers
  'suppliers.view', 'suppliers.edit',
  // Materials / masters
  'materials.view', 'materials.edit',
  'customers.view', 'customers.edit',
  'factories.view', 'factories.edit',
  // Inward
  'inward.view', 'inward.create', 'inward.confirm',
  // Stock
  'stock.view', 'stock.edit', 'stock.rate.view', 'adjustments.create', 'adjustments.approve',
  // Design
  'designs.view', 'designs.edit', 'designs.rate.view',
  // Production
  'requirements.view', 'requirements.edit',
  'jobslips.view', 'jobslips.edit', 'jobslips.confirm', 'jobslips.cancel',
  'issuance.view', 'issuance.edit', 'issuance.confirm',
  'processing.view', 'processing.edit',
  'receiving.view', 'receiving.edit', 'receiving.confirm', 'receiving.rate.view',
  'reconciliation.view', 'reconciliation.approve',
  // Costing
  'costing.view',
  // Ready stock / packing
  'readystock.view', 'packing.view', 'packing.edit',
  // Sales
  'salesorders.view', 'salesorders.edit', 'salesorders.confirm', 'salesorders.cancel',
  'invoices.view', 'invoices.edit', 'invoices.confirm', 'invoices.cancel',
  'payments.view', 'payments.create',
  // Control
  'auditlog.view', 'reports.view', 'users.manage', 'settings.manage',
  // Factory portal (own party only — enforced by party scope, not this list)
  'factoryportal.acknowledge', 'factoryportal.updateStatus',
] as const;
export type PermissionKey = typeof PERMISSION_KEYS[number];

const ALL: PermissionKey[] = [...PERMISSION_KEYS];

/** prd.md §2.2 table, converted to boolean grants per role. */
export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  super_admin: ALL,

  purchase: [
    'purchases.view', 'purchases.rate.view', 'purchases.create', 'purchases.edit', 'purchases.confirm', 'purchases.cancel',
    'suppliers.view', 'suppliers.edit', 'materials.view',
    'inward.view', 'stock.view',
    'designs.view', 'reports.view',
  ],

  inventory: [
    'materials.view', 'materials.edit', 'suppliers.view',
    'inward.view', 'inward.create', 'inward.confirm',
    'stock.view', 'stock.edit', 'stock.rate.view', 'adjustments.create',
    'designs.view', 'requirements.view',
    'jobslips.view', 'issuance.view', 'issuance.edit', 'issuance.confirm',
    'processing.view', 'receiving.view', 'reconciliation.view',
    'factories.view', 'reports.view',
  ],

  design: [
    'designs.view', 'designs.edit', 'designs.rate.view',
    'stock.view', 'requirements.view',
    'jobslips.view', 'purchases.view', 'reports.view',
  ],

  production: [
    'designs.view', 'requirements.view', 'requirements.edit',
    'jobslips.view', 'jobslips.edit', 'jobslips.confirm', 'jobslips.cancel',
    'issuance.view', 'processing.view', 'processing.edit',
    'receiving.view', 'receiving.edit', 'receiving.confirm', 'receiving.rate.view',
    'reconciliation.view', 'reconciliation.approve',
    'factories.view', 'factories.edit', 'stock.view', 'materials.view',
    'readystock.view', 'reports.view',
  ],

  packing: [
    'readystock.view', 'packing.view', 'packing.edit', 'designs.view', 'reports.view',
    // costing.view intentionally absent — PKG-02
  ],

  sales: [
    'customers.view', 'customers.edit',
    'salesorders.view', 'salesorders.edit', 'salesorders.confirm', 'salesorders.cancel',
    'invoices.view', 'invoices.edit', 'invoices.confirm', 'invoices.cancel',
    'payments.view', 'payments.create',
    'readystock.view', 'designs.view', 'reports.view',
    // purchases.rate.view / costing.view intentionally absent
  ],

  factory: [
    'jobslips.view', 'issuance.view', 'receiving.view',
    'factoryportal.acknowledge', 'factoryportal.updateStatus',
    // no cost/rate keys, no other-party visibility (enforced by party scope)
  ],
};

export function roleHasPermission(role: Role, key: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(key) ?? false;
}
