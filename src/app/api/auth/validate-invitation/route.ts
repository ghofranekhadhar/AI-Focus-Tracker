import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInvitationToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // Vérifier le token
    const decoded = verifyInvitationToken(token);
    if (!decoded) {
      return NextResponse.json({ valid: false, error: 'Token invalide ou expiré' }, { status: 200 });
    }

    // Vérifier l'invitation en base de données
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        email: decoded.email,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ valid: false, error: 'Invitation invalide ou expirée' }, { status: 200 });
    }

    return NextResponse.json({ 
      valid: true, 
      email: invitation.email,
      role: invitation.role 
    });
  } catch (error) {
    console.error('Erreur lors de la validation de l\'invitation:', error);
    return NextResponse.json({ valid: false, error: 'Erreur interne' }, { status: 200 });
  }
}