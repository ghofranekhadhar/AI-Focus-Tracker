import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/src/app/contexts/UserContext';
import { Meeting, ProjectStats } from '../types/meeting';

export const useMeetings = () => {
  const { user } = useUser();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformMeeting = (meeting: any): Meeting => ({
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    scheduledTime: meeting.scheduledTime,
    duration: meeting.duration,
    status: meeting.status as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    createdBy: {
      id: meeting.createdBy?.id,
      name: meeting.createdBy?.name,
      email: meeting.createdBy?.email,
      role: meeting.createdBy?.role || 'user'
    },
    participants: meeting.participants?.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      status: p.status || 'ACCEPTED'
    })) || [],
    meetingUrl: meeting.meetingUrl,
    room: meeting.room,
    project: meeting.projectId ? {
      id: meeting.projectId,
      name: meeting.projectName || `Projet ${meeting.projectId}`,
      color: meeting.projectColor || 'bg-blue-500'
    } : undefined,
    isRecurring: meeting.isRecurring,
    recurrencePattern: meeting.recurrencePattern,
    agenda: meeting.agenda ? { items: meeting.agenda.items || [] } : undefined,
    isPinned: meeting.isPinned || false
  });

  const refreshData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const meetingsResponse = await fetch('/api/meetings');
      if (!meetingsResponse.ok) throw new Error('Erreur de chargement des réunions');

      const meetingsFromApi = await meetingsResponse.json();

      // CORRECTION : Utiliser user.role avec conversion en string
      const accessibleMeetings = meetingsFromApi.filter((m: any) => {
        // Solution 1: Convertir en string pour la comparaison
        if (String(user.role).toLowerCase() === 'admin') return true;
        
        const isOrganizer = m.createdBy?.id === user.id;
        const isParticipant = m.participants?.some((p: any) => p.id === user.id);
        return isOrganizer || isParticipant;
      });

      setMeetings(accessibleMeetings.map(transformMeeting));

      // Charger les projets
      try {
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projectsFromApi = await projectsResponse.json();
          setProjects(projectsFromApi.map((p: any) => ({
            id: p.id,
            name: p.name,
            color: p.color || 'bg-gray-500',
            meetingCount: p.meetingCount || 0
          })));
        }
      } catch {
        setProjects([
          { id: '1', name: 'Website Update', color: 'bg-blue-500', meetingCount: 5 },
          { id: '2', name: 'Documentation Team', color: 'bg-green-500', meetingCount: 3 },
          { id: '3', name: 'Automotive Project', color: 'bg-purple-500', meetingCount: 2 },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, refreshData]);

  return { meetings, projects, isLoading, error, refreshData, setMeetings };
};