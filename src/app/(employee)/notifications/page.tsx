'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Calendar, Clock, Check, Mail, X, ChevronRight, 
  Filter, CheckCircle, AlertCircle, Users, MessageSquare, 
  RefreshCw, Settings, Archive, MoreVertical, ExternalLink,
  Shield, UserPlus, FileText, Zap, ChevronUp
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'MEETING_INVITATION' | 'SYSTEM' | 'MESSAGE' | 'TASK' | 'ANNOUNCEMENT' | 'SECURITY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  sender?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  meeting?: {
    id: string;
    title: string;
    scheduledTime: string;
    participants: number;
    duration?: number;
    location?: string;
  };
  actionUrl?: string;
  actionLabel?: string;
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
  const [filter, setFilter] = useState<'all' | 'unread' | 'meetings' | 'system' | 'security' | 'archived'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const modifiedStates: SavedNotificationState[] = notifications.map(n => ({
        id: n.id,
        isRead: n.isRead,
        isArchived: n.isArchived
      }));
      localStorage.setItem('notificationStates', JSON.stringify(modifiedStates));
    }
  }, [notifications]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      
      if (response.ok) {
        const data = await response.json();
        const newNotifications: Notification[] = data.notifications || [];
        
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
        
        const notificationsWithSavedStates = newNotifications.map((notif: Notification) => {
          const savedState = statesMap.get(notif.id);
          if (savedState) {
            return {
              ...notif,
              isRead: savedState.isRead,
              isArchived: savedState.isArchived
            };
          }
          return notif;
        });
        
        const existingArchived = notifications.filter(n => n.isArchived);
        const archivedOnlyInClient = existingArchived.filter(
          archivedNotif => !newNotifications.some((newN: Notification) => newN.id === archivedNotif.id)
        );
        
        setNotifications([...notificationsWithSavedStates, ...archivedOnlyInClient]);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
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
      await fetch('/api/notifications/read-multiple', {
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
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      
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

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead && !n.isArchived);
        break;
      case 'meetings':
        filtered = filtered.filter(n => n.type === 'MEETING_INVITATION' && !n.isArchived);
        break;
      case 'system':
        filtered = filtered.filter(n => n.type === 'SYSTEM' && !n.isArchived);
        break;
      case 'security':
        filtered = filtered.filter(n => n.type === 'SECURITY' && !n.isArchived);
        break;
      case 'archived':
        filtered = filtered.filter(n => n.isArchived);
        break;
      default: // 'all'
        filtered = filtered.filter(n => !n.isArchived);
        break;
    }
    
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return filtered.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const urgentCount = notifications.filter(n => n.priority === 'URGENT' && !n.isRead && !n.isArchived).length;
  const selectedCount = selectedNotifications.length;
  const archivedCount = notifications.filter(n => n.isArchived).length;

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

  const getNotificationIcon = (type: string, priority: string) => {
    const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      MEETING_INVITATION: Calendar,
      SYSTEM: AlertCircle,
      MESSAGE: MessageSquare,
      TASK: CheckCircle,
      ANNOUNCEMENT: Bell,
      SECURITY: Shield,
    };
    
    const Icon = IconMap[type] || Mail;

    const colorClasses = {
      URGENT: 'text-red-600 bg-red-50',
      HIGH: 'text-orange-600 bg-orange-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      LOW: 'text-gray-600 bg-gray-50',
    };
    
    const colorClass = colorClasses[priority as keyof typeof colorClasses] || 'text-gray-600 bg-gray-50';

    return (
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfigs: Record<string, { label: string; className: string }> = {
      URGENT: { 
        label: 'Urgent', 
        className: 'bg-red-50 text-red-700 border-red-200' 
      },
      HIGH: { 
        label: 'Élevée', 
        className: 'bg-orange-50 text-orange-700 border-orange-200' 
      },
      MEDIUM: { 
        label: 'Moyenne', 
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200' 
      },
      LOW: { 
        label: 'Basse', 
        className: 'bg-gray-50 text-gray-700 border-gray-200' 
      },
    };

    const config = priorityConfigs[priority] || { 
      label: 'Inconnu', 
      className: 'bg-gray-100 text-gray-700 border-gray-300' 
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
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
              {urgentCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">Gérez vos alertes et restez informé en temps réel</p>
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
          { label: 'Total', value: notifications.filter(n => !n.isArchived).length, icon: Bell, color: 'blue' },
          { label: 'Non lues', value: unreadCount, icon: Bell, color: 'amber' },
          { label: 'Réunions', value: notifications.filter(n => n.type === 'MEETING_INVITATION' && !n.isArchived).length, icon: Calendar, color: 'emerald' },
          { label: 'Système', value: urgentCount, icon: AlertCircle, color: 'red' },
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
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Toutes', icon: Bell },
                { key: 'unread', label: 'Non lues', icon: Bell },
                { key: 'meetings', label: 'Réunions', icon: Calendar },
                { key: 'system', label: 'Système', icon: AlertCircle },
                { key: 'archived', label: 'Archivées', icon: Archive },
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
                  onClick={() => archiveMultiple(selectedNotifications)}
                  className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                >
                  <Archive className="w-3 h-3" />
                  Archiver
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

      {/* Liste des notifications - VERSION SIMPLIFIÉE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {filter === 'all' ? 'Toutes les notifications' :
               filter === 'unread' ? 'Notifications non lues' :
               filter === 'meetings' ? 'Invitations aux réunions' :
               filter === 'archived' ? 'Notifications archivées' :
               'Notifications système'}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </span>
              <div className="w-px h-4 bg-gray-200" />
              {filter !== 'archived' && filteredNotifications.length > 0 && (
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
            <p className="text-gray-500 mt-4 font-medium">Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              {filter === 'archived' ? (
                <Archive className="w-10 h-10 text-gray-400" />
              ) : (
                <Bell className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {filter === 'archived' 
                  ? 'Aucune notification archivée' 
                  : 'Aucune notification'}
              </h3>
              <p className="text-gray-500 mt-1">
                {filter === 'archived' 
                  ? 'Les notifications archivées apparaîtront ici' 
                  : 'Vous êtes à jour !'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
          <div className="divide-y divide-gray-100">
  {filteredNotifications.map((notification) => (
    <div
      key={notification.id}
      className={`p-4 hover:bg-gray-50/50 transition-colors duration-150 ${
        !notification.isRead && !notification.isArchived ? 'bg-blue-50/30' : ''
      } ${selectedNotifications.includes(notification.id) ? 'bg-blue-50' : ''} ${
        notification.isArchived ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Sélection */}
        <div className="pt-2">
          <input
            type="checkbox"
            checked={selectedNotifications.includes(notification.id)}
            onChange={() => toggleSelectNotification(notification.id)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>

        {/* Icône simplifiée */}
        <div className="relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            notification.type === 'MEETING_INVITATION' ? 'bg-blue-100 text-blue-600' :
            notification.type === 'SECURITY' ? 'bg-red-100 text-red-600' :
            notification.type === 'SYSTEM' ? 'bg-yellow-100 text-yellow-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {notification.type === 'MEETING_INVITATION' ? (
              <Calendar className="w-4 h-4" />
            ) : notification.type === 'SECURITY' ? (
              <Shield className="w-4 h-4" />
            ) : notification.type === 'SYSTEM' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>
          {!notification.isRead && !notification.isArchived && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white"></div>
          )}
        </div>

        {/* Contenu simplifié */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Ligne supérieure : Expéditeur + Date */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {notification.sender && (
                <span className="text-sm font-medium text-gray-900">
                  {notification.sender.name}
                </span>
              )}
              {notification.priority === 'URGENT' && (
                <Badge variant="destructive" className="py-0.5">
                  Urgent
                </Badge>
              )}
              {!notification.isRead && !notification.isArchived && (
                <Badge className="bg-blue-100 text-blue-700">
                  Non lu
                </Badge>
              )}
            </div>
            
            {/* Bouton des trois points avec menu intégré */}
            <div className="relative flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatDate(notification.createdAt)}
              </span>
              
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionMenu(showActionMenu === notification.id ? null : notification.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {/* Menu d'actions */}
                {showActionMenu === notification.id && (
                  <>
                    {/* Overlay pour fermer le menu en cliquant ailleurs */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowActionMenu(null)}
                    />
                    
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      {!notification.isArchived ? (
                        <>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Marquer comme lu
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveNotification(notification.id);
                              setShowActionMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            Archiver
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                              setShowActionMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Supprimer
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unarchiveNotification(notification.id);
                              setShowActionMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            Désarchiver
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                              setShowActionMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Supprimer définitivement
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Titre et message */}
          <div>
            <h4 className="font-semibold text-gray-900 text-base mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600">
              {notification.message}
            </p>
          </div>

          {/* Actions spécifiques */}
          {notification.meeting && !notification.isArchived && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.meeting.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(notification.meeting.scheduledTime).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/reunions/${notification.meeting.id}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                >
                  Voir détails
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {notification.actionUrl && !notification.meeting && !notification.isArchived && (
            <div className="pt-2">
              <Link
                href={notification.actionUrl}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 group"
              >
                {notification.actionLabel || 'Voir plus'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
          </div>
        )}

        {filteredNotifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  {filter === 'archived' 
                    ? `${archivedCount} notification${archivedCount > 1 ? 's' : ''} archivée${archivedCount > 1 ? 's' : ''}`
                    : unreadCount > 0 
                      ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                      : 'Toutes les notifications sont lues'
                  }
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