// src/app/reunions/[id]/live/components/ParticipantsList.tsx
import React from 'react';
import { Users, Hand } from 'lucide-react';
import { ParticipantItem } from './ParticipantItem';
import { DisplayParticipant } from '../types';

interface ParticipantsListProps {
  participants: DisplayParticipant[];
  activeParticipantsCount: number; // ← Gardez ce nom pour compatibilité
  raisedHands?: Set<string>;
  pinnedParticipants?: Set<string>;
  onPinParticipant?: (id: string) => void;
  onUnpinParticipant?: (id: string) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  activeParticipantsCount,
  raisedHands = new Set(),
  pinnedParticipants = new Set(),
  onPinParticipant,
  onUnpinParticipant
}) => {
  // Trier les participants : épinglés d'abord, puis par statut EN LIGNE, puis par nom
  const sortedParticipants = [...participants].sort((a, b) => {
    // Les épinglés d'abord
    const aIsPinned = pinnedParticipants.has(a.id);
    const bIsPinned = pinnedParticipants.has(b.id);
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    
    // EN LIGNE avant hors ligne ← CORRECTION ICI
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    
    // Organisateurs avant participants
    if (a.isOrganizer && !b.isOrganizer) return -1;
    if (!a.isOrganizer && b.isOrganizer) return 1;
    
    // Par ordre alphabétique
    return a.name.localeCompare(b.name);
  });

  // Compter les participants EN LIGNE
  const onlineCount = participants.filter(p => p.isOnline).length;

  return (
    <div className="h-full flex flex-col">
      {/* En-tête fixe */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              Participants
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} dans la réunion
            </p>
          </div>
          
          {/* Compteurs */}
          <div className="flex items-center gap-3">
            {raisedHands.size > 0 && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 px-3 py-1.5 rounded-lg border border-amber-800/30">
                <Hand size={14} className="text-amber-400" />
                <span className="text-sm text-amber-300 font-medium">
                  {raisedHands.size}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-800/30">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-400">
                {onlineCount} en ligne {/* ← CORRECTION ICI */}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Liste défilante */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        <div className="p-4">
          {/* Section participants épinglés */}
          {pinnedParticipants.size > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-[10px] text-white">★</span>
                  </span>
                  Épinglés ({pinnedParticipants.size})
                </h4>
                <button
                  onClick={() => {
                    if (onUnpinParticipant) {
                      pinnedParticipants.forEach(id => onUnpinParticipant(id));
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-gray-300 transition duration-200"
                >
                  Tout désépingler
                </button>
              </div>
              <div className="space-y-3">
                {sortedParticipants
                  .filter(person => pinnedParticipants.has(person.id))
                  .map(person => (
                    <ParticipantItem
                      key={person.id}
                      participant={person}
                      isHandRaised={raisedHands.has(person.id)}
                      isPinned={true}
                      onPinParticipant={onPinParticipant}
                      onUnpinParticipant={onUnpinParticipant}
                    />
                  ))}
              </div>
            </div>
          )}
          
          {/* Tous les participants */}
          <div className="space-y-3">
            {sortedParticipants
              .filter(person => !pinnedParticipants.has(person.id))
              .map(person => (
                <ParticipantItem
                  key={person.id}
                  participant={person}
                  isHandRaised={raisedHands.has(person.id)}
                  isPinned={false}
                  onPinParticipant={onPinParticipant}
                  onUnpinParticipant={onUnpinParticipant}
                />
              ))}
          </div>
          
          {/* État vide */}
          {participants.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                <Users size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-300 font-medium">Aucun participant</p>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Les participants apparaîtront ici quand ils rejoindront la réunion
              </p>
            </div>
          )}
          
          {/* Indicateur de scroll */}
          {participants.length > 8 && (
            <div className="mt-6 pt-4 border-t border-gray-800/50">
              <p className="text-xs text-center text-gray-500">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} • 
                Défilez pour voir plus
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;