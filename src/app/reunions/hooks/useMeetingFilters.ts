import { useState, useMemo, useCallback } from 'react';
import { Meeting, User, DateFilter, OrganizerFilter, PinnedFilter, ActiveTab, SortOrder } from '../types/meeting';
import { isMeetingDatePassed } from './useMeetingUtils';

// Helper function pour vérifier les rôles de manière sécurisée
const isAdmin = (role: any): boolean => {
  return String(role).toLowerCase() === 'admin';
};

const isUserAdmin = (user: User | null): boolean => {
  return user ? isAdmin(user.role) : false;
};

export const useMeetingFilters = (meetings: Meeting[], user: User | null) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [organizerFilter, setOrganizerFilter] = useState<OrganizerFilter>('all');
  const [pinnedFilter, setPinnedFilter] = useState<PinnedFilter>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // MODIFICATION : L'admin voit toutes les réunions, l'employé voit seulement ses réunions
  const accessibleMeetings = useMemo(() => {
    if (!user) return [];
    
    // CORRECTION : Utiliser la fonction helper pour vérifier le rôle admin
    if (isUserAdmin(user)) {
      return meetings;
    }
    
    // Si c'est un employé, filtrer seulement ses réunions
    return meetings.filter(meeting => {
      const isOrganizer = meeting.createdBy?.id === user.id;
      const isParticipant = meeting.participants?.some(p => p.id === user.id);
      
      return isOrganizer || isParticipant;
    });
  }, [meetings, user]);

  const globalStatistics = useMemo(() => {
    const totalMeetings = accessibleMeetings.length;
    const liveMeetings = accessibleMeetings.filter(m => m.status === 'IN_PROGRESS').length;
    const plannedMeetings = accessibleMeetings.filter(m => m.status === 'PLANNED').length;
    const completedMeetings = accessibleMeetings.filter(m => m.status === 'COMPLETED').length;
    
    // MODIFICATION : L'admin voit toutes les réunions annulées/expirées
    const cancelledMeetings = accessibleMeetings.filter(m => {
      if (isUserAdmin(user)) {
        return m.status === 'CANCELLED' && !isMeetingDatePassed(m.scheduledTime, m.duration);
      }
      return m.status === 'CANCELLED' && 
             m.createdBy.id === user?.id &&
             !isMeetingDatePassed(m.scheduledTime, m.duration);
    }).length;

    const expiredMeetings = accessibleMeetings.filter(m => {
      if (isUserAdmin(user)) {
        return m.status === 'PLANNED' && isMeetingDatePassed(m.scheduledTime, m.duration);
      }
      return m.status === 'PLANNED' && 
             isMeetingDatePassed(m.scheduledTime, m.duration) &&
             m.createdBy.id === user?.id;
    }).length;

    return {
      totalMeetings,
      liveMeetings,
      plannedMeetings,
      completedMeetings,
      cancelledMeetings,
      expiredMeetings,
      tabCounts: {
        upcoming: accessibleMeetings.filter(m => 
          m.status === 'PLANNED' && new Date(m.scheduledTime) >= new Date()
        ).length,
        live: liveMeetings,
        past: completedMeetings,
        cancelled: cancelledMeetings,
        expired: expiredMeetings
      }
    };
  }, [accessibleMeetings, user]);

  const filteredMeetings = useMemo(() => {
    return accessibleMeetings.filter(meeting => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          meeting.title.toLowerCase().includes(searchLower) ||
          meeting.description?.toLowerCase().includes(searchLower) ||
          meeting.createdBy.name.toLowerCase().includes(searchLower) ||
          meeting.participants.some(p => p.name.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      if (organizerFilter === 'me' && meeting.createdBy.id !== user?.id) {
        return false;
      }
      if (organizerFilter === 'others' && meeting.createdBy.id === user?.id) {
        return false;
      }

      if (dateFilter !== 'all') {
        const meetingDate = new Date(meeting.scheduledTime);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case 'today':
            return meetingDate.toDateString() === today.toDateString();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return meetingDate.toDateString() === tomorrow.toDateString();
          case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            return meetingDate >= startOfWeek && meetingDate <= endOfWeek;
          case 'month':
            return meetingDate.getMonth() === today.getMonth() && 
                   meetingDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      }

      if (pinnedFilter === 'pinned' && !meeting.isPinned) {
        return false;
      }

      return true;
    });
  }, [accessibleMeetings, searchTerm, organizerFilter, dateFilter, pinnedFilter, user]);

  const sortedMeetings = useMemo(() => {
    return [...filteredMeetings].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const dateA = new Date(a.scheduledTime).getTime();
      const dateB = new Date(b.scheduledTime).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredMeetings, sortOrder]);

  const tabFilteredMeetings = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return sortedMeetings.filter(m => 
          m.status === 'PLANNED' && new Date(m.scheduledTime) >= new Date()
        );
      case 'live':
        return sortedMeetings.filter(m => m.status === 'IN_PROGRESS');
      case 'past':
        return sortedMeetings.filter(m => m.status === 'COMPLETED');
      case 'cancelled':
        // MODIFICATION : L'admin voit toutes les réunions annulées
        return sortedMeetings.filter(m => {
          if (isUserAdmin(user)) {
            return m.status === 'CANCELLED' && !isMeetingDatePassed(m.scheduledTime, m.duration);
          }
          return m.status === 'CANCELLED' && 
                 m.createdBy.id === user?.id &&
                 !isMeetingDatePassed(m.scheduledTime, m.duration);
        });
      case 'expired':
        // MODIFICATION : L'admin voit toutes les réunions expirées
        return sortedMeetings.filter(m => {
          const isExpired = m.status === 'PLANNED' && isMeetingDatePassed(m.scheduledTime, m.duration);
          if (isUserAdmin(user)) {
            return isExpired;
          }
          return isExpired && m.createdBy.id === user?.id;
        });
      default:
        return sortedMeetings;
    }
  }, [sortedMeetings, activeTab, user]);

  const filteredStatistics = useMemo(() => {
    const upcomingCount = sortedMeetings.filter(m => 
      m.status === 'PLANNED' && new Date(m.scheduledTime) >= new Date()
    ).length;
    
    const liveCount = sortedMeetings.filter(m => m.status === 'IN_PROGRESS').length;
    
    const pastCount = sortedMeetings.filter(m => m.status === 'COMPLETED').length;
    
    // MODIFICATION : L'admin voit toutes les réunions annulées
    const cancelledCount = sortedMeetings.filter(m => {
      if (isUserAdmin(user)) {
        return m.status === 'CANCELLED' && !isMeetingDatePassed(m.scheduledTime, m.duration);
      }
      return m.status === 'CANCELLED' && 
             m.createdBy.id === user?.id &&
             !isMeetingDatePassed(m.scheduledTime, m.duration);
    }).length;

    // MODIFICATION : L'admin voit toutes les réunions expirées
    const expiredCount = sortedMeetings.filter(m => {
      if (isUserAdmin(user)) {
        return m.status === 'PLANNED' && isMeetingDatePassed(m.scheduledTime, m.duration);
      }
      return m.status === 'PLANNED' && 
             isMeetingDatePassed(m.scheduledTime, m.duration) &&
             m.createdBy.id === user?.id;
    }).length;

    return {
      tabCounts: {
        upcoming: upcomingCount,
        live: liveCount,
        past: pastCount,
        cancelled: cancelledCount,
        expired: expiredCount
      }
    };
  }, [sortedMeetings, user]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setDateFilter('all');
    setOrganizerFilter('all');
    setPinnedFilter('all');
    setSortOrder('asc');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || dateFilter !== 'all' || organizerFilter !== 'all' || pinnedFilter !== 'all';
  }, [searchTerm, dateFilter, organizerFilter, pinnedFilter]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    organizerFilter,
    setOrganizerFilter,
    pinnedFilter,
    setPinnedFilter,
    activeTab,
    setActiveTab,
    sortOrder,
    setSortOrder,
    filteredMeetings: sortedMeetings,
    tabFilteredMeetings,
    globalStatistics,
    filteredStatistics,
    resetFilters,
    toggleSortOrder,
    hasActiveFilters
  };
};