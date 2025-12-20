import { useState, useEffect } from 'react';
import { Meeting, User } from '../types/meeting';

interface EditMeetingPopupProps {
  meeting: any | null;  // Utilisez temporairement 'any'
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedData: any) => void;
}

export const EditMeetingPopup: React.FC<EditMeetingPopupProps> = ({
  meeting,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    participants: [] as string[]
  });
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const usersData = await response.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (meeting && isOpen) {
      setFormData({
        title: meeting.title,
        description: meeting.description || '',
        duration: meeting.duration,
        participants: meeting.participants
          .map(p => p.email)
          .filter(email => email !== meeting.createdBy.email)
      });
    }
  }, [meeting, isOpen]);

  const filteredUsers = users.filter(u => 
    (u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase()))) &&
    !formData.participants.includes(u.email) &&
    u.email !== meeting?.createdBy.email
  );

  const addParticipant = (email: string) => {
    if (!formData.participants.includes(email)) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, email]
      }));
    }
    setUserSearchTerm('');
    setShowUserDropdown(false);
  };

  const removeParticipant = (email: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting) return;

    setLoading(true);
    try {
      const updatedData = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        participants: [...new Set([meeting.createdBy.email, ...formData.participants])]
      };
      
      await onConfirm(updatedData);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const calculateEndTime = (startDateTime: string, duration: number) => {
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return endDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !meeting) return null;

  const hasChanges = 
    formData.title !== meeting.title ||
    formData.description !== meeting.description ||
    formData.duration !== meeting.duration ||
    formData.participants.length !== meeting.participants.filter(p => p.email !== meeting.createdBy.email).length;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header fixe */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Modifier la réunion
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Mettre à jour les détails
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Horaire actuel */}
            <div className="bg-gray-50 rounded-md p-4">
              <div className="text-sm text-gray-600 mb-1">Réunion programmée le</div>
              <div className="font-medium text-gray-900">
                {formatDisplayDate(meeting.scheduledTime)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDuration(formData.duration)} • 
                Fin prévue : {calculateEndTime(meeting.scheduledTime, formData.duration)}
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Titre de la réunion"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Description (optionnel)"
              />
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée
              </label>
              <div className="flex items-center space-x-3">
                {/* Heures */}
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Heures</div>
                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const currentHours = Math.floor(formData.duration / 60);
                        if (currentHours > 0) {
                          const newMinutes = (currentHours - 1) * 60 + (formData.duration % 60);
                          handleChange('duration', newMinutes);
                        }
                      }}
                      disabled={Math.floor(formData.duration / 60) === 0}
                      className="px-2 py-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <div className="flex-1 text-center py-2">
                      <span className="text-lg font-medium text-gray-800">
                        {Math.floor(formData.duration / 60)}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const currentHours = Math.floor(formData.duration / 60);
                        if (currentHours < 8) {
                          const newMinutes = (currentHours + 1) * 60 + (formData.duration % 60);
                          handleChange('duration', newMinutes);
                        }
                      }}
                      disabled={Math.floor(formData.duration / 60) === 8}
                      className="px-2 py-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Minutes */}
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Minutes</div>
                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const currentMinutes = formData.duration % 60;
                        let newMinutes = formData.duration;
                        
                        if (currentMinutes === 0) {
                          newMinutes = Math.floor(formData.duration / 60) * 60 + 45;
                        } else if (currentMinutes === 15) {
                          newMinutes = Math.floor(formData.duration / 60) * 60;
                        } else if (currentMinutes === 30) {
                          newMinutes = Math.floor(formData.duration / 60) * 60 + 15;
                        } else if (currentMinutes === 45) {
                          newMinutes = Math.floor(formData.duration / 60) * 60 + 30;
                        }
                        
                        handleChange('duration', newMinutes);
                      }}
                      className="px-2 py-2 text-gray-500 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <div className="flex-1 text-center py-2">
                      <span className="text-lg font-medium text-gray-800">
                        {(formData.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const currentMinutes = formData.duration % 60;
                        let newMinutes = formData.duration;
                        
                        if (currentMinutes === 0) {
                          newMinutes = Math.floor(formData.duration / 60) * 60 + 15;
                        } else if (currentMinutes === 15) {
                          newMinutes = Math.floor(formData.duration / 60) * 60 + 30;
                        } else if (currentMinutes === 30) {
                          newMinutes = Math.floor(formData.duration / 60) * 60 + 45;
                        } else if (currentMinutes === 45) {
                          newMinutes = Math.floor(formData.duration / 60) * 60;
                        }
                        
                        handleChange('duration', newMinutes);
                      }}
                      className="px-2 py-2 text-gray-500 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Durée totale */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total</div>
                  <div className="text-center px-4 py-2 bg-blue-50 rounded-md">
                    <span className="font-medium text-blue-700">
                      {formatDuration(formData.duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Participants
                </label>
                <span className="text-xs text-gray-500">
                  {formData.participants.length + 1} total
                </span>
              </div>
              
              {/* Barre de recherche */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                  placeholder="Rechercher un collaborateur..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* Dropdown utilisateurs */}
                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {usersLoading ? (
                      <div className="p-3 text-center text-gray-500">
                        Chargement...
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((userItem) => (
                        <button
                          key={userItem.id}
                          type="button"
                          onClick={() => addParticipant(userItem.email)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-medium">
                              {userItem.name?.charAt(0) || userItem.email.charAt(0)}
                            </div>
                            <div className="ml-2">
                              <div className="text-sm text-gray-900">
                                {userItem.name || userItem.email.split('@')[0]}
                              </div>
                              <div className="text-xs text-gray-500">{userItem.email}</div>
                            </div>
                          </div>
                        </button>
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
                {/* Organisateur */}
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs font-medium">
                      {meeting.createdBy.name?.charAt(0) || meeting.createdBy.email.charAt(0)}
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {meeting.createdBy.name || meeting.createdBy.email.split('@')[0]}
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                          Organisateur
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{meeting.createdBy.email}</div>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                {formData.participants.map((participant) => {
                  const participantInfo = meeting.participants.find(p => p.email === participant) || 
                                         users.find(u => u.email === participant);
                  return (
                    <div key={participant} className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-medium">
                          {participantInfo?.name?.charAt(0) || participant.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm text-gray-900">
                            {participantInfo?.name || participant.split('@')[0]}
                          </div>
                          <div className="text-xs text-gray-500">{participant}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParticipant(participant)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3">
              <p>Les participants ajoutés ou supprimés seront notifiés par email.</p>
            </div>
          </form>
        </div>

        {/* Footer avec actions fixé en bas */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              onClick={handleSubmit}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};