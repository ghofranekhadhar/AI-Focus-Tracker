// reunions/types/meeting.ts

// Utilisez les mêmes types que votre Prisma et UserContext
export type UserRole = 'EMPLOYEE' | 'ADMIN'; // Au lieu de 'user' | 'admin' | 'manager'

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole; // Maintenant c'est 'EMPLOYEE' | 'ADMIN'
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'ACCEPTED' | 'DECLINED' | 'PENDING';
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

// AJOUT DU STATUT 'EXPIRED' DANS LES POSSIBILITÉS
export interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  duration: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'; // AJOUT DE 'EXPIRED'
  createdBy: User;
  participants: Participant[];
  meetingUrl?: string;
  room?: string;
  project?: Project;
  isRecurring?: boolean;
  recurrencePattern?: string;
  agenda?: {
    items: AgendaItem[];
  };
  isPinned?: boolean;
  concentrationScore?: number; // AJOUT POUR COMPATIBILITÉ
}

export interface ProjectStats {
  id: string;
  name: string;
  color: string;
  meetingCount: number;
}

// Types pour les filtres
export type StatusFilter = 'all' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'; // AJOUT DES STATUTS
export type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'month';
export type OrganizerFilter = 'all' | 'me' | 'others';
export type PinnedFilter = 'all' | 'pinned';
export type ActiveTab = 'upcoming' | 'live' | 'past' | 'cancelled' | 'expired';
export type SortOrder = 'asc' | 'desc';