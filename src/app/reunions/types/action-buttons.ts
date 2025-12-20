import { Meeting, User } from './meeting';

export interface BaseActionButtonsProps {
  meeting: Meeting;
  user: User;
  onJoinMeeting: (meetingId: string) => void;
  onStartMeeting: (meetingId: string) => void;
  onEndMeeting: (meetingId: string) => void;
  onCancelMeeting: (meetingId: string) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onRestoreMeeting: (meetingId: string) => void;
  onExportPDF: (meetingId: string) => void;
  // AJOUTEZ CES DEUX NOUVELLES MÉTHODES :
  onReprogramMeeting: (meetingId: string) => void;
  onEditMeeting: (meetingId: string) => void;
  onExportRecordings?: (meetingId: string, meetingTitle: string) => void; 

  onOpenPDFForm?: (meetingId: string) => void;

}