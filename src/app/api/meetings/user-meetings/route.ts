import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const date = searchParams.get('date');
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json([]);
    }

    let whereClause: any = {
      OR: [
        { createdById: user.id },
        { participants: { some: { id: user.id } } }
      ]
    };

    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.scheduledTime = {
        gte: selectedDate,
        lt: nextDay
      };
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        participants: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    return NextResponse.json(meetings);

  } catch (error) {
    console.error('❌ Error fetching user meetings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réunions' },
      { status: 500 }
    );
  }
}