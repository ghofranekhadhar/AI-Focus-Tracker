// src/app/api/meetings/[id]/export-ai-pv/route.ts
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
        agenda: true,
        decisions: true,
        actionItems: true 
      }
    });
    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Réunion non trouvée' },
        { status: 404 }
      );
    }
    
    // Créer PDF même sans IA
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PROCÈS-VERBAL', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(meeting.title, 20, 40);
    
    // Ajouter données basiques
    const content = `
    Titre: ${meeting.title}
    
    Agenda: ${JSON.stringify(meeting.agenda)}
    Décisions: ${JSON.stringify(meeting.decisions)}
    Actions: ${JSON.stringify(meeting.actionItems)}
    
    ---
    Pour générer un PV IA complet, utilisez /generate-ai-pv
    `;
    
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, 60);
    
    const fileName = `PV_${meeting.title.replace(/\s/g, '_')}.pdf`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return new NextResponse(doc.output('blob'), { headers });
    
  } catch (error) {
    console.error('❌ Erreur export PV:', error);
    return NextResponse.json(
      { error: 'Erreur export' },
      { status: 500 }
    );
  }
}