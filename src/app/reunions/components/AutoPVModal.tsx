// Dans AutoPVModal.tsx
'use client';

import { useState, useEffect } from 'react';
// ... autres imports

interface AutoPVModalProps {
  meetingId: string;
  meetingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onGeneratePDF: (notes?: string) => Promise<boolean>;
}

export const AutoPVModal: React.FC<AutoPVModalProps> = ({
  meetingId,
  meetingTitle,
  isOpen,
  onClose,
  onGeneratePDF
}) => {
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [meetingData, setMeetingData] = useState<any>(null); // ← AJOUTEZ
  const [isLoading, setIsLoading] = useState(false); // ← AJOUTEZ

  // Chargez les données fraîches quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadMeetingData();
    }
  }, [isOpen]);

  const loadMeetingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/meetings/${meetingId}/auto-minutes`);
      if (response.ok) {
        const data = await response.json();
        setMeetingData(data.structuredData);
        console.log('📊 Données chargées pour PV:', {
          agenda: data.structuredData.agenda?.length || 0,
          decisions: data.structuredData.decisions?.length || 0,
          actions: data.structuredData.actionItems?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const success = await onGeneratePDF(notes);
    setIsGenerating(false);
    
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 
                    max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            📝 Générer le Procès-Verbal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* PRÉVISUALISATION DES DONNÉES - AJOUTEZ CE BLOC */}
        {meetingData && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              📊 Données qui seront incluses dans le PV
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center p-3 bg-blue-900/30 rounded-lg border border-blue-800/50">
                <div className="text-2xl font-bold text-blue-300">
                  {meetingData.agenda?.length || 0}
                </div>
                <div className="text-sm text-gray-300">Points agenda</div>
              </div>
              
              <div className="text-center p-3 bg-green-900/30 rounded-lg border border-green-800/50">
                <div className="text-2xl font-bold text-green-300">
                  {meetingData.decisions?.length || 0}
                </div>
                <div className="text-sm text-gray-300">Décisions</div>
              </div>
              
              <div className="text-center p-3 bg-amber-900/30 rounded-lg border border-amber-800/50">
                <div className="text-2xl font-bold text-amber-300">
                  {meetingData.actionItems?.length || 0}
                </div>
                <div className="text-sm text-gray-300">Actions</div>
              </div>
            </div>

            {/* Liste détaillée */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {meetingData.agenda?.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-900/50 rounded">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm text-white">{typeof item === 'object' ? item.item : item}</div>
                    {typeof item === 'object' && item.presenter && (
                      <div className="text-xs text-gray-400">Par: {item.presenter}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Le reste du modal existant */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes supplémentaires (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 
                     text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 
                     focus:border-transparent resize-none"
            placeholder="Ajoutez des notes, commentaires ou détails supplémentaires..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg 
                     transition duration-200 font-medium disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                     hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg 
                     transition duration-200 font-medium flex items-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Génération...
              </>
            ) : (
              '📄 Générer le PV'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};