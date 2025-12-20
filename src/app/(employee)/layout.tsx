// src/app/(employee)/layout.tsx
'use client';

import { useUser } from '../contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationDropdown from '@/src/app/reunions/components/NotificationDropdown';


import {
  LayoutDashboard,
  Calendar,
  Clock,
  BarChart3,
  UserCircle,
  Bell,
  LogOut,
  Menu,
  X,
  Target,
  CheckSquare,
  Folder,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function EmployeeLayout({
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

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
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

  if (!user) {
    return null; // Redirection en cours
  }

  const menuItems = [
    {
      title: 'EMPLOYÉ',
      icon: TrendingUp,
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', badge: null },
        { name: 'Réunions', icon: Calendar, path: '/reunions', badge: 3 },
        { name: 'Sessions', icon: Clock, path: '/dashboard/sessions', badge: null },
        { name: 'Statistiques', icon: BarChart3, path: '/dashboard/stats', badge: null },
        { name: 'Focus Tracker', icon: Target, path: '/dashboard/focus', badge: null },
      ]
    },
    {
      title: 'PROFIL',
      icon: UserCircle,
      items: [
        { name: 'Mon Profil', icon: UserCircle, path: '/dashboard/profile', badge: null },
        { name: 'Mes Tâches', icon: CheckSquare, path: '/dashboard/tasks', badge: 2 },
        { name: 'Mes Projets', icon: Folder, path: '/dashboard/projects', badge: null },
        { name: 'Notifications', icon: Bell, path: '/notifications', badge: 5 },      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Employé - NOUVEAU STYLE */}
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🧠</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-semibold text-gray-900">AI Focus Tracker</h1>
                <p className="text-xs text-gray-500 mt-0.5">Espace Employé</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu - NOUVEAU STYLE */}
        <nav className="p-4 space-y-8">
          {menuItems.map((section, index) => (
            <div key={index}>
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
                  const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.name}>
                      <a
                        href={item.path}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                          }
                          ${sidebarOpen ? '' : 'justify-center'}
                        `}
                      >
                        <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                        
                        {sidebarOpen && (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
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

        {/* User Profile - NOUVEAU STYLE */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-medium">{user.name?.charAt(0) || 'E'}</span>
            </div>
            
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Employé'}</p>
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

      {/* Main Content - NOUVEAU STYLE */}
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
                  {getEmployeePageTitle(pathname)}
                </h1>
                {pathname === '/reunions' && (
                  <p className="text-sm text-gray-500 mt-1">Gérez votre participation aux réunions</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationDropdown />
            </div>
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function getEmployeePageTitle(pathname: string | null) {
  if (!pathname) return 'Dashboard Employé';
  
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard Employé',
    '/reunions': 'Mes Réunions',
    '/dashboard/sessions': 'Mes Sessions',
    '/dashboard/stats': 'Mes Statistiques',
    '/dashboard/focus': 'Focus Tracker',
    '/dashboard/profile': 'Mon Profil',
    '/dashboard/tasks': 'Mes Tâches',
    '/dashboard/projects': 'Mes Projets',
    '/notifications': 'Notifications',
  };
  
  return titles[pathname] || 'AI Focus Tracker';
}