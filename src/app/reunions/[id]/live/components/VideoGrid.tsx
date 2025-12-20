import React from 'react';
import { User, Pin, PinOff, Hand, VideoOff } from 'lucide-react';

interface VideoGridProps {
  participants: any[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
  isVideoEnabled: boolean;
  user: any;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenShareRef: React.RefObject<HTMLVideoElement>;
  videoLayout: 'grid' | 'speaker' | 'sidebar';
  pinnedParticipant: string | null;
  onPinParticipant: (id: string | null) => void;
  raisedHands: Set<string>;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  localStream,
  screenStream,
  isScreenSharing,
  isVideoEnabled,
  user,
  localVideoRef,
  screenShareRef,
  videoLayout,
  pinnedParticipant,
  onPinParticipant,
  raisedHands
}) => {
// Dans VideoGrid.tsx - version corrigée
const getGridClass = () => {
  const totalParticipants = participants.length + (localStream ? 1 : 0);
  
  if (isScreenSharing) {
    return 'grid-cols-1';
  }
  
  if (videoLayout === 'speaker') {
    return 'grid-cols-1'; // Mode speaker = 1 colonne
  }
  
  // Logique cohérente
  if (totalParticipants <= 2) {
    return 'grid-cols-1 lg:grid-cols-2';
  } else if (totalParticipants <= 4) {
    return 'grid-cols-2 lg:grid-cols-2';
  } else if (totalParticipants <= 9) {
    return 'grid-cols-2 lg:grid-cols-3';
  } else {
    return 'grid-cols-3 lg:grid-cols-4';
  }
};

  if (isScreenSharing) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-6xl">
          <video
            ref={screenShareRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain rounded-2xl bg-black shadow-2xl"
          />
          <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-xl">
            <span className="text-sm font-medium">
              <span className="text-blue-400">{user.name}</span> partage son écran
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full p-4 overflow-auto ${videoLayout === 'grid' ? 'flex items-center justify-center' : ''}`}>
      <div className={`grid ${getGridClass()} gap-4 max-w-7xl mx-auto ${videoLayout === 'grid' ? 'h-full' : ''}`}>
        {/* Vidéo locale */}
        {localStream && (
          <div className={`relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl border-2 ${
            pinnedParticipant === user.id 
              ? 'border-blue-500 ring-4 ring-blue-500/20' 
              : 'border-gray-800'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
              {isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-300 font-medium">{user.name}</p>
                    <p className="text-gray-500 text-sm">(Vous)</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Overlay info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{user.name}</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Vous</span>
                  {!isVideoEnabled && (
                    <VideoOff size={12} className="text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => onPinParticipant(pinnedParticipant === user.id ? null : user.id)}
                  className="p-1.5 bg-gray-900/80 hover:bg-gray-800 rounded-lg transition duration-200"
                >
                  {pinnedParticipant === user.id ? (
                    <PinOff size={14} className="text-blue-400" />
                  ) : (
                    <Pin size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Indicateur main levée */}
            {raisedHands.has(user.id) && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-600 to-yellow-600 px-3 py-1.5 rounded-lg shadow-lg">
                <Hand size={14} className="text-white" />
              </div>
            )}
          </div>
        )}
        
        {/* Participants distants */}
        {participants
          .filter(p => p.id !== user.id)
          .map(participant => (
            <div
              key={participant.id}
              className={`relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl border-2 ${
                pinnedParticipant === participant.id 
                  ? 'border-blue-500 ring-4 ring-blue-500/20' 
                  : 'border-gray-800'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
                {participant.videoEnabled ? (
                  // Ici vous ajouteriez la vidéo WebRTC de l'autre participant
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white text-lg font-bold">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <p className="text-gray-300 font-medium">{participant.name}</p>
                      <p className="text-gray-500 text-sm">Vidéo active</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-300 font-medium">{participant.name}</p>
                      <p className="text-gray-500 text-sm">Caméra désactivée</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{participant.name}</span>
                    {participant.isOrganizer && (
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Org.</span>
                    )}
                    {!participant.audioEnabled && (
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Mu</span>
                    )}
                  </div>
                  <button
                    onClick={() => onPinParticipant(pinnedParticipant === participant.id ? null : participant.id)}
                    className="p-1.5 bg-gray-900/80 hover:bg-gray-800 rounded-lg transition duration-200"
                  >
                    {pinnedParticipant === participant.id ? (
                      <PinOff size={14} className="text-blue-400" />
                    ) : (
                      <Pin size={14} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Indicateur statut */}
              <div className={`absolute top-4 left-4 w-3 h-3 rounded-full border-2 border-gray-900 ${
                participant.isActive ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              
              {/* Indicateur main levée */}
              {raisedHands.has(participant.id) && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-600 to-yellow-600 px-3 py-1.5 rounded-lg shadow-lg">
                  <Hand size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};