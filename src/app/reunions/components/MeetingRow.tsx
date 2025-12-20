'use client';

import { ComponentType } from 'react';
import Link from 'next/link';
import { Meeting, User } from '../types/meeting';
import { BaseActionButtonsProps } from '../types/action-buttons';
import { 
  useDateTimeFormat, 
  useEndTime, 
  useStatusBadge, 
  useParticipantStatus, 
  formatDuration 
} from '../hooks/useMeetingUtils';
import { UserAvatar } from './UserAvatar';
import { ActionButtons } from './ActionButtons';
import { PushPinIcon, EyeIcon } from './icons';
import { FileVideo, Download, Eye } from 'lucide-react';



interface MeetingRowProps {
  meeting: Meeting;
  user: User;
  onJoinMeeting: (meetingId: string) => void;
  onStartMeeting: (meetingId: string) => void;
  onReprogramMeeting: (meetingId: string) => void;
  onEditMeeting: (meetingId: string) => void;
  onRestartMeeting: (meetingId: string) => void;
  onRestoreMeeting: (meetingId: string) => void;
  onCancelMeeting: (meetingId: string) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onEndMeeting: (meetingId: string) => void;
  onExportPDF: (meetingId: string) => void;
  onTogglePin: (meetingId: string) => void;
  onExportRecordings?: (meetingId: string, meetingTitle: string) => void;
  onOpenPDFForm?: (meetingId: string) => void;

  ActionButtonsComponent?: ComponentType<BaseActionButtonsProps>;
}

export const MeetingRow: React.FC<MeetingRowProps> = ({
  meeting,
  user,
  onJoinMeeting,
  onStartMeeting,
  onReprogramMeeting,
  onEditMeeting,
  onRestartMeeting,
  onRestoreMeeting,
  onCancelMeeting,
  onDeleteMeeting,
  onEndMeeting,
  onExportPDF,
  onTogglePin,
  onExportRecordings,
  onOpenPDFForm,
  ActionButtonsComponent
}) => {
  const { date, time } = useDateTimeFormat(meeting.scheduledTime);
  const endTime = useEndTime(meeting.scheduledTime, meeting.duration);
  const userIsOrganizer = meeting.createdBy.id === user.id;
  const statusBadge = useStatusBadge(meeting.status, meeting.scheduledTime);
  const participantStatus = useParticipantStatus(meeting.participants);
  

  // AJOUTEZ CES 2 LIGNES :
const isMeetingEnded = meeting.status === 'COMPLETED' 


// 2. Vérifier si l'utilisateur peut voir les enregistrements
const canViewRecordings = isMeetingEnded && 
  (userIsOrganizer || 
   meeting.participants?.some((p: any) => p.id === user.id));





  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
      meeting.isPinned ? 'bg-blue-50 hover:bg-blue-100' : ''
    }`}>
      
      <td className="py-4 px-2 text-center">
        <button
          onClick={() => onTogglePin(meeting.id)}
          className={`group relative p-2 rounded-lg transition-all duration-300 transform ${
            meeting.isPinned 
              ? 'bg-blue-100 text-blue-600 shadow-lg -translate-y-0.5 border border-blue-200' 
              : 'bg-white text-gray-400 hover:bg-blue-50 hover:shadow-md border border-transparent'
          }`}
          title={meeting.isPinned ? "Désépingler" : "Épingler"}
        >
          <PushPinIcon className={`w-4 h-4 transition-all duration-300 ${
            meeting.isPinned 
              ? 'fill-current rotate-45' 
              : 'group-hover:fill-blue-300 group-hover:scale-110 group-hover:rotate-12'
          }`} />
          
          {meeting.isPinned && (
            <div className="absolute inset-0 rounded-lg bg-blue-200 opacity-20 animate-pulse"></div>
          )}
        </button>
      </td>

      <td className="py-4 px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{meeting.title}</h3>
            
            {meeting.isRecurring && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200 whitespace-nowrap">
                Récurrent
              </span>
            )}
            
            {meeting.isPinned && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200 whitespace-nowrap">
                Épinglée
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{meeting.description || 'Aucune description'}</p>
          {meeting.room && (
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>Salle: {meeting.room}</span>
            </div>
          )}
        </div>
      </td>

      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900">
              {date.split(' ')[0]}
            </div>
            <div className="text-xs text-slate-600 font-medium uppercase">
              {date.split(' ')[1]}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-300"></div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {date.split(' ')[2]}
            </span>
            <span className="text-xs text-blue-600 font-medium">
              {time}
            </span>
          </div>
        </div>
      </td>

      <td className="py-4 px-6">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900">
            {formatDuration(meeting.duration)}
          </div>
        </div>
      </td>

      <td className="py-4 px-6">
        <UserAvatar user={meeting.createdBy} currentUserId={user.id} />
      </td>
      
      <td className="py-4 px-6">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">👥</span>
          <span className="text-xs text-gray-700">
            {meeting.participants.length} participant{meeting.participants.length > 1 ? 's' : ''}
          </span>
        </div>
      </td>
      
      <td className="py-4 px-6">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
          {statusBadge.text}
        </span>
      </td>
      
      <td className="py-4 px-6">
  {ActionButtonsComponent ? (
    <ActionButtonsComponent
  meeting={meeting}
  user={user}
  onJoinMeeting={onJoinMeeting}
  onStartMeeting={onStartMeeting}
  onEndMeeting={onEndMeeting}
  onCancelMeeting={onCancelMeeting}
  onDeleteMeeting={onDeleteMeeting}
  onRestoreMeeting={onRestoreMeeting}
  onExportPDF={onExportPDF}
  onReprogramMeeting={onReprogramMeeting}
  onEditMeeting={onEditMeeting}
  onExportRecordings={onExportRecordings} 
  onOpenPDFForm={onOpenPDFForm} 
/>

  ) : (
    <ActionButtons 
      meeting={meeting}
      user={user}
      userIsOrganizer={userIsOrganizer}
      onJoinMeeting={onJoinMeeting}
      onStartMeeting={onStartMeeting}
      onReprogramMeeting={onReprogramMeeting}
      onEditMeeting={onEditMeeting}
      onRestartMeeting={onRestartMeeting}
      onRestoreMeeting={onRestoreMeeting}
      onEndMeeting={onEndMeeting}
      onCancelMeeting={onCancelMeeting}
      onDeleteMeeting={onDeleteMeeting}
      onExportPDF={onExportPDF}
      onExportRecordings={onExportRecordings}
      onOpenPDFForm={onOpenPDFForm} 
    />
  )}
</td>

      <td className="py-4 px-6">
        <Link 
          href={`/reunions/${meeting.id}`}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center justify-center"
          title="Voir les détails"
        >
          <EyeIcon className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
};