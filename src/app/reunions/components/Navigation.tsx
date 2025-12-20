// src/app/reunions/components/Navigation.tsx
import Link from 'next/link'; // ← AJOUTEZ CETTE LIGNE
import { useUser } from '@/src/app/contexts/UserContext'; // Ajustez selon votre chemin

export default function Navigation() {
  const { user } = useUser();
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/reunions" className="text-xl font-bold text-blue-600">
              AIFocus Meetings
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-4">
              <Link 
                href="/reunions"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Toutes les réunions
              </Link>
              
              <Link 
                href="/reunions/create"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle réunion
              </Link>
              
    
            </div>
          </div>
          
          {/* Profil utilisateur */}
          {user && (
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || 'Utilisateur'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.email}
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.name?.charAt(0) || user.email.charAt(0)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}