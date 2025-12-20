import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/src/app/contexts/UserContext';
import { Meeting } from '../../types/meeting';

export const useAdminMeetings = () => {
  const { user } = useUser();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger TOUTES les réunions (pas de filtrage par utilisateur)
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/meetings');
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      
      const meetingsFromApi = await response.json();
      setMeetings(meetingsFromApi || []);
    } catch (err) {
      setError('Erreur lors du chargement des réunions');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Actions ADMIN (peut agir sur toutes les réunions)
  const handleJoinMeeting = async (meetingId: string) => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      if (meeting?.status === 'IN_PROGRESS') {
        window.location.href = `/reunions/${meetingId}/live`;
      } else {
        alert('Cette réunion n\'est pas en cours actuellement');
      }
    } catch (error) {
      alert('Erreur lors de la vérification de la réunion');
    }
  };

  const handleStartMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' })
      });

      if (response.ok) {
        setMeetings(prev => prev.map(m => 
          m.id === meetingId ? { ...m, status: 'IN_PROGRESS' } : m
        ));
        window.location.href = `/reunions/${meetingId}/live`;
      }
    } catch (error) {
      alert('Erreur lors du démarrage');
    }
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });

      if (response.ok) {
        setMeetings(prev => prev.map(m => 
          m.id === meetingId ? { ...m, status: 'COMPLETED' } : m
        ));
      }
    } catch (error) {
      alert('Erreur lors de l\'arrêt');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' });
        if (response.ok) {
          setMeetings(prev => prev.filter(m => m.id !== meetingId));
        }
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réunion ?')) {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' })
        });

        if (response.ok) {
          setMeetings(prev => prev.map(m => 
            m.id === meetingId ? { ...m, status: 'CANCELLED' } : m
          ));
        }
      } catch (error) {
        alert('Erreur lors de l\'annulation');
      }
    }
  };

  const handleRestoreMeeting = async (meetingId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir restaurer cette réunion ?')) {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PLANNED' })
        });

        if (response.ok) {
          setMeetings(prev => prev.map(m => 
            m.id === meetingId ? { ...m, status: 'PLANNED' } : m
          ));
        }
      } catch (error) {
        alert('Erreur lors de la restauration');
      }
    }
  };

  return {
    meetings,
    isLoading,
    error,
    refreshData,
    setMeetings,
    handleJoinMeeting,
    handleStartMeeting,
    handleEndMeeting,
    handleDeleteMeeting,
    handleCancelMeeting,
    handleRestoreMeeting
  };
};