// app/api/admin/notifications/read-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Admin : marquer TOUTES les notifications comme lues
    const result = await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    const updatedCount = result.count;
    const remainingUnread = await prisma.notification.count({
      where: { isRead: false },
    });

    return NextResponse.json({ 
      success: true,
      message: `${updatedCount} notification(s) marquée(s) comme lue(s)`,
      stats: {
        marked: updatedCount,
        remainingUnread,
        markedBy: user.name,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('❌ Erreur admin marquer toutes comme lues:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}