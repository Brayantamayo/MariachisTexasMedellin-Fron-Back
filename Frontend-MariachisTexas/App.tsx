
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './shared/contexts/AuthContext';
import { Sidebar } from './shared/components/Sidebar';
import { LoginPage } from './src/features/auth/pages/LoginPage';
import { RegisterPage } from './src/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from './src/features/auth/pages/ForgotPasswordPage';
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
import { ProfilePage } from './src/features/home/pages/ProfilePage';
import { ModuleName, UserRole } from './types';
import { PublicLayout } from './shared/components/PublicLayout';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Estado de navegación simple
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Si el usuario se loguea, lo redirigimos al dashboard o home según rol
  useEffect(() => {
    if (isAuthenticated && (currentPath === '/' || currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password')) {
      // Clientes y Empleados van a HOME, Admin a Dashboard
      if (user?.role === UserRole.CLIENTE || user?.role === UserRole.EMPLEADO) {
          setCurrentPath('/home');
      } else {
          setCurrentPath('/dashboard');
      }
    }
  }, [isAuthenticated, currentPath, user]);

  // Mostrar pantalla de carga global
  if (isLoading) {
      return <LoadingScreen />;
  }

  // Rutas públicas que deben ser accesibles incluso si el usuario está autenticado
  const publicRoutes = ['/cotizacion'];
  const isPublicRoute = publicRoutes.includes(currentPath);

  // Renderizado para usuarios NO autenticados O rutas públicas explícitas
  if (!isAuthenticated || isPublicRoute) {
    const renderPublicContent = () => {
        switch (currentPath) {
          case '/login':
            return <LoginPage onNavigate={setCurrentPath} />;
          case '/register':
            return <RegisterPage onNavigate={setCurrentPath} />;
          case '/forgot-password':
            return <ForgotPasswordPage onNavigate={setCurrentPath} />;
          case '/reset-password':
            return <ResetPasswordPage onNavigate={setCurrentPath} />;
          case '/repertorio':
            return <PublicRepertoirePage />;
          case '/cotizacion':
            return <PublicCotizacionPage onNavigate={setCurrentPath} />;
          default:
            return <LandingPage onNavigate={setCurrentPath} />;
        }
    };

    return (
        <PublicLayout onNavigate={setCurrentPath} currentPath={currentPath}>
            {renderPublicContent()}
        </PublicLayout>
    );
  }

  // Router simple para usuarios logueados (Dashboard)
  const renderAppContent = () => {
    const module = currentPath.substring(1) as ModuleName;

    switch (module) {
      case 'home':
        return <HomePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'clientes':
        return <ClientsPage />;
      case 'usuarios':
        return <UsersPage />;
      case 'roles':
        return <RolesPage />;
      case 'empleados':
        return <EmployeesPage />;
      case 'repertorio':
        return <RepertoirePage />;
      case 'servicios':
        return user?.role === UserRole.ADMIN ? <ServicesPage /> : <HomePage />;
      case 'ensayos':
        return <EnsayosPage />;
      case 'reservas':
        return <ReservasPage />;
      case 'abonos':
        return <AbonosPage />;
      case 'ventas':
        return <VentasPage />;
      case 'cotizaciones':
        return <CotizacionesPage />;
      case 'perfil':
        return <ProfilePage />;
      default:
        // Si no coincide, redirigir al default de cada rol
        return user?.role === UserRole.ADMIN ? <DashboardPage /> : <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="font-bold text-lg text-slate-800">Mariachis Texas</div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Wrapper for Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
            currentPath={currentPath} 
            onNavigate={(path) => {
                setCurrentPath(path);
                setIsMobileMenuOpen(false);
            }} 
            isPanelOpen={isPanelOpen}
            setIsPanelOpen={setIsPanelOpen}
        />
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden lg:block">
        <Sidebar 
            currentPath={currentPath} 
            onNavigate={setCurrentPath} 
            isPanelOpen={isPanelOpen}
            setIsPanelOpen={setIsPanelOpen}
        />
      </div>
      
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className={`flex-1 p-4 pt-20 lg:p-8 lg:pt-8 transition-all duration-300 bg-slate-50 text-slate-800 w-full min-w-0 ${isPanelOpen ? 'lg:ml-[22rem]' : 'lg:ml-[6rem]'}`}>
        {renderAppContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
      <Toaster position="top-center" />
    </AuthProvider>
  );
};

export default App;
