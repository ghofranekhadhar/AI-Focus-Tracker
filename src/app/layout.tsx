// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from './contexts/UserContext';

export const metadata: Metadata = {
  title: 'Projet Focus - Gestion de réunions',
  description: 'Plateforme de gestion de réunions et d\'événements professionnels',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}