// src/app/api/meetings/[id]/pdf-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/././lib/db'; 

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    console.log('📄 GET /api/meetings/[id]/pdf-data - ID:', id);
    
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } }
      }
    });
    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Réunion non trouvée' },
        { status: 404 }
      );
    }
    
    // Fonction pour parser les données JSON de façon sécurisée
    const parseJSONField = (field: any) => {
      if (!field) return [];
      try {
        if (typeof field === 'string') {
          return JSON.parse(field);
        }
        return field; // Déjà un objet/tableau
      } catch (error) {
        console.error('❌ Erreur parsing JSON:', error);
        return [];
      }
    };
    
    // Structure des données pour le PDF
    const pdfData = {
      id: meeting.id,
      title: meeting.title,
      scheduledTime: meeting.scheduledTime.toISOString(),
      createdBy: {
        name: meeting.createdBy.name,
        email: meeting.createdBy.email,
        department: 'Non spécifié'
      },
      participants: meeting.participants.map(p => ({
        name: p.name,
        email: p.email,
        role: 'Participant',
        department: 'Non spécifié'
      })),
      duration: meeting.duration,
      location: (meeting as any).location || 'Non spécifié',
      agenda: parseJSONField((meeting as any).agenda),
      decisions: parseJSONField((meeting as any).decisions),
      actionItems: parseJSONField((meeting as any).actionItems),
      nextSteps: Array.isArray((meeting as any).nextSteps) 
        ? (meeting as any).nextSteps 
        : []
    };
    
    console.log('✅ Données PDF préparées:', {
      participants: pdfData.participants.length,
      agendaItems: pdfData.agenda.length,
      decisions: pdfData.decisions.length,
      actions: pdfData.actionItems.length,
      nextSteps: pdfData.nextSteps.length,
      location: pdfData.location
    });
    
    return NextResponse.json(pdfData);
    
  } catch (error) {
    console.error('❌ Erreur PDF data:', error);
    return NextResponse.json(
      { error: 'Erreur préparation données PDF' },
      { status: 500 }
    );
  }
}