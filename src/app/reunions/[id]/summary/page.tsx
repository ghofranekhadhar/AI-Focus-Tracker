// src/app/reunions/[id]/summary/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function MeetingSummaryPage() {
  const params = useParams();
  const meetingId = params.id as string;
  const [meetingData, setMeetingData] = useState(null);
  
  useEffect(() => {
    const loadMeetingData = async () => {
      const response = await fetch(`/api/meetings/${meetingId}/pdf-data`);
      if (response.ok) {
        const data = await response.json();
        setMeetingData(data);
      }
    };
    loadMeetingData();
  }, [meetingId]);
  
  if (!meetingData) return <div>Chargement...</div>;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{meetingData.title}</h1>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold">📋 Participants</h2>
        <ul>
          {meetingData.participants.map((p, i) => (
            <li key={i}>{p.name} - {p.email}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold">📝 Ordre du jour</h2>
        <ul>
          {meetingData.agenda.map((item, i) => (
            <li key={i}>
              {item.item} - {item.presenter} ({item.duration} min)
            </li>
          ))}
        </ul>
      </div>
      
      <button 
        onClick={() => {
          // Utilisez votre fonction existante
          const { downloadProfessionalMeetingPDF } = require('../utils/pdfGenerator');
          downloadProfessionalMeetingPDF(meetingId, meetingData.title);
        }}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        📄 Générer le PDF
      </button>
    </div>
  );
}