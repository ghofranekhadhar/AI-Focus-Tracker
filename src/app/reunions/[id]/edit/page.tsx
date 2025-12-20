// src/app/reunions/[id]/edit/page.tsx - VERSION CORRIGÉE
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/src/app/contexts/UserContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  duration: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  participants: {
    id: string;
    name: string;
    email: string;
  }[];
  location?: string;
}

export default function EditMeetingPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // Réf pour détecter les clics en dehors du dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const meetingId = params.id as string;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    scheduledTime: '',
    participants: [] as string[],
  });
  
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // ✅ Charger les utilisateurs depuis la base de données
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);
        
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const usersData = await response.json();
        
        if (Array.isArray(usersData)) {
          setUsers(usersData);
        } else {
          throw new Error('Format de données invalide');
        }
        
      } catch (err) {
        console.error('❌ Erreur chargement utilisateurs:', err);
        setUsersError('Impossible de charger la liste des utilisateurs.');
      } finally {
        setUsersLoading(false);
      }
    };

    if (user) {
      loadUsers();
    }
  }, [user]);

  // ✅ Charger les données de la réunion
  useEffect(() => {
    const loadMeeting = async () => {
      if (!user) return;
      
      try {
        setMeetingLoading(true);
        setError(null);
        
        const response = await fetch(`/api/meetings/${meetingId}`);
        
        if (!response.ok) {
          throw new Error('Réunion non trouvée');
        }
        
        const meeting: Meeting = await response.json();
        
        // Vérifier que l'utilisateur est l'organisateur
        if (meeting.createdBy.id !== user.id) {
          setError('Vous n\'êtes pas autorisé à modifier cette réunion');
          return;
        }

        // Formater la date pour l'input datetime-local
        const scheduledTime = new Date(meeting.scheduledTime);
        const timeString = scheduledTime.toISOString().slice(0, 16);

        setFormData({
          title: meeting.title,
          description: meeting.description || '',
          duration: meeting.duration,
          scheduledTime: timeString,
          participants: meeting.participants.map(p => p.email).filter(email => email !== user.email),
        });
        
      } catch (err) {
        console.error('Erreur chargement réunion:', err);
        setError('Erreur lors du chargement de la réunion');
      } finally {
        setMeetingLoading(false);
      }
    };

    if (user) {
      loadMeeting();
    }
  }, [user, meetingId]);

  // ✅ Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ✅ Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  // ✅ Ajouter un participant depuis la liste déroulante
  const addParticipantFromDropdown = (email: string) => {
    if (formData.participants.includes(email)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, email]
    }));
    setSelectedUserEmail('');
    setUserSearchTerm('');
    setShowUserDropdown(false);
  };

  // ✅ Gérer la touche Entrée
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showUserDropdown && filteredUsers.length > 0) {
        addParticipantFromDropdown(filteredUsers[0].email);
      }
    }
  };

  // ✅ Formater l'affichage de la date
  const formatDisplayDate = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // ✅ Calculer l'heure de fin
  const calculateEndTime = (startDateTime: string, duration: number) => {
    if (!startDateTime) return '-';
    
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    return endDate.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const removeParticipant = (email: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (!user) {
        setError('Vous devez être connecté');
        return;
      }

      // Validation
      if (!formData.title.trim()) {
        setError('Veuillez remplir le titre de la réunion');
        return;
      }

      // Préparer les données - NE PAS envoyer scheduledTime modifié
      const meetingData = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        participants: [...new Set([user.email, ...formData.participants])],
      };

      // Appel API pour modification
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erreur lors de la modification');
      }

      setSuccessMessage('Réunion modifiée avec succès !');
      
      // Redirection après délai
      setTimeout(() => {
        router.push(`/reunions/${meetingId}`);
        router.refresh();
      }, 2000);
      
    } catch (err) {
      console.error('Erreur modification:', err);
      setError('Erreur lors de la modification: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Options de durée
  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 heure' },
    { value: 90, label: '1 heure 30' },
    { value: 120, label: '2 heures' },
    { value: 180, label: '3 heures' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">Veuillez vous connecter</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">{error}</p>
          <Link href="/reunions" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Retour aux réunions
          </Link>
        </div>
      </div>
    );
  }

  if (meetingLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement de la réunion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/reunions/${meetingId}`}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour aux détails
          </Link>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Modifier la Réunion
              </h1>
              <p className="text-slate-600 mt-1">Modifiez les détails de votre réunion</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong className="text-lg">Erreur</strong>
              </div>
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong className="text-lg">Succès</strong>
              </div>
              <p>{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Titre de la réunion *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Ex: Réunion de planning hebdomadaire"
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                  placeholder="Décrivez l'objectif de cette réunion..."
                  disabled={loading}
                />
              </div>

              {/* Date et heure + Durée */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date et heure - NON MODIFIABLE */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Date et heure
                  </label>
                  <div className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-100/50 text-slate-600">
                    {formatDisplayDate(formData.scheduledTime)}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">
                    📅 Cette information n'est pas modifiable
                  </p>
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Durée *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration: parseInt(e.target.value) 
                    }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    disabled={loading}
                  >
                    {durationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-slate-500 mt-2 font-medium">
                    🕒 Fin: {calculateEndTime(formData.scheduledTime, formData.duration)}
                  </p>
                </div>
              </div>

              {/* ✅ SECTION PARTICIPANTS AMÉLIORÉE */}
              <div ref={dropdownRef}>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Participants
                </label>
              
                {/* ✅ Sélection d'utilisateurs */}
                <div className="relative mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Inviter des participants
                  </label>
                  
                  {usersError && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {usersError}
                      </p>
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setShowUserDropdown(true);
                        setSelectedUserEmail(e.target.value);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      onKeyPress={handleEmailKeyPress}
                      placeholder="Rechercher un utilisateur par nom ou email..."
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm pr-12 ${
                        usersError 
                          ? 'border-amber-300 bg-amber-50 focus:ring-amber-500/30 focus:border-amber-500' 
                          : 'border-slate-300 bg-white/50 focus:ring-blue-500/30 focus:border-blue-500'
                      }`}
                      disabled={loading || usersLoading || !!usersError}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {usersLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* ✅ DROPDOWN */}
                  {showUserDropdown && !usersError && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {usersLoading ? (
                        <div className="px-4 py-3 text-center text-slate-500">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-sm mt-2">Chargement des utilisateurs...</p>
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((userItem) => (
                          <button
                            key={userItem.id}
                            type="button"
                            onClick={() => addParticipantFromDropdown(userItem.email)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 focus:outline-none focus:bg-slate-100"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                {userItem.name?.charAt(0) || userItem.email.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {userItem.name || 'Utilisateur sans nom'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {userItem.email}
                                </p>
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                userItem.role === 'ADMIN' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {userItem.role}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-slate-500">
                          <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm">Aucun utilisateur trouvé</p>
                          {userSearchTerm && (
                            <p className="text-xs mt-1">Aucun résultat pour "{userSearchTerm}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Liste des participants */}
                <div className="space-y-3 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-white/50">
                  {formData.participants.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-slate-500 text-sm">
                        Aucun participant supplémentaire. Vous êtes automatiquement inclus en tant qu'organisateur.
                      </p>
                    </div>
                  ) : (
                    formData.participants.map((participant, index) => {
                      const userInfo = users.find(u => u.email === participant);
                      return (
                        <div key={index} className="flex justify-between items-center bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                              userInfo 
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-600' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-600'
                            }`}>
                              {userInfo ? userInfo.name?.charAt(0) || userInfo.email.charAt(0) : participant.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-slate-900 block">
                                {userInfo ? userInfo.name || 'Utilisateur sans nom' : participant.split('@')[0]}
                              </span>
                              <span className="text-xs text-slate-500">
                                {participant}
                                {!userInfo && <span className="ml-2 text-orange-600">(Nouvel utilisateur)</span>}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeParticipant(participant)}
                            disabled={loading}
                            className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            title="Supprimer ce participant"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Indicateur du nombre de participants */}
                {formData.participants.length > 0 && (
                  <p className="text-sm text-slate-600 mt-3 font-medium">
                    👥 {formData.participants.length} participant(s) supplémentaire(s) + vous-même
                  </p>
                )}
              </div>

              {/* Résumé de la réunion */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center text-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Résumé de la réunion
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Quand:</span>
                      <span className="text-slate-900">{formatDisplayDate(formData.scheduledTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Durée:</span>
                      <span className="text-slate-900">{formData.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Fin prévue:</span>
                      <span className="text-slate-900">{calculateEndTime(formData.scheduledTime, formData.duration)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Organisateur:</span>
                      <span className="text-slate-900">{user.name || user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Participants totaux:</span>
                      <span className="text-slate-900 font-semibold">{formData.participants.length + 1} personne(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-slate-200">
              <Link
                href={`/reunions/${meetingId}`}
                className="px-8 py-3 text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold flex items-center space-x-2 ${
                  loading
                    ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Modification en cours...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Modifier la réunion</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}