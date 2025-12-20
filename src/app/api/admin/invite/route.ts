import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email-utils';
import { generateInvitationToken } from '@/lib/auth-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email et rôle requis' }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
    }

    // Générer le token d'invitation
    const invitationToken = generateInvitationToken(email, role);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    // Créer l'invitation dans la base de données
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token: invitationToken,
        expiresAt,
        invitedBy: session.user.id,
      },
    });

    // Envoyer l'email d'invitation
    await sendInvitationEmail(email, invitationToken, session.user.name);

    return NextResponse.json({ 
      message: 'Invitation envoyée avec succès',
      invitationId: invitation.id 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'invitation:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}