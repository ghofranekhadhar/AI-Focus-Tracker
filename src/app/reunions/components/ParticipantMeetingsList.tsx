// src/components/ParticipantMeetingsList.tsx
'use client';

import { useState, useEffect } from 'react';

interface ParticipantMeetingsListProps {
  participantEmail: string;
  selectedDate: string;
}

export default function ParticipantMeetingsList({ 
  participantEmail, 
  selectedDate 
}: ParticipantMeetingsListProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadParticipantMeetings = async () => {
      if (!selectedDate || !participantEmail) {
        setMeetings([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/meetings/user-meetings?email=${encodeURIComponent(participantEmail)}&date=${selectedDate}`);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
        
        const data = await response.json();
        setMeetings(data);
      } catch (err) {
        console.error('❌ Error loading participant meetings:', err);
        setError('Impossible de charger les réunions');
      } finally {
        setLoading(false);
      }
    };

    loadParticipantMeetings();
  }, [participantEmail, selectedDate]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex items-center text-sm text-green-600">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Disponible toute la journée
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => {
        const meetingStart = new Date(meeting.scheduledTime);
        const meetingEnd = new Date(meetingStart.getTime() + meeting.duration * 60000);
        
        return (
          <div key={meeting.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">{meeting.title}</div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <span className="font-medium">
                    {formatTime(meeting.scheduledTime)} - {formatTime(meetingEnd.toISOString())}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{formatDuration(meeting.duration)}</span>
                </div>
                {meeting.createdBy && meeting.createdBy.email !== participantEmail && (
                  <div className="text-xs text-gray-500 mt-1">
                    Organisée par: {meeting.createdBy.name || meeting.createdBy.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}