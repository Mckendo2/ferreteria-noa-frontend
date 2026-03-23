import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';

// Feature Pages
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ControlPanelPage from '../features/dashboard/pages/ControlPanelPage';
import ProductsPage from '../features/products/pages/ProductsPage';
import CategoriesPage from '../features/categories/pages/CategoriesPage';
import UsersPage from '../features/users/pages/UsersPage';
import RolePage from '../features/roles/pages/RolePage';
import SalesPage from '../features/sales/pages/SalesPage';
import ClientsPage from '../features/clients/pages/ClientsPage';
import ProvidersPage from '../features/providers/pages/ProvidersPage';
import PurchasesPage from '../features/purchases/pages/PurchasesPage';
import MovementsPage from '../features/movements/pages/MovementsPage';
import ExpensesPage from '../features/expenses/pages/ExpensesPage';
import CreditsPage from '../features/credits/pages/CreditsPage';
import PermissionsPage from '../features/permissions/pages/PermissionsPage';
import AuditPage from '../features/audit/pages/AuditPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import LandingPage from '../features/landing/pages/LandingPage';

const PrivateRoute = ({ children, permission }) => {
    const { user, hasPermission } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (permission && !hasPermission(permission)) return <Navigate to="/" />;
    return <MainLayout>{children}</MainLayout>;
};

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/panel-control" element={<PrivateRoute permission="ver_dashboard"><ControlPanelPage /></PrivateRoute>} />
            <Route path="/productos" element={<PrivateRoute permission="ver_inventario"><ProductsPage /></PrivateRoute>} />
            <Route path="/categorias" element={<PrivateRoute permission="ver_categorias"><CategoriesPage /></PrivateRoute>} />
            <Route path="/usuarios" element={<PrivateRoute permission="ver_usuarios"><UsersPage /></PrivateRoute>} />
            <Route path="/roles" element={<PrivateRoute permission="ver_roles"><RolePage /></PrivateRoute>} />
            <Route path="/ventas" element={<PrivateRoute permission="crear_ventas"><SalesPage /></PrivateRoute>} />
            <Route path="/compras" element={<PrivateRoute permission="ver_compras"><PurchasesPage /></PrivateRoute>} />
            <Route path="/clientes" element={<PrivateRoute permission="ver_clientes"><ClientsPage /></PrivateRoute>} />
            <Route path="/proveedores" element={<PrivateRoute permission="ver_proveedores"><ProvidersPage /></PrivateRoute>} />
            <Route path="/movimientos" element={<PrivateRoute permission="ver_movimientos"><MovementsPage /></PrivateRoute>} />
            <Route path="/gastos" element={<PrivateRoute permission="ver_gastos"><ExpensesPage /></PrivateRoute>} />
            <Route path="/creditos" element={<PrivateRoute permission="ver_creditos"><CreditsPage /></PrivateRoute>} />
            <Route path="/permisos" element={<PrivateRoute permission="ver_roles"><PermissionsPage /></PrivateRoute>} />
            <Route path="/auditoria" element={<PrivateRoute permission="ver_auditoria"><AuditPage /></PrivateRoute>} />
            <Route path="/reportes" element={<PrivateRoute permission="ver_reportes"><ReportsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRouter;
