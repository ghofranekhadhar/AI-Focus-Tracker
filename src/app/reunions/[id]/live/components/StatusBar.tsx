// src/app/reunions/[id]/live/components/StatusBar.tsx
import React from 'react';
import { Wifi, WifiOff, Users, RefreshCw } from 'lucide-react';

interface StatusBarProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  onlineParticipantsCount: number;
  meetingId: string;
  onRejoin: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  connectionStatus,
  onlineParticipantsCount,
  meetingId,
  onRejoin
}) => {
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connecté';
      case 'connecting':
        return 'Connexion...';
      case 'reconnecting':
        return 'Reconnexion...';
      case 'disconnected':
        return 'Déconnecté';
      default:
        return 'Inconnu';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-400';
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Statut de connexion */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <Wifi size={16} className="text-green-400" />
          ) : (
            <WifiOff size={16} className="text-yellow-400" />
          )}
          <div>
            <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
            {connectionStatus === 'reconnecting' && (
              <div className="text-xs text-gray-400 mt-0.5">
                Tentative de reconnexion...
              </div>
            )}
          </div>
        </div>

        {/* Nombre de participants EN LIGNE */}
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          <div>
            <span className="text-sm font-medium text-gray-100">
              {onlineParticipantsCount} en ligne
            </span>
            <div className="text-xs text-gray-400 mt-0.5">
              Réunion ID: {meetingId.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Bouton rejoin */}
      {connectionStatus === 'disconnected' && (
        <button
          onClick={onRejoin}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200 text-sm font-medium"
        >
          <RefreshCw size={14} />
          Rejoindre
        </button>
      )}
    </div>
  );
};

export default StatusBar;