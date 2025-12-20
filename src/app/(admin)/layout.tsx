// MODIFICATIONS DANS AdminLayout (layout.tsx)
'use client';

import { useUser } from '../contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationDropdown from '@/src/app/reunions/components/NotificationDropdown';

import {
  LayoutDashboard,
  Calendar,
  Users,
  UserPlus,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  FileText,
  Shield,
  ChevronRight,
  Home,
  Briefcase,
  Database,
  Server
} from 'lucide-react';

export default function AdminLayout({
  children,
  onLogout,
}: {
  children: React.ReactNode;
   onLogout?: () => void;
}) {
  const { user, logout, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const menuItems = [
    {
      title: 'ADMINISTRATION',
      icon: Briefcase,
      items: [
        { name: 'Dashboard', icon: Home, path: '/admin' },
        { name: 'Réunions', icon: Calendar, path: '/reunions/admin', badge: 3 },
        { name: 'Employés', icon: Users, path: '/admin/employees' },
        { name: 'Inviter', icon: UserPlus, path: '/admin/invite' },
      ]
    },
    {
      title: 'ANALYSE',
      icon: BarChart3,
      items: [
        { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
        { name: 'Rapports', icon: FileText, path: '/admin/reports' },
      ]
    },
    {
      title: 'SYSTÈME',
      icon: Server,
      items: [
        { name: 'Paramètres', icon: Settings, path: '/admin/settings' },
 {        name: 'Journal', icon: Bell, path: '/notification', badge: 'admin' }, 
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Minimaliste */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        bg-white border-r border-gray-200
        h-screen sticky top-0 overflow-y-auto
        transition-all duration-300
        shadow-sm
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-semibold text-gray-900">Admin</h1>
                <p className="text-xs text-gray-500 mt-0.5">AI Focus Tracker</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-8">
          {menuItems.map((section) => (
            <div key={section.title}>
              {sidebarOpen && (
              <div className="mb-3 px-3">
  <div className="flex items-center gap-2">
    <section.icon size={14} className="text-blue-500" />
    <h3 className="text-xs text-gray-500 uppercase tracking-wider">
      {section.title}
    </h3>
  </div>
</div>
              )}
              
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.name}>
                  <a
  href={item.path}
  className={`
    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
    ${isActive 
      ? 'bg-blue-100 text-blue-700' 
      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
    }
    ${sidebarOpen ? '' : 'justify-center'}
  `}
>
  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'} />
                        {sidebarOpen && (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {isActive && sidebarOpen && (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
              </div>
            )}
            
              <button 
    onClick={onLogout || (() => logout())} // Utilise onLogout si fourni
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    title="Déconnexion"
  >
    <LogOut size={16} className="text-gray-500" />
  </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {getAdminPageTitle(pathname)}
                </h1>
                {pathname === '/reunions/admin' && (
                  <p className="text-sm text-gray-500 mt-1">Gestion des réunions stratégiques</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
             <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function getAdminPageTitle(pathname: string | null) {
  if (!pathname) return 'Dashboard';
  
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/reunions/admin': 'Réunions',
    '/admin/employees': 'Employés',
    '/admin/invite': 'Inviter',
    '/admin/analytics': 'Analytics',
    '/admin/reports': 'Rapports',
    '/admin/settings': 'Paramètres',
     '/notification': 'Journal des activités',
  };
  
  return titles[pathname] || 'Admin';
}