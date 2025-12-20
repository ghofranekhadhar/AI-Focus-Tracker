// src/app/reunions/[id]/live/components/MediaInitButton.tsx
import React from 'react';
import { Video, Loader2 } from 'lucide-react';

interface MediaInitButtonProps {
  localStream: MediaStream | null;
  isInitializingMedia: boolean;
  onMediaInit: () => void;
}

export const MediaInitButton: React.FC<MediaInitButtonProps> = ({
  localStream,
  isInitializingMedia,
  onMediaInit
}) => {
  if (!localStream && !isInitializingMedia) {
    return (
      <button
        onClick={onMediaInit}
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium flex items-center gap-1.5 transition duration-200"
      >
        <Video size={14} />
        Activer la caméra
      </button>
    );
  }

  if (isInitializingMedia) {
    return (
      <div className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm font-medium flex items-center gap-1.5">
        <Loader2 size={14} className="animate-spin" />
        Initialisation...
      </div>
    );
  }

  return null;
};