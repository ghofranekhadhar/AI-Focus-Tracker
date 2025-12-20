// contexts/UserContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { signIn, signOut, getSession } from 'next-auth/react';

export type UserRole = 'EMPLOYEE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  isActive?: boolean;
}

interface UserContextType {
  user: User | null;
  login: (userData: User) => void; // ✅ Changé pour accepter un objet User
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role as UserRole,
          });
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ✅ Maintenant login accepte un objet User
  const login = (userData: User) => {
    setUser(userData);
  };

const logout = async () => {
  try {
    setLoading(true);
    
    // 1. Appeler signOut de NextAuth
    await signOut({ 
      redirect: false, // IMPORTANT: Ne pas rediriger automatiquement
      callbackUrl: '/auth/signin'
    });
    
    // 2. Nettoyer l'état local
    setUser(null);
    
    // 3. Rediriger manuellement APRÈS que le state est nettoyé
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
    
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    setLoading(false);
  }
};

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};