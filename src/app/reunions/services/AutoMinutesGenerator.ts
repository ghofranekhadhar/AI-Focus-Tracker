// src/app/reunions/services/AutoMinutesGenerator.ts
import { prisma } from '@/src/lib/db';

export interface MeetingMinutesData {
  meetingId: string;
  title: string;
  scheduledTime: Date;
  duration: number;
  location?: string;
  createdBy: {
    name: string;
    email: string;
  };
  participants: Array<{
    name: string;
    email: string;
  }>;
  agenda?: Array<{
    item: string;
    presenter?: string;
    duration?: number;
  }>;
  decisions?: Array<{
    decision: string;
    responsible?: string;
    deadline?: string;
  }>;
  actionItems?: Array<{
    task: string;
    responsible: string;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  nextSteps?: string[];
  chatMessages?: Array<{
    sender: string;
    message: string;
    time: string;
  }>;
  attendance?: Array<{
    name: string;
    present: boolean;
    joinedAt?: string;
    leftAt?: string;
  }>;
}

export class AutoMinutesGenerator {
  
  static async getMeetingDataForMinutes(meetingId: string): Promise<MeetingMinutesData> {
    try {
      console.log('🔍 Récupération données pour PV:', meetingId);
      
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          createdBy: { select: { name: true, email: true } },
          participants: { select: { name: true, email: true } }
        }
      });

      if (!meeting) {
        throw new Error('Réunion non trouvée');
      }

      console.log('📦 Données brutes de la réunion:', {
        id: meeting.id,
        agendaRaw: meeting.agenda,
        decisionsRaw: meeting.decisions,
        actionItemsRaw: meeting.actionItems
      });


const parseJsonField = (field: any, name?: string): any[] => {  
  if (name) {
    console.log(`🔧 Parsing ${name}:`, field);
  }
  
  if (field == null) {
    if (name) console.log(`➡️ ${name}: champ vide`);
    return [];
  }
  
  // Si c'est déjà un tableau
  if (Array.isArray(field)) {
    if (name) console.log(`✅ ${name}: déjà un tableau (${field.length} éléments)`);
    return field;
  }
  
  // Si c'est une string
  if (typeof field === 'string') {
    try {
      const trimmed = field.trim();
      if (trimmed === '') {
        if (name) console.log(`➡️ ${name}: string vide`);
        return [];
      }
      
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (name) console.log(`✅ ${name}: string JSON parsée`);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      
      // String simple
      if (name) console.log(`⚠️ ${name}: string simple, création tableau`);
      return [{ value: trimmed }];
      
    } catch (error) {
      if (name) console.error(`❌ Erreur parsing ${name}:`, error);
      return [{ value: field }];
    }
  }
  
  // Si c'est un objet
  if (typeof field === 'object') {
    if (name) console.log(`✅ ${name}: objet détecté, mise en tableau`);
    return [field];
  }
  
  // Autres types
  if (name) console.log(`⚠️ ${name}: type inconnu (${typeof field})`);
  return [];
};

      const agenda = parseJsonField((meeting as any).agenda, 'agenda');
      const decisions = parseJsonField((meeting as any).decisions, 'decisions');
      const actionItems = parseJsonField((meeting as any).actionItems, 'actionItems');

      console.log('📊 Résumé parsing:', {
        agenda: agenda.length,
        decisions: decisions.length,
        actionItems: actionItems.length
      });

      const attendance = await this.getAttendanceData(meetingId);
      const chatMessages = await this.getChatMessages(meetingId);

      return {
        meetingId: meeting.id,
        title: meeting.title,
        scheduledTime: meeting.scheduledTime,
        duration: meeting.duration,
        location: (meeting as any).location,
        createdBy: {
          name: meeting.createdBy.name,
          email: meeting.createdBy.email
        },
        participants: meeting.participants,
        agenda: agenda,
        decisions: decisions,
        actionItems: actionItems,
        nextSteps: Array.isArray((meeting as any).nextSteps) 
          ? (meeting as any).nextSteps 
          : [],
        chatMessages,
        attendance
      };

    } catch (error) {
      console.error('Erreur récupération données:', error);
      throw error;
    }
  }
  
  private static async getAttendanceData(meetingId: string) {
    try {
      const sessions = await prisma.session.findMany({
        where: { meetingId },
        include: {
          concentrationData: {
            include: { user: { select: { name: true } } }
          }
        }
      });

      if (sessions.length === 0) return [];

      const attendance = new Map();
      
      sessions.forEach(session => {
        session.concentrationData.forEach(data => {
          if (!attendance.has(data.userId)) {
            attendance.set(data.userId, {
              name: data.user.name,
              present: true,
              joinedAt: session.startedAt,
              leftAt: session.endedAt
            });
          }
        });
      });

      return Array.from(attendance.values());

    } catch (error) {
      console.log('Pas de données de présence disponibles');
      return [];
    }
  }

  private static async getChatMessages(meetingId: string) {
    try {
      return [];
    } catch (error) {
      console.log('Pas de messages de chat disponibles');
      return [];
    }
  }

  static async generateAutoSummary(meetingId: string): Promise<string> {
    const data = await this.getMeetingDataForMinutes(meetingId);
    
    const meetingDate = new Date(data.scheduledTime);
    
    return `
RÉSUMÉ AUTOMATIQUE - ${data.title}

📅 Date: ${meetingDate.toLocaleDateString('fr-FR')}
🕒 Heure: ${meetingDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
📍 Lieu: ${data.location || 'Non spécifié'}
👤 Organisateur: ${data.createdBy.name}

👥 PARTICIPANTS (${data.participants.length}):
${data.participants.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}

📊 PRÉSENCE:
• Total invités: ${data.participants.length}
• Présents: ${data.attendance?.length || data.participants.length}
${data.attendance?.map(a => `  ✓ ${a.name}`).join('\n') || ''}

📝 POINTS DISCUTÉS:
${data.agenda && data.agenda.length > 0 
  ? data.agenda.map((item, i) => `${i + 1}. ${typeof item === 'object' ? item.item : item}`).join('\n')
  : 'Aucun ordre du jour défini.'}

✅ DÉCISIONS PRISES:
${data.decisions && data.decisions.length > 0 
  ? data.decisions.map((decision, i) => `${i + 1}. ${typeof decision === 'object' ? decision.decision : decision}`).join('\n')
  : 'Aucune décision enregistrée.'}

🎯 ACTIONS ASSIGNÉES:
${data.actionItems && data.actionItems.length > 0 
  ? data.actionItems.map((action, i) => {
      if (typeof action === 'object') {
        return `${i + 1}. ${action.task} → ${action.responsible} (${action.deadline || 'sans date'})`;
      }
      return `${i + 1}. ${action}`;
    }).join('\n')
  : 'Aucune action assignée.'}

➡️ PROCHAINES ÉTAPES:
${data.nextSteps && data.nextSteps.length > 0 
  ? data.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')
  : 'Aucune prochaine étape définie.'}

---
*Ce résumé a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}.*
`;
  }

  static async generateFormattedMinutes(meetingId: string, organizerNotes?: string): Promise<{
    content: string;
    structuredData: MeetingMinutesData;
  }> {
    const data = await this.getMeetingDataForMinutes(meetingId);
    
    const meetingDate = new Date(data.scheduledTime);
    
    const formattedContent = `
# PROCÈS-VERBAL DE RÉUNION

## 📋 Informations générales
**Titre :** ${data.title}
**Date :** ${meetingDate.toLocaleDateString('fr-FR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
**Heure :** ${meetingDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
**Durée :** ${data.duration} minutes
**Lieu :** ${data.location || 'Non spécifié'}
**Organisateur :** ${data.createdBy.name} (${data.createdBy.email})
**Statut :** Réunion terminée

## 👥 Participants
**Total :** ${data.participants.length} participant(s)

${data.participants.map((p, i) => `${i + 1}. **${p.name}** - ${p.email || ''}`).join('\n')}

## 📊 Présence
${data.attendance && data.attendance.length > 0 
  ? `**Présents :** ${data.attendance.length}/${data.participants.length}\n` +
    data.attendance.map(a => `• ${a.name}`).join('\n')
  : 'Données de présence non disponibles.'
}

## 📝 Ordre du jour
${data.agenda && data.agenda.length > 0 
  ? data.agenda.map((item, i) => {
      if (typeof item === 'object') {
        return `**${i + 1}. ${item.item}**\n   *Animateur :* ${item.presenter || 'Non spécifié'}\n   *Durée :* ${item.duration || 'Non spécifié'} min`;
      }
      return `${i + 1}. ${item}`;
    }).join('\n\n')
  : 'Aucun ordre du jour défini.'
}

## ✅ Décisions prises
${data.decisions && data.decisions.length > 0 
  ? data.decisions.map((decision, i) => {
      if (typeof decision === 'object') {
        return `**Décision ${i + 1} :** ${decision.decision}\n   *Responsable :* ${decision.responsible || 'Non assigné'}\n   *Échéance :* ${decision.deadline || 'Non définie'}`;
      }
      return `${i + 1}. ${decision}`;
    }).join('\n\n')
  : 'Aucune décision enregistrée.'
}

## 🎯 Actions assignées
${data.actionItems && data.actionItems.length > 0 
  ? data.actionItems.map((action, i) => {
      if (typeof action === 'object') {
        const priorityEmoji = {
          high: '🔴',
          medium: '🟡', 
          low: '🟢'
        }[action.priority] || '⚪';
        
        return `**Action ${i + 1} :** ${action.task}\n   *Responsable :* ${action.responsible}\n   *Échéance :* ${action.deadline}\n   *Priorité :* ${priorityEmoji} ${action.priority}`;
      }
      return `${i + 1}. ${action}`;
    }).join('\n\n')
  : 'Aucune action assignée.'
}

## ➡️ Prochaines étapes
${data.nextSteps && data.nextSteps.length > 0 
  ? data.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')
  : 'Aucune prochaine étape définie.'
}

## 📝 Notes de l'organisateur
${organizerNotes || 'Aucune note supplémentaire.'}

---

*Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.*  
*ID de référence : ${data.meetingId}*
`;

    return {
      content: formattedContent,
      structuredData: data
    };
  }
}