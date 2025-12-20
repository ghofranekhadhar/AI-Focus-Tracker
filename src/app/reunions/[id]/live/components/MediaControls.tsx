import React from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ScreenShare, 
  ScreenShareOff,
  Hand,
  FileVideo,
  Crown,
  Pause,
  Play
} from 'lucide-react';

interface MediaControlsProps {
  localStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isInitializingMedia: boolean;
  isOrganizer: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeaveMeeting: () => void;
  onEndMeeting: () => void;
  onMediaInit: () => void;
  onToggleRaiseHand: () => void;
  onStartScreenRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  isHandRaised: boolean;
  isRecording: boolean;
  isPaused: boolean;
  canRecord: boolean;
  audioType: 'system' | 'microphone' | 'none';
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isInitializingMedia,
  isOrganizer,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveMeeting,
  onEndMeeting,
  onMediaInit,
  onToggleRaiseHand,
  onStartScreenRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  isHandRaised,
  isRecording,
  isPaused,
  canRecord,
  audioType
}) => {
  // Gestion des raccourcis clavier
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="border-t border-gray-800 p-4">
      <div className="flex justify-center items-center space-x-4">
        {/* Bouton lever la main */}
        <button
          onClick={onToggleRaiseHand}
          onKeyDown={(e) => handleKeyDown(e, onToggleRaiseHand)}
          className={`p-4 rounded-full transition-all duration-200 relative group ${
            isHandRaised
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
          aria-label={isHandRaised ? 'Main levée. Cliquer pour baisser' : 'Cliquer pour lever la main'}
          aria-pressed={isHandRaised}
          title={isHandRaised ? 'Baisser la main (Ctrl+H)' : 'Lever la main (Ctrl+H)'}
        >
          <Hand size={20} className="text-white" />
          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isHandRaised ? 'Baisser la main' : 'Lever la main'}
          </span>
        </button>

        {/* Contrôle audio */}
        <button
          onClick={onToggleAudio}
          onKeyDown={(e) => handleKeyDown(e, onToggleAudio)}
          disabled={!localStream || isInitializingMedia}
          className={`p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative group ${
            isAudioEnabled
              ? 'bg-gray-800 hover:bg-gray-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          aria-label={isAudioEnabled ? 'Micro actif. Cliquer pour désactiver' : 'Micro désactivé. Cliquer pour activer'}
          aria-pressed={isAudioEnabled}
          title={isAudioEnabled ? 'Désactiver le micro (Ctrl+M)' : 'Activer le micro (Ctrl+M)'}
        >
          {isAudioEnabled ? (
            <Mic size={20} className="text-white" />
          ) : (
            <MicOff size={20} className="text-white" />
          )}
          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isAudioEnabled ? 'Désactiver micro' : 'Activer micro'}
          </span>
        </button>

        {/* Contrôle vidéo */}
        <button
          onClick={onToggleVideo}
          onKeyDown={(e) => handleKeyDown(e, onToggleVideo)}
          disabled={!localStream || isInitializingMedia}
          className={`p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative group ${
            isVideoEnabled
              ? 'bg-gray-800 hover:bg-gray-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          aria-label={isVideoEnabled ? 'Caméra active. Cliquer pour désactiver' : 'Caméra désactivée. Cliquer pour activer'}
          aria-pressed={isVideoEnabled}
          title={isVideoEnabled ? 'Désactiver la caméra (Ctrl+V)' : 'Activer la caméra (Ctrl+V)'}
        >
          {isVideoEnabled ? (
            <Video size={20} className="text-white" />
          ) : (
            <VideoOff size={20} className="text-white" />
          )}
          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isVideoEnabled ? 'Désactiver caméra' : 'Activer caméra'}
          </span>
        </button>

        {/* Partage d'écran */}
        <button
          onClick={onToggleScreenShare}
          onKeyDown={(e) => handleKeyDown(e, onToggleScreenShare)}
          disabled={isInitializingMedia}
          className={`p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative group ${
            isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
          aria-label={isScreenSharing ? 'Partage d\'écran actif. Cliquer pour arrêter' : 'Cliquer pour partager l\'écran'}
          aria-pressed={isScreenSharing}
          title={isScreenSharing ? 'Arrêter le partage d\'écran (Ctrl+S)' : 'Partager l\'écran (Ctrl+S)'}
        >
          {isScreenSharing ? (
            <ScreenShareOff size={20} className="text-white" />
          ) : (
            <ScreenShare size={20} className="text-white" />
          )}
          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isScreenSharing ? 'Arrêter partage' : 'Partager écran'}
          </span>
        </button>

        {/* ENREGISTRER ÉCRAN - CONDITIONNEL */}
        {canRecord && (
          <>
            <div className="relative">
              <button
                onClick={() => {
                  if (isRecording) {
                    if (isPaused) {
                      onResumeRecording();
                    } else {
                      onPauseRecording();
                    }
                  } else {
                    onStartScreenRecording();
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, () => {
                  if (isRecording) {
                    if (isPaused) {
                      onResumeRecording();
                    } else {
                      onPauseRecording();
                    }
                  } else {
                    onStartScreenRecording();
                  }
                })}
                disabled={isInitializingMedia}
                className={`p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative group ${
                  isRecording
                    ? isPaused
                      ? 'bg-gradient-to-r from-yellow-600 to-amber-600'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 animate-pulse'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
                aria-label={
                  isRecording
                    ? isPaused
                      ? 'Enregistrement en pause. Cliquer pour reprendre'
                      : 'Enregistrement en cours. Cliquer pour mettre en pause'
                    : 'Enregistrer l\'écran'
                }
                aria-pressed={isRecording}
                title={
                  isRecording
                    ? isPaused
                      ? 'Reprendre l\'enregistrement (Ctrl+R)'
                      : 'Mettre en pause (Ctrl+R)'
                    : 'Enregistrer l\'écran (Ctrl+R)'
                }
              >
                {isRecording ? (
                  <>
                    {isPaused ? (
                      <div className="relative">
                        <Play size={20} className="text-white" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-5 h-5 bg-white rounded-sm"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <FileVideo size={20} className="text-white" />
                )}
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {isRecording
                    ? isPaused
                      ? 'Reprendre'
                      : 'Pause'
                    : 'Enregistrer'}
                </span>
              </button>
              
              {/* Indicateur pause */}
              {isPaused && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  PAUSE
                </div>
              )}
            </div>

            {/* Info audio */}
            {isRecording && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isPaused ? 'bg-yellow-900/80 text-yellow-300' :
                  audioType === 'system' ? 'bg-green-900/80 text-green-300' :
                  audioType === 'microphone' ? 'bg-blue-900/80 text-blue-300' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {isPaused ? '⏸️ En pause' : 
                   audioType === 'system' ? '🔊 Système' : 
                   audioType === 'microphone' ? '🎤 Micro' : 
                   '🔇 Sans audio'}
                </div>
              </div>
            )}
          </>
        )}

        {/* Séparateur */}
        <div className="h-8 w-px bg-gray-700"></div>

        {/* Quitter la réunion */}
        <button
          onClick={onLeaveMeeting}
          onKeyDown={(e) => handleKeyDown(e, onLeaveMeeting)}
          className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition-all duration-200 relative group"
          aria-label="Quitter la réunion"
          title="Quitter la réunion (Ctrl+Q)"
        >
          <PhoneOff size={20} className="text-white" />
          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Quitter
          </span>
        </button>
      </div>
      
      {/* Message d'information et bouton organisateur */}
      <div className="text-center mt-4 space-y-3">
        <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>En direct</span>
          </div>
          <span>•</span>
          <span>Raccourcis: Ctrl+H (main), Ctrl+M (micro), Ctrl+V (caméra){canRecord && ', Ctrl+R (enregistrer/pause)'}</span>
          {canRecord && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-purple-300">
                <Crown size={12} />
                Organisateur - Accès enregistrement
              </span>
            </>
          )}
        </div>
        
        {isRecording && (
          <div className="pt-2 border-t border-gray-800">
            <div className="flex items-center justify-center gap-4 mb-2">
              <p className={`font-medium ${
                isPaused ? 'text-yellow-300' : 'text-green-300'
              }`}>
                {isPaused ? '⏸️ Enregistrement en pause' : '🎥 Enregistrement en cours'}
              </p>
              <div className="flex gap-2">
                {isPaused ? (
                  <button
                    onClick={onResumeRecording}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2"
                  >
                    <Play size={14} />
                    Reprendre
                  </button>
                ) : (
                  <button
                    onClick={onPauseRecording}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2"
                  >
                    <Pause size={14} />
                    Pause
                  </button>
                )}
                <button
                  onClick={onStopRecording}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2"
                >
                  Arrêter
                </button>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Audio: {
                audioType === 'system' ? 'Système 🔊' : 
                audioType === 'microphone' ? 'Microphone 🎤' : 
                'Aucun 🔇'
              } • Tout l'écran est capturé
            </p>
          </div>
        )}
        
        {isOrganizer && !isRecording && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-gray-300 text-sm mb-2">
              En tant qu'organisateur, vous pouvez terminer la réunion pour tous
            </p>
            <button
              onClick={onEndMeeting}
              onKeyDown={(e) => handleKeyDown(e, onEndMeeting)}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2 mx-auto"
              aria-label="Terminer la réunion pour tous les participants"
              title="Terminer la réunion (Ctrl+E)"
            >
              <PhoneOff size={14} />
              Terminer la réunion pour tous
            </button>
          </div>
        )}
        
        {!localStream && !isInitializingMedia && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-gray-300 text-sm mb-2">
              La caméra et le microphone ne sont pas activés
            </p>
            <button
              onClick={onMediaInit}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-sm font-medium transition duration-200"
              aria-label="Activer la caméra et le microphone"
            >
              Activer caméra & microphone
            </button>
          </div>
        )}
      </div>
      
      {/* Raccourcis clavier globaux */}
      <div className="sr-only" aria-live="polite">
        Raccourcis disponibles: Ctrl+H pour lever/baisser la main, 
        Ctrl+M pour le micro, Ctrl+V pour la caméra, 
        Ctrl+S pour le partage d'écran{canRecord && ', Ctrl+R pour enregistrer/mettre en pause l\'écran'},
        Ctrl+Q pour quitter, {isOrganizer && ' Ctrl+E pour terminer la réunion'}
      </div>
    </div>
  );
};