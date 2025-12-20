import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import bcrypt from 'bcryptjs';
import { NotificationService } from '@/src/services/notificationService';

export async function GET(request: NextRequest) {
  try {
    console.log('📍 GET /api/meetings - Début');
    
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const userEmail = searchParams.get('userEmail');
    
    let whereClause: any = {};
    
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (user) {
        whereClause = {
          OR: [
            { createdById: user.id },
            { participants: { some: { id: user.id } } }
          ]
        };
      }
    }
    
    if (filter === 'upcoming') {
      whereClause.scheduledTime = {
        gte: new Date()
      };
    } else if (filter === 'past') {
      whereClause.scheduledTime = {
        lt: new Date()
      };
    }
    
    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } }
      },
      orderBy: { scheduledTime: 'desc' }
    });
    
    console.log('📥 GET /api/meetings - Nombre de réunions:', meetings.length);
    
    return NextResponse.json(meetings);
  } catch (error) {
    console.error('❌ Error GET /api/meetings:', error);
    return NextResponse.json(
      { error: 'Erreur récupération réunions: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📍 POST /api/meetings - Données reçues:', body);
    
    // Validation
    if (!body.title) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      );
    }

    if (!body.participants || !Array.isArray(body.participants) || body.participants.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un participant est requis' },
        { status: 400 }
      );
    }

    // Vérifier que tous les participants ont des emails valides
    const invalidEmails = body.participants.filter((email: string) => !email || typeof email !== 'string');
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: 'Format d\'email invalide pour certains participants' },
        { status: 400 }
      );
    }

    console.log('📧 Emails participants validés:', body.participants);

    // Récupérer l'email du créateur
    const creatorEmail = body.creatorEmail || body.participants[0];
    console.log('👑 Créateur de la réunion:', creatorEmail);

    // Vérifier/créer l'utilisateur créateur
    let creatorUser = await prisma.user.findUnique({
      where: { email: creatorEmail }
    });

    if (!creatorUser) {
      console.log('➕ Création du créateur:', creatorEmail);
      // Créer un mot de passe par défaut hashé
      const defaultPassword = await bcrypt.hash('defaultPassword123', 12);
      
      creatorUser = await prisma.user.create({
        data: {
          email: creatorEmail,
          name: creatorEmail.split('@')[0],
          role: 'EMPLOYEE',
          password: defaultPassword,
          isActive: true
        }
      });
      console.log('✅ Créateur créé:', creatorUser.id);
    }

    // Gestion robuste des participants
    const participantsToConnect = await Promise.all(
      body.participants.map(async (email: string) => {
        console.log('🔍 Recherche utilisateur pour:', email);
        
        let existingUser = await prisma.user.findUnique({
          where: { email: email }
        });

        console.log('👤 Utilisateur existant:', existingUser ? 'OUI' : 'NON');

        if (!existingUser) {
          console.log('➕ Création nouvel utilisateur:', email);
          try {
            // Créer un mot de passe par défaut hashé
            const defaultPassword = await bcrypt.hash('defaultPassword123', 12);
            
            existingUser = await prisma.user.create({
              data: {
                email: email,
                name: email.split('@')[0],
                role: 'EMPLOYEE',
                password: defaultPassword,
                isActive: true
              }
            });
            console.log('✅ Utilisateur créé:', existingUser.id);
          } catch (createError) {
            console.error('❌ Erreur création utilisateur:', createError);
            throw new Error(`Impossible de créer l'utilisateur ${email}`);
          }
        }

        return { id: existingUser.id };
      })
    );

    console.log('👥 Participants à connecter:', participantsToConnect);

    // Formater correctement la date
    let scheduledTime;
    try {
      let timeString = body.scheduledTime;
      if (timeString.includes('.0002')) {
        timeString = timeString.replace('.0002', '.000Z');
        console.log('🕒 Date corrigée:', timeString);
      }
      scheduledTime = new Date(timeString);
      
      if (isNaN(scheduledTime.getTime())) {
        throw new Error('Date invalide');
      }
    } catch (error) {
      console.error('❌ Erreur format date:', error);
      return NextResponse.json(
        { error: 'Format de date invalide. Utilisez le format ISO (ex: 2025-11-19T12:00:00.000Z)' },
        { status: 400 }
      );
    }

    // ========== CRÉATION DE LA RÉUNION ==========
    const meeting = await prisma.meeting.create({
      data: {
        title: body.title,
        description: body.description || '',
        scheduledTime: scheduledTime,
        duration: parseInt(body.duration) || 30,
        status: 'PLANNED',
        createdById: creatorUser.id,
        participants: {
          connect: participantsToConnect
        }
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } }
      }
    });

    console.log('✅ Réunion créée avec succès:', {
      id: meeting.id,
      title: meeting.title,
      createdBy: meeting.createdBy.email,
      participantsCount: meeting.participants.length
    });

    // ========== ENVOI DES NOTIFICATIONS ==========
    try {
      console.log('📨 Préparation envoi notifications...');
      
      // Filtrer les participants à notifier (exclure le créateur)
      const participantsToNotify = body.participants
        .filter((email: string) => email !== creatorEmail)
        .filter(Boolean); // Supprimer les valeurs vides
      
      console.log('👥 Participants à notifier:', participantsToNotify);
      
      if (participantsToNotify.length > 0) {
        console.log('🚀 Envoi des notifications...');
        
        await NotificationService.sendMeetingInvitation(
          meeting.id,
          creatorEmail,
          participantsToNotify,
          {
            title: body.title,
            scheduledTime: scheduledTime,
            duration: parseInt(body.duration) || 30,
            description: body.description || '',
          }
        );
        
        console.log('✅ Notifications envoyées avec succès');
      } else {
        console.log('ℹ️ Aucun participant à notifier (seulement le créateur)');
      }
    } catch (notificationError) {
      console.error('⚠️ Erreur lors de l\'envoi des notifications:', notificationError);
      // Ne pas bloquer la création de la réunion si les notifications échouent
    }

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('❌ Erreur POST /api/meetings:', error);
    return NextResponse.json(
      { error: 'Erreur création réunion: ' + (error as Error).message },
      { status: 500 }
    );
  }
}