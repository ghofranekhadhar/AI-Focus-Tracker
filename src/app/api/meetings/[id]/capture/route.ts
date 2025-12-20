// src/app/api/meetings/[id]/capture/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const meetingId = params.id;
    const body = await request.json();
    
    const { 
      type,  // 'decision' | 'task' | 'agenda'
      content,
      responsible,
      deadline
    } = body;
    
    console.log('🎯 CAPTURE DÉBUT:', { meetingId, type, content });
    
    if (!content || !type) {
      return NextResponse.json(
        { error: 'Contenu et type requis' },
        { status: 400 }
      );
    }
    
    // 1. Récupérer la réunion AVEC les données actuelles
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        agenda: true,
        decisions: true,
        actionItems: true
      }
    });



    console.log('🔍 TYPES des données actuelles:', {
  agendaType: typeof meeting.agenda,
  agendaValue: meeting.agenda,
  decisionsType: typeof meeting.decisions, 
  decisionsValue: meeting.decisions,
  actionItemsType: typeof meeting.actionItems,
  actionItemsValue: meeting.actionItems
});


    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Réunion non trouvée' },
        { status: 404 }
      );
    }
    
    // 2. Fonction de parsing RENFORCÉE
    const parseJSONField = (field: any): any[] => {
      console.log('🔍 Parsing field:', { 
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
    
    // 3. LIRE les données actuelles
    const currentAgenda = parseJSONField(meeting.agenda);
    const currentDecisions = parseJSONField(meeting.decisions);
    const currentActionItems = parseJSONField(meeting.actionItems);
    
    console.log('📊 Données actuelles:', {
      agenda: currentAgenda.length,
      decisions: currentDecisions.length,
      actionItems: currentActionItems.length
    });
    
    // 4. CRÉER le nouvel élément
    const timestamp = new Date();
    let updateData: any = {};
    let newItem: any;
    
    switch(type) {
      case 'decision':
        newItem = {
          id: `decision_${Date.now()}`,
          decision: content,
          responsible: responsible || '',
          deadline: deadline || '',
          timestamp: timestamp.toISOString()
        };
        
        const updatedDecisions = [...currentDecisions, newItem];
        console.log('➕ Nouvelle décision ajoutée, total:', updatedDecisions.length);
        
        updateData = {
          decisions: updatedDecisions  // ← Tableau JavaScript, Prisma le convertira
        };
        break;
        
      case 'task':
        newItem = {
          id: `task_${Date.now()}`,
          task: content,
          responsible: responsible || '',
          deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'medium',
          timestamp: timestamp.toISOString()
        };
        
        const updatedTasks = [...currentActionItems, newItem];
        console.log('➕ Nouvelle tâche ajoutée, total:', updatedTasks.length);
        
        updateData = {
          actionItems: updatedTasks
        };
        break;
        
      case 'agenda':
        newItem = {
          id: `agenda_${Date.now()}`,
          item: content,
          presenter: responsible || '',
          duration: 10,
          timestamp: timestamp.toISOString()
        };
        
        const updatedAgenda = [...currentAgenda, newItem];
        console.log('➕ Nouveau point agenda ajouté, total:', updatedAgenda.length);
        
        updateData = {
          agenda: updatedAgenda
        };
        break;




        
        
      default:
        return NextResponse.json(
          { error: 'Type non supporté' },
          { status: 400 }
        );

        
    }
    
console.log('🔍 FORMAT du nouvel item:', {
  newItemType: typeof newItem,
  newItem: newItem,
  updatedData: updateData
});

    
    // 5. SAUVEGARDER avec Prisma
    console.log('💾 Données à sauvegarder:', JSON.stringify(updateData, null, 2));
    
    // ESSAYEZ les deux méthodes :
    try {
      // Méthode 1 : Directement
      const result = await prisma.meeting.update({
  where: { id: meetingId },
  data: updateData  // ← Directement, sans stringify
});
      
      console.log('✅ Prisma update réussi');
      
    } catch (prismaError) {
      console.error('❌ Erreur Prisma:', prismaError);
      
      // Méthode 2 : Forcer avec JSON.stringify
    const stringifiedData = Object.keys(updateData).reduce((acc, key) => {
  const value = updateData[key];
  // Si c'est déjà une string, la garder
  if (typeof value === 'string') {
    acc[key] = value;
  } else {
    // Sinon stringifier
    acc[key] = JSON.stringify(value);
  }
  return acc;
}, {} as any);
      
      console.log('🔄 Tentative avec stringify:', stringifiedData);
      
      await prisma.meeting.update({
        where: { id: meetingId },
        data: stringifiedData
      });
      
      console.log('✅ Update avec stringify réussi');
    }
    


    // Ajoutez APRÈS la sauvegarde Prisma (ligne ~200) :

console.log('🔍 VERIFICATION BASE DE DONNÉES:');
const dbCheck = await prisma.meeting.findUnique({
  where: { id: meetingId },
  select: { 
    agenda: true, 
    decisions: true, 
    actionItems: true 
  }
});

console.log('📊 DONNÉES EN BASE:', {
  agenda: dbCheck?.agenda,
  decisions: dbCheck?.decisions,
  actionItems: dbCheck?.actionItems
});






    // 6. VÉRIFIER la sauvegarde
    const verification = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        agenda: true,
        decisions: true,
        actionItems: true
      }
    });
    
    console.log('🔍 Vérification finale:', {
      agenda: parseJSONField(verification?.agenda).length,
      decisions: parseJSONField(verification?.decisions).length,
      actionItems: parseJSONField(verification?.actionItems).length
    });
    
    return NextResponse.json({
      success: true,
      message: `${type} capturé avec succès`,
      data: newItem,
      counts: {
        agenda: parseJSONField(verification?.agenda).length,
        decisions: parseJSONField(verification?.decisions).length,
        actionItems: parseJSONField(verification?.actionItems).length
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR CAPTURE:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la capture',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );


    
    
  }
}