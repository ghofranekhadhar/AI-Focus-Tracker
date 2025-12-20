'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Calendar, Clock, Filter, Download, Trash2, 
  ChevronLeft, Search, Eye, EyeOff, FileText, 
  AlertCircle, Shield, MessageSquare, CheckCircle,
  Users, X, Archive, MoreVertical, ExternalLink,
  ChevronDown, ChevronUp, RotateCcw, HardDrive,
  BarChart3, RefreshCw, FileSpreadsheet, History,
  User, Building, Server, Database, AlertTriangle,
  Shield as ShieldIcon, Users as UsersIcon, Globe,
  Check, Eye as EyeIcon, Crown
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'MEETING_INVITATION' | 'SYSTEM' | 'MESSAGE' | 'TASK' | 'ANNOUNCEMENT' | 'SECURITY' | 'ADMIN_ALERT';
  isRead: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
  deletedAt?: string;
  sender?: {
    name: string;
    avatar?: string;
    role?: string;
    department?: string;
  };
  meeting?: {
    id: string;
    title: string;
    scheduledTime: string;
    participants: number;
    organizer: {
      id: string;
      name: string;
      role: string;
    };
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    type: 'team' | 'project' | 'client' | 'training' | 'all-hands';
    department?: string;
  };
  scope?: 'personal' | 'team' | 'department' | 'company' | 'system';
  metadata?: {
    affectedUsers?: number;
    systemComponent?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface FilterState {
  type: string;
  date: string;
  status: string;
  department: string;
  scope: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    date: 'all',
    status: 'all',
    department: 'all',
    scope: 'all'
  });

  useEffect(() => {
    loadAdminNotifications();
  }, []);

  const loadAdminNotifications = async () => {
    try {
      setLoading(true);
      
      // Dans une vraie application, vous feriez un appel API comme :
      // const response = await fetch('/api/notifications/admin');
      // const data = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Simulation de données pour admin avec TOUTES les réunions
      const demoData: AdminNotification[] = [
        {
          id: '1',
          title: 'Réunion stratégique Q4 - Département IT',
          message: 'Tous les managers IT sont invités à participer à la réunion stratégique du Q4.',
          type: 'MEETING_INVITATION',
          isRead: false,
          isArchived: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 heure
          sender: {
            name: 'Marie Dubois',
            role: 'Directrice IT',
            department: 'IT'
          },
          meeting: {
            id: 'meet-001',
            title: 'Stratégie Q4 IT',
            scheduledTime: new Date(Date.now() + 86400000 * 2).toISOString(),
            participants: 25,
            organizer: {
              id: 'org1',
              name: 'Marie Dubois',
              role: 'Directrice IT'
            },
            status: 'scheduled',
            type: 'team',
            department: 'IT'
          },
          scope: 'department',
          metadata: {
            affectedUsers: 25,
            priority: 'high'
          }
        },
        {
          id: '2',
          title: 'Performance serveurs critiques',
          message: 'Le serveur principal a atteint 95% d\'utilisation CPU pendant plus de 15 minutes.',
          type: 'ADMIN_ALERT',
          isRead: false,
          isArchived: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes
          sender: {
            name: 'Système de Monitoring',
            role: 'Système'
          },
          scope: 'system',
          metadata: {
            systemComponent: 'server-main-01',
            affectedUsers: 156,
            priority: 'critical'
          }
        },
        {
          id: '3',
          title: 'Réunion annulée - Formation sécurité',
          message: 'La formation sécurité prévue pour demain a été annulée par l\'organisateur.',
          type: 'MEETING_INVITATION',
          isRead: true,
          isArchived: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 heures
          sender: {
            name: 'Jean Martin',
            role: 'Responsable Sécurité',
            department: 'Sécurité'
          },
          meeting: {
            id: 'meet-002',
            title: 'Formation Sécurité',
            scheduledTime: new Date(Date.now() + 86400000).toISOString(),
            participants: 45,
            organizer: {
              id: 'org2',
              name: 'Jean Martin',
              role: 'Responsable Sécurité'
            },
            status: 'cancelled',
            type: 'training',
            department: 'Sécurité'
          },
          scope: 'company'
        },
        {
          id: '4',
          title: 'Nouvel employé - Procédure d\'intégration',
          message: 'Un nouvel employé a rejoint le département Marketing. Veuillez valider la procédure d\'intégration.',
          type: 'ADMIN_ALERT',
          isRead: false,
          isArchived: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 heures
          sender: {
            name: 'Système RH',
            role: 'Ressources Humaines'
          },
          scope: 'department',
          metadata: {
            affectedUsers: 1,
            priority: 'medium'
          }
        },
        {
          id: '5',
          title: 'Réunion en cours - Projet Alpha',
          message: 'La réunion du projet Alpha a commencé il y a 15 minutes. 8 participants sur 12 sont présents.',
          type: 'MEETING_INVITATION',
          isRead: true,
          isArchived: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes
          sender: {
            name: 'Système de Réunions',
            role: 'Système'
          },
          meeting: {
            id: 'meet-003',
            title: 'Réunion Projet Alpha',
            scheduledTime: new Date(Date.now() - 900000).toISOString(),
            participants: 12,
            organizer: {
              id: 'org3',
              name: 'Sophie Martin',
              role: 'Project Manager'
            },
            status: 'in-progress',
            type: 'project',
            department: 'Développement'
          },
          scope: 'team'
        },
        {
          id: '6',
          title: 'Alerte sécurité - Tentative de connexion suspecte',
          message: 'Plusieurs tentatives de connexion suspectes détectées depuis une IP externe.',
          type: 'SECURITY',
          isRead: false,
          isArchived: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes
          sender: {
            name: 'Système de Sécurité',
            role: 'Sécurité'
          },
          scope: 'system',
          metadata: {
            priority: 'critical'
          }
        },
        {
          id: '7',
          title: 'Tâche assignée - Revue budget',
          message: 'Une nouvelle tâche de revue budgétaire a été assignée au département Finance.',
          type: 'TASK',
          isRead: true,
          isArchived: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 jour
          sender: {
            name: 'Pierre Lambert',
            role: 'Directeur Financier',
            department: 'Finance'
          },
          scope: 'department'
        }
      ];
      
      setNotifications(demoData);
    } catch (error) {
      console.error('Erreur chargement notifications admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      date: 'all',
      status: 'all',
      department: 'all',
      scope: 'all'
    });
    setSearch('');
  };

  const softDeleteNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { 
          ...notif, 
          isDeleted: true, 
          deletedAt: new Date().toISOString() 
        } : notif
      )
    );
  };

  const restoreNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { 
          ...notif, 
          isDeleted: false, 
          deletedAt: undefined 
        } : notif
      )
    );
  };

  const permanentlyDelete = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isArchived: true } : notif
      )
    );
  };

  const exportToCSV = () => {
    const activeNotifications = filteredNotifications.filter(n => !n.isDeleted);
    const headers = ['Date', 'Type', 'Titre', 'Message', 'Portée', 'Département', 'Expéditeur', 'Statut', 'Priorité'];
    const csvData = activeNotifications.map(n => [
      new Date(n.createdAt).toLocaleString('fr-FR'),
      getTypeLabel(n.type),
      n.title,
      n.message,
      n.scope || 'N/A',
      n.meeting?.department || n.sender?.department || 'N/A',
      n.sender?.name || 'Système',
      n.isRead ? 'Lu' : 'Non lu',
      n.metadata?.priority || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notifications-admin-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'MEETING_INVITATION': 'Réunion',
      'SYSTEM': 'Système',
      'MESSAGE': 'Message',
      'TASK': 'Tâche',
      'ANNOUNCEMENT': 'Annonce',
      'SECURITY': 'Sécurité',
      'ADMIN_ALERT': 'Alerte Admin'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string, className: string = "w-4 h-4") => {
    const icons: Record<string, React.ReactNode> = {
      'MEETING_INVITATION': <Calendar className={className} />,
      'SYSTEM': <Server className={className} />,
      'MESSAGE': <MessageSquare className={className} />,
      'TASK': <CheckCircle className={className} />,
      'ANNOUNCEMENT': <Bell className={className} />,
      'SECURITY': <ShieldIcon className={className} />,
      'ADMIN_ALERT': <AlertTriangle className={className} />
    };
    return icons[type] || <Bell className={className} />;
  };

  const getScopeIcon = (scope?: string) => {
    const icons: Record<string, React.ReactNode> = {
      'personal': <User className="w-3 h-3" />,
      'team': <Users className="w-3 h-3" />,
      'department': <Building className="w-3 h-3" />,
      'company': <Globe className="w-3 h-3" />,
      'system': <Server className="w-3 h-3" />
    };
    return icons[scope || 'personal'] || <Globe className="w-3 h-3" />;
  };

  const getScopeLabel = (scope?: string) => {
    const labels: Record<string, string> = {
      'personal': 'Personnel',
      'team': 'Équipe',
      'department': 'Département',
      'company': 'Entreprise',
      'system': 'Système'
    };
    return labels[scope || 'personal'] || 'Personnel';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (search && !notification.title.toLowerCase().includes(search.toLowerCase()) &&
          !notification.message.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      if (filters.type !== 'all' && notification.type !== filters.type) {
        return false;
      }
      
      if (filters.status === 'read' && !notification.isRead) return false;
      if (filters.status === 'unread' && notification.isRead) return false;
      if (filters.status === 'deleted' && !notification.isDeleted) return false;
      if (filters.status === 'active' && notification.isDeleted) return false;
      if (filters.status === 'archived' && !notification.isArchived) return false;
      
      if (filters.department !== 'all') {
        const department = notification.meeting?.department || notification.sender?.department;
        if (!department || department !== filters.department) return false;
      }
      
      if (filters.scope !== 'all' && notification.scope !== filters.scope) {
        return false;
      }
      
      const notificationDate = new Date(notification.createdAt);
      const now = new Date();
      
      if (filters.date === 'today') {
        return notificationDate.toDateString() === now.toDateString();
      }
      if (filters.date === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return notificationDate >= weekAgo;
      }
      if (filters.date === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return notificationDate >= monthAgo;
      }
      
      return true;
    }).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, search, filters]);

  const stats = useMemo(() => {
    const total = notifications.length;
    const active = notifications.filter(n => !n.isDeleted && !n.isArchived).length;
    const deleted = notifications.filter(n => n.isDeleted).length;
    const archived = notifications.filter(n => n.isArchived).length;
    const meetings = notifications.filter(n => n.type === 'MEETING_INVITATION' && !n.isDeleted && !n.isArchived).length;
    const unread = notifications.filter(n => !n.isRead && !n.isDeleted && !n.isArchived).length;
    const critical = notifications.filter(n => 
      (n.type === 'SECURITY' || n.type === 'ADMIN_ALERT') && 
      n.metadata?.priority === 'critical' && 
      !n.isDeleted && 
      !n.isArchived
    ).length;
    
    return { total, active, deleted, archived, meetings, unread, critical };
  }, [notifications]);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    notifications.forEach(n => {
      if (n.meeting?.department) depts.add(n.meeting.department);
      if (n.sender?.department) depts.add(n.sender.department);
    });
    return Array.from(depts);
  }, [notifications]);

  const storageUsed = useMemo(() => {
    return Math.round(JSON.stringify(notifications).length / 1024);
  }, [notifications]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Retour Dashboard</span>
              </Link>
            </div>
            
            <button
              onClick={loadAdminNotifications}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Notifications Administrateur</h1>
                <p className="text-gray-600 mt-1">Vue complète de toutes les notifications système et réunions</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {stats.total} notifications système au total
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Tout marquer comme lu</span>
                </button>
                
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Admin */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notifications actives</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.active}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réunions</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.meetings}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critiques</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.critical}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Non lues</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.unread}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <EyeOff className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Admin */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans toutes les notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <Filter className="w-4 h-4" />
                <span>Filtres Admin</span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {(search || Object.values(filters).some(f => f !== 'all')) && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Type</label>
                      <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="all">Tous les types</option>
                        <option value="MEETING_INVITATION">Réunions</option>
                        <option value="SYSTEM">Système</option>
                        <option value="ADMIN_ALERT">Alertes Admin</option>
                        <option value="SECURITY">Sécurité</option>
                        <option value="TASK">Tâches</option>
                        <option value="ANNOUNCEMENT">Annonces</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Portée</label>
                      <select
                        value={filters.scope}
                        onChange={(e) => handleFilterChange('scope', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="all">Toutes portées</option>
                        <option value="personal">Personnel</option>
                        <option value="team">Équipe</option>
                        <option value="department">Département</option>
                        <option value="company">Entreprise</option>
                        <option value="system">Système</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Département</label>
                      <select
                        value={filters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="all">Tous départements</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Statut</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="all">Tous statuts</option>
                        <option value="active">Actives</option>
                        <option value="unread">Non lues</option>
                        <option value="read">Lues</option>
                        <option value="archived">Archivées</option>
                        <option value="deleted">Supprimées</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Notifications List Admin */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Vue Admin - Toutes les notifications</h3>
                  <p className="text-sm text-gray-600">
                    {filteredNotifications.length} résultat{filteredNotifications.length !== 1 ? 's' : ''}
                    {filters.scope !== 'all' && ` • Portée: ${getScopeLabel(filters.scope)}`}
                    {filters.department !== 'all' && ` • Département: ${filters.department}`}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>{storageUsed} KB de données</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-purple-600"></div>
              <p className="text-gray-600 mt-4">Chargement des notifications admin...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Aucune notification trouvée</h3>
              <p className="text-gray-600">
                {search ? 'Aucun résultat ne correspond à votre recherche' : 'Ajustez vos filtres pour voir plus de résultats'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 transition-colors hover:bg-gray-50 ${
                    notification.isDeleted ? 'bg-red-50' : 
                    notification.isArchived ? 'bg-gray-50' :
                    notification.metadata?.priority === 'critical' ? 'bg-red-50/30' :
                    ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${
                        notification.isDeleted ? 'bg-red-100 text-red-600' :
                        notification.isArchived ? 'bg-gray-100 text-gray-600' :
                        notification.type === 'MEETING_INVITATION' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'ADMIN_ALERT' ? 'bg-orange-100 text-orange-600' :
                        notification.type === 'SECURITY' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getTypeIcon(notification.type, "w-5 h-5")}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {notification.title}
                            {notification.isDeleted && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Supprimée
                              </span>
                            )}
                            {notification.isArchived && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Archivée
                              </span>
                            )}
                            {!notification.isRead && !notification.isDeleted && !notification.isArchived && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Non lue
                              </span>
                            )}
                            {notification.metadata?.priority === 'critical' && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Critique
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                          {getTypeLabel(notification.type)}
                        </span>
                        
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded font-medium inline-flex items-center gap-1">
                          {getScopeIcon(notification.scope)}
                          {getScopeLabel(notification.scope)}
                        </span>
                        
                        {notification.meeting?.department && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                            {notification.meeting.department}
                          </span>
                        )}
                        
                        {notification.sender && (
                          <span className="text-xs text-gray-500">
                            De : {notification.sender.name}
                            {notification.sender.role && ` (${notification.sender.role})`}
                          </span>
                        )}
                      </div>
                      
                      {/* Détails de réunion pour Admin */}
                      {notification.meeting && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">Détails de la réunion</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              notification.meeting.status === 'in-progress' ? 'bg-green-100 text-green-700' :
                              notification.meeting.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {notification.meeting.status === 'scheduled' ? 'Planifiée' :
                               notification.meeting.status === 'in-progress' ? 'En cours' :
                               notification.meeting.status === 'completed' ? 'Terminée' : 'Annulée'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Organisateur:</span>
                              <p className="font-medium">{notification.meeting.organizer.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <p className="font-medium">
                                {new Date(notification.meeting.scheduledTime).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Participants:</span>
                              <p className="font-medium">{notification.meeting.participants}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <p className="font-medium capitalize">{notification.meeting.type}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Métadonnées Admin */}
                      {notification.metadata && (
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
                          {notification.metadata.affectedUsers && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <UsersIcon className="w-3 h-3" />
                              {notification.metadata.affectedUsers} utilisateur(s) affecté(s)
                            </span>
                          )}
                          {notification.metadata.systemComponent && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Server className="w-3 h-3" />
                              {notification.metadata.systemComponent}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                        {notification.isDeleted ? (
                          <>
                            <button
                              onClick={() => restoreNotification(notification.id)}
                              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Restaurer</span>
                            </button>
                            <button
                              onClick={() => permanentlyDelete(notification.id)}
                              className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Supprimer définitivement</span>
                            </button>
                          </>
                        ) : notification.isArchived ? (
                          <>
                            <button
                              onClick={() => setNotifications(prev => prev.map(n => 
                                n.id === notification.id ? { ...n, isArchived: false } : n
                              ))}
                              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <Archive className="w-4 h-4" />
                              <span>Désarchiver</span>
                            </button>
                            <button
                              onClick={() => softDeleteNotification(notification.id)}
                              className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Supprimer</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-800"
                              >
                                <EyeIcon className="w-4 h-4" />
                                <span>Marquer comme lu</span>
                              </button>
                            )}
                            <button
                              onClick={() => archiveNotification(notification.id)}
                              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                              <Archive className="w-4 h-4" />
                              <span>Archiver</span>
                            </button>
                            
                            {notification.meeting && (
                              <Link
                                href={`/reunions/admin/${notification.meeting.id}`}
                                className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Gérer la réunion</span>
                              </Link>
                            )}
                            
                            <button
                              onClick={() => softDeleteNotification(notification.id)}
                              className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Supprimer</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Vue Admin</strong> - Accès complet à toutes les notifications système et utilisateurs
                </div>
                <div className="text-xs text-gray-500">
                  Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start space-x-3">
            <ShieldIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-800">
              <p className="font-medium mb-1">Informations Administrateur</p>
              <p>
                Cette page affiche toutes les notifications du système, y compris celles des autres utilisateurs.
                Les actions disponibles dépendent de vos permissions d'administrateur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}