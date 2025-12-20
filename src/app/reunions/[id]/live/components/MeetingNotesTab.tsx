// src/app/reunions/[id]/live/components/MeetingNotesTab.tsx
'use client';

import { useState } from 'react';

export const MeetingNotesTab = ({ meetingId, onSave }) => {
  const [notes, setNotes] = useState({
    agenda: [{ item: '', presenter: '', duration: '' }],
    decisions: [{ decision: '', responsible: '', deadline: '' }],
    actionItems: [{ task: '', responsible: '', deadline: '', priority: 'medium' }]
  });

  const addAgendaItem = () => {
    setNotes({...notes, agenda: [...notes.agenda, { item: '', presenter: '', duration: '' }]});
  };

  const saveToDatabase = async () => {
    const response = await fetch(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes)
    });
    
    if (response.ok) {
      onSave();
      alert('Notes sauvegardées !');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h3 className="font-bold">📝 Notes de la réunion</h3>
      
      <div>
        <h4>Ordre du jour</h4>
        {notes.agenda.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input 
              placeholder="Point..."
              value={item.item}
              className="flex-1"
            />
            <input 
              placeholder="Animateur"
              value={item.presenter}
              className="w-32"
            />
            <input 
              placeholder="Durée (min)"
              value={item.duration}
              className="w-24"
            />
          </div>
        ))}
        <button onClick={addAgendaItem}>+ Ajouter un point</button>
      </div>
      
      <button 
        onClick={saveToDatabase}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        💾 Sauvegarder les notes
      </button>
    </div>
  );
};