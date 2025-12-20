// src/app/api/meetings/[id]/save-notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const meetingId = params.id;
    const body = await request.json();
    const { notes } = body;

    // Sauvegarder les notes dans la réunion
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        // Vous pouvez ajouter un champ pour les notes si besoin
        // Pour l'instant, on peut les mettre dans description ou un champ JSON
        description: notes
          ? `Notes du PV: ${notes}\n\n${(await prisma.meeting.findUnique({ where: { id: meetingId } }))?.description || ''}`
          : undefined
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Notes sauvegardées' 
    });

  } catch (error) {
    console.error('Erreur sauvegarde notes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des notes' },
      { status: 500 }
    );
  }
}