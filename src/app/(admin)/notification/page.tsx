'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Calendar, Clock, Check, Mail, X, ChevronRight, 
  Filter, CheckCircle, AlertCircle, Users, MessageSquare, 
  RefreshCw, Settings, Archive, MoreVertical, ExternalLink,
  Shield, UserPlus, FileText, Zap, ChevronUp, Eye, EyeOff,
  Building, User
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  meeting?: {
    id: string;
    title: string;
    scheduledTime: string;
    participants?: number;
  };
  // AJOUTEZ cette propriété
  meetingId?: string; // ← AJOUTÉ
  // Données admin (optionnelles)
  _adminData?: {
    recipient: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    adminIsParticipant: boolean;
    adminCreatedMeeting: boolean;
    isMeeting: boolean;
    meetingId?: string; // ← AJOUTÉ ICI AUSSI
  };
}

interface SavedNotificationState {
  id: string;
  isRead: boolean;
  isArchived: boolean;
}

const Badge = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}: { 
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    outline: 'bg-transparent text-gray-700 border border-gray-300',
  };
  
  const selectedVariant = variantClasses[variant] || variantClasses.default;

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center ${selectedVariant} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'meetings' | 'archived'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminView, setAdminView] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);

  // Détecter si l'utilisateur est admin
  useEffect(() => {
    if (user) {
      const userIsAdmin = user.role === 'ADMIN';
      setIsAdmin(userIsAdmin);
      // Par défaut, si admin, montrer la vue admin
      setAdminView(userIsAdmin);
    }
  }, [user]);

  // Fetch des notifications - Gère les deux APIs
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Choisir l'API selon la vue
      let apiUrl = '/api/notifications';
      if (adminView && isAdmin) {
        apiUrl = '/api/admin/notifications';
      }
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        // Sauvegarder les stats admin si disponibles
        if (adminView && isAdmin && data._adminStats) {
          setAdminStats(data._adminStats);
        }
        
        // Formatter les notifications
        let formattedNotifications: Notification[] = (data.notifications || []).map((notif: any) => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
          meeting: notif.meeting,
          // Garder les données admin si présentes
          _adminData: notif._adminData
        }));

        // Sauvegarde locale des états
        const savedStates = localStorage.getItem('notificationStates');
        let statesMap = new Map<string, SavedNotificationState>();
        
        if (savedStates) {
          try {
            const states: SavedNotificationState[] = JSON.parse(savedStates);
            states.forEach(state => statesMap.set(state.id, state));
          } catch (error) {
            console.error('Erreur parsing saved states:', error);
          }
        }
        
        // Appliquer les états sauvegardés
        const notificationsWithSavedStates = formattedNotifications.map((notif: Notification) => {
          const savedState = statesMap.get(notif.id);
          if (savedState) {
            return {
              ...notif,
              isRead: savedState.isRead,
            };
          }
          return notif;
        });
        
        // Garder les notifications archivées locales
        const existingArchived = notifications.filter(n => {
          const savedState = statesMap.get(n.id);
          return savedState?.isArchived || false;
        });
        
        const archivedOnlyInClient = existingArchived.filter(
          archivedNotif => !formattedNotifications.some((newN: Notification) => newN.id === archivedNotif.id)
        );
        
        setNotifications([...notificationsWithSavedStates, ...archivedOnlyInClient]);
        
        // Debug
        console.log('📊 Notifications chargées:', {
          total: formattedNotifications.length,
          meetings: formattedNotifications.filter(n => n.meeting).length,
          view: adminView ? 'admin' : 'personnel',
          userRole: user?.role,
          adminStats: data._adminStats
        });
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toggle admin view
  const toggleAdminView = () => {
    if (!isAdmin) return;
    const newAdminView = !adminView;
    console.log('🔄 Changement de vue:', { from: adminView ? 'admin' : 'personnel', to: newAdminView ? 'admin' : 'personnel' });
    setAdminView(newAdminView);
    setSelectedNotifications([]);
    setShowActionMenu(null);
  };

  // Sauvegarder les états locaux
  useEffect(() => {
    if (notifications.length > 0) {
      const modifiedStates: SavedNotificationState[] = notifications.map(n => ({
        id: n.id,
        isRead: n.isRead,
        isArchived: false
      }));
      localStorage.setItem('notificationStates', JSON.stringify(modifiedStates));
    }
  }, [notifications]);

  // Charger les notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, adminView]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Utiliser la bonne API selon le mode
      const apiUrl = adminView && isAdmin
        ? `/api/admin/notifications/${notificationId}/read`
        : `/api/notifications/${notificationId}/read`;
      
      await fetch(apiUrl, { method: 'PUT' });
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const markMultipleAsRead = async (ids: string[]) => {
    try {
      // Utiliser la bonne API selon le mode
      const apiUrl = adminView && isAdmin
        ? '/api/admin/notifications/read-multiple'
        : '/api/notifications/read-multiple';
      
      await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      
      setNotifications(prev =>
        prev.map(notif =>
          ids.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Erreur marquer comme lus:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      
      // Utiliser la bonne API selon le mode
      const apiUrl = adminView && isAdmin
        ? '/api/admin/notifications/read-all'
        : '/api/notifications/read-all';
      
      await fetch(apiUrl, { method: 'PUT' });
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setSelectedNotifications([]);
      
      setTimeout(() => setIsMarkingAll(false), 1000);
    } catch (error) {
      console.error('Erreur marquer tous comme lus:', error);
      setIsMarkingAll(false);
    }
  };

  const archiveNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isArchived: true } : notif
      )
    );
    setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    setShowActionMenu(null);
  };

  const archiveMultiple = (ids: string[]) => {
    setNotifications(prev =>
      prev.map(notif =>
        ids.includes(notif.id) ? { ...notif, isArchived: true } : notif
      )
    );
    setSelectedNotifications([]);
  };

  const unarchiveNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isArchived: false } : notif
      )
    );
    setShowActionMenu(null);
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Utiliser la bonne API selon le mode
      const apiUrl = adminView && isAdmin
        ? `/api/admin/notifications/${notificationId}`
        : `/api/notifications/${notificationId}`;
      
      await fetch(apiUrl, { method: 'DELETE' });
      
      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
      setShowActionMenu(null);
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  const deleteMultiple = async (ids: string[]) => {
    try {
      // Utiliser la bonne API selon le mode
      const apiUrl = adminView && isAdmin
        ? '/api/admin/notifications/delete-multiple'
        : '/api/notifications/delete-multiple';
      
      await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      
      setNotifications(prev =>
        prev.filter(notif => !ids.includes(notif.id))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Erreur suppression multiple:', error);
    }
  };

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };

  // FILTRAGE INTELLIGENT : Différent selon la vue
const filteredNotifications = useMemo(() => {
  let filtered = notifications;
  
  switch (filter) {
    case 'unread':
      filtered = filtered.filter(n => !n.isRead);
      break;
      
    case 'meetings':
      // VUE ADMIN : Toutes les réunions du système
      if (adminView && isAdmin) {
        console.log('🔄 Filtrage admin - réunions système');
        
        // CRITIQUE : Utiliser meetingId OU meeting object
        filtered = notifications.filter(n => {
          // 1. Vérifier si la notification a un meetingId (le plus fiable)
          if (n.meetingId) {
            console.log(`✅ ${n.id} a meetingId:`, n.meetingId);
            return true;
          }
          
          // 2. Vérifier si elle a un objet meeting
          if (n.meeting) {
            console.log(`✅ ${n.id} a un objet meeting`);
            return true;
          }
          
          // 3. Vérifier par le type
          if (n.type?.includes('MEETING')) {
            console.log(`✅ ${n.id} a type MEETING:`, n.type);
            return true;
          }
          
          console.log(`❌ ${n.id} n'est pas une réunion`);
          return false;
        });
        
        console.log(`📊 Résultat: ${filtered.length} réunions trouvées`);
      } 
      // VUE EMPLOYÉ : Seulement ses réunions
      else {
        filtered = notifications.filter(n => 
          n.type?.includes('MEETING') || n.meeting !== null
        );
      }
      break;
      
    default: // 'all'
      break;
  }
  
  return filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}, [notifications, filter, adminView, isAdmin]);



  // Statistiques
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const selectedCount = selectedNotifications.length;

  // Statistiques meetings selon la vue
  const meetingStats = useMemo(() => {
    if (adminView && isAdmin) {
      // En vue admin : toutes les réunions
      const allMeetings = notifications.filter(n => 
        n._adminData?.isMeeting || n.type?.includes('MEETING') || n.meeting
      );
      const userMeetings = allMeetings.filter(n => 
        n._adminData?.adminIsParticipant || n._adminData?.adminCreatedMeeting
      );
      
      return {
        total: allMeetings.length,
        userInvolved: userMeetings.length,
        userNotInvolved: allMeetings.length - userMeetings.length,
      };
    } else {
      // En vue personnelle : seulement les réunions de l'utilisateur
      const userMeetings = notifications.filter(n => 
        n.type?.includes('MEETING') || n.meeting
      );
      
      return {
        total: userMeetings.length,
        userInvolved: userMeetings.length,
        userNotInvolved: 0,
      };
    }
  }, [notifications, adminView, isAdmin]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (notification: Notification) => {
    const isMeeting = notification.type?.includes('MEETING') || notification.meeting;
    
    if (isMeeting) {
      return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
          <Calendar className="w-5 h-5" />
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600">
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  const getColorClass = (color: string, type: 'bg' | 'text'): string => {
    const colorMap: Record<string, Record<string, string>> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
      red: { bg: 'bg-red-50', text: 'text-red-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    };
    return colorMap[color]?.[type] || 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto px-4">
      {/* Header avec breadcrumb et actions */}
      <div className="flex flex-col space-y-4">   
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Centre de notifications</h1>
              {adminView && isAdmin && (
                <Badge variant="secondary" className="ml-2">
                  Vue Administrateur
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              {adminView && isAdmin 
                ? "Vue globale de toutes les notifications système" 
                : "Gérez vos alertes et restez informé en temps réel"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 hover:shadow-sm"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/parametres/notifications"
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
              title="Paramètres"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </Link>
            
            {/* Switch Vue Admin/Personnel */}
            {isAdmin && (
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <span className={`text-sm font-medium ${adminView ? 'text-gray-600' : 'text-blue-600'}`}>
                  Personnel
                </span>
                <button
                  onClick={toggleAdminView}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    adminView ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      adminView ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${adminView ? 'text-blue-600' : 'text-gray-600'}`}>
                  Admin
                </span>
              </div>
            )}
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAll}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium flex items-center gap-2 text-sm transition-all duration-200 shadow-sm hover:shadow disabled:opacity-70"
              >
                {isMarkingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-b-transparent rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Tout marquer comme lu
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total', 
            value: notifications.length, 
            icon: Bell, 
            color: 'blue' 
          },
          { 
            label: 'Non lues', 
            value: unreadCount, 
            icon: Bell, 
            color: 'amber' 
          },
          { 
            label: adminView && isAdmin ? 'Réunions système' : 'Mes réunions', 
            value: meetingStats.total, 
            icon: Calendar, 
            color: 'emerald' 
          },
          { 
            label: adminView && isAdmin ? 'Utilisateurs' : 'Système', 
            value: adminView && adminStats ? adminStats.users : 0, 
            icon: adminView && isAdmin ? Users : AlertCircle, 
            color: 'red' 
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${getColorClass(stat.color, 'bg')} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${getColorClass(stat.color, 'text')}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-4">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            {stat.label.includes('Réunions') && adminView && isAdmin && meetingStats.total > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {meetingStats.userInvolved} avec vous • {meetingStats.userNotInvolved} autres
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Filtres et actions groupées */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Filtres */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Filtres</h3>
              {adminView && isAdmin && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Vue globale
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Toutes', icon: Bell },
                { key: 'unread', label: 'Non lues', icon: Bell },
                { key: 'meetings', label: adminView && isAdmin ? 'Toutes les réunions' : 'Mes réunions', icon: Calendar },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    filter === item.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions groupées */}
        {selectedCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{selectedCount} sélectionné(s)</p>
                  <p className="text-sm text-blue-700">Actions groupées disponibles</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => markMultipleAsRead(selectedNotifications)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Marquer comme lu
                </button>
                <button
                  onClick={() => deleteMultiple(selectedNotifications)}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setSelectedNotifications([])}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des notifications */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {filter === 'all' ? 'Toutes les notifications' :
               filter === 'unread' ? 'Notifications non lues' :
               filter === 'meetings' ? (adminView && isAdmin ? 'Toutes les réunions système' : 'Mes réunions') :
               'Notifications système'}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </span>
              <div className="w-px h-4 bg-gray-200" />
              {filteredNotifications.length > 0 && (
                <button
                  onClick={() => setSelectedNotifications(
                    filteredNotifications.map(n => n.id)
                  )}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tout sélectionner
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-4 font-medium">
              Chargement des notifications...
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Aucune notification
              </h3>
              <p className="text-gray-500 mt-1">
                {adminView && isAdmin && filter === 'meetings'
                  ? 'Aucune réunion dans le système'
                  : 'Vous êtes à jour !'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50/50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50/30' : ''
                } ${selectedNotifications.includes(notification.id) ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  {getNotificationIcon(notification)}
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    {/* En-tête */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {notification.title}
                        </h3>
                        
                        {/* Badges */}
                        {!notification.isRead && (
                          <Badge className="bg-blue-100 text-blue-700">
                            Non lu
                          </Badge>
                        )}
                        
                        {/* Badge admin si en vue admin et notification appartient à un autre utilisateur */}
                        {adminView && isAdmin && notification._adminData && notification._adminData.recipient.email !== user?.email && (
                          <Badge variant="secondary" className="text-xs">
                            Pour: {notification._adminData.recipient.name}
                          </Badge>
                        )}
                        
                        {/* Badge si l'admin ne participe pas à la réunion */}
                        {adminView && isAdmin && notification._adminData && notification._adminData.isMeeting && 
                         !notification._adminData.adminIsParticipant && !notification._adminData.adminCreatedMeeting && (
                          <Badge variant="outline" className="text-xs">
                            Non impliqué
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                        
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Message */}
                    <p className="text-gray-600 mb-4">
                      {notification.message}
                    </p>
                    
                    {/* Informations supplémentaires pour admin */}
                    {adminView && isAdmin && notification._adminData && (
                      <div className="mt-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-3 h-3" />
                          <span>Destinataire: {notification._adminData.recipient.name} ({notification._adminData.recipient.role})</span>
                          {notification._adminData.adminIsParticipant && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">
                              Vous participez
                            </Badge>
                          )}
                          {notification._adminData.adminCreatedMeeting && (
                            <Badge className="bg-green-100 text-green-700 text-xs ml-2">
                              Vous avez créé
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Détails réunion */}
                    {notification.meeting && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {notification.meeting.title}
                            </h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(notification.meeting.scheduledTime).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {new Date(notification.meeting.scheduledTime).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {notification.meeting.participants && notification.meeting.participants > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{notification.meeting.participants} participants</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Link
                            href={`/reunions/${notification.meeting.id}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Voir la réunion
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredNotifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 
                    ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                    : 'Toutes les notifications sont lues'
                  }
                  {adminView && isAdmin && filter === 'meetings' && meetingStats.total > 0 && (
                    <span className="ml-2">
                      • {meetingStats.userInvolved} avec vous • {meetingStats.userNotInvolved} autres
                    </span>
                  )}
                </p>
                {selectedCount > 0 && (
                  <>
                    <div className="w-px h-4 bg-gray-300" />
                    <p className="text-sm text-blue-600 font-medium">
                      {selectedCount} sélectionné(s)
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                >
                  <ChevronUp className="w-4 h-4" />
                  Retour en haut
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pied de page - Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Link 
          href="/notifications/historique"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-sm transition-all duration-200 group block"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Historique des notifications</h4>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Consultez l'historique complet de toutes vos notifications
              </p>
              <span className="text-xs text-blue-600 font-medium">Accéder à l'historique</span>
            </div>
          </div>
        </Link>

        <Link 
          href="/parametres/notifications"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-200 hover:shadow-sm transition-all duration-200 group block"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <Settings className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Paramètres de notification</h4>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Personnalisez vos préférences de notification
              </p>
              <span className="text-xs text-emerald-600 font-medium">Configurer les paramètres</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}