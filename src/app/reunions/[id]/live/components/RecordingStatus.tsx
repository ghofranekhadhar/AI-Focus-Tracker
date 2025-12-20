//recordingstatus 

import React from 'react';
import { Circle, Clock, HardDrive, Pause, Play, AlertCircle } from 'lucide-react';

interface RecordingStatusProps {
  isRecording: boolean;
  isPaused?: boolean;
  recordingTime: number;
  formatRecordingTime: (seconds: number, isPaused?: boolean) => string;
  audioType?: 'system' | 'microphone' | 'none'; // ← AJOUTER CETTE PROP
}

export const RecordingStatus: React.FC<RecordingStatusProps> = ({
  isRecording,
  isPaused = false,
  recordingTime,
  formatRecordingTime,
  audioType // ← AJOUTER CETTE PROP
}) => {
  if (!isRecording) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 animate-fade-in">
      <div className={`bg-gradient-to-r ${
        isPaused 
          ? 'from-yellow-900/90 to-amber-900/90 border-yellow-700/50' 
          : 'from-red-900/90 to-rose-900/90 border-red-700/50'
      } border rounded-xl p-3 shadow-2xl backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          {/* Icône principale */}
          <div className="relative mt-1">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              isPaused 
                ? 'bg-yellow-500 text-black' 
                : 'bg-red-500 text-white animate-pulse'
            }`}>
              {isPaused ? (
                <Pause size={8} fill="currentColor" />
              ) : (
                <Circle size={6} fill="currentColor" />
              )}
            </div>
            {!isPaused && (
              <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping"></div>
            )}
          </div>
          
          {/* Contenu */}
          <div className="space-y-2 flex-1">
            {/* Titre et statut */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  isPaused ? 'text-yellow-200' : 'text-red-200'
                }`}>
                  {isPaused ? '⏸️ EN PAUSE' : '🔴 ENREGISTREMENT'}
                </span>
                
                {/* Badge type audio */}
                {audioType && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    audioType === 'system' ? 'bg-green-900/50 text-green-300' :
                    audioType === 'microphone' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {audioType === 'system' ? '🔊 Système' :
                     audioType === 'microphone' ? '🎤 Micro' : 
                     '🔇 Sans audio'}
                  </span>
                )}
              </div>
              
              {/* Temps */}
              <span className={`text-xs font-mono ${
                isPaused ? 'text-yellow-300/80' : 'text-red-300/80'
              }`}>
                {formatRecordingTime(recordingTime, isPaused)}
              </span>
            </div>
            
            {/* Détails */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Clock size={10} />
                  <span>Durée: {formatRecordingTime(recordingTime)}</span>
                </span>
                
                <span className="flex items-center gap-1.5 text-gray-300">
                  <HardDrive size={10} />
                  <span>{isPaused ? 'En attente' : 'Enregistrement actif'}</span>
                </span>
              </div>
              
              {/* Message d'état */}
              <div className={`text-[11px] ${
                isPaused ? 'text-yellow-400/80' : 'text-gray-400'
              }`}>
                {isPaused ? (
                  <span className="flex items-center gap-1">
                    <AlertCircle size={10} />
                    L'enregistrement est en pause. Cliquez sur "Reprendre" pour continuer.
                  </span>
                ) : (
                  'Ne fermez pas cette fenêtre pendant l\'enregistrement.'
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Barre de progression (optionnelle) */}
        {!isPaused && (
          <div className="mt-2">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingStatus;