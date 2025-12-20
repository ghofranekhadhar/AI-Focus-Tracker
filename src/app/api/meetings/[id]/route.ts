// src/app/api/meetings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

// ATTENTION : Dans Next.js 15+, params est maintenant une Promise
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    console.log('📍 GET /api/meetings/[id] - ID:', id);
    
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } },
        sessions: { 
          include: { 
            concentrationData: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            }
          } 
        }
      }
    });
    
    if (!meeting) {
      console.log('❌ Réunion non trouvée:', id);
      return NextResponse.json(
        { error: 'Réunion non trouvée' },
        { status: 404 }
      );
    }
    
    // ============ AJOUTER CETTE SECTION ============
    // Vérifier les champs PDF
    const hasPDFFields = {
      location: 'location' in meeting,
      agenda: 'agenda' in meeting,
      decisions: 'decisions' in meeting,
      actionItems: 'actionItems' in meeting,
      nextSteps: 'nextSteps' in meeting
    };
    
    console.log('📊 Champs PDF présents:', hasPDFFields);
    
    // Préparer les données avec valeurs par défaut
    const parseJSONField = (field: any): any[] => {
  console.log('🔍 Parsing field (GET):', { 
    type: typeof field, 
    isArray: Array.isArray(field),
    raw: field
  });
  
  if (field == null) return [];
  
  // 1. Si c'est déjà un tableau
  if (Array.isArray(field)) {
    console.log('✅ Déjà un tableau:', field.length, 'éléments');
    return field;
  }
  
  // 2. Si c'est une string
  if (typeof field === 'string') {
    try {
      const trimmed = field.trim();
      if (trimmed === '') return [];
      
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        console.log('✅ String JSON parsée');
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      
      // String simple
      console.log('⚠️ String simple, création tableau');
      return [{ value: trimmed }];
      
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      return [{ value: field }];
    }
  }
  
  // 3. Si c'est un objet
  if (typeof field === 'object') {
    console.log('✅ Objet détecté, mise en tableau');
    return [field];
  }
  
  // 4. Autres types
  console.log('⚠️ Type inconnu:', typeof field);
  return [];
};

// Préparer les données avec la fonction de parsing
const meetingWithPDFData = {
  ...meeting,
  location: (meeting as any).location || 'Non spécifié',
  agenda: parseJSONField((meeting as any).agenda),
  decisions: parseJSONField((meeting as any).decisions),
  actionItems: parseJSONField((meeting as any).actionItems),
  nextSteps: (meeting as any).nextSteps || []
};









    // ============ FIN AJOUT ============
    
    console.log('✅ Réunion trouvée:', meeting.id);
    return NextResponse.json(meetingWithPDFData); // ← CHANGER meeting en meetingWithPDFData
    
  } catch (error) {
    console.error('❌ Erreur GET /api/meetings/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réunion' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    const body = await request.json();
    console.log('📍 PUT /api/meetings/[id] - Données reçues:', body);
    console.log('📍 ID réunion:', id);
    
    // Vérifier que la réunion existe
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    });
    
    if (!existingMeeting) {
      console.log('❌ Réunion non trouvée pour modification:', id);
      return NextResponse.json(
        { error: 'Réunion non trouvée' },
        { status: 404 }
      );
    }

    console.log('📍 Réunion existante - Statut actuel:', existingMeeting.status);

    // Gestion des participants pour la modification
    let participantsUpdate = {};
    
    if (body.participants && Array.isArray(body.participants)) {
      console.log('👥 Mise à jour des participants:', body.participants);
      
      // Valider les emails
      const invalidEmails = body.participants.filter((email: string) => !email || typeof email !== 'string');
      if (invalidEmails.length > 0) {
        return NextResponse.json(
          { error: 'Format d\'email invalide pour certains participants' },
          { status: 400 }
        );
      }

      // Trouver ou créer les utilisateurs
      const participantsToConnect = await Promise.all(
        body.participants.map(async (email: string) => {
          console.log('🔍 Recherche utilisateur pour modification:', email);
          
          let existingUser = await prisma.user.findUnique({
            where: { email: email }
          });

          // Créer l'utilisateur avec un mot de passe par défaut
          if (!existingUser) {
            console.log('➕ Création nouvel utilisateur pour modification:', email);
            
            // Générer un mot de passe temporaire
            const temporaryPassword = Math.random().toString(36).slice(-8);
            
            existingUser = await prisma.user.create({
              data: {
                email: email,
                name: email.split('@')[0],
                role: 'EMPLOYEE',
                password: temporaryPassword
              }
            });
            
            console.log('📝 Utilisateur créé avec mot de passe temporaire:', email);
          }

          return { id: existingUser.id };
        })
      );

      participantsUpdate = {
        participants: {
          set: [],
          connect: participantsToConnect
        }
      };
      
      console.log('✅ Participants à mettre à jour:', participantsToConnect);
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      ...participantsUpdate
    };
    
    // Ajouter seulement les champs qui sont fournis
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration !== undefined) updateData.duration = parseInt(body.duration);
    if (body.status !== undefined) {
      updateData.status = body.status;
      console.log('🔄 Changement de statut:', existingMeeting.status, '→', body.status);
    }
    if (body.scheduledTime !== undefined) {
      try {
        updateData.scheduledTime = new Date(body.scheduledTime);
      } catch (error) {
        console.error('❌ Erreur format date:', error);
        return NextResponse.json(
          { error: 'Format de date invalide' },
          { status: 400 }
        );
      }
    }
    if (body.concentrationScore !== undefined) updateData.concentrationScore = parseFloat(body.concentrationScore);
    
    // ============ AJOUTER CES LIGNES POUR LES CHAMPS PDF ============
    if (body.location !== undefined) updateData.location = body.location;
    if (body.agenda !== undefined) updateData.agenda = body.agenda; // Prisma gère le JSON
    if (body.decisions !== undefined) updateData.decisions = body.decisions;
    if (body.actionItems !== undefined) updateData.actionItems = body.actionItems;
    if (body.nextSteps !== undefined) updateData.nextSteps = body.nextSteps;
    // ============ FIN AJOUT ============

    console.log('📍 Données de mise à jour complètes:', updateData);

    // Mise à jour avec gestion d'erreur
    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } }
      }
    });
    
console.log('✅ Réunion mise à jour avec succès:', {
  id: meeting.id,
  title: meeting.title,
  status: meeting.status,
  participantsCount: meeting.participants.length,
  hasLocation: !!(meeting as any).location,
  hasAgenda: !!(meeting as any).agenda,
  hasDecisions: !!(meeting as any).decisions,
  hasActionItems: !!(meeting as any).actionItems,
  hasNextSteps: Array.isArray((meeting as any).nextSteps) && (meeting as any).nextSteps.length > 0
});
    
    return NextResponse.json(meeting);
    
  } catch (error) {
    console.error('❌ Erreur PUT /api/meetings/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la réunion: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // D'abord attendre params
    const params = await context.params;
    const id = params.id;
    
    console.log('📍 DELETE /api/meetings/[id] - ID:', id);
    
    // Vérifier d'abord si la réunion existe
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    });
    
    if (!existingMeeting) {
      console.log('❌ Réunion non trouvée pour suppression:', id);
      return NextResponse.json(
        { error: 'Réunion non trouvée' },
        { status: 404 }
      );
    }

    console.log('🗑️ Suppression de la réunion:', existingMeeting.title);
    
    // Supprimer la réunion
    await prisma.meeting.delete({
      where: { id }
    });
    
    console.log('✅ Réunion supprimée avec succès:', id);
    return NextResponse.json({ 
      success: true, 
      message: 'Réunion supprimée avec succès' 
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE /api/meetings/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réunion: ' + (error as Error).message },
      { status: 500 }
    );
  }
}