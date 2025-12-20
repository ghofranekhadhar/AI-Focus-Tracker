// src/app/reunions/[id]/live/components/SystemNotification.tsx
'use client';

import { useEffect, useState } from 'react';
import { UserPlus, UserMinus, X } from 'lucide-react';

interface SystemNotificationProps {
  message: string;
  type: 'join' | 'leave';
  duration?: number;
  onClose: () => void;
}

export const SystemNotification: React.FC<SystemNotificationProps> = ({
  message,
  type,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Attendre l'animation de sortie
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`
      animate-fade-in-up 
      fixed top-4 right-4 z-50 max-w-sm 
      ${type === 'join' 
        ? 'bg-gradient-to-r from-green-900/90 to-emerald-900/90 border border-green-700/50' 
        : 'bg-gradient-to-r from-amber-900/90 to-orange-900/90 border border-amber-700/50'
      } 
      rounded-xl p-4 shadow-2xl backdrop-blur-sm
      transition-all duration-300
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${type === 'join' ? 'bg-green-800/50' : 'bg-amber-800/50'}
        `}>
          {type === 'join' ? (
            <UserPlus size={20} className="text-green-300" />
          ) : (
            <UserMinus size={20} className="text-amber-300" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {message}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {type === 'join' ? 'Nouveau participant' : 'Participant parti'}
          </p>
        </div>
        
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 100);
          }}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Barre de progression */}
      <div className="mt-3 h-1 w-full bg-gray-800/50 rounded-full overflow-hidden">
        <div 
          className={`
            h-full 
            ${type === 'join' ? 'bg-green-500' : 'bg-amber-500'}
            animate-[progress_3s_linear]
          `}
        />
      </div>
    </div>
  );
};