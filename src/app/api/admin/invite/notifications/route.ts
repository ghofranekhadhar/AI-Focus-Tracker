// /api/admin/notifications/route.ts - VERSION CORRIGÉE
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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    // TOUJOURS récupérer TOUTES les notifications en admin
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledTime: true,
            participants: {
              select: {
                id: true,
                name: true,
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
    });

    // Formater SIMPLEMENT
    const formattedNotifications = notifications.map(notification => {
      // CRITIQUE : Toujours inclure meetingId explicitement
      const hasMeeting = notification.meetingId !== null;
      const isMeetingType = notification.type?.includes('MEETING');
      
      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        // Données réunion - CRITIQUE
        meeting: notification.meeting ? {
          id: notification.meeting.id,
          title: notification.meeting.title,
          scheduledTime: notification.meeting.scheduledTime.toISOString(),
          participants: notification.meeting.participants?.length || 0,
        } : null,
        // FLAGS EXPLICITES - TRÈS IMPORTANT
        _flags: {
          hasMeeting: hasMeeting,
          isMeetingType: isMeetingType,
          isMeetingNotification: hasMeeting || isMeetingType,
          recipientId: notification.userId,
          recipientName: notification.user.name,
          meetingId: notification.meetingId, // EXPLICITE
        },
        // Pour compatibilité
        meetingId: notification.meetingId, // AJOUTÉ ICI
      };
    });

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount: await prisma.notification.count({ where: { isRead: false } }),
      metadata: {
        isAdminView: true,
        user: {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
        },
        stats: {
          total: formattedNotifications.length,
          withMeetings: formattedNotifications.filter(n => n._flags.hasMeeting).length,
          meetingTypes: formattedNotifications.filter(n => n._flags.isMeetingType).length,
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération notifications admin:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}