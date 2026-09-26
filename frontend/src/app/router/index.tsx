import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout/AdminLayout';
import { AuthLayout } from '../../layouts/AuthLayout/AuthLayout';
import Dashboard from '../../pages/Dashboard';
import ErrorPage from '../../pages/ErrorPage';
import Login from '../../pages/auth/Login';
import { ProtectedRoute } from '../../components/navigation/ProtectedRoute';
import { SupplierList } from '../../pages/procurement/suppliers/SupplierList';
import { SupplierForm } from '../../pages/procurement/suppliers/SupplierForm';
import { MaterialList } from '../../pages/inventory/materials/MaterialList';
import { MaterialForm } from '../../pages/inventory/materials/MaterialForm';
import { FactoryList } from '../../pages/masters/factories/FactoryList';
import { FactoryForm } from '../../pages/masters/factories/FactoryForm';
import { ProcessList } from '../../pages/masters/processes/ProcessList';
import { ProcessForm } from '../../pages/masters/processes/ProcessForm';
import { ColourList } from '../../pages/masters/colours/ColourList';
import { ColourForm } from '../../pages/masters/colours/ColourForm';
import { UnitList } from '../../pages/masters/units/UnitList';
import { UnitForm } from '../../pages/masters/units/UnitForm';
import { SizeList } from '../../pages/masters/sizes/SizeList';
import { SizeForm } from '../../pages/masters/sizes/SizeForm';
import { LocationList } from '../../pages/masters/locations/LocationList';
import { LocationForm } from '../../pages/masters/locations/LocationForm';
import { CustomerList } from '../../pages/masters/customers/CustomerList';
import { CustomerForm } from '../../pages/masters/customers/CustomerForm';
import { CategoryList } from '../../pages/masters/categories/CategoryList';
import { CategoryForm } from '../../pages/masters/categories/CategoryForm';
import { PurchaseOrderList } from '../../pages/procurement/purchases/PurchaseOrderList';
import { PurchaseOrderForm } from '../../pages/procurement/purchases/PurchaseOrderForm';
import { PendingInwardList } from '../../pages/procurement/inward/PendingInwardList';
import { InwardForm } from '../../pages/procurement/inward/InwardForm';
import { DesignList } from '../../pages/production/designs/DesignList';
import { DesignForm } from '../../pages/production/designs/DesignForm';
import { JobSlipList } from '../../pages/production/job-slips/JobSlipList';
import { JobSlipForm } from '../../pages/production/job-slips/JobSlipForm';
import { PendingIssuanceList } from '../../pages/production/issuance/PendingIssuanceList';
import { IssuanceForm } from '../../pages/production/issuance/IssuanceForm';
import { DesignDetail } from '../../pages/production/designs/DesignDetail';
import { ProductionRequirementList } from '../../pages/production/requirements/ProductionRequirementList';
import { ProductionRequirementForm } from '../../pages/production/requirements/ProductionRequirementForm';
import { JobSlipDetail } from '../../pages/production/job-slips/JobSlipDetail';
import { ReceivingList } from '../../pages/production/receiving/ReceivingList';
import { ReceivingForm } from '../../pages/production/receiving/ReceivingForm';
import { ReconciliationDetail } from '../../pages/production/reconciliation/ReconciliationDetail';
import { FactoryLayout } from '../../layouts/FactoryLayout/FactoryLayout';
import { FactoryHome } from '../../pages/factory/FactoryHome';
import { FactoryJobList } from '../../pages/factory/FactoryJobList';
import { FactoryJobDetail } from '../../pages/factory/FactoryJobDetail';
import { CostSheetList } from '../../pages/costing/CostSheetList';
import { CostSheetDetail } from '../../pages/costing/CostSheetDetail';
import { ReadyStockList } from '../../pages/ready-stock/ReadyStockList';
import { PackingDashboard } from '../../pages/ready-stock/PackingDashboard';
import { StockOverview } from '../../pages/inventory/stock/StockOverview';
import { StockLedger } from '../../pages/inventory/stock/StockLedger';
import { StockAdjustmentList } from '../../pages/inventory/stock/StockAdjustmentList';
import { StockAdjustmentForm } from '../../pages/inventory/stock/StockAdjustmentForm';
import { LotList } from '../../pages/inventory/lots/LotList';
// Phase 7 — Sales
import { SalesOrderList } from '../../pages/sales/SalesOrderList';
import { SalesOrderForm } from '../../pages/sales/SalesOrderForm';
import { SalesOrderDetail } from '../../pages/sales/SalesOrderDetail';
import { InvoiceList } from '../../pages/sales/InvoiceList';
import { InvoiceDetail } from '../../pages/sales/InvoiceDetail';
import { PaymentList } from '../../pages/sales/PaymentList';
import { PaymentForm } from '../../pages/sales/PaymentForm';
// Processing jobs
import { ProcessingJobList } from '../../pages/production/processing/ProcessingJobList';
import { ProcessingJobForm } from '../../pages/production/processing/ProcessingJobForm';
// Phase 8 — Traceability
import { TraceabilitySearch } from '../../pages/traceability/TraceabilitySearch';
// Phase 9 — Control
import { AuditLog } from '../../pages/audit/AuditLog';
import { ReportsList } from '../../pages/reports/ReportsList';
// Settings
import { Settings } from '../../pages/settings/Settings';
// Invoice form
import { InvoiceForm } from '../../pages/sales/InvoiceForm';
// User management
import { UserList } from '../../pages/admin/users/UserList';
import { UserForm } from '../../pages/admin/users/UserForm';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'masters',
        children: [
          { index: true, element: <Navigate to="factories" replace /> },
          { path: 'factories', element: <FactoryList /> },
          { path: 'factories/new', element: <FactoryForm /> },
          { path: 'factories/:id', element: <FactoryForm /> },
          { path: 'processes', element: <ProcessList /> },
          { path: 'processes/new', element: <ProcessForm /> },
          { path: 'processes/:id', element: <ProcessForm /> },
          { path: 'colours', element: <ColourList /> },
          { path: 'colours/new', element: <ColourForm /> },
          { path: 'colours/:id', element: <ColourForm /> },
          { path: 'units', element: <UnitList /> },
          { path: 'units/new', element: <UnitForm /> },
          { path: 'units/:id', element: <UnitForm /> },
          { path: 'sizes', element: <SizeList /> },
          { path: 'sizes/new', element: <SizeForm /> },
          { path: 'sizes/:id', element: <SizeForm /> },
          { path: 'locations', element: <LocationList /> },
          { path: 'locations/new', element: <LocationForm /> },
          { path: 'locations/:id', element: <LocationForm /> },
          { path: 'customers', element: <CustomerList /> },
          { path: 'customers/new', element: <CustomerForm /> },
          { path: 'customers/:id', element: <CustomerForm /> },
          { path: 'categories', element: <CategoryList /> },
          { path: 'categories/new', element: <CategoryForm /> },
          { path: 'categories/:id', element: <CategoryForm /> },
        ],
      },
      {
        path: 'procurement',
        children: [
          { index: true, element: <Navigate to="suppliers" replace /> },
          { path: 'suppliers', element: <SupplierList /> },
          { path: 'suppliers/new', element: <SupplierForm /> },
          { path: 'suppliers/:id', element: <SupplierForm /> },
          { path: 'purchases', element: <PurchaseOrderList /> },
          { path: 'purchases/new', element: <PurchaseOrderForm /> },
          { path: 'purchases/:id', element: <PurchaseOrderForm /> },
          { path: 'inward', element: <PendingInwardList /> },
          { path: 'inward/:id', element: <InwardForm /> },
        ],
      },
      {
        path: 'production',
        children: [
          { index: true, element: <Navigate to="designs" replace /> },
          { path: 'designs', element: <DesignList /> },
          { path: 'designs/new', element: <DesignForm /> },
          { path: 'designs/:id', element: <DesignDetail /> },
          { path: 'designs/:id/edit', element: <DesignForm /> },
          { path: 'requirements', element: <ProductionRequirementList /> },
          { path: 'requirements/new', element: <ProductionRequirementForm /> },
          { path: 'requirements/:id', element: <ProductionRequirementForm /> },
          { path: 'job-slips', element: <JobSlipList /> },
          { path: 'job-slips/new', element: <JobSlipForm /> },
          { path: 'job-slips/:id', element: <JobSlipDetail /> },
          { path: 'job-slips/:id/edit', element: <JobSlipForm /> },
          { path: 'processing', element: <ProcessingJobList /> },
          { path: 'processing/new', element: <ProcessingJobForm /> },
          { path: 'processing/:id', element: <ProcessingJobForm /> },
          { path: 'receiving', element: <ReceivingList /> },
          { path: 'receiving/new', element: <ReceivingForm /> },
          { path: 'receiving/:id', element: <ReceivingForm /> },
          { path: 'reconciliation/:id', element: <ReconciliationDetail /> },
          { path: 'issuance', element: <PendingIssuanceList /> },
          { path: 'issuance/:id', element: <IssuanceForm /> },
        ],
      },
      {
        path: 'inventory',
        children: [
          { index: true, element: <Navigate to="stock" replace /> },
          { path: 'materials', element: <MaterialList /> },
          { path: 'materials/new', element: <MaterialForm /> },
          { path: 'materials/:id', element: <MaterialForm /> },
          { path: 'stock', element: <StockOverview /> },
          { path: 'ledger', element: <StockLedger /> },
          { path: 'adjustments', element: <StockAdjustmentList /> },
          { path: 'adjustments/new', element: <StockAdjustmentForm /> },
          { path: 'adjustments/:id', element: <StockAdjustmentForm /> },
          { path: 'lots', element: <LotList /> },
        ],
      },
      {
        path: 'costing',
        children: [
          { index: true, element: <CostSheetList /> },
          { path: ':id', element: <CostSheetDetail /> },
        ],
      },
      {
        path: 'ready-stock',
        children: [
          { index: true, element: <ReadyStockList /> },
          { path: 'packing', element: <PackingDashboard /> },
        ],
      },
      // Phase 7 — Sales
      {
        path: 'sales',
        children: [
          { index: true, element: <Navigate to="orders" replace /> },
          { path: 'orders', element: <SalesOrderList /> },
          { path: 'orders/new', element: <SalesOrderForm /> },
          { path: 'orders/:id', element: <SalesOrderDetail /> },
          { path: 'invoices', element: <InvoiceList /> },
          { path: 'invoices/new', element: <InvoiceForm /> },
          { path: 'invoices/:id', element: <InvoiceDetail /> },
          { path: 'payments', element: <PaymentList /> },
          { path: 'payments/new', element: <PaymentForm /> },
        ],
      },
      // Phase 8 — Traceability
      { path: 'traceability', element: <TraceabilitySearch /> },
      // Phase 9 — Control
      { path: 'reports', element: <ReportsList /> },
      { path: 'audit-log', element: <AuditLog /> },
      { path: 'settings', element: <Settings /> },
      // Admin
      {
        path: 'admin',
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: 'users', element: <UserList /> },
          { path: 'users/new', element: <UserForm /> },
          { path: 'users/:id', element: <UserForm /> },
        ],
      },
    ],
  },
  {
    path: '/factory',
    element: (
      <ProtectedRoute>
        <FactoryLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <FactoryHome /> },
      { path: 'jobs', element: <FactoryJobList /> },
      { path: 'jobs/:id', element: <FactoryJobDetail /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
