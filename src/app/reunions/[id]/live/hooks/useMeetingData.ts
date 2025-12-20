//usemeetingdata
import { useState, useEffect } from 'react';
import { Meeting } from '../types';

export const useMeetingData = (meetingId: string, user: any) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeeting = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/meetings/${meetingId}`);
        
        if (!response.ok) {
          throw new Error('Réunion non trouvée');
        }
        
        const meetingData = await response.json();
        
        if (meetingData.status !== 'IN_PROGRESS') {
          throw new Error('Cette réunion n\'est pas en cours');
        }
        
        setMeeting(meetingData);
        
      } catch (err) {
        console.error('Erreur chargement réunion:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    loadMeeting();
  }, [meetingId, user]);

  return { meeting, isLoading, error, setMeeting };
};