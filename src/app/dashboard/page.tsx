'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de bord Employé
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Bienvenue, {session.user.name} ({session.user.email})
            </p>
          </div>
          
          <div className="px-6 py-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                Vous êtes connecté en tant qu'employé. 
                {session.user.role === 'ADMIN' && (
                  <span className="text-blue-600 font-medium">
                    Vous avez aussi les privilèges administrateur.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}