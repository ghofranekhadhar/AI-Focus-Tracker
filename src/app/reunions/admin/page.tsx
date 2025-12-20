'use client';

import { useUser } from '@/src/app/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect, useMemo } from 'react';

// Import des hooks et composants de base
import { useMeetings } from '../hooks/useMeetings';
import { useMeetingFilters } from '../hooks/useMeetingFilters';
import { isMeetingDatePassed, getRandomColor, getInitials } from '../hooks/useMeetingUtils';

// Composants réutilisables
import { StatisticsSection } from '../components/StatisticsSection';
import { TabNavigation } from '../components/TabNavigation';
import { MeetingsContent } from '../components/MeetingsContent';
import { LoadingState } from '../components/LoadingState';
import { ReprogramPopup } from '../components/ReprogramPopup';
import { EditMeetingPopup } from '../components/EditMeetingPopup';
import { RecordingManager } from '@/src/app/reunions/[id]/live/components/RecordingManager';


// AJOUT IMPORTANT : Import du composant Admin
import { AdminActionButtons } from './components/AdminActionButtons';


import AdminLayout from '@/src/app/(admin)/layout';




// Icons
import { 
  CalendarIcon, 
  SearchIcon, 
  PlusIcon, 
  UserIcon, 
  PinIcon, 
  ArrowUpDownIcon, 
  XIcon, 
  RefreshCwIcon 
} from '../components/icons';

// 🔍 DEBUG CRITIQUE
console.log('🔍 [1] Admin page - AdminActionButtons imported:', !!AdminActionButtons);
console.log('🔍 [1] Admin page - AdminActionButtons path:', './components/AdminActionButtons');




export default function ProfessionalAdminReunionsPage() {
  const { user, logout } = useUser();
  const router = useRouter();
  
  const { meetings, isLoading, error, setMeetings, refreshData } = useMeetings();
  
  // 🔍 DEBUG CRITIQUE
  console.log('🔍 [2] Admin page - User:', user);
  console.log('🔍 [2] Admin page - User role:', user?.role);
  console.log('🔍 [2] Admin page - User ID:', user?.id);
  console.log('🔍 [2] Admin page - Total meetings:', meetings.length);
  
  // Affichez les créateurs des réunions pour voir si l'admin voit bien toutes les réunions
  meetings.forEach((meeting, index) => {
    console.log(`🔍 [2] Meeting ${index}:`, {
      id: meeting.id,
      title: meeting.title,
      createdBy: meeting.createdBy.id,
      createdByName: meeting.createdBy.name,
      isCurrentUserCreator: meeting.createdBy.id === user?.id
    });
  });
  
  const allMeetings = useMemo(() => meetings, [meetings]);
  
  const {
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
    tabFilteredMeetings,
    globalStatistics,
    filteredStatistics,
    resetFilters,
    toggleSortOrder,
    hasActiveFilters
  } = useMeetingFilters(allMeetings, user);

  // 🔍 DEBUG CRITIQUE
  console.log('🔍 [3] Admin page - Tab filtered meetings:', tabFilteredMeetings.length);
  console.log('🔍 [3] Admin page - Active tab:', activeTab);
  
  // Vérifiez si les réunions filtrées incluent celles d'autres utilisateurs
  tabFilteredMeetings.forEach((meeting, index) => {
    console.log(`🔍 [3] Filtered meeting ${index}:`, {
      id: meeting.id,
      title: meeting.title, 
      createdBy: meeting.createdBy.id,
      createdByName: meeting.createdBy.name,
      isCurrentUserCreator: meeting.createdBy.id === user?.id
    });
  });

  // États pour les popups
  const [reprogramPopup, setReprogramPopup] = useState<{
    isOpen: boolean;
    meeting: any;
  }>({
    isOpen: false,
    meeting: null
  });

  const [editPopup, setEditPopup] = useState<{
    isOpen: boolean;
    meeting: any;
  }>({
    isOpen: false,
    meeting: null
  });



  const [selectedMeetingForExport, setSelectedMeetingForExport] = useState<{
  id: string;
  title: string;
} | null>(null);



  // Vérification des réunions expirées
  useEffect(() => {
    const checkAndUpdateExpiredMeetings = () => {
      meetings.forEach(async (meeting) => {
        if (meeting.status === 'PLANNED' && isMeetingDatePassed(meeting.scheduledTime)) {
          console.log(`Réunion ${meeting.title} est expirée`);
        }
      });
    };

    const interval = setInterval(checkAndUpdateExpiredMeetings, 60000);
    return () => clearInterval(interval);
  }, [meetings]);

  // HANDLERS AVEC PERMISSIONS ADMIN ÉTENDUES

  const handleRestoreMeeting = useCallback(async (meetingId: string) => {
    if (confirm('Êtes-vous sûr de vouloir restaurer cette réunion annulée ? Elle redeviendra planifiée.')) {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'PLANNED'
          })
        });

        if (response.ok) {
          setMeetings(prev => prev.map(m => 
            m.id === meetingId ? { ...m, status: 'PLANNED' } : m
          ));
          alert('Réunion restaurée avec succès !');
        } else {
          throw new Error('Erreur lors de la restauration de la réunion');
        }
      } catch (error) {
        console.error('Erreur restauration:', error);
        alert('Erreur lors de la restauration de la réunion');
      }
    }
  }, [setMeetings]);

  const handleTogglePin = useCallback(async (meetingId: string) => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) return;

      const newPinStatus = !meeting.isPinned;
      
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: newPinStatus
        })
      });

      if (response.ok) {
        setMeetings(prev => prev.map(m => 
          m.id === meetingId ? { ...m, isPinned: newPinStatus } : m
        ));
      } else {
        throw new Error('Erreur lors de la modification du statut épinglé');
      }
    } catch (error) {
      console.error('Erreur pin/unpin:', error);
      alert('Erreur lors de la modification du statut épinglé');
    }
  }, [meetings, setMeetings]);

  const handleOpenReprogramPopup = useCallback((meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      setReprogramPopup({
        isOpen: true,
        meeting
      });
    }
  }, [meetings]);

  const handleCloseReprogramPopup = useCallback(() => {
    setReprogramPopup({
      isOpen: false,
      meeting: null
    });
  }, []);

  const handleOpenEditPopup = useCallback((meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      setEditPopup({
        isOpen: true,
        meeting
      });
    }
  }, [meetings]);

  const handleCloseEditPopup = useCallback(() => {
    setEditPopup({
      isOpen: false,
      meeting: null
    });
  }, []);

  // ADMIN : Peut terminer n'importe quelle réunion en cours
  const handleEndMeeting = useCallback(async (meetingId: string) => {
    if (confirm('Êtes-vous sûr de vouloir terminer cette réunion pour tous les participants ?')) {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'COMPLETED'
          })
        });

        if (response.ok) {
          setMeetings(prev => prev.map(m => 
            m.id === meetingId ? { ...m, status: 'COMPLETED' } : m
          ));
          alert('Réunion terminée avec succès !');
        } else {
          throw new Error('Erreur lors de la fin de la réunion');
        }
      } catch (error) {
        console.error('Erreur fin de réunion:', error);
        alert('Erreur lors de la fin de la réunion');
      }
    }
  }, [setMeetings]);

  const handleConfirmReprogram = useCallback(async (newDateTime: string) => {
    if (!reprogramPopup.meeting) return;

    try {
      const response = await fetch(`/api/meetings/${reprogramPopup.meeting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledTime: newDateTime
        })
      });

      if (response.ok) {
        setMeetings(prev => prev.map(m => 
          m.id === reprogramPopup.meeting!.id 
            ? { ...m, scheduledTime: newDateTime }
            : m
        ));
        refreshData();
        alert('Réunion reprogrammée avec succès !');
      } else {
        throw new Error('Erreur lors de la reprogrammation');
      }
    } catch (error) {
      console.error('Erreur reprogrammation:', error);
      alert('Erreur lors de la reprogrammation de la réunion');
    }
  }, [reprogramPopup.meeting, setMeetings, refreshData]);

  const handleConfirmEdit = useCallback(async (updatedData: any) => {
    if (!editPopup.meeting) return;

    try {
      const response = await fetch(`/api/meetings/${editPopup.meeting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        setMeetings(prev => prev.map(m => 
          m.id === editPopup.meeting!.id 
            ? { ...m, ...updatedData }
            : m
        ));
        refreshData();
        alert('Réunion modifiée avec succès !');
      } else {
        throw new Error('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('Erreur lors de la modification de la réunion');
    }
  }, [editPopup.meeting, setMeetings, refreshData]);

  // ADMIN : Peut reprogrammer n'importe quelle réunion
  const handleReprogramMeeting = useCallback((meetingId: string) => {
    handleOpenReprogramPopup(meetingId);
  }, [handleOpenReprogramPopup]);

  // ADMIN : Peut modifier n'importe quelle réunion
  const handleEditMeeting = useCallback((meetingId: string) => {
    handleOpenEditPopup(meetingId);
  }, [handleOpenEditPopup]);

  // ADMIN : Peut annuler n'importe quelle réunion
  const handleCancelMeeting = useCallback(async (meetingId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réunion ?')) {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'CANCELLED'
          })
        });

        if (response.ok) {
          setMeetings(prev => prev.map(m => 
            m.id === meetingId ? { ...m, status: 'CANCELLED' } : m
          ));
        } else {
          throw new Error('Erreur lors de l\'annulation de la réunion');
        }
      } catch (error) {
        console.error('Erreur annulation:', error);
        alert('Erreur lors de l\'annulation de la réunion');
      }
    }
  }, [setMeetings]);

  // ADMIN : Peut supprimer n'importe quelle réunion
  const handleDeleteMeeting = useCallback(async (meetingId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette réunion ?')) {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setMeetings(prev => prev.filter(m => m.id !== meetingId));
        } else {
          throw new Error('Erreur lors de la suppression de la réunion');
        }
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression de la réunion');
      }
    }
  }, [setMeetings]);



// Après les autres handlers (handleExportPDF, handleJoinMeeting, etc.), ajoutez :
const handleExportRecordings = useCallback((meetingId: string, meetingTitle: string) => {
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) return;
  
  console.log('📁 Admin - Ouverture enregistrements:', {
    meetingId,
    meetingTitle,
    status: meeting.status
  });
  
  if (meeting.status !== 'COMPLETED') {
    alert('Seules les réunions terminées peuvent avoir des enregistrements à exporter.');
    return;
  }
  
  setSelectedMeetingForExport({
    id: meetingId,
    title: meetingTitle
  });
}, [meetings]);





  const handleExportPDF = useCallback(async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/export-pdf`, {
        method: 'POST',
      });


      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `pv-reunion-${meetingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erreur lors de l\'export PDF');
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export du PDF');
    }
  }, []);

  // ADMIN : Peut rejoindre n'importe quelle réunion en cours
  const handleJoinMeeting = useCallback(async (meetingId: string) => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      
      if (!meeting) {
        alert('Réunion non trouvée');
        return;
      }

      if (meeting.status === 'IN_PROGRESS') {
        router.push(`/reunions/${meetingId}/live`);
        return;
      }

      if (meeting.status === 'PLANNED' && isMeetingDatePassed(meeting.scheduledTime)) {
        alert('Cette réunion planifiée ne peut pas être rejointe car sa date est déjà passée. Contactez l\'organisateur pour la reprogrammer.');
        return;
      }

      console.warn('Cette réunion n\'est pas en cours actuellement');
      alert(`Cette réunion n'est pas accessible actuellement (statut: ${meeting.status}).`);
      
    } catch (error) {
      console.error('Erreur lors de la vérification de la réunion:', error);
      alert('Erreur lors de la tentative de rejoindre la réunion');
    }
  }, [meetings, router]);

  // ADMIN : Peut redémarrer n'importe quelle réunion terminée
  const handleRestartMeeting = useCallback(async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/restart`, {
        method: 'POST',
      });

      if (response.ok) {
        setMeetings(prev => prev.map(m => 
          m.id === meetingId ? { ...m, status: 'IN_PROGRESS' } : m
        ));
        router.push(`/reunions/${meetingId}/live`);
      } else {
        throw new Error('Erreur lors du redémarrage de la réunion');
      }
    } catch (error) {
      console.error('Erreur redémarrage:', error);
      alert('Erreur lors du redémarrage de la réunion');
    }
  }, [setMeetings, router]);

  // ADMIN : Peut démarrer UNIQUEMENT les réunions qu'il a créées
  const handleStartMeeting = useCallback(async (meetingId: string) => {
    console.log('🟡 Début handleStartMeeting pour:', meetingId);
    
    const meeting = meetings.find(m => m.id === meetingId);
    
    if (!meeting) {
      console.log('❌ Réunion non trouvée');
      alert('Réunion non trouvée');
      return;
    }

    if (isMeetingDatePassed(meeting.scheduledTime)) {
      console.log('❌ Date de réunion dépassée');
      alert('Impossible de démarrer cette réunion : la date planifiée est déjà passée. Veuillez reprogrammer la réunion.');
      return;
    }

    // ADMIN : Seule restriction - ne peut démarrer que les réunions qu'il a créées
    if (meeting.createdBy.id !== user?.id) {
      console.log('❌ Permission refusée - Admin ne peut démarrer que ses propres réunions');
      alert('En tant qu\'administrateur, vous ne pouvez démarrer que les réunions que vous avez créées.');
      return;
    }

    if (meeting.status !== 'PLANNED') {
      console.log('❌ Statut incorrect:', meeting.status);
      alert(`Cette réunion ne peut pas être démarrée (statut: ${meeting.status})`);
      return;
    }

    try {
      console.log('🟡 Envoi requête API...');
      
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      setMeetings(prev => prev.map(m => 
        m.id === meetingId ? { ...m, status: 'IN_PROGRESS' } : m
      ));

      console.log('✅ Réunion démarrée avec succès, redirection...');
      router.push(`/reunions/${meetingId}/live`);
      
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      alert(`Erreur lors du démarrage de la réunion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [meetings, user, setMeetings, router]);

  const handleCreateMeeting = useCallback(() => {
    router.push('/reunions/create');
  }, [router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/auth/signin');
  }, [logout, router]);

  // Vérification des permissions ADMIN
  if (!user) {
    return <LoadingState />;
  }

  if (user.role.toLowerCase() !== 'admin') {
  return (
    <div>Accès Administrateur Requis...</div>
  );
}


  return (
  <AdminLayout onLogout={handleLogout}>
    <div className="space-y-8 p-6">
      <div className="flex justify-end">
        <button
          onClick={handleCreateMeeting}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 text-sm shadow-md hover:shadow-lg"
        >
          <PlusIcon className="w-4 h-4" />
          Nouvelle réunion
        </button>
      </div>

      <StatisticsSection statistics={globalStatistics} />
        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative w-full lg:flex-1 lg:max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une réunion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm shadow-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
            <button
              onClick={() => setOrganizerFilter(organizerFilter === 'me' ? 'all' : 'me')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                organizerFilter === 'me' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Mes réunions</span>
            </button>

            <button
              onClick={() => setPinnedFilter(pinnedFilter === 'pinned' ? 'all' : 'pinned')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                pinnedFilter === 'pinned' 
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <PinIcon className={`w-4 h-4 ${pinnedFilter === 'pinned' ? 'text-yellow-600 fill-current' : ''}`} />
              <span>Épinglées</span>
            </button>

            <div className="relative">
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="appearance-none bg-white text-gray-600 border border-gray-200 hover:border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 font-medium text-sm whitespace-nowrap cursor-pointer"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="tomorrow">Demain</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
              <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-gray-600 hover:text-gray-700 transition-all duration-300 font-medium text-sm whitespace-nowrap"
            >
              <ArrowUpDownIcon className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              <span>{sortOrder === 'asc' ? 'Plus anciennes' : 'Plus récentes'}</span>
            </button>

            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap ${
                hasActiveFilters
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  : 'bg-gray-50 text-gray-400 border border-gray-100'
              }`}
            >
              <XIcon className="w-4 h-4" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION PAR ONGLETS */}
        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabCounts={filteredStatistics.tabCounts}
        />

       {/* CONTENU DES RÉUNIONS - CORRECTION IMPORTANTE */}
<MeetingsContent
  isLoading={isLoading}
  error={error}
  meetings={tabFilteredMeetings}
  user={user}
  activeTab={activeTab}
  hasActiveFilters={hasActiveFilters}
  onJoinMeeting={handleJoinMeeting}
  onStartMeeting={handleStartMeeting}
  onReprogramMeeting={handleReprogramMeeting}
  onEditMeeting={handleEditMeeting}
  onRestartMeeting={handleRestartMeeting}
  onRestoreMeeting={handleRestoreMeeting}
  onCancelMeeting={handleCancelMeeting}
  onDeleteMeeting={handleDeleteMeeting}
  onEndMeeting={handleEndMeeting}
  onResetFilters={resetFilters}
  onExportPDF={handleExportPDF}
  onExportRecordings={handleExportRecordings} 
  onTogglePin={handleTogglePin}
  ActionButtonsComponent={AdminActionButtons}
/>

{/* 🔍 DEBUG FINAL - CORRECTION */}
{(() => {
console.log('🔍 [4] Admin page - Passing AdminActionButtons to MeetingsContent:', !!AdminActionButtons);
  return null;
})()}

       
        {/* POPUPS */}
        <ReprogramPopup
          meeting={reprogramPopup.meeting}
          isOpen={reprogramPopup.isOpen}
          onClose={handleCloseReprogramPopup}
          onConfirm={handleConfirmReprogram}
        />

        <EditMeetingPopup
          meeting={editPopup.meeting}
          isOpen={editPopup.isOpen}
          onClose={handleCloseEditPopup}
          onConfirm={handleConfirmEdit}
        />
    </div>


{selectedMeetingForExport && (
  <RecordingManager
    key={selectedMeetingForExport.id}
    meetingId={selectedMeetingForExport.id}
    meetingTitle={selectedMeetingForExport.title}
    isOpen={true}
    onClose={() => setSelectedMeetingForExport(null)}
  />
)}

        </AdminLayout>

  );
}