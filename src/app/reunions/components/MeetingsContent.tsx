'use client';

import { ComponentType } from 'react';
import { Meeting, User, ActiveTab } from '../types/meeting';
import { BaseActionButtonsProps } from '../types/action-buttons';
import { MeetingRow } from './MeetingRow';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface MeetingsContentProps {
  isLoading: boolean;
  error: string | null;
  meetings: Meeting[];
  user: User;
  activeTab: ActiveTab;
  hasActiveFilters: boolean;
  onJoinMeeting: (meetingId: string) => void;
  onStartMeeting: (meetingId: string) => void;
  onReprogramMeeting: (meetingId: string) => void;
  onEditMeeting: (meetingId: string) => void;
  onRestartMeeting: (meetingId: string) => void;
  onRestoreMeeting: (meetingId: string) => void;
  onCancelMeeting: (meetingId: string) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onEndMeeting: (meetingId: string) => void;
  onResetFilters: () => void;
  onExportPDF: (meetingId: string) => void;
  onTogglePin: (meetingId: string) => void;
  ActionButtonsComponent?: ComponentType<BaseActionButtonsProps>;
  onExportRecordings?: (meetingId: string, meetingTitle: string) => void; 
  onOpenPDFForm?: (meetingId: string) => void;

}

export const MeetingsContent: React.FC<MeetingsContentProps> = ({ 
  isLoading, 
  error, 
  meetings, 
  user, 
  activeTab, 
  hasActiveFilters, 
  onJoinMeeting, 
  onStartMeeting, 
  onReprogramMeeting,
  onEditMeeting,
  onRestartMeeting,
  onRestoreMeeting,
  onCancelMeeting,
  onDeleteMeeting,
  onEndMeeting,
  onResetFilters, 
  onExportPDF,
  onTogglePin,
  ActionButtonsComponent,
  onExportRecordings,
  onOpenPDFForm

}) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (meetings.length === 0) {
    return (
      <EmptyState 
        activeTab={activeTab}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-4 px-2 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider w-16">
                Épingler
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Titre
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Durée
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Organisateur
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Participants
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Action
              </th>
              <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Détails
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {meetings.map(meeting => (
              <MeetingRow
                key={meeting.id}
                meeting={meeting}
                user={user}
                onJoinMeeting={onJoinMeeting}
                onStartMeeting={onStartMeeting}
                onReprogramMeeting={onReprogramMeeting}
                onEditMeeting={onEditMeeting}
                onRestartMeeting={onRestartMeeting}
                onRestoreMeeting={onRestoreMeeting}
                onCancelMeeting={onCancelMeeting}
                onDeleteMeeting={onDeleteMeeting} 
                onEndMeeting={onEndMeeting}
                onExportPDF={onExportPDF}
                onTogglePin={onTogglePin}
                onExportRecordings={onExportRecordings}

                onOpenPDFForm={onOpenPDFForm}

                ActionButtonsComponent={ActionButtonsComponent}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};