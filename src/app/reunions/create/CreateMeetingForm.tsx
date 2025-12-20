'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ParticipantMeetingsList from '../components/ParticipantMeetingsList';
import { 
  CalendarIcon, 
  AlertCircleIcon,
  CheckIcon,
  X as XIcon,
  Minus,
  Plus
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Meeting {
  id: string;
  title: string;
  scheduledTime: string;
  duration: number;
  participants: string[];
  creator?: {
    name: string;
    email: string;
  };
}

interface CreateMeetingFormProps {
  user: any;
  onClose: () => void;
}

export default function CreateMeetingForm({ user, onClose }: CreateMeetingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictingMeeting, setConflictingMeeting] = useState<Meeting | null>(null);
  const [conflictingParticipants, setConflictingParticipants] = useState<string[]>([]);
  const conflictCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const defaultDate = new Date();
  defaultDate.setHours(14, 0, 0, 0);
  const defaultDateTime = defaultDate.toISOString().slice(0, 16);

  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: defaultDateTime,
    participants: [] as string[]
  });
  
  const predefinedDurations = [
    { label: '1h', value: 60 },
    { label: '1h30', value: 90 },
    { label: '2h', value: 120 },
    { label: '2h30', value: 150 },
    { label: '3h', value: 180 }
  ];

  const totalDuration = durationHours * 60 + durationMinutes;

  const checkForConflicts = useCallback(async () => {
    if (!formData.scheduledTime || formData.participants.length === 0) {
      setConflictError(null);
      setConflictingMeeting(null);
      setConflictingParticipants([]);
      return { hasConflict: false };
    }
    
    try {
      setCheckingConflicts(true);
      
      const allParticipants = [...new Set([user!.email, ...formData.participants])];
      const scheduledDate = new Date(formData.scheduledTime);
      
      const response = await fetch('/api/meetings/check-conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledTime: scheduledDate.toISOString(),
          duration: totalDuration,
          participants: allParticipants,
          excludeMeetingId: null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des conflits');
      }
      
      const result = await response.json();
      
      if (result.hasConflict) {
        const participantNames = result.conflictingParticipants.map((email: string) => {
          const user = users.find(u => u.email === email);
          return user?.name || email;
        }).join(', ');
        
        setConflictError(`Conflit de planning détecté pour : ${participantNames}`);
        setConflictingParticipants(result.conflictingParticipants);
        
        if (result.conflictingMeeting) {
          setConflictingMeeting(result.conflictingMeeting);
        }
      } else {
        setConflictError(null);
        setConflictingMeeting(null);
        setConflictingParticipants([]);
      }
      
      return result;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setConflictError('Impossible de vérifier les disponibilités');
      return { hasConflict: false };
    } finally {
      setCheckingConflicts(false);
    }
  }, [formData.scheduledTime, formData.participants, totalDuration, user, users]);

  const handleCloseConflictModal = () => {
    setShowConflictModal(false);
    setConflictError(null);
    setConflictingMeeting(null);
    setConflictingParticipants([]);
  };

  const handleRemoveConflictingParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => !conflictingParticipants.includes(p))
    }));
    setShowConflictModal(false);
    setConflictError(null);
    setConflictingMeeting(null);
    setConflictingParticipants([]);
  };

  useEffect(() => {
    if (conflictCheckTimeout.current) {
      clearTimeout(conflictCheckTimeout.current);
    }
    
    if (formData.scheduledTime && formData.participants.length > 0) {
      conflictCheckTimeout.current = setTimeout(() => {
        checkForConflicts();
      }, 1000);
    }
    
    return () => {
      if (conflictCheckTimeout.current) {
        clearTimeout(conflictCheckTimeout.current);
      }
    };
  }, [formData.scheduledTime, formData.participants, totalDuration, checkForConflicts]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      duration: totalDuration
    }));
  }, [totalDuration]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
        
        const usersData = await response.json();
        if (Array.isArray(usersData)) {
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    if (user) {
      loadUsers();
    }
  }, [user]);

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

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const addParticipantFromDropdown = (email: string) => {
    if (formData.participants.includes(email) || email === user?.email) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, email]
    }));
    setUserSearchTerm('');
    setShowUserDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflictError(null);
    
    try {
      if (!formData.title.trim()) {
        setError('Veuillez remplir le titre de la réunion');
        setLoading(false);
        return;
      }

      if (!formData.scheduledTime) {
        setError('Veuillez sélectionner une date et heure');
        setLoading(false);
        return;
      }

      if (totalDuration < 5) {
        setError('La durée minimum est de 5 minutes');
        setLoading(false);
        return;
      }

      if (totalDuration > 480) {
        setError('La durée maximum est de 480 minutes (8 heures)');
        setLoading(false);
        return;
      }

      const conflictCheck = await checkForConflicts();
      if (conflictCheck.hasConflict) {
        setShowConflictModal(true);
        setLoading(false);
        return;
      }

      const allParticipants = [...new Set([user!.email, ...formData.participants])];

      const meetingData = {
        title: formData.title,
        description: formData.description,
        scheduledTime: new Date(formData.scheduledTime).toISOString(),
        duration: totalDuration,
        participants: allParticipants,
        creatorEmail: user!.email
      };

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      setSuccessMessage(`Réunion "${formData.title}" créée avec succès !`);

      setTimeout(() => {
        const userRole = String(user?.role).toLowerCase();
        const isAdmin = userRole === 'admin';
        router.push(isAdmin ? '/reunions/admin' : '/reunions');
      }, 2000);
      
    } catch (err) {
      setError('Erreur lors de la création: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const removeParticipant = (email: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
    
    setConflictingParticipants(prev => prev.filter(p => p !== email));
  };

  const formatDisplayDate = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const calculateEndTime = (startDateTime: string, duration: number) => {
    if (!startDateTime) return '-';
    
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    return endDate.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number): string => {
    if (!minutes || minutes < 1) return '--';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const handleHourChange = (hours: number) => {
    if (hours >= 0 && hours <= 8) {
      setDurationHours(hours);
    }
  };

  const handleMinuteChange = (minutes: number) => {
    if (minutes >= 0 && minutes <= 55 && minutes % 5 === 0) {
      setDurationMinutes(minutes);
    }
  };

  const applyPredefinedDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    setDurationHours(hours);
    setDurationMinutes(mins);
  };

  return (
    <>
      {/* Header du modal */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Nouvelle réunion</h2>
          <p className="text-sm text-gray-500 mt-1">Planifiez une nouvelle réunion avec vos collaborateurs</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <XIcon size={20} className="text-gray-500" />
        </button>
      </div>
      
      {/* Contenu du formulaire */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircleIcon className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {conflictError && !showConflictModal && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <AlertCircleIcon className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-blue-800 font-medium">{conflictError}</span>
                <div className="mt-2 text-sm text-gray-600">
                  La réunion ne pourra pas être créée tant que ce conflit n'est pas résolu.
                </div>
              </div>
              {checkingConflicts && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de la réunion *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Revue de projet Q4"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Objectifs de la réunion, points à aborder..."
                disabled={loading}
              />
            </div>

            {/* Date et Durée alignées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date - Cadré */}
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date et heure de début *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                      disabled={loading}
                    />
                  </div>

                  {/* Affichage date formatée */}
                  <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r p-3">
                    <div className="flex items-start">
                      <div className="mr-3">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Réunion programmée</div>
                        <div className="flex flex-col">
                          <div className="text-s font-medium text-gray-800">
                            {formatDisplayDate(formData.scheduledTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Durée - Cadré */}
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée de la réunion *
                    </label>
                    
                    {/* Sélecteur aligné */}
                    <div className="flex items-center space-x-3">
                      {/* Heures */}
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 mb-1">Heures</div>
                        <div className="flex border border-gray-300 rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleHourChange(durationHours - 1)}
                            disabled={durationHours === 0}
                            className="px-2 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 text-center py-2">
                            <span className="text-lg font-medium text-gray-800">{durationHours}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleHourChange(durationHours + 1)}
                            disabled={durationHours === 8}
                            className="px-2 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Minutes */}
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 mb-1">Minutes</div>
                        <div className="flex border border-gray-300 rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(durationMinutes - 15)}
                            disabled={durationMinutes === 0}
                            className="px-2 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 text-center py-2">
                            <span className="text-lg font-medium text-gray-800">
                              {durationMinutes.toString().padStart(2, '0')}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(durationMinutes + 15)}
                            disabled={durationMinutes === 45}
                            className="px-2 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Durée totale */}
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Durée</div>
                        <div className="text-center px-3 py-2 bg-blue-50 rounded-md">
                          <span className="font-medium text-blue-700">
                            {formatDuration(totalDuration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Durées courantes */}
                  <div>
                    <div className="text-xs text-gray-600 mb-2">Durées courantes</div>
                    <div className="grid grid-cols-5 gap-2">
                      {predefinedDurations.map((duration) => (
                        <button
                          key={duration.value}
                          type="button"
                          onClick={() => applyPredefinedDuration(duration.value)}
                          className={`px-2 py-2 text-sm rounded-md transition-colors ${
                            totalDuration === duration.value
                              ? 'bg-blue-800 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {duration.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participants
              </label>
              
              <div className="relative mb-3">
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="Rechercher un collaborateur..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || usersLoading}
                />
                
                {/* Dropdown utilisateurs */}
                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {usersLoading ? (
                      <div className="p-3 text-center text-gray-500">
                        Chargement...
                      </div>
                    ) : filteredUsers.filter(u => u.email !== user?.email).length > 0 ? (
                      filteredUsers
                        .filter(u => u.email !== user?.email)
                        .map((userItem) => (
                          <div
                            key={userItem.id}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
                            onClick={() => {
                              if (!formData.participants.includes(userItem.email) && userItem.email !== user?.email) {
                                setFormData(prev => ({
                                  ...prev,
                                  participants: [...prev.participants, userItem.email]
                                }));
                              }
                              setUserSearchTerm('');
                              setShowUserDropdown(false);
                            }}
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white text-sm font-medium">
                                {userItem.name?.charAt(0) || userItem.email.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {userItem.name || userItem.email}
                                </div>
                                <div className="text-xs text-blue-600">{userItem.email}</div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        Aucun utilisateur trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Liste des participants */}
              <div className="space-y-2">
                {formData.participants
                  .filter(p => p !== user?.email)
                  .map((participant) => {
                    const userInfo = users.find(u => u.email === participant);
                    const isInConflict = conflictingParticipants.includes(participant);
                    
                    return (
                      <div key={participant} className={`flex items-center justify-between p-3 rounded-md ${
                        isInConflict ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                      }`}>
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-medium ${
                            isInConflict ? 'bg-red-600' : 'bg-blue-600'
                          }`}>
                            {userInfo ? userInfo.name?.charAt(0) || userInfo.email.charAt(0) : participant.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {userInfo ? userInfo.name || participant : participant}
                              {isInConflict && (
                                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                                  Conflit
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-blue-600">{participant}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant)}
                          className="text-blue-400 hover:text-blue-700 transition-colors p-1"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Résumé */}
            <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Résumé</h3>
              <div className="flex flex-col md:flex-row md:items-start">
                {/* Colonne gauche */}
                <div className="flex-1 space-y-3 pr-0 md:pr-8">
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-sm">Date :</span>
                    <span className="text-sm font-medium text-gray-800 text-right">
                      {formatDisplayDate(formData.scheduledTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-sm">Durée :</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatDuration(totalDuration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-sm">Heure de fin :</span>
                    <span className="text-sm font-medium text-gray-800">
                      {calculateEndTime(formData.scheduledTime, totalDuration)}
                    </span>
                  </div>
                </div>
                
                {/* Ligne de séparation verticale - Desktop uniquement */}
                <div className="hidden md:block mx-8">
                  <div className="w-px h-20 bg-gray-300"></div>
                </div>
                
                {/* Ligne de séparation horizontale - Mobile uniquement */}
                <div className="md:hidden w-full h-px bg-gray-300 my-4"></div>
                
                {/* Colonne droite */}
                <div className="flex-1 space-y-3 pl-0 md:pl-8">
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-sm">Organisateur :</span>
                    <span className="text-sm font-medium text-gray-800">
                      {user.name || user.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-sm">Participants :</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formData.participants.filter(p => p !== user?.email).length + 1} personne(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || totalDuration < 5 || totalDuration > 480}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  'Créer la réunion'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Section des réunions des participants */}
      {formData.participants.length > 0 && (
        <div className="mt-6 bg-white border-t border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Disponibilités des participants
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.participants.map(participant => {
              const userInfo = users.find(u => u.email === participant);
              const isInConflict = conflictingParticipants.includes(participant);
              
              return (
                <div 
                  key={participant} 
                  className={`border rounded-md p-4 ${
                    isInConflict 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-medium ${
                      isInConflict 
                        ? 'bg-red-600' 
                        : 'bg-blue-600'
                    }`}>
                      {userInfo ? userInfo.name?.charAt(0) || userInfo.email.charAt(0) : participant.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900">
                        {userInfo ? userInfo.name || participant : participant}
                        {isInConflict && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                            Conflit
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{participant}</div>
                    </div>
                  </div>
                  <ParticipantMeetingsList 
                    participantEmail={participant}
                    selectedDate={formData.scheduledTime}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modale de succès */}
      {successMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 max-w-md w-full animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Réunion créée</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full animate-[progress_2s_linear_forwards]"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de conflit */}
     {showConflictModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-lg w-full">
      {/* Header sobre */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
            <AlertCircleIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Conflit d'horaires</h3>
            <p className="text-sm text-gray-500 mt-0.5">Un ou plusieurs participants sont indisponibles</p>
          </div>
        </div>
      </div>

      {/* Contenu structuré */}
      <div className="p-6">
        {/* Participants concernés - Liste sobre */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Participants concernés</h4>
          <div className="space-y-3">
            {conflictingParticipants.map((participant, index) => {
              const userInfo = users.find(u => u.email === participant);
              return (
                <div key={participant} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-700 font-medium text-sm">
                      {userInfo ? userInfo.name?.charAt(0) || userInfo.email.charAt(0) : participant.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {userInfo ? userInfo.name || participant : participant}
                        </span>
                        <span className="text-xs text-red-600 font-medium">Indisponible</span>
                      </div>
                      <div className="text-xs text-gray-500">{participant}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">#{index + 1}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Réunion existante - Cartouche info */}
        {conflictingMeeting && (
          <div className="mb-6 p-4 bg-blue-50/50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">Réunion existante</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Titre</div>
                <div className="text-sm font-medium text-gray-900">{conflictingMeeting.title}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Date</div>
                <div className="text-sm font-medium text-gray-900">{formatDisplayDate(conflictingMeeting.scheduledTime)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Durée</div>
                <div className="text-sm font-medium text-gray-900">{formatDuration(conflictingMeeting.duration)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Participants</div>
                <div className="text-sm font-medium text-gray-900">{conflictingMeeting.participants?.length || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Ligne séparatrice */}
        <div className="my-6 border-t border-gray-100"></div>

        {/* Boutons d'action - Style sobre */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCloseConflictModal}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[140px]"
          >
            Modifier les détails
          </button>
          <button
            type="button"
            onClick={handleRemoveConflictingParticipants}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors min-w-[140px]"
          >
            Exclure participants
          </button>
        </div>

        {/* Note discrète */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Sélectionnez un créneau différent ou ajustez la liste des participants pour créer la réunion.
          </p>
        </div>
      </div>
    </div>
  </div>
)}
    </>
  );
}