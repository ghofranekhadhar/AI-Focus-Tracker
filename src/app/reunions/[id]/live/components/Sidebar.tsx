// src/app/reunions/[id]/live/components/Sidebar.tsx
import React from 'react';
import { Users, MessageSquare, Wifi, Battery, Clock } from 'lucide-react';
import { ParticipantsList } from './ParticipantsList';
import { ChatPanel } from './ChatPanel';
import { Meeting, ChatMessage, DisplayParticipant } from '../types';

interface SidebarProps {
  activeView: 'grid' | 'chat';
  onViewChange: (view: 'grid' | 'chat') => void;
  participants: DisplayParticipant[];
  onlineParticipantsCount: number;
  meeting: Meeting;
  chatMessages: ChatMessage[];
  newMessage: string;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  user: any;
  connectionStatus: string;
  raisedHands?: Set<string>;
  pinnedParticipants?: Set<string>;
  onPinParticipant?: (id: string) => void;
  onUnpinParticipant?: (id: string) => void;
  networkQuality: 'excellent' | 'good' | 'average' | 'poor'; // ← AJOUTEZ 'excellent'
  connectionMetrics: {
    latency: number;
    bandwidth: number;
  };

   meetingNotes?: {
    agenda: any[];
    decisions: any[];
    actionItems: any[];
  };
  onSaveNotes?: () => Promise<void>;

}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  participants,
  onlineParticipantsCount,
  meeting,
  chatMessages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  user,
  connectionStatus,
  raisedHands = new Set(),
  pinnedParticipants = new Set(),
  onPinParticipant,
  onUnpinParticipant,

   meetingNotes,
  onSaveNotes,

  networkQuality = 'good',
  connectionMetrics = { latency: 0, bandwidth: 0 }
}) => {
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNetworkQualityColor = () => {
    switch (networkQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-emerald-400';
      case 'average': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getNetworkQualityText = () => {
    switch (networkQuality) {
      case 'excellent': return 'Excellente';
      case 'good': return 'Bonne';
      case 'average': return 'Moyenne';
      case 'poor': return 'Faible';
      default: return 'Inconnue';
    }
  };

  return (
    <div className="lg:w-96 xl:w-96 2xl:w-[420px] border-l border-gray-800/50 flex flex-col bg-gradient-to-b from-gray-950 to-gray-900 h-full">
      {/* En-tête des onglets */}
      <div className="border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-950 flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => onViewChange('grid')}
            className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 relative ${
              activeView === 'grid' 
                ? 'text-white bg-gradient-to-r from-gray-800/80 to-gray-900/80' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <Users size={16} className={activeView === 'grid' ? 'text-blue-400' : ''} />
            <span>Participants</span>
            {participants.length > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                activeView === 'grid'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}>
                {participants.length}
              </span>
            )}
          </button>
          
          <div className="w-px h-6 self-center bg-gradient-to-b from-transparent via-gray-700 to-transparent"></div>
          
          <button
            onClick={() => onViewChange('chat')}
            className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 relative ${
              activeView === 'chat'
                ? 'text-white bg-gradient-to-r from-gray-800/80 to-gray-900/80'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <MessageSquare size={16} className={activeView === 'chat' ? 'text-blue-400' : ''} />
            <span>Chat</span>
            {chatMessages.length > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                activeView === 'chat'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}>
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Indicateur de sélection */}
        <div className="relative h-0.5 bg-gray-800">
          <div 
            className={`absolute top-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ${
              activeView === 'grid' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
            }`}
          ></div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeView === 'grid' ? (
          <ParticipantsList
            participants={participants}
            activeParticipantsCount={onlineParticipantsCount}
            raisedHands={raisedHands}
            pinnedParticipants={pinnedParticipants}
            onPinParticipant={onPinParticipant}
            onUnpinParticipant={onUnpinParticipant}
          />
        ) : (
          <ChatPanel
            chatMessages={chatMessages}
            newMessage={newMessage}
            onNewMessageChange={onNewMessageChange}
            onSendMessage={onSendMessage}
            user={user}
            connectionStatus={connectionStatus}
          />
        )}
      </div>

      {/* Pied de page */}
      <div className="border-t border-gray-800/50 bg-gradient-to-t from-gray-900 to-gray-950 p-3 flex-shrink-0">
        <div className="space-y-2">
          {/* Statut de connexion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-xs font-medium text-gray-300">
                {connectionStatus === 'connected' ? '● Connecté' :
                 connectionStatus === 'reconnecting' ? '🔄 Reconnexion' : '● Déconnecté'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={10} />
              <span>{formatTime()}</span>
            </div>
          </div>
          
          {/* Métriques réseau */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Wifi size={10} className={getNetworkQualityColor()} />
                <span className={getNetworkQualityColor()}>{getNetworkQualityText()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <div className="flex items-center gap-1">
                <Battery size={10} className="text-blue-400" />
                <span className="text-gray-400">{connectionMetrics.latency}ms</span>
              </div>
            </div>
          </div>
          
          {/* Barre de progression réseau */}
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                networkQuality === 'excellent' ? 'w-full bg-gradient-to-r from-green-500 to-emerald-500' :
                networkQuality === 'good' ? 'w-3/4 bg-gradient-to-r from-emerald-500 to-blue-500' :
                networkQuality === 'average' ? 'w-1/2 bg-gradient-to-r from-yellow-500 to-amber-500' :
                'w-1/4 bg-gradient-to-r from-red-500 to-rose-500'
              }`}
            ></div>
          </div>
          
          {/* Informations réunion */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="truncate">
              <span className="font-mono text-gray-400">{meeting.id.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{onlineParticipantsCount} en ligne</span>
              {raisedHands.size > 0 && (
                <span className="text-amber-400">• {raisedHands.size} main{raisedHands.size > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;