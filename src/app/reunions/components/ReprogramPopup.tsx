import { useState, useEffect } from 'react';

interface ReprogramPopupProps {
  meeting: any | null;  // Comme EditMeetingPopup
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDateTime: string) => void;
}

export const ReprogramPopup: React.FC<ReprogramPopupProps> = ({
  meeting,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meeting && isOpen) {
      const meetingDate = new Date(meeting.scheduledTime);
      setNewDate(meetingDate.toISOString().split('T')[0]);
      setNewTime(meetingDate.toTimeString().slice(0, 5));
    }
  }, [meeting, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting || !newDate || !newTime) return;

    setLoading(true);
    try {
      const newDateTime = `${newDate}T${newTime}:00`;
      await onConfirm(newDateTime);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !meeting) return null;

  const newDateTime = newDate && newTime ? `${newDate}T${newTime}` : null;
  const isDateChanged = newDateTime && new Date(newDateTime).getTime() !== new Date(meeting.scheduledTime).getTime();

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Reprogrammer la réunion
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Sélectionnez une nouvelle date et heure
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Réunion info */}
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="font-medium text-gray-900 mb-1">{meeting.title}</h3>
            <div className="text-sm text-gray-600 space-y-0.5">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDisplayDate(meeting.scheduledTime)}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {meeting.participants.length} participants • {meeting.duration} minutes
              </div>
            </div>
          </div>

          {/* Nouvelle date et heure */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvelle date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvelle heure
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Aperçu */}
          {newDateTime && isDateChanged && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Nouveau créneau</p>
                  <p className="text-sm text-blue-800 mt-0.5">{formatDisplayDate(newDateTime)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification */}
          <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3">
            <p>Tous les participants seront notifiés par email.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              disabled={loading || !newDate || !newTime || !isDateChanged}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Modification...
                </>
              ) : (
                'Confirmer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};