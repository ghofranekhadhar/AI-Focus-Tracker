// src/app/reunions/[id]/live/components/AudioIndicator.tsx
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioIndicatorProps {
  isAudioEnabled: boolean;
}

export const AudioIndicator: React.FC<AudioIndicatorProps> = ({ isAudioEnabled }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isAudioEnabled ? 'bg-green-900/40' : 'bg-red-900/40'
    }`}>
      {isAudioEnabled ? (
        <Volume2 size={16} className="text-green-400" />
      ) : (
        <VolumeX size={16} className="text-red-400" />
      )}
      <span className="text-sm">
        {isAudioEnabled ? 'Audio actif' : 'Audio muet'}
      </span>
    </div>
  );
};