
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AiAssistant from '../components/AiAssistant';
import MedicalDisclaimerModal from '../components/MedicalDisclaimerModal';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Bell, Settings, User } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const hasSeenDisclaimer = sessionStorage.getItem('disclaimer_seen');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleDisclaimerAgree = () => {
    sessionStorage.setItem('disclaimer_seen', 'true');
    setShowDisclaimer(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Abrir menu</span>
              <Menu className="h-6 w-6" />
            </button>

            {/* Page title placeholder */}
            <div className="flex-1 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                FisioFlow
              </h1>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                <span className="sr-only">Ver notificações</span>
                <Bell className="h-6 w-6" />
              </button>

              {/* Settings */}
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                <span className="sr-only">Configurações</span>
                <Settings className="h-6 w-6" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                  <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src={user.avatarUrl} 
                        alt={user.name}
                      />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="hidden md:block text-gray-700 font-medium">
                    {user?.name}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          {children}
        </div>

        <AiAssistant />
        <MedicalDisclaimerModal isOpen={showDisclaimer} onAgree={handleDisclaimerAgree} />
      </main>
    </div>
  );
};

export default MainLayout;