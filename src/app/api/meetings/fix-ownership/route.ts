import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.userEmail) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }

    // Trouver ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { email: body.userEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: body.userId || `user-${Date.now()}`,
          email: body.userEmail,
          name: body.userEmail.split('@')[0],
          role: 'EMPLOYEE'
        }
      });
    }

    // Mettre à jour toutes les réunions pour cet utilisateur
    const updatedMeetings = await prisma.meeting.updateMany({
      where: {
        OR: [
          { createdBy: { email: body.userEmail } },
          { participants: { some: { email: body.userEmail } } }
        ]
      },
      data: {
        createdById: user.id // S'assurer que createdById correspond
      }
    });

    // Ajouter l'utilisateur comme participant à ses propres réunions
    const userMeetings = await prisma.meeting.findMany({
      where: {
        createdBy: { email: body.userEmail }
      }
    });

    for (const meeting of userMeetings) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          participants: {
            connect: { id: user.id }
          }
        }
      });
    }

    return NextResponse.json({
      message: `Accès corrigé pour ${userMeetings.length} réunions`,
      user: { id: user.id, email: user.email },
      meetingsUpdated: updatedMeetings.count
    });

  } catch (error) {
    console.error('❌ Erreur correction ownership:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la correction des réunions' },
      { status: 500 }
    );
  }
}