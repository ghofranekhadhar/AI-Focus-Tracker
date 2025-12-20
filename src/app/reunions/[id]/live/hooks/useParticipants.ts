import { useMemo } from 'react';
import { Meeting, DisplayParticipant, ParticipantStatus } from '../types';

export const useParticipants = (
  meeting: Meeting | null,
  user: any,
  participantsStatus: ParticipantStatus[],
  localAudioEnabled: boolean,
  localVideoEnabled: boolean
) => {
  // CALCUL DIRECT des participants (pas une fonction)
  const displayParticipants = useMemo(() => {
    const participants: DisplayParticipant[] = [];
    
    // 1. Utilisateur courant
    if (user) {
      participants.push({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: true,
        isOnline: true,
        audioEnabled: localAudioEnabled,
        videoEnabled: localVideoEnabled,
        isCurrentUser: true,
        isOrganizer: meeting?.createdBy.id === user.id,
        lastSeen: new Date()
      });
    }
    
    // 2. Participants depuis WebSocket
    participantsStatus.forEach(status => {
      const participantInfo = meeting?.participants.find(p => p.id === status.userId);
      
      if (participantInfo && participantInfo.id !== user?.id) {
        let isOnline = status.isOnline;
        
        if (isOnline === undefined && status.lastSeen) {
          const lastSeenTime = new Date(status.lastSeen).getTime();
          const now = Date.now();
          isOnline = (now - lastSeenTime) < 45000;
        } else if (isOnline === undefined) {
          isOnline = status.isActive;
        }
        
        participants.push({
          id: status.userId,
          name: status.userName || participantInfo.name,
          email: participantInfo.email,
          isActive: status.isActive,
          isOnline: isOnline,
          audioEnabled: status.audioEnabled,
          videoEnabled: status.videoEnabled,
          isCurrentUser: false,
          isOrganizer: meeting?.createdBy.id === status.userId,
          lastSeen: status.lastSeen
        });
      }
    });
    
    // 3. Participants inactifs
    meeting?.participants.forEach(participant => {
      if (participant.id !== user?.id) {
        const alreadyInList = participants.find(p => p.id === participant.id);
        if (!alreadyInList) {
          participants.push({
            id: participant.id,
            name: participant.name,
            email: participant.email,
            isActive: false,
            isOnline: false,
            audioEnabled: false,
            videoEnabled: false,
            isCurrentUser: false,
            isOrganizer: meeting?.createdBy.id === participant.id
          });
        }
      }
    });
    
    return participants.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      if (a.isOrganizer && !b.isOrganizer) return -1;
      if (!a.isOrganizer && b.isOrganizer) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [meeting, user, participantsStatus, localAudioEnabled, localVideoEnabled]);

  // Calculs BASÉS SUR displayParticipants (les données, pas une fonction)
  const onlineParticipantsCount = useMemo(() => {
    return displayParticipants.filter(p => p.isOnline).length;
  }, [displayParticipants]);

  const activeParticipantsCount = useMemo(() => {
    return displayParticipants.filter(p => p.isActive).length;
  }, [displayParticipants]);

  // Fonction helper si vous avez besoin d'une fonction
  const getDisplayParticipants = () => displayParticipants;

  return {
    getDisplayParticipants,  // Fonction simple
    displayParticipants,     // Données directement
    onlineParticipantsCount,
    activeParticipantsCount
  };
};