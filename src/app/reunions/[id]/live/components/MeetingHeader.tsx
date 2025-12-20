import React from 'react';
import { Crown, Clock, Circle, FileVideo } from 'lucide-react';
import { ConnectionIndicator } from './ConnectionIndicator';
import { MediaInitButton } from './MediaInitButton';
import { Meeting } from '../types';

interface MeetingHeaderProps {
  meeting: Meeting;
  connectionStatus: string;
  networkQuality: string;
  isOrganizer: boolean;
  remainingTime: string;
  onMediaInit: () => void;
  isInitializingMedia: boolean;
  localStream: MediaStream | null;
  onShowRecordings?: () => void;
  isRecording?: boolean;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  meeting,
  connectionStatus,
  networkQuality,
  isOrganizer,
  remainingTime,
  onMediaInit,
  isInitializingMedia,
  localStream,
  onShowRecordings,
  isRecording = false
}) => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* Indicateur d'enregistrement */}
            {isRecording && (
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping"></div>
              </div>
            )}
            
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            
            <span className="font-medium flex items-center gap-2">
              {connectionStatus === 'connected' ? '● EN DIRECT' :
               connectionStatus === 'reconnecting' ? '🔄 RECONNEXION' :
               connectionStatus === 'connecting' ? '🔗 CONNEXION...' : '🔌 DÉCONNECTÉ'}
              
              {isRecording && (
                <span className="text-red-400 text-sm flex items-center gap-1">
                  <Circle size={10} className="animate-pulse" />
                  ENREGISTREMENT
                </span>
              )}
            </span>
          </div>
          
          <div className="h-6 w-px bg-gray-700"></div>
          
          <div>
            <h1 className="font-semibold text-lg">{meeting.title}</h1>
            <p className="text-gray-400 text-sm">
              Organisée par <span className="text-blue-400">{meeting.createdBy.name}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ConnectionIndicator 
            connectionStatus={connectionStatus}
            networkQuality={networkQuality}
          />
          
          {remainingTime && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-900/30 rounded-lg border border-blue-800/30">
              <Clock size={14} className="text-blue-400" />
              <span className="text-sm font-medium">{remainingTime} restant</span>
            </div>
          )}
          
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            isOrganizer 
              ? 'bg-gradient-to-r from-yellow-600 to-amber-600' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}>
            {isOrganizer ? (
              <span className="flex items-center gap-1.5">
                <Crown size={14} />
                Organisateur
              </span>
            ) : 'Participant'}
          </div>
          
          {/* Indicateur d'enregistrement en cours */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-900/30 to-rose-900/30 rounded-lg border border-red-800/30 animate-pulse">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-300 font-medium">
                Enregistrement
              </span>
            </div>
          )}
          
          {/* Bouton pour voir les enregistrements */}
          {isOrganizer && onShowRecordings && (
            <button
              onClick={onShowRecordings}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-sm font-medium flex items-center gap-1.5 transition duration-200"
              title="Voir les enregistrements"
            >
              <FileVideo size={14} />
              Enregistrements
            </button>
          )}
          
          <MediaInitButton 
            localStream={localStream}
            isInitializingMedia={isInitializingMedia}
            onMediaInit={onMediaInit}
          />
        </div>
      </div>
    </header>
  );
};