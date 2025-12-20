// src/app/api/meetings/[id]/generate-ai-pv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { AIPVGenerator } from '@/src/app/reunions/services/AIPVGenerator';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const meetingId = params.id;
    
    console.log('🧠 Début génération PV IA pour:', meetingId);
    
    // 1. Récupérer les données de la réunion
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
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
    
    // 2. Formater les données pour l'IA
    const meetingData = {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description || '',
      scheduledTime: meeting.scheduledTime,
      duration: meeting.duration,
      location: meeting.location || 'Virtuel',
      status: meeting.status,
      organizer: {
        id: meeting.createdBy.id,
        name: meeting.createdBy.name,
        email: meeting.createdBy.email
      },
      participants: meeting.participants.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: 'EMPLOYEE'
      })),
      agenda: meeting.agenda ? 
        (Array.isArray(meeting.agenda) ? meeting.agenda : [meeting.agenda]) : [],
      decisions: meeting.decisions ? 
        (Array.isArray(meeting.decisions) ? meeting.decisions : [meeting.decisions]) : [],
      actionItems: meeting.actionItems ? 
        (Array.isArray(meeting.actionItems) ? meeting.actionItems : [meeting.actionItems]) : [],
      nextSteps: Array.isArray(meeting.nextSteps) ? meeting.nextSteps : [],
      chatMessages: [],
      capturedItems: []
    };
    
    console.log('📊 Données pour IA:', {
      participants: meetingData.participants.length,
      agenda: meetingData.agenda.length,
      decisions: meetingData.decisions.length,
      actions: meetingData.actionItems.length
    });
    
    // 3. Générer le PV avec IA
    const aiGeneratedMinutes = await AIPVGenerator.generateProfessionalPV(meetingData);
    
    // 4. Vérifier la longueur (PostgreSQL a des limites)
    const truncatedMinutes = aiGeneratedMinutes.length > 10000 
      ? aiGeneratedMinutes.substring(0, 10000) + "... [tronqué]"
      : aiGeneratedMinutes;
    
    // 5. Sauvegarder dans la base de données
    try {
      const updatedMeeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          aiGeneratedMinutes: truncatedMinutes,
          minutesGeneratedAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ PV IA généré et sauvegardé');
      
    } catch (prismaError) {
      console.error('❌ Erreur Prisma:', prismaError);
      
      // Fallback: utiliser le champ description
      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          description: `[PV IA] ${truncatedMinutes.substring(0, 5000)}`,
          updatedAt: new Date()
        }
      });
      
      console.log('⚠️ PV IA sauvegardé dans description (fallback)');
    }
    
    // 6. Retourner le résultat
    return NextResponse.json({
      success: true,
      message: 'PV généré avec succès',
      pv: aiGeneratedMinutes.substring(0, 500) + '...', // Prévisualisation
      downloadUrl: `/api/meetings/${meetingId}/export-pdf`
    });
    
  } catch (error) {
    console.error('❌ Erreur génération PV IA:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération du PV IA',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}