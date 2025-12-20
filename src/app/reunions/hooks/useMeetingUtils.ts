import { useMemo } from 'react';
import { Participant } from '../types/meeting';

export const isMeetingDatePassed = (scheduledTime: string, duration?: number): boolean => {
  try {
    const meetingDate = new Date(scheduledTime);
    const now = new Date();
    
    const meetingDuration = (duration || 60) * 60000;
    const margin = 60 * 60000;
    const meetingEndTime = new Date(meetingDate.getTime() + meetingDuration + margin);
    
    return meetingEndTime < now;
  } catch {
    return false;
  }
};

export const useParticipantStatus = (participants: Participant[]) => {
  return useMemo(() => {
    const total = participants.length;
    const accepted = participants.filter(p => p.status === 'ACCEPTED').length;
    const pending = participants.filter(p => p.status === 'PENDING').length;
    const declined = participants.filter(p => p.status === 'DECLINED').length;
    
    return { total, accepted, pending, declined };
  }, [participants]);
};

export const formatDuration = (duration: number): string => {
  if (duration < 60) {
    return `${duration} min`;
  } else if (duration === 60) {
    return '1h';
  } else {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${hours}h`;
  }
};

export const getRandomColor = (userId: string): string => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-red-500', 'bg-yellow-500', 'bg-indigo-500',
    'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
  ];
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const useStatusBadge = (status: string, scheduledTime?: string, duration?: number) => {
  return useMemo(() => {
    if (status === 'PLANNED' && scheduledTime && isMeetingDatePassed(scheduledTime, duration)) {
      return { 
        color: 'bg-orange-100 text-orange-800 border border-orange-200', 
        text: 'Expirée'
      };
    }

    const config = {
      PLANNED: { 
        color: 'bg-blue-100 text-blue-800 border border-blue-200', 
        text: 'Planifiée'
      },
      IN_PROGRESS: { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        text: 'En direct'
      },
      COMPLETED: { 
        color: 'bg-gray-100 text-gray-800 border border-gray-200', 
        text: 'Terminée'
      },
      CANCELLED: { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        text: 'Annulée'
      }
    };
    return config[status as keyof typeof config] || config.PLANNED;
  }, [status, scheduledTime, duration]);
};

export const useDateTimeFormat = (dateTimeString: string) => {
  return useMemo(() => {
    try {
      const date = new Date(dateTimeString);
      return {
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        weekday: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
        datetime: date.toLocaleString('fr-FR')
      };
    } catch {
      return { 
        date: 'Date invalide', 
        time: 'Heure invalide', 
        weekday: '',
        datetime: 'Date invalide'
      };
    }
  }, [dateTimeString]);
};

export const useEndTime = (startTime: string, duration: number) => {
  return useMemo(() => {
    try {
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      return endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Heure invalide';
    }
  }, [startTime, duration]);
};