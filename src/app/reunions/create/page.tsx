'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/src/app/contexts/UserContext';
import { X } from 'lucide-react';
import CreateMeetingForm from './CreateMeetingForm';

export default function CreateMeetingModalPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // Empêcher le scroll du body et ajouter l'effet flou
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Empêcher le scroll
    document.body.style.overflow = 'hidden';
    
    // Compenser la barre de défilement
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const handleClose = () => {
    const userRole = user?.role?.toLowerCase();
    const isAdmin = userRole === 'admin';
    router.push(isAdmin ? '/reunions/admin' : '/reunions');
  };

  // Écouter la touche Échap pour fermer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  if (userLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay flou avec animation */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal centré */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <CreateMeetingForm user={user} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}