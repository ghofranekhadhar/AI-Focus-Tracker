// src/app/api/meetings/[id]/export-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import jsPDF from 'jspdf';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const meetingId = params.id;
    
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { 
        title: true, 
        aiGeneratedMinutes: true,
        scheduledTime: true,
        location: true,
        duration: true
      }
    });
    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Réunion non trouvée' },
        { status: 404 }
      );
    }
    
    // Créer PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PROCÈS-VERBAL', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(meeting.title, 20, 40);
    doc.text(`Date: ${new Date(meeting.scheduledTime).toLocaleDateString('fr-FR')}`, 20, 50);
    
    // Ajouter le contenu IA
    if (meeting.aiGeneratedMinutes) {
      const lines = doc.splitTextToSize(meeting.aiGeneratedMinutes, 170);
      doc.text(lines, 20, 70);
    } else {
      doc.text('PV en cours de génération...', 20, 70);
    }
    
    const fileName = `PV_${meeting.title.replace(/\s/g, '_')}.pdf`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return new NextResponse(doc.output('blob'), { headers });
    
  } catch (error) {
    console.error('❌ Erreur export PDF:', error);
    return NextResponse.json(
      { error: 'Erreur export PDF' },
      { status: 500 }
    );
  }
}