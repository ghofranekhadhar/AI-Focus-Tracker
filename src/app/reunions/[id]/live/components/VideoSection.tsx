// src/app/reunions/[id]/live/components/VideoSection.tsx
import React from 'react';
import { Users } from 'lucide-react';
import { VideoDisplay } from './VideoDisplay';
import { AudioIndicator } from './AudioIndicator';
import { VideoIndicator } from './VideoIndicator';
import { MediaControls } from './MediaControls';

interface VideoSectionProps {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  user: any;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenShareRef: React.RefObject<HTMLVideoElement>;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeaveMeeting: () => void;
  onEndMeeting: () => void;
  onMediaInit: () => void;
  isOrganizer: boolean;
  activeParticipants: number;
  isInitializingMedia: boolean;
  // Ajoutez ces deux nouvelles propriétés
  onToggleRaiseHand: () => void;
  isHandRaised: boolean;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  localStream,
  screenStream,
  isScreenSharing,
  isVideoEnabled,
  isAudioEnabled,
  user,
  localVideoRef,
  screenShareRef,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveMeeting,
  onEndMeeting,
  onMediaInit,
  isOrganizer,
  activeParticipants,
  isInitializingMedia,
  // Ajoutez ces deux nouvelles propriétés dans la déstructuration
  onToggleRaiseHand,
  isHandRaised
}) => {
  return (
    <div className="bg-gray-900 rounded-xl h-full overflow-hidden flex flex-col">
      {/* En-tête de la zone vidéo */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">
            <Users size={18} />
            Salle de réunion ({activeParticipants} en ligne)
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Statut:</span>
            <span className="text-green-400 font-medium">● Actif</span>
          </div>
        </div>
      </div>
      
      {/* Conteneur vidéo */}
      <div className="flex-1 relative p-4">
        <VideoDisplay 
          localStream={localStream}
          screenStream={screenStream}
          isScreenSharing={isScreenSharing}
          isVideoEnabled={isVideoEnabled}
          user={user}
          localVideoRef={localVideoRef}
          screenShareRef={screenShareRef}
          onMediaInit={onMediaInit}
        />
        
        {/* Overlay d'information */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <AudioIndicator isAudioEnabled={isAudioEnabled} />
          
          {localStream && <VideoIndicator isVideoEnabled={isVideoEnabled} />}
        </div>
      </div>

      {/* Barre de contrôle */}
      <MediaControls
        localStream={localStream}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isInitializingMedia={isInitializingMedia}
        isOrganizer={isOrganizer}
        onToggleAudio={onToggleAudio}
        onToggleVideo={onToggleVideo}
        onToggleScreenShare={onToggleScreenShare}
        onLeaveMeeting={onLeaveMeeting}
        onEndMeeting={onEndMeeting}
        onMediaInit={onMediaInit}
        // Ajoutez ces deux nouvelles propriétés
        onToggleRaiseHand={onToggleRaiseHand}
        isHandRaised={isHandRaised}
      />
    </div>
  );
};