// src/app/reunions/[id]/live/page.tsx
'use client';

import { useUser } from '@/src/app/contexts/UserContext';
import { useParams, useRouter } from 'next/navigation';

import { SystemNotification } from './components/SystemNotification';
import { useMeetingRecorder } from './hooks/useMeetingRecorder';
import { RecordingManager } from './components/RecordingManager';
import { RecordingStatus } from './components/RecordingStatus';
import { MediaControls } from './components/MediaControls';

import { AutoPVModal } from '@/src/app/reunions/components/AutoPVModal';
import { downloadProfessionalMeetingPDF } from '@/src/app/reunions/utils/pdfGenerator';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ScreenShare, 
  ScreenShareOff,
  Users,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  User,
  Crown,
  Volume2,
  VolumeX,
  Hand,
  FileVideo,
  Pause,
  Play,
  Loader2,
  CheckSquare,       
  ClipboardList,       
  Target,            
  Plus,              
  X,                 
  Calendar,          
  UserPlus           
} from 'lucide-react';

// Hooks personnalisés
import { useMeetingData } from './hooks/useMeetingData';
import { useWebSocket } from './hooks/useWebSocket';
import { useMediaStream } from './hooks/useMediaStream';
import { useParticipants } from './hooks/useParticipants';

// Composants
import { MeetingHeader } from './components/MeetingHeader';
import { VideoDisplay } from './components/VideoDisplay';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';

// Utilitaires
import { getRemainingTime } from './utils';

export default function ProfessionalLiveMeetingPage() {
  // === 1. HOOKS REACT NATIFS ===
  const { user, loading: userLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  
  const [activeView, setActiveView] = useState<'grid' | 'chat'>('grid');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [networkQuality, setNetworkQuality] = useState<'good' | 'average' | 'poor'>('good');
  const [participantsStatus, setParticipantsStatus] = useState<any[]>([]);
  const participantsStatusRef = useRef<any[]>([]);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [pinnedParticipants, setPinnedParticipants] = useState<Set<string>>(new Set());
  const [showRecordings, setShowRecordings] = useState(false);

  const [showAutoPVModal, setShowAutoPVModal] = useState(false);


  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'join' | 'leave';
  }>>([]);


const [meetingNotes, setMeetingNotes] = useState({
  agenda: [],
  decisions: [],
  actionItems: []
});



// Après les autres états
const [showCapturePanel, setShowCapturePanel] = useState(false);
const [capturedItems, setCapturedItems] = useState<Array<{
  id: string;
  type: 'decision' | 'task' | 'agenda';
  content: string;
  responsible?: string;
  timestamp: Date;
}>>([]);







// Fonction pour capturer en temps réel
// Remplacez la fonction existante par celle-ci :
const captureMeetingItem = async (
  type: 'decision' | 'task' | 'agenda', 
  content: string, 
  responsible?: string
) => {
  if (!content.trim()) return;
  
  console.log('🎯 Capture en cours...', { type, content, responsible });
  
  try {
    // 1. Sauvegarder via API
    const response = await fetch(`/api/meetings/${meetingId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        content,
        responsible: responsible || '',
        deadline: type === 'task' 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
          : ''
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Capture réussie:', result);
      
      // 2. Mettre à jour l'état local
      const newItem = {
        id: `${type}_${Date.now()}`,
        type,
        content,
        responsible,
        timestamp: new Date()
      };
      
      setCapturedItems(prev => [newItem, ...prev]);
      
      // 3. Notification visuelle
      const notificationId = `capture_${Date.now()}`;
      setNotifications(prev => [
        ...prev,
        {
          id: notificationId,
          message: `${type === 'decision' ? '✅ Décision' : type === 'task' ? '🎯 Tâche' : '📝 Point'} capturé !`,
          type: 'join'
        }
      ]);
      
      // Supprimer la notification après 3s
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 3000);
      
      
      // 5. Actualiser les données de meeting
      const meetingResponse = await fetch(`/api/meetings/${meetingId}`);
      if (meetingResponse.ok) {
        const updatedMeeting = await meetingResponse.json();
        setLocalMeeting(updatedMeeting);
      }
      
    } else {
      console.error('❌ Erreur API capture:', result.error);
      alert(`Erreur: ${result.error || 'Échec de la capture'}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur capture:', error);
    alert('Erreur de connexion au serveur');
  }
};




// Fonctions rapides pour chaque type
const captureDecision = () => {
  const decision = prompt('Quelle décision a été prise ?');
  if (decision) captureMeetingItem('decision', decision);
};

const captureTask = () => {
  const task = prompt('Quelle tâche à assigner ?');
  if (task) {
    const responsible = prompt('À qui assigner cette tâche ?');
    if (responsible) captureMeetingItem('task', task, responsible);
  }
};

const captureAgendaPoint = () => {
  const point = prompt('Ajouter un point à l\'ordre du jour :');
  if (point) captureMeetingItem('agenda', point);
};










  // === 2. FONCTIONS DE GESTION D'ÉTAT (déclarées AVANT les hooks qui les utilisent) ===
  const updateParticipantsStatus = useCallback((newValue: any[] | ((prev: any[]) => any[])) => {
    if (typeof newValue === 'function') {
      setParticipantsStatus(prev => {
        const updatedValue = (newValue as Function)(prev);
        participantsStatusRef.current = updatedValue;
        return updatedValue;
      });
    } else {
      participantsStatusRef.current = newValue;
      setParticipantsStatus(newValue);
    }
  }, []);

  const addNotification = useCallback((message: string, type: 'join' | 'leave') => {
    if (!user?.name) return;
    
    const userName = message.split(' a ')[0]?.trim();
    const currentUserName = user.name.trim();
    
    if (userName && currentUserName && userName.includes(currentUserName.split(' ')[0])) {
      return;
    }
    
    const id = `notification-${Date.now()}`;
    setNotifications(prev => {
      const newNotifications = [...prev, { id, message, type }];
      return newNotifications.length > 3 ? newNotifications.slice(-3) : newNotifications;
    });
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
    
  }, [user?.name]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // === 3. HOOKS PERSONNALISÉS (après déclaration des fonctions qu'ils utilisent) ===
  const { meeting, isLoading, error } = useMeetingData(meetingId, user);

  const [localMeeting, setLocalMeeting] = useState(meeting);

  // Mettez à jour localMeeting quand meeting change
useEffect(() => {
  if (meeting) {
    setLocalMeeting(meeting);
  }
}, [meeting]);


  const {
    connectionStatus,
    initializeWebSocket,
    sendUserStatus,
    sendChatMessage,
    endMeeting: endMeetingWs,
    leaveMeeting: leaveMeetingWs,
    cleanupWebSocket
  } = useWebSocket(
    meetingId, 
    user, 
    setChatMessages, 
    updateParticipantsStatus, // ← maintenant déclaré
    addNotification // ← maintenant déclaré
  );
  
  const {
    localStream,
    screenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isInitializingMedia,
    initializeMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    cleanupMedia,
    sendStatusWithDebounce
  } = useMediaStream(localVideoRef, screenShareRef, sendUserStatus, user, participantsStatus);

const { getDisplayParticipants, displayParticipants, onlineParticipantsCount } = useParticipants(
  meeting, 
  user, 
  participantsStatus, 
  isAudioEnabled, 
  isVideoEnabled
);

 // === 4. CALCULS ET MÉMORISATIONS ===
const isOrganizer = useMemo(() => {
  return meeting?.createdBy?.id && user?.id 
    ? meeting.createdBy.id === user.id 
    : false;
}, [meeting?.createdBy?.id, user?.id]);

// Hook d'enregistrement ÉCRAN
const {
  isRecording,
  isPaused,
  recordingTime,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  formatRecordingTime,
  formatRecordingTimeWithPause,
  audioType,
  canRecord
} = useMeetingRecorder(isOrganizer, localStream, meetingId);

// === 5. FONCTION DE DÉMARRAGE D'ENREGISTREMENT (UNIQUE) ===
const handleStartScreenRecording = useCallback(async () => {
  if (!isOrganizer) {
    alert('❌ Seul l\'organisateur peut enregistrer la réunion.');
    return;
  }
  
  console.log('🎬 Démarrage...');
  const success = await startRecording();
  
  if (success) {
    console.log('✅ Enregistrement démarré!');
    sendChatMessage("🎥 Enregistrement démarré par l'organisateur");
  }
}, [isOrganizer, startRecording, sendChatMessage]);

// === 6. EFFET WEBSOCKET CORRIGÉ ===
useEffect(() => {
  if (meeting && user) {
    initializeWebSocket();
  }
  
  return () => {
    cleanupWebSocket(); // ← Utilisez la fonction fournie par le hook
  };
}, [meeting, user?.id, initializeWebSocket, cleanupWebSocket]);




  // === 5. RENDU CONDITIONNEL (après tous les hooks) ===
  
  // Afficher un loader pendant le chargement de l'utilisateur
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500 mx-auto mb-4">
            <Loader2 className="w-14 h-14 animate-spin" />
          </div>
          <p className="text-lg font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Si utilisateur non connecté
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-3">Veuillez vous connecter</p>
          <Link 
            href="/auth/signin" 
            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-2"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }





  const memoizedOnlineCount = displayParticipants.filter(p => p.isOnline).length;


  // Initialiser WebSocket quand la réunion est chargée
  useEffect(() => {
    if (meeting && user) {
      initializeWebSocket();
    }
  }, [meeting, user, initializeWebSocket]);

  // Network quality simulation
  useEffect(() => {
    const networkInterval = setInterval(() => {
      const qualities: ('good' | 'average' | 'poor')[] = ['good', 'average', 'poor'];
      setNetworkQuality(qualities[Math.floor(Math.random() * qualities.length)]);
    }, 10000);
    
    return () => {
      clearInterval(networkInterval);
      cleanupWebSocket();
      cleanupMedia();
    };
  }, [cleanupWebSocket, cleanupMedia]);

  // Gérer le lever/baisser de main
  const handleToggleRaiseHand = useCallback(() => {
    if (!user?.id) return;
    
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    
    if (newState) {
      setRaisedHands(prev => new Set([...prev, user.id]));
    } else {
      setRaisedHands(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
    
    sendStatusWithDebounce({
      audioEnabled: isAudioEnabled,
      videoEnabled: isVideoEnabled,
      handRaised: newState
    });
  }, [isHandRaised, user?.id, sendStatusWithDebounce, isAudioEnabled, isVideoEnabled]);

  // Gérer les participants épinglés
  const handlePinParticipant = useCallback((id: string) => {
    setPinnedParticipants(prev => new Set([...prev, id]));
  }, []);

  const handleUnpinParticipant = useCallback((id: string) => {
    setPinnedParticipants(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Envoyer un message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    
    sendChatMessage(newMessage);
    setNewMessage('');
  };

  // Quitter la réunion
  const handleLeaveMeeting = async () => {
    if (!confirm('Voulez-vous quitter la réunion ?\n\nVous pourrez la rejoindre plus tard.')) return;
    
    leaveMeetingWs();
    
    try {
      await fetch(`/api/meetings/${meetingId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
    } catch (error) {
      console.error('Erreur lors de la sortie:', error);
    }
    
    cleanupMedia();
    cleanupWebSocket();
    router.push('/reunions');
  };

  // Terminer la réunion (organisateur seulement)
// 2. MODIFIEZ LA FONCTION handleEndMeeting :
const handleEndMeeting = async () => {
  if (!meeting || !isOrganizer) return;
  
  if (!confirm('Voulez-vous terminer la réunion pour tous les participants ?\n\nLe chat sera archivé et vous pourrez générer le PV.')) return;
  
  try {
    // 1. Arrêter l'enregistrement si en cours
    if (isRecording) {
      stopRecording();
    }
    
    // 2. Terminer la réunion via WebSocket
    endMeetingWs();
    
    // 3. Mettre à jour le statut dans la base de données
    await fetch(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'COMPLETED',
        endedAt: new Date().toISOString()
      })
    });
    
    // 4. Ouvrir le modal de génération de PV
    setShowAutoPVModal(true);
    
    // 5. Nettoyer les ressources média
    cleanupMedia();
    cleanupWebSocket();
    
    // Note: On ne redirige pas tout de suite, on laisse le modal ouvert
    
  } catch (error) {
    console.error('Erreur fin réunion:', error);
    alert('Erreur lors de la fin de la réunion');
  }
};

// 3. AJOUTEZ CETTE FONCTION :
// Modifiez votre fonction handleGenerateAIAutoPV
const handleGenerateAIAutoPV = async (notes?: string): Promise<boolean> => {
  if (!isOrganizer) {
    alert('Seul l\'organisateur peut générer le PV automatique.');
    return false;
  }
  
  try {
    const response = await fetch(`/api/meetings/${meetingId}/generate-ai-pv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: notes ? JSON.stringify({ notes }) : undefined
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Télécharger automatiquement
      const downloadLink = document.createElement('a');
      downloadLink.href = result.downloadUrl;
      downloadLink.download = `PV_IA_${meeting?.title || 'Réunion'}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      return true;
    } else {
      alert(`Erreur: ${result.error || 'Erreur inconnue'}`);
      return false;
    }
    
  } catch (error) {
    console.error('Erreur génération PV IA:', error);
    alert('Erreur lors de la génération du PV IA');
    return false;
  }
};




















  const handleRejoin = () => {
    window.location.reload();
  };

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            handleToggleRaiseHand();
            break;
          case 'm':
            e.preventDefault();
            toggleAudio();
            break;
          case 'v':
            e.preventDefault();
            toggleVideo();
            break;
          case 's':
            e.preventDefault();
            toggleScreenShare();
            break;
          case 'q':
            e.preventDefault();
            if (confirm('Voulez-vous quitter la réunion ?')) {
              handleLeaveMeeting();
            }
            break;
          case 'e':
            e.preventDefault();
            if (isOrganizer) {
              handleEndMeeting();
            }
            break;
          case 'r':
            e.preventDefault();
            if (isOrganizer) {
              if (isRecording) {
                if (isPaused) {
                  resumeRecording();
                } else {
                  pauseRecording();
                }
              } else {
                handleStartScreenRecording();
              }
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleToggleRaiseHand, 
    toggleAudio, 
    toggleVideo, 
    toggleScreenShare, 
    handleLeaveMeeting, 
    handleEndMeeting, 
    isOrganizer,
    isRecording,
    isPaused,
    handleStartScreenRecording,
    pauseRecording,
    resumeRecording
  ]);

  // Rendu conditionnel pour le chargement de la réunion
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500 mx-auto mb-4">
            <Loader2 className="w-14 h-14 animate-spin" />
          </div>
          <p className="text-lg font-medium">Connexion à la réunion...</p>
          <p className="text-gray-400 text-sm mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white max-w-md p-6">
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-800/30">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Réunion non disponible</h2>
          <p className="text-gray-400 mb-6">
            {error || 'Cette réunion n\'est pas accessible'}
          </p>

      

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRejoin}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition duration-200 font-medium flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
            <Link 
              href="/reunions" 
              className="bg-gray-800 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition duration-200 font-medium"
            >
              Retour aux réunions
            </Link>
          </div>
        </div>





<button
  onClick={async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/generate-ai-pv`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Télécharger le PDF
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = `PV_IA_${meeting.title}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }}
  className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg"
>
  🧠 Générer PV avec IA
</button>




      </div>








    );
  }

  const remainingTime = getRemainingTime(meeting);
  const connectionMetrics = {
    latency: Math.floor(Math.random() * 100) + 50,
    bandwidth: Math.floor(Math.random() * 5000) + 1000
  };








  // === 7. RENDU FINAL ===
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col h-screen">
      {/* NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <SystemNotification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
      
      <MeetingHeader
        meeting={meeting}
        connectionStatus={connectionStatus}
        networkQuality={networkQuality}
        isOrganizer={isOrganizer}
        remainingTime={remainingTime}
        onMediaInit={() => initializeMedia(0)}
        isInitializingMedia={isInitializingMedia}
        localStream={localStream}
        onShowRecordings={() => setShowRecordings(true)}
        isRecording={isRecording}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Zone vidéo principale */}
        <div className="flex-1 lg:flex-3 min-h-0 p-4 lg:p-6">
          <div className="bg-gray-900 rounded-xl h-full overflow-hidden flex flex-col shrink-0">
            <div className="px-6 py-4 border-b border-gray-800 shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2">
                  <Users size={18} />
                  Salle de réunion ({memoizedOnlineCount} en ligne)
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Statut:</span>
                  <span className="text-green-400 font-medium">● Actif</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 relative p-4">
              <VideoDisplay
                localStream={localStream}
                screenStream={screenStream}
                isScreenSharing={isScreenSharing}
                isVideoEnabled={isVideoEnabled}
                user={user}
                localVideoRef={localVideoRef}
                screenShareRef={screenShareRef}
                onMediaInit={() => initializeMedia(0)}
              />
              
              {/* Overlay d'information */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
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
                
                {localStream && (
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
                )}
                
                {isHandRaised && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-linear-to-r from-amber-900/40 to-yellow-900/40">
                    <Hand size={16} className="text-amber-400" />
                    <span className="text-sm text-amber-300">
                      Main levée
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <MediaControls
                localStream={localStream}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                isScreenSharing={isScreenSharing}
                isInitializingMedia={isInitializingMedia}
                isOrganizer={isOrganizer}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={toggleScreenShare}
                onLeaveMeeting={handleLeaveMeeting}
                onEndMeeting={handleEndMeeting}
                onMediaInit={() => initializeMedia(0)}
                onToggleRaiseHand={handleToggleRaiseHand}
                onStartScreenRecording={handleStartScreenRecording}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
                onStopRecording={stopRecording}
                isHandRaised={isHandRaised}
                isRecording={isRecording}
                isPaused={isPaused}
                canRecord={canRecord}
                audioType={audioType}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-96 xl:w-[420px] shrink-0 border-l border-gray-800/50">
          <div className="h-full flex flex-col">
            <Sidebar
              activeView={activeView}
              onViewChange={setActiveView}
              participants={displayParticipants}
              onlineParticipantsCount={memoizedOnlineCount}
              meeting={meeting}
              chatMessages={chatMessages}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              user={user}
              connectionStatus={connectionStatus}
              raisedHands={raisedHands}
              pinnedParticipants={pinnedParticipants}
              onPinParticipant={handlePinParticipant}
              onUnpinParticipant={handleUnpinParticipant}
              networkQuality={networkQuality}
              connectionMetrics={connectionMetrics}
            />
          </div>
        </div>
      </div>

      <StatusBar
        connectionStatus={connectionStatus}
        onlineParticipantsCount={memoizedOnlineCount}
        meetingId={meetingId}
        onRejoin={handleRejoin}
      />

      {/* Indicateur d'enregistrement flottant */}
 <RecordingStatus
  isRecording={isRecording}
  isPaused={isPaused}
  recordingTime={recordingTime}
  formatRecordingTime={formatRecordingTimeWithPause}
  audioType={audioType}
/>

  

      {/* Modal des enregistrements */}
      {showRecordings && (
        <RecordingManager
          meetingId={meetingId}
          meetingTitle={meeting?.title}
          isOpen={showRecordings}
          onClose={() => setShowRecordings(false)}
        />
      )}

      
  {showAutoPVModal && (
  <AutoPVModal
    meetingId={meetingId}
    meetingTitle={meeting?.title || 'Réunion'}
    isOpen={showAutoPVModal}
    onClose={() => {
      setShowAutoPVModal(false);
      router.push('/reunions');
    }}
    onGeneratePDF={handleGenerateAIAutoPV} // ← CORRECTION ICI
  />
)}





{/* === CAPTURE PANEL === */}
{isOrganizer && (
  <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
    {/* Boutons d'action */}
    {showCapturePanel && (
      <div className="flex flex-col gap-2 mb-2">
        <button
          onClick={captureDecision}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                   p-3 rounded-lg flex items-center gap-2 text-white shadow-xl transition-all duration-200 
                   transform hover:scale-105"
        >
          <CheckSquare size={18} />
          <span className="text-sm font-medium">Décision</span>
        </button>
        
        <button
          onClick={captureTask}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 
                   p-3 rounded-lg flex items-center gap-2 text-white shadow-xl transition-all duration-200 
                   transform hover:scale-105"
        >
          <Target size={18} />
          <span className="text-sm font-medium">Tâche</span>
        </button>
        
        <button
          onClick={captureAgendaPoint}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                   p-3 rounded-lg flex items-center gap-2 text-white shadow-xl transition-all duration-200 
                   transform hover:scale-105"
        >
          <ClipboardList size={18} />
          <span className="text-sm font-medium">Point Agenda</span>
        </button>
      </div>
    )}
    
    {/* Bouton principal */}
    <button
      onClick={() => setShowCapturePanel(!showCapturePanel)}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
               p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 
               flex items-center justify-center"
      title="Capturer pendant la réunion"
    >
      {showCapturePanel ? (
        <X size={24} className="text-white" />
      ) : (
        <Plus size={24} className="text-white" />
      )}
    </button>
    
    {/* Badge du nombre d'éléments capturés */}
    {capturedItems.length > 0 && (
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold 
                    rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
        {capturedItems.length}
      </div>
    )}
  </div>
)}

{/* Panneau de visualisation des éléments capturés */}
{isOrganizer && capturedItems.length > 0 && (
  <div className="fixed top-20 right-4 z-30 w-80 bg-gradient-to-b from-gray-900 to-gray-950 
                border border-gray-800 rounded-xl shadow-2xl p-4">
    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
      <ClipboardList size={16} />
      Points capturés ({capturedItems.length})
    </h3>
    
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {capturedItems.map(item => (
        <div 
          key={item.id}
          className={`p-3 rounded-lg border ${
            item.type === 'decision' ? 'border-green-800 bg-green-900/20' :
            item.type === 'task' ? 'border-amber-800 bg-amber-900/20' :
            'border-blue-800 bg-blue-900/20'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className={`p-1 rounded ${
              item.type === 'decision' ? 'bg-green-700' :
              item.type === 'task' ? 'bg-amber-700' :
              'bg-blue-700'
            }`}>
              {item.type === 'decision' ? (
                <CheckSquare size={12} className="text-white" />
              ) : item.type === 'task' ? (
                <Target size={12} className="text-white" />
              ) : (
                <ClipboardList size={12} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm">{item.content}</p>
              {item.responsible && (
                <p className="text-gray-400 text-xs mt-1">
                  👤 {item.responsible}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {item.timestamp.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}





  </div>
);



}