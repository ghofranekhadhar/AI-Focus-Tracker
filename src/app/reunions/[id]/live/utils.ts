// src/app/reunions/[id]/live/utils.ts
import { Meeting } from './types'; // Ajoutez cette ligne

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRemainingTime = (meeting: Meeting | null) => {
  if (!meeting?.scheduledTime || !meeting?.duration) return 'Temps écoulé';
  
  const startTime = new Date(meeting.scheduledTime);
  const endTime = new Date(startTime.getTime() + meeting.duration * 60000);
  const now = new Date();
  const diffMs = endTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Temps écoulé';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  
  if (diffHours > 0) {
    return `${diffHours}h${remainingMins > 0 ? ` ${remainingMins}min` : ''}`;
  }
  return `${diffMins}min`;
};