import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/contexts/AuthContext';
import { Sidebar } from './shared/components/Sidebar';
import Topbar from './shared/components/Topbar';
import { LoginPage } from './src/features/auth/pages/LoginPage';
import { RegisterPage } from './src/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from './src/features/auth/pages/ForgotPasswordPage';
import { VerifyOtpPage } from './src/features/auth/pages/VerifyOtpPage';
import { ResetPasswordPage } from './src/features/auth/pages/ResetPasswordPage';
import { LandingPage } from './src/features/home/pages/LandingPage';
import { PublicRepertoirePage } from './src/features/home/pages/PublicRepertoirePage';
import { PublicCotizacionPage } from './src/features/home/pages/PublicCotizacionPage';
import { ServicesPage } from './src/features/servicio/pages/ServicesPage';
import { HomePage } from './src/features/home/pages/HomePage';
import { ClientsPage } from './src/features/clientes/pages/ClientsPage';
import { RolesPage } from './src/features/roles/pages/RolesPage';
import { UsersPage } from './src/features/users/pages/UsersPage';
import { EmployeesPage } from './src/features/employees/pages/EmployeesPage';
import { RepertoirePage } from './src/features/repertoire/pages/RepertoirePage';
import { EnsayosPage } from './src/features/ensayos/pages/EnsayosPage';
import { ReservasPage } from './src/features/reservas/pages/ReservasPage';
import { AbonosPage } from './src/features/abonos/pages/AbonosPage';
import { VentasPage } from './src/features/ventas/pages/VentasPage';
import { CotizacionesPage } from './src/features/cotizaciones/pages/CotizacionesPage';
import { DashboardPage } from './src/features/home/pages/DashboardPage';
import { GaleriaPage } from './src/features/galeria/pages/GaleriaPage';
import { ProfilePage } from './src/features/home/pages/ProfilePage';

import { UserRole } from './types';
import { PublicLayout } from './shared/components/PublicLayout';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { PublicRoute } from './shared/components/PublicRoute';
import { Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const AuthenticatedLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const showTopbar = user && user.role !== 'CLIENTE';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="font-bold text-lg text-slate-800">Mariachis Texas</div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          isPanelOpen={isPanelOpen}
          setIsPanelOpen={setIsPanelOpen}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isPanelOpen={isPanelOpen}
          setIsPanelOpen={setIsPanelOpen}
        />
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className={`flex-1 transition-all duration-300 w-full min-w-0 
        ${(currentPath === '/perfil' || currentPath === '/home') ? 'bg-[#050608] p-0' : 'bg-slate-50 p-4 pt-20 lg:p-8 lg:pt-8 text-slate-800'} 
        ${isPanelOpen ? 'lg:ml-[22rem]' : 'lg:ml-[6rem]'}`}>
        {showTopbar && currentPath !== '/perfil' && currentPath !== '/home' && (
          <div className="hidden lg:block -mx-8 -mt-8 mb-6">
            <Topbar />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      {isAuthenticated ? (
        // Rutas para usuarios autenticados
        <Route element={<AuthenticatedLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><DashboardPage /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><ClientsPage /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><UsersPage /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><RolesPage /></ProtectedRoute>} />
          <Route path="/galeria" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><GaleriaPage /></ProtectedRoute>} />
          <Route path="/empleados" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><EmployeesPage /></ProtectedRoute>} />
          <Route path="/repertorio" element={<RepertoirePage />} />
          <Route path="/ensayos" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EMPLEADO]}><EnsayosPage /></ProtectedRoute>} />
          <Route path="/servicios" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><ServicesPage /></ProtectedRoute>} />
          <Route path="/reservas" element={<ReservasPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/abonos" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AbonosPage /></ProtectedRoute>} />
          <Route path="/cotizaciones" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CLIENTE]}><CotizacionesPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to={user?.role === UserRole.ADMIN ? "/dashboard" : "/home"} replace />} />
        </Route>
      ) : (
        // Rutas para usuarios públicos/invitados
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
          <Route path="/repertorio" element={<PublicRepertoirePage />} />
          <Route path="/cotizacion" element={<PublicCotizacionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
        <Toaster position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;