// src/app/reunions/[id]/live/components/VideoDisplay.tsx
import React from 'react';
import { VideoOff, User } from 'lucide-react';

interface VideoDisplayProps {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
  isVideoEnabled: boolean;
  user: any;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenShareRef: React.RefObject<HTMLVideoElement>;
  onMediaInit: () => void;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({
  localStream,
  screenStream,
  isScreenSharing,
  isVideoEnabled,
  user,
  localVideoRef,
  screenShareRef,
  onMediaInit
}) => {
  if (isScreenSharing) {
    return (
      <div className="relative w-full h-full">
        <video
          ref={screenShareRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg text-sm">
          <span className="text-blue-400">{user.name}</span> partage son écran
        </div>
      </div>
    );
  }

  if (localStream && isVideoEnabled) {
    return (
      <div className="relative w-full h-full">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg text-sm">
          {user.name} (Vous) {!isVideoEnabled && '📷❌'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-40 h-40 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          {localStream ? (
            <User size={48} className="text-gray-400" />
          ) : (
            <div className="text-center">
              <VideoOff size={48} className="text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Caméra désactivée</p>
            </div>
          )}
        </div>
        <p className="text-gray-400 font-medium">
          {user.name} (Vous)
        </p>
        <p className="text-gray-500 text-sm mt-1">
          {localStream 
            ? (isVideoEnabled ? 'Caméra active' : 'Caméra désactivée')
            : 'Caméra non initialisée'}
        </p>
        {!localStream && (
          <button
            onClick={onMediaInit}
            className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition duration-200"
          >
            Activer la caméra
          </button>
        )}
      </div>
    </div>
  );
};