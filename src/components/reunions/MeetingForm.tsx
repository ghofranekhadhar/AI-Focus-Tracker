'use client';

import { useState } from 'react';

interface MeetingFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: {
    title: string;
    description: string;
    duration: number;
    scheduledTime: string;
  };
}

export function MeetingForm({ onSubmit, onCancel, loading = false, initialData }: MeetingFormProps) {
  // Date par défaut : aujourd'hui à 14h00
  const defaultDate = new Date();
  defaultDate.setHours(14, 0, 0, 0); // 14h00 aujourd'hui
  const defaultDateTime = defaultDate.toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    duration: initialData?.duration || 30,
    scheduledTime: initialData?.scheduledTime || defaultDateTime,
    participants: [] as string[]
  });
  
  const [participantEmail, setParticipantEmail] = useState('');

 const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Veuillez remplir le titre de la réunion');
      return;
    }

    if (!formData.scheduledTime) {
      alert('Veuillez sélectionner une date et heure');
      return;
    }

    // Convertir les emails en IDs temporaires
    const participantIds = formData.participants.map(email => `user-${email.replace('@', '-at-')}`);

    const meetingData = {
      title: formData.title,
      description: formData.description,
      scheduledTime: new Date(formData.scheduledTime).toISOString(),
      duration: formData.duration,
      participants: formData.participants // Tableau d'emails directement
    };

    console.log('📤 Données envoyées:', meetingData);
    onSubmit(meetingData);
  };
  

  const addParticipant = () => {
    const email = participantEmail.trim();
    if (email && !formData.participants.includes(email)) {
      if (validateEmail(email)) {
        setFormData(prev => ({
          ...prev,
          participants: [...prev.participants, email]
        }));
        setParticipantEmail('');
      } else {
        alert('Veuillez entrer une adresse email valide');
      }
    }
  };

  const removeParticipant = (email: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Options de durée prédéfinies
  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 heure' },
    { value: 90, label: '1 heure 30' },
    { value: 120, label: '2 heures' },
    { value: 150, label: '2 heures 30' },
    { value: 180, label: '3 heures' }
  ];

  // Formater la date pour l'affichage
  const formatDisplayDate = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Réunion de planning hebdomadaire"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Décrivez l'objectif de cette réunion..."
          />
        </div>

        {/* Date et heure */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date et heure *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.scheduledTime}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().slice(0, 16)} // Pas de dates dans le passé
            />
            <p className="text-xs text-gray-500 mt-1">
              {formatDisplayDate(formData.scheduledTime)}
            </p>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durée *
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Fin: {calculateEndTime(formData.scheduledTime, formData.duration)}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participants
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="email"
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addParticipant();
                }
              }}
            />
            <button
              type="button"
              onClick={addParticipant}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ajouter
            </button>
          </div>
          
          {/* Liste des participants */}
          {formData.participants.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
              <p className="text-sm text-gray-600 mb-2">
                {formData.participants.length} participant(s) invité(s)
              </p>
              {formData.participants.map((participant, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm">{participant}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParticipant(participant)}
                    className="text-red-600 hover:text-red-800 text-lg font-bold"
                    title="Retirer ce participant"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Résumé de la réunion */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📅 Résumé de la réunion</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Quand:</strong> {formatDisplayDate(formData.scheduledTime)}</p>
            <p><strong>Durée:</strong> {formData.duration} minutes</p>
            <p><strong>Fin prévue:</strong> {calculateEndTime(formData.scheduledTime, formData.duration)}</p>
            <p><strong>Participants:</strong> {formData.participants.length} personne(s)</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Création...</span>
            </>
          ) : (
            <>
              <span>📅</span>
              <span>Créer la réunion</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Fonction utilitaire pour calculer l'heure de fin
function calculateEndTime(startDateTime: string, duration: number): string {
  if (!startDateTime) return '-';
  
  const startDate = new Date(startDateTime);
  const endDate = new Date(startDate.getTime() + duration * 60000); // duration en minutes
  
  return endDate.toLocaleString('fr-FR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}