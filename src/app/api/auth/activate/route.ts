import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInvitationToken, hashPassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }

    // Vérifier le token
    const decoded = verifyInvitationToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 });
    }

    // Trouver l'invitation
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
      return NextResponse.json({ error: 'Invitation invalide, expirée ou déjà utilisée' }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà (au cas où)
    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: decoded.email,
        name: decoded.email.split('@')[0], // Nom par défaut
        role: invitation.role,
        password: hashedPassword,
        isActive: true,
        invitedAt: invitation.createdAt,
        activatedAt: new Date(),
      },
    });

    // Marquer l'invitation comme utilisée
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ 
      message: 'Compte activé avec succès',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Erreur lors de l\'activation du compte:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}