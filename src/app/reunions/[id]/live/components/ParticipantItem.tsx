// src/app/reunions/[id]/live/components/ParticipantItem.tsx
import React from 'react';
import { Mic, MicOff, Video, VideoOff, Pin, PinOff, Hand, Crown } from 'lucide-react';
import { DisplayParticipant } from '../types';

interface ParticipantItemProps {
  participant: DisplayParticipant;
  isHandRaised?: boolean;
  isPinned?: boolean;
  onPinParticipant?: (id: string) => void;
  onUnpinParticipant?: (id: string) => void;
}

export const ParticipantItem: React.FC<ParticipantItemProps> = ({
  participant,
  isHandRaised = false,
  isPinned = false,
  onPinParticipant,
  onUnpinParticipant
}) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-800/50 rounded-lg transition duration-200 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Indicateur en ligne/hors ligne */}
        <div className="relative flex-shrink-0">
          <div className={`w-3 h-3 rounded-full ${
            participant.isOnline 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-gray-500'
          }`} />
          {!participant.isOnline && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gray-800 border border-gray-700" />
          )}
        </div>
        
        {/* Avatar et nom */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {participant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-gray-100 font-medium truncate">
                  {participant.name}
                </span>
                {participant.isOrganizer && (
                  <Crown size={12} className="text-yellow-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                {!participant.isOnline && (
                  <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-800/50 rounded">
                    hors ligne
                  </span>
                )}
                {participant.isCurrentUser && (
                  <span className="text-xs text-gray-400">(Vous)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions et statuts */}
      <div className="flex items-center gap-2">
        {/* Statut audio/vidéo */}
        <div className="flex items-center gap-1">
          {participant.audioEnabled ? (
            <Mic size={14} className="text-green-400" />
          ) : (
            <MicOff size={14} className="text-gray-500" />
          )}
          {participant.videoEnabled ? (
            <Video size={14} className="text-green-400" />
          ) : (
            <VideoOff size={14} className="text-gray-500" />
          )}
        </div>
        
        {/* Main levée */}
        {isHandRaised && (
          <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 p-1.5 rounded-lg">
            <Hand size={14} className="text-amber-400" />
          </div>
        )}
        
        {/* Bouton épingler */}
        {onPinParticipant && onUnpinParticipant && (
          <button
            onClick={() => {
              if (isPinned) {
                onUnpinParticipant(participant.id);
              } else {
                onPinParticipant(participant.id);
              }
            }}
            className={`p-1.5 rounded-lg transition duration-200 ${
              isPinned 
                ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-blue-400' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
            title={isPinned ? "Désépingler" : "Épingler"}
          >
            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default ParticipantItem;