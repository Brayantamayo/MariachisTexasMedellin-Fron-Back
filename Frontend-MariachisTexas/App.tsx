import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './shared/contexts/AuthContext';
import { Sidebar } from './shared/components/Sidebar';
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
import { ProfilePage } from './src/features/home/pages/ProfilePage';
import { ModuleName, UserRole } from './types';
import { PublicLayout } from './shared/components/PublicLayout';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // ✅ Todos los hooks ANTES de cualquier return condicional
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');

  // Redirigir al dashboard o home tras login
  useEffect(() => {
    if (isAuthenticated && (
      currentPath === '/' ||
      currentPath === '/login' ||
      currentPath === '/register' ||
      currentPath === '/forgot-password' ||
      currentPath === '/verify-otp' ||
      currentPath === '/reset-password'
    )) {
      if (user?.role === UserRole.CLIENTE || user?.role === UserRole.EMPLEADO) {
        setCurrentPath('/home');
      } else {
        setCurrentPath('/dashboard');
      }
    }
  }, [isAuthenticated, currentPath, user]);

  // ✅ Ahora sí el return condicional — DESPUÉS de todos los hooks
  if (isLoading) return <LoadingScreen />;

  const publicRoutes = ['/cotizacion'];
  const isPublicRoute = publicRoutes.includes(currentPath);

  if (!isAuthenticated || isPublicRoute) {
    const renderPublicContent = () => {
      switch (currentPath) {
        case '/login':
          return <LoginPage onNavigate={setCurrentPath} />;
        case '/register':
          return <RegisterPage onNavigate={setCurrentPath} />;
        case '/forgot-password':
          return (
            <ForgotPasswordPage
              onNavigate={setCurrentPath}
              onEmailSent={(email) => {
                setResetEmail(email);
                setCurrentPath('/verify-otp');
              }}
            />
          );
        case '/verify-otp':
          return (
            <VerifyOtpPage
              email={resetEmail}
              onVerified={(otp) => {
                setResetOtp(otp);
                setCurrentPath('/reset-password');
              }}
              onNavigate={setCurrentPath}
            />
          );
        case '/reset-password':
          return (
            <ResetPasswordPage
              email={resetEmail}
              otp={resetOtp}
              onNavigate={setCurrentPath}
            />
          );
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

  const renderAppContent = () => {
    const module = currentPath.substring(1) as ModuleName;
    switch (module) {
      // ✅ HomePage recibe onNavigate para que los botones redirijan
      case 'home': return <HomePage onNavigate={setCurrentPath} />;
      case 'dashboard': return <DashboardPage />;
      case 'clientes': return <ClientsPage />;
      case 'usuarios': return <UsersPage />;
      case 'roles': return <RolesPage />;
      case 'empleados': return <EmployeesPage />;
      case 'repertorio': return <RepertoirePage />;
      case 'servicios': return user?.role === UserRole.ADMIN ? <ServicesPage /> : <HomePage onNavigate={setCurrentPath} />;
      case 'ensayos': return <EnsayosPage />;
      case 'reservas': return <ReservasPage />;
      case 'abonos': return <AbonosPage />;
      case 'ventas': return <VentasPage />;
      case 'cotizaciones': return <CotizacionesPage />;
      case 'perfil': return <ProfilePage />;
      default:
        return user?.role === UserRole.ADMIN
          ? <DashboardPage />
          : <HomePage onNavigate={setCurrentPath} />;
    }
  };

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
          currentPath={currentPath}
          onNavigate={(path) => { setCurrentPath(path); setIsMobileMenuOpen(false); }}
          isPanelOpen={isPanelOpen}
          setIsPanelOpen={setIsPanelOpen}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentPath={currentPath}
          onNavigate={setCurrentPath}
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