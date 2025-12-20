// src/app/reunions/components/MeetingDetailsForm.tsx
'use client';

import { useState } from 'react';

export const MeetingDetailsForm = ({ meetingId, onSave }) => {
  const [formData, setFormData] = useState({
    location: '',
    agenda: [{ item: '', presenter: '', duration: '' }],
    decisions: [{ decision: '', responsible: '', deadline: '' }],
    actionItems: [{ task: '', responsible: '', deadline: '', priority: 'medium' }],
    nextSteps: ['']
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Données enregistrées avec succès !');
        onSave();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Lieu de la réunion</label>
        <input 
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          placeholder="Salle de conférence..."
        />
      </div>
      
      <div>
        <h3>Ordre du jour</h3>
        {formData.agenda.map((item, index) => (
          <div key={index}>
            <input 
              placeholder="Point à l'ordre du jour"
              value={item.item}
              onChange={(e) => {
                const newAgenda = [...formData.agenda];
                newAgenda[index].item = e.target.value;
                setFormData({...formData, agenda: newAgenda});
              }}
            />
          </div>
        ))}
      </div>
      
      <button type="submit">Enregistrer</button>
    </form>
  );
};