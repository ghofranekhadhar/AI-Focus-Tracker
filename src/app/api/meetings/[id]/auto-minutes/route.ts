// src/app/api/meetings/[id]/auto-minutes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AutoMinutesGenerator } from '@/src/app/reunions/services/AutoMinutesGenerator';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const meetingId = params.id;

    console.log(`📝 Génération minutes automatiques pour: ${meetingId}`);
    
    // Générer le contenu
    const result = await AutoMinutesGenerator.generateFormattedMinutes(meetingId);
    
    // Générer aussi un résumé
    const summary = await AutoMinutesGenerator.generateAutoSummary(meetingId);
    
    return NextResponse.json({
      success: true,
      meetingId,
      title: result.structuredData.title,
      content: result.content,
      summary,
      stats: {
        participantsCount: result.structuredData.participants.length,
        agendaItems: result.structuredData.agenda?.length || 0,
        decisionsCount: result.structuredData.decisions?.length || 0,
        actionsCount: result.structuredData.actionItems?.length || 0,
        attendanceCount: result.structuredData.attendance?.length || 0,
        chatMessagesCount: result.structuredData.chatMessages?.length || 0
      },
      structuredData: result.structuredData
    });

  } catch (error) {
    console.error('❌ Erreur génération minutes:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération des minutes',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const meetingId = params.id;
    const body = await request.json();
    const { notes } = body;

    // Générer avec les notes de l'organisateur
    const result = await AutoMinutesGenerator.generateFormattedMinutes(meetingId, notes);
    
    // Ici vous pourriez sauvegarder dans la base de données
    // await prisma.meetingMinutes.create({ ... });
    
    return NextResponse.json({
      success: true,
      message: 'Minutes générées avec succès',
      content: result.content,
      downloadUrl: `/api/meetings/${meetingId}/export-pdf?notes=${encodeURIComponent(notes || '')}`
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur génération' },
      { status: 500 }
    );
  }
}