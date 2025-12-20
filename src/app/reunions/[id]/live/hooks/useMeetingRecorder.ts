// useMeetingRecorder.tsx 
import { useState, useRef, useCallback, useEffect } from 'react';
import { recordingDB, RecordingDB } from '@/src/lib/indexedDB'; // ← Import depuis le fichier séparé

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  error: string | null;
  audioType: 'system' | 'microphone' | 'none';
  isAudioAvailable: boolean;
}

export const useMeetingRecorder = (
  isOrganizer: boolean = false,
  localStream: MediaStream | null = null,
  meetingId: string = ''
) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    error: null,
    audioType: 'none',
    isAudioAvailable: false
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const totalPauseTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number | null>(null);
  const activeTimeRef = useRef<number>(0);
  const currentMimeTypeRef = useRef<string>('video/webm');

  // Initialiser IndexedDB
  useEffect(() => {
    recordingDB.init().catch(console.error);
  }, []);

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    console.log('🛑 Arrêt enregistrement...');
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && 
        (mediaRecorderRef.current.state === 'recording' || 
         mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    totalPauseTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    activeTimeRef.current = 0;
    
    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      recordingTime: 0
    }));
  }, []);

  // Mettre en pause
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('⏸️ Mise en pause de l\'enregistrement...');
      mediaRecorderRef.current.pause();
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      pauseStartTimeRef.current = Date.now();
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: true
      }));
      
      console.log('✅ Enregistrement en pause');
    }
  }, []);

  // Reprendre
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      console.log('▶️ Reprise de l\'enregistrement...');
      mediaRecorderRef.current.resume();
      
      if (pauseStartTimeRef.current) {
        const pauseDuration = Date.now() - pauseStartTimeRef.current;
        totalPauseTimeRef.current += Math.floor(pauseDuration / 1000);
        pauseStartTimeRef.current = null;
      }
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1
        }));
        activeTimeRef.current += 1;
      }, 1000);
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: false
      }));
      
      console.log('✅ Enregistrement repris');
    }
  }, []);

  // Fonction de capture audio
  const captureWithForcedAudio = async (): Promise<{
    screenStream: MediaStream;
    audioStream: MediaStream | null;
    audioType: 'system' | 'microphone' | 'none';
  }> => {
    try {
      console.log('🎵 Tentative capture audio...');
      
      // ESSAI 1: Audio système
      try {
        const streamWithAudio = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
            frameRate: { ideal: 30 }
          },
          audio: true
        });
        
        const audioTracks = streamWithAudio.getAudioTracks();
        
        if (audioTracks.length > 0) {
          console.log('✅ Audio système capturé!');
          const audioStream = new MediaStream([audioTracks[0]]);
          const videoStream = new MediaStream(streamWithAudio.getVideoTracks());
          
          return {
            screenStream: videoStream,
            audioStream,
            audioType: 'system'
          };
        }
      } catch (error) {
        console.log('⚠️ Audio système échoué:', error);
      }
      
      // ESSAI 2: Microphone
      console.log('🎤 Capture microphone...');
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 44100,
            channelCount: 2
          }
        });
        
        console.log('✅ Microphone capturé');
        return {
          screenStream,
          audioStream,
          audioType: 'microphone'
        };
      } catch (audioError) {
        console.log('⚠️ Microphone non disponible');
        return {
          screenStream,
          audioStream: null,
          audioType: 'none'
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur capture:', error);
      throw error;
    }
  };

  // SAUVEGARDER dans IndexedDB
  const saveRecordingToDB = useCallback(async (blob: Blob, recordingInfo: any) => {
    try {
      const recordingDBData: RecordingDB = {
        id: recordingInfo.id,
        meetingId: recordingInfo.meetingId,
        fileName: recordingInfo.fileName,
        fileSize: blob.size,
        duration: recordingInfo.duration,
        timestamp: new Date().toISOString(),
        audioType: recordingInfo.audioType,
        blob: blob,
        metadata: {
          pausedTime: recordingInfo.pausedTime,
          activeTime: recordingInfo.activeTime,
          status: 'completed'
        }
      };

      await recordingDB.saveRecording(recordingDBData);
      console.log('💾 Enregistrement sauvegardé dans IndexedDB:', recordingInfo.fileName);
      
      // Notifier les composants
      window.dispatchEvent(new CustomEvent('recording-saved', {
        detail: { 
          meetingId: recordingInfo.meetingId,
          recordingId: recordingInfo.id 
        }
      }));
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde IndexedDB:', error);
    }
  }, []);

  // Démarrer l'enregistrement
const startRecording = useCallback(async (): Promise<boolean> => {
  
   
  if (recordingState.isRecording) {
    if (recordingState.isPaused) {
      resumeRecording();
      return true;
    }
    if (confirm('Un enregistrement est déjà en cours. Voulez-vous l\'arrêter ?')) {
      stopRecording();
    }
    return false;
  }
    
  console.log('🎬 Démarrage enregistrement...');


    let screenStream: MediaStream;
    let audioStream: MediaStream | null = null;
    let audioType: 'system' | 'microphone' | 'none' = 'none';
    
    try {
      const result = await captureWithForcedAudio();
      screenStream = result.screenStream;
      audioStream = result.audioStream;
      audioType = result.audioType;
      
      screenStreamRef.current = screenStream;
      if (audioStream) {
        audioStreamRef.current = audioStream;
      }
      
      // Créer le flux final
      let finalStream: MediaStream;
      
      if (audioStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const audioTrack = audioStream.getAudioTracks()[0];
        finalStream = new MediaStream([videoTrack, audioTrack]);
      } else {
        finalStream = screenStream;
      }
      
      // Configurer MediaRecorder
      let mimeType = 'video/webm';
      const codecs = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm'
      ];
      
      for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          mimeType = codec;
          break;
        }
      }
      
      currentMimeTypeRef.current = mimeType;
      
      const mediaRecorder = new MediaRecorder(finalStream, { 
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: audioStream ? 128000 : 0
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      totalPauseTimeRef.current = 0;
      pauseStartTimeRef.current = null;
      activeTimeRef.current = 0;
      
      // Événements MediaRecorder
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Finalisation enregistrement...');
        
        if (recordedChunksRef.current.length === 0) {
          console.error('❌ Aucune donnée enregistrée!');
          alert('Erreur: Aucune donnée enregistrée.');
          return;
        }
        
        // Créer le blob final
        const blob = new Blob(recordedChunksRef.current, { type: currentMimeTypeRef.current });
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        
        // Temps
        const realRecordingTime = activeTimeRef.current;
        const totalPauseTime = totalPauseTimeRef.current;
        
        // Nom du fichier
        const timestamp = new Date().toISOString()
          .replace(/:/g, '-')
          .replace(/\./g, '-')
          .replace('T', '_')
          .slice(0, 19);
        
        const audioLabel = audioType === 'system' ? 'systeme' : 
                         audioType === 'microphone' ? 'micro' : 'sans-audio';
        
        const fileName = `reunion_${timestamp}_${audioLabel}_${realRecordingTime}s.webm`;
        
        // ============ 1. TÉLÉCHARGER LE FICHIER ============
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, 100);
        
        console.log('✅ Enregistrement téléchargé');
        
        // ============ 2. SAUVEGARDER DANS INDEXEDDB ============
        const recordingInfo = {
          id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          meetingId,
          fileName,
          fileSize: blob.size,
          fileSizeMB,
          duration: realRecordingTime,
          timestamp: new Date().toISOString(),
          audioType,
          pausedTime: totalPauseTime,
          activeTime: realRecordingTime
        };
        
        await saveRecordingToDB(blob, recordingInfo);
        
        console.log('💾 Enregistrement sauvegardé pour la liste');
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ Erreur MediaRecorder:', event);
        alert('Erreur technique lors de l\'enregistrement.');
        stopRecording();
      };

      // Gérer l'arrêt manuel
      finalStream.getTracks().forEach(track => {
        track.onended = () => {
          console.log(`🛑 Piste ${track.kind} arrêtée`);
          stopRecording();
        };
      });

      // DÉMARRER
      mediaRecorder.start(1000);
      
      // Mettre à jour l'état
      setRecordingState({
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        error: null,
        audioType,
        isAudioAvailable: audioType !== 'none'
      });

      // Timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1
        }));
        activeTimeRef.current += 1;
      }, 1000);

      console.log('🎥 Enregistrement démarré');
      
      return true;
      
    } catch (error) {
      console.error('💥 ERREUR CRITIQUE:', error);
      
      let message = 'Erreur inconnue';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          message = '❌ Permission refusée.\n\nVeuillez autoriser la capture d\'écran et l\'audio.';
        } else if (error.name === 'NotFoundError') {
          message = '❌ Aucun écran disponible.\n\nVérifiez vos connexions d\'écran.';
        } else {
          message = `❌ ${error.message}`;
        }
      }
      
      alert(message);
      setRecordingState(prev => ({ ...prev, error: message }));
      stopRecording();
      return false;
    }
  }, [recordingState.isRecording, recordingState.isPaused, resumeRecording, stopRecording, meetingId, saveRecordingToDB]);

  // Formater le temps
  const formatRecordingTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  // Formater le temps avec pause
 // Formater le temps avec pause
const formatRecordingTimeWithPause = useCallback((seconds: number, isPaused: boolean = false) => {
  const formatted = formatRecordingTime(seconds);
  return isPaused ? `${formatted} ⏸️` : formatted;
}, [formatRecordingTime]);

// Nettoyage - FIX: NE PAS dépendre de stopRecording !
useEffect(() => {
  return () => {
    console.log('🧹 Cleanup useMeetingRecorder');
    
    // CODE DIRECT SANS APPELER stopRecording()
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && 
        (mediaRecorderRef.current.state === 'recording' || 
         mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    totalPauseTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    activeTimeRef.current = 0;
  };
}, []);

return {
  ...recordingState,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  formatRecordingTime,
  formatRecordingTimeWithPause,
  clearError: () => setRecordingState(prev => ({ ...prev, error: null })),
  canRecord: isOrganizer
};

};