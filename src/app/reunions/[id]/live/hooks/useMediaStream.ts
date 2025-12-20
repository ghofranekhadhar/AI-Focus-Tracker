import { useState, useCallback, useEffect, useRef } from 'react';

export const useMediaStream = (
  localVideoRef: React.RefObject<HTMLVideoElement>,
  screenShareRef: React.RefObject<HTMLVideoElement>,
  sendUserStatus: (updates: any) => void,
  user: any,
  participantsStatus: any[]
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInitializingMedia, setIsInitializingMedia] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');

  // Référence pour suivre le dernier statut envoyé
  const lastSentStatusRef = useRef<{
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    timestamp?: number;
  }>({});

  // Obtenir la liste des appareils (une seule fois)
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        
        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);
        
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Erreur liste périphériques:', error);
      }
    };
    
    getDevices();
  }, []);

  // Fonction pour envoyer le statut avec anti-spam
  const sendStatusWithDebounce = useCallback((updates: any) => {
    const now = Date.now();
    const lastSent = lastSentStatusRef.current;
    
    // Vérifier si c'est le même statut que la dernière fois
    const isSameAudio = 'audioEnabled' in updates && updates.audioEnabled === lastSent.audioEnabled;
    const isSameVideo = 'videoEnabled' in updates && updates.videoEnabled === lastSent.videoEnabled;
    
    // Si pas de changement ou envoyé il y a moins de 500ms, ignorer
    if ((isSameAudio && isSameVideo) || (lastSent.timestamp && now - lastSent.timestamp < 500)) {
      console.log('⏭️ Statut identique, non envoyé');
      return;
    }
    
    // Mettre à jour la référence
    lastSentStatusRef.current = {
      ...lastSentStatusRef.current,
      ...updates,
      timestamp: now
    };
    
    // Envoyer au serveur
    sendUserStatus(updates);
  }, [sendUserStatus]);

  // Initialiser le flux média
 const initializeMedia = useCallback(async (retryCount = 0) => {
  if (isInitializingMedia || !user) return; // ← Ajouter !user
    
  setIsInitializingMedia(true);
  
  try {
    console.log(`🎥 Initialisation média (${retryCount + 1}/3)...`);
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      const hasVideo = stream.getVideoTracks().length > 0;
      setIsVideoEnabled(hasVideo);
      setIsAudioEnabled(true);
      
      // Envoyer le statut initial
      sendStatusWithDebounce({
        audioEnabled: true,
        videoEnabled: hasVideo
      });
      
      console.log('✅ Médias initialisés');
      
    } catch (error) {
    console.error(`❌ Erreur initialisation (tentative ${retryCount + 1}):`, error);
    
    if (retryCount < 2) {
      setTimeout(() => initializeMedia(retryCount + 1), 1000);
    }
  } finally {
    setIsInitializingMedia(false);
  }
}, [isInitializingMedia, localStream, selectedVideoDevice, selectedAudioDevice, localVideoRef, sendStatusWithDebounce, user]);

  // Activer/désactiver audio
  const toggleAudio = useCallback(() => {
    if (!localStream) return false;
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return false;
    
    const newState = !audioTracks[0].enabled;
    audioTracks.forEach(track => track.enabled = newState);
    
    setIsAudioEnabled(newState);
    sendStatusWithDebounce({ audioEnabled: newState });
    
    return newState;
  }, [localStream, sendStatusWithDebounce]);

  // Activer/désactiver vidéo
  const toggleVideo = useCallback(() => {
    if (!localStream) return false;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;
    
    const newState = !videoTracks[0].enabled;
    videoTracks.forEach(track => track.enabled = newState);
    
    setIsVideoEnabled(newState);
    sendStatusWithDebounce({ videoEnabled: newState });
    
    return newState;
  }, [localStream, sendStatusWithDebounce]);

  // Partager l'écran
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Arrêter le partage
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      return;
    }
    
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      setScreenStream(screenStream);
      setIsScreenSharing(true);
      
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = screenStream;
      }
      
      // Quand l'utilisateur arrête le partage
      screenStream.getVideoTracks()[0].onended = () => {
        toggleScreenShare();
      };
      
    } catch (error) {
      console.error('❌ Erreur partage écran:', error);
    }
  }, [isScreenSharing, screenStream, screenShareRef]);

  // Nettoyer
  const cleanupMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
  }, [localStream, screenStream]);

  return {
    localStream,
    screenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isInitializingMedia,
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
    initializeMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    cleanupMedia,
    sendStatusWithDebounce
  };
};