// src/app/reunions/[id]/live/components/VideoIndicator.tsx
import React from 'react';
import { Video, VideoOff } from 'lucide-react';

interface VideoIndicatorProps {
  isVideoEnabled: boolean;
}

export const VideoIndicator: React.FC<VideoIndicatorProps> = ({ isVideoEnabled }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isVideoEnabled ? 'bg-green-900/40' : 'bg-red-900/40'
    }`}>
      {isVideoEnabled ? (
        <Video size={16} className="text-green-400" />
      ) : (
        <VideoOff size={16} className="text-red-400" />
      )}
      <span className="text-sm">
        {isVideoEnabled ? 'Caméra active' : 'Caméra désactivée'}
      </span>
    </div>
  );
};