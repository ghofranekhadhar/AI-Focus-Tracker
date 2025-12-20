// src/app/reunions/components/MeetingPDFForm.tsx
'use client';

import { useState } from 'react';

interface AgendaItem {
  item: string;
  presenter: string;
  duration: string;
}

interface Decision {
  decision: string;
  responsible: string;
  deadline: string;
}

interface ActionItem {
  task: string;
  responsible: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}

interface MeetingPDFFormProps {
  meetingId: string;
  meetingTitle: string;
  onSave?: () => void;
}

export const MeetingPDFForm: React.FC<MeetingPDFFormProps> = ({ 
  meetingId, 
  meetingTitle,
  onSave 
}) => {
  const [formData, setFormData] = useState({
    location: '',
    agenda: [{ item: '', presenter: '', duration: '' }] as AgendaItem[],
    decisions: [{ decision: '', responsible: '', deadline: '' }] as Decision[],
    actionItems: [{ task: '', responsible: '', deadline: '', priority: 'medium' as const }] as ActionItem[],
    nextSteps: [''] as string[]
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!formData.location.trim()) {
      setMessage('❌ Le lieu est obligatoire');
      return;
    }

    setIsSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setMessage('✅ Données sauvegardées pour le PDF !');
        if (onSave) onSave();
        
        // Test immédiat de l'API PDF
        setTimeout(async () => {
          const testRes = await fetch(`/api/meetings/${meetingId}/pdf-data`);
          const testData = await testRes.json();
          console.log('📊 Test après sauvegarde:', {
            location: testData.location,
            agenda: testData.agenda?.length,
            decisions: testData.decisions?.length,
            actions: testData.actionItems?.length
          });
        }, 1000);
      } else {
        const error = await response.json();
        setMessage(`❌ Erreur: ${error.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessage('❌ Erreur de connexion au serveur');
    } finally {
      setIsSaving(false);
    }
  };

  const addAgendaItem = () => {
    setFormData({
      ...formData,
      agenda: [...formData.agenda, { item: '', presenter: '', duration: '' }]
    });
  };

  const removeAgendaItem = (index: number) => {
    setFormData({
      ...formData,
      agenda: formData.agenda.filter((_, i) => i !== index)
    });
  };

  const addDecision = () => {
    setFormData({
      ...formData,
      decisions: [...formData.decisions, { decision: '', responsible: '', deadline: '' }]
    });
  };

  const removeDecision = (index: number) => {
    setFormData({
      ...formData,
      decisions: formData.decisions.filter((_, i) => i !== index)
    });
  };

  const addActionItem = () => {
    setFormData({
      ...formData,
      actionItems: [...formData.actionItems, { task: '', responsible: '', deadline: '', priority: 'medium' }]
    });
  };

  const removeActionItem = (index: number) => {
    setFormData({
      ...formData,
      actionItems: formData.actionItems.filter((_, i) => i !== index)
    });
  };

  const addNextStep = () => {
    setFormData({
      ...formData,
      nextSteps: [...formData.nextSteps, '']
    });
  };

  const removeNextStep = (index: number) => {
    setFormData({
      ...formData,
      nextSteps: formData.nextSteps.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-6 space-y-8">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">📋 Remplir le PV de réunion</h2>
        <p className="text-gray-600">Ces informations seront incluses dans le PDF</p>
        <p className="text-sm text-gray-500 mt-1">Réunion: <strong>{meetingTitle}</strong> (ID: {meetingId.slice(0, 8)}...)</p>
      </div>
      
      {/* Lieu */}
      <div className="space-y-2">
        <label className="block font-medium text-gray-700">📍 Lieu de la réunion *</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ex: Salle de conférence A, Zoom, Teams..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      {/* Ordre du jour */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">📝 Ordre du jour</h3>
          <button
            type="button"
            onClick={addAgendaItem}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
          >
            + Ajouter un point
          </button>
        </div>
        
        {formData.agenda.map((item, index) => (
          <div key={index} className="flex gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Point {index + 1}</span>
                {formData.agenda.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <input
                type="text"
                value={item.item}
                onChange={(e) => {
                  const newAgenda = [...formData.agenda];
                  newAgenda[index].item = e.target.value;
                  setFormData({ ...formData, agenda: newAgenda });
                }}
                placeholder="Point à l'ordre du jour"
                className="w-full p-2 border border-gray-300 rounded"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={item.presenter}
                  onChange={(e) => {
                    const newAgenda = [...formData.agenda];
                    newAgenda[index].presenter = e.target.value;
                    setFormData({ ...formData, agenda: newAgenda });
                  }}
                  placeholder="Animateur"
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  value={item.duration}
                  onChange={(e) => {
                    const newAgenda = [...formData.agenda];
                    newAgenda[index].duration = e.target.value;
                    setFormData({ ...formData, agenda: newAgenda });
                  }}
                  placeholder="Durée (min)"
                  className="w-24 p-2 border border-gray-300 rounded"
                  min="1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Décisions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">✅ Décisions prises</h3>
          <button
            type="button"
            onClick={addDecision}
            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
          >
            + Ajouter une décision
          </button>
        </div>
        {formData.decisions.map((decision, index) => (
          <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Décision {index + 1}</span>
              {formData.decisions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDecision(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>
            <textarea
              value={decision.decision}
              onChange={(e) => {
                const newDecisions = [...formData.decisions];
                newDecisions[index].decision = e.target.value;
                setFormData({ ...formData, decisions: newDecisions });
              }}
              placeholder="Décision prise..."
              className="w-full p-2 border border-gray-300 rounded"
              rows={2}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={decision.responsible}
                onChange={(e) => {
                  const newDecisions = [...formData.decisions];
                  newDecisions[index].responsible = e.target.value;
                  setFormData({ ...formData, decisions: newDecisions });
                }}
                placeholder="Responsable"
                className="flex-1 p-2 border border-gray-300 rounded"
              />
              <input
                type="date"
                value={decision.deadline}
                onChange={(e) => {
                  const newDecisions = [...formData.decisions];
                  newDecisions[index].deadline = e.target.value;
                  setFormData({ ...formData, decisions: newDecisions });
                }}
                className="w-40 p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">🎯 Actions assignées</h3>
          <button
            type="button"
            onClick={addActionItem}
            className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
          >
            + Ajouter une action
          </button>
        </div>
        {formData.actionItems.map((action, index) => (
          <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Action {index + 1}</span>
              {formData.actionItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeActionItem(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>
            <input
              type="text"
              value={action.task}
              onChange={(e) => {
                const newActions = [...formData.actionItems];
                newActions[index].task = e.target.value;
                setFormData({ ...formData, actionItems: newActions });
              }}
              placeholder="Tâche à réaliser"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={action.responsible}
                onChange={(e) => {
                  const newActions = [...formData.actionItems];
                  newActions[index].responsible = e.target.value;
                  setFormData({ ...formData, actionItems: newActions });
                }}
                placeholder="Responsable"
                className="flex-1 p-2 border border-gray-300 rounded"
              />
              <input
                type="date"
                value={action.deadline}
                onChange={(e) => {
                  const newActions = [...formData.actionItems];
                  newActions[index].deadline = e.target.value;
                  setFormData({ ...formData, actionItems: newActions });
                }}
                className="w-40 p-2 border border-gray-300 rounded"
              />
              <select
                value={action.priority}
                onChange={(e) => {
                  const newActions = [...formData.actionItems];
                  newActions[index].priority = e.target.value as 'high' | 'medium' | 'low';
                  setFormData({ ...formData, actionItems: newActions });
                }}
                className="w-32 p-2 border border-gray-300 rounded"
              >
                <option value="high">🔴 Haute</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="low">🟢 Basse</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      
      {/* Prochaines étapes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">➡️ Prochaines étapes</h3>
          <button
            type="button"
            onClick={addNextStep}
            className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200"
          >
            + Ajouter une étape
          </button>
        </div>
        {formData.nextSteps.map((step, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={step}
              onChange={(e) => {
                const newSteps = [...formData.nextSteps];
                newSteps[index] = e.target.value;
                setFormData({ ...formData, nextSteps: newSteps });
              }}
              placeholder="Étape suivante..."
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            {formData.nextSteps.length > 1 && (
              <button
                type="button"
                onClick={() => removeNextStep(index)}
                className="text-red-600 hover:text-red-800 p-2"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Message et bouton */}
      {message && (
        <div className={`p-3 rounded ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sauvegarde en cours...
            </>
          ) : (
            '💾 Sauvegarder pour le PDF'
          )}
        </button>
        
        <button
          onClick={() => {
            if (onSave) onSave();
          }}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Annuler
        </button>
      </div>
      
      <div className="text-sm text-gray-500 text-center pt-4 border-t">
        <p>💡 <strong>Conseil :</strong> Remplissez tous les champs pour obtenir un PDF professionnel complet.</p>
        <p className="mt-1">Après sauvegarde, le bouton "Exporter PV" générera un PDF avec ces informations.</p>
      </div>
    </div>
  );
};