// src/app/reunions/[id]/live/components/ConnectionIndicator.tsx
import React from 'react';
import { WifiOff } from 'lucide-react';

interface ConnectionIndicatorProps {
  connectionStatus: string;
  networkQuality: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  connectionStatus,
  networkQuality
}) => {
  if (connectionStatus === 'connected') {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-4 rounded-full ${
                i < (networkQuality === 'good' ? 3 : networkQuality === 'average' ? 2 : 1)
                  ? 'bg-green-500'
                  : 'bg-gray-600'
              }`}
            ></div>
          ))}
        </div>
        <span className="text-sm text-gray-300">
          {networkQuality === 'good' ? 'Bonne' : networkQuality === 'average' ? 'Moyenne' : 'Faible'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
      <WifiOff size={16} className="text-yellow-500" />
      <span className="text-sm text-yellow-500">
        {connectionStatus === 'reconnecting' ? 'Reconnexion...' : 'Déconnecté'}
      </span>
    </div>
  );
};