// src/app/reunions/[id]/live/types.ts
export interface Meeting {
  id: string;
  title: string;
  description: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: { 
    id: string; 
    name: string; 
    email: string;
    role: 'EMPLOYEE' | 'ADMIN';
  };
  participants: { 
    id: string; 
    name: string; 
    email: string;
    isActive?: boolean;
    audioEnabled?: boolean;
    videoEnabled?: boolean;
  }[];
  scheduledTime: string;
  duration: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
  isPending?: boolean;
}

export interface ParticipantStatus {
  userId: string;
  userName?: string;
  userEmail?: string;
  isActive: boolean;        // A rejoint la réunion
  isOnline?: boolean;       // Est connecté maintenant ← NOUVEAU
  audioEnabled: boolean;
  videoEnabled: boolean;
  handRaised?: boolean;
  joinedAt: Date;
  lastSeen?: Date;          // Dernière activité ← NOUVEAU
}

export interface DisplayParticipant {
  id: string;
  name: string;
  email: string;
  isActive: boolean;        // A rejoint la réunion
  isOnline?: boolean;       // Est connecté maintenant ← NOUVEAU
  audioEnabled: boolean;
  videoEnabled: boolean;
  isCurrentUser: boolean;
  isOrganizer: boolean;
  lastSeen?: Date;          // Optionnel
}