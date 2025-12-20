// app/api/notifications/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      where: { 
        userId: user.id,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledTime: true,
            createdBy: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Ajouter l'expéditeur basé sur des règles simples
    const notificationsWithSender = notifications.map(notification => {
      let senderInfo = {
        name: "Système",
        email: "system@example.com",
        role: "System"
      };

      // Déterminer l'expéditeur
      if (notification.type === 'MEETING_INVITATION' && notification.meeting?.createdBy) {
        senderInfo = {
          name: notification.meeting.createdBy.name,
          email: notification.meeting.createdBy.email,
          role: notification.meeting.createdBy.role
        };
      } else if (notification.type === 'MEETING_INVITATION') {
        senderInfo = {
          name: "Organisateur",
          email: "meetings@example.com",
          role: "Organizer"
        };
      } else if (notification.type === 'SECURITY') {
        senderInfo = {
          name: "Sécurité",
          email: "security@example.com",
          role: "Security"
        };
      }

      return {
        ...notification,
        sender: senderInfo
      };
    });

    const totalCount = await prisma.notification.count({
      where: { userId: user.id },
    });

    const stats = {
      total: totalCount,
      unread: await prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
      meetings: await prisma.notification.count({
        where: {
          userId: user.id,
          type: 'MEETING_INVITATION',
        },
      }),
      system: await prisma.notification.count({
        where: {
          userId: user.id,
          type: 'SYSTEM',
        },
      }),
      security: await prisma.notification.count({
        where: {
          userId: user.id,
          type: 'SECURITY',
        },
      }),
    };

    return NextResponse.json({
      notifications: notificationsWithSender,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
      stats,
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}