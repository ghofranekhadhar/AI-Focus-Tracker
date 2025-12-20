// src/app/api/meetings/check-conflicts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduledTime, duration, participants, excludeMeetingId } = body;

    if (!scheduledTime || !participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const startTime = new Date(scheduledTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Trouver tous les utilisateurs par email
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: participants
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({
        hasConflict: false,
        conflictingParticipants: [],
        conflictingMeeting: null
      });
    }

    const userIds = users.map(user => user.id);

    // Récupérer toutes les réunions où ces utilisateurs sont participants
    const allMeetings = await prisma.meeting.findMany({
      where: {
        participants: {
          some: {
            id: {
              in: userIds
            }
          }
        }
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        participants: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    const conflictingParticipants = new Set<string>();
    let conflictingMeeting = null;

    for (const meeting of allMeetings) {
      // Exclure la réunion en cours d'édition si nécessaire
      if (excludeMeetingId && meeting.id === excludeMeetingId) {
        continue;
      }

      const meetingStart = new Date(meeting.scheduledTime);
      const meetingEnd = new Date(meetingStart.getTime() + meeting.duration * 60000);

      // Vérifier le chevauchement EXACT (même créneau)
      const hasExactConflict = (
        // La nouvelle réunion commence pendant une réunion existante
        (startTime >= meetingStart && startTime < meetingEnd) ||
        // La nouvelle réunion finit pendant une réunion existante
        (endTime > meetingStart && endTime <= meetingEnd) ||
        // La nouvelle réunion englobe complètement une réunion existante
        (startTime <= meetingStart && endTime >= meetingEnd)
      );

      if (hasExactConflict) {
        // Trouver les participants communs
        const meetingParticipantEmails = meeting.participants.map(p => p.email);
        const commonParticipants = participants.filter(p => 
          meetingParticipantEmails.includes(p)
        );
        
        if (commonParticipants.length > 0) {
          commonParticipants.forEach(p => conflictingParticipants.add(p));
          
          if (!conflictingMeeting) {
            conflictingMeeting = {
              id: meeting.id,
              title: meeting.title,
              scheduledTime: meeting.scheduledTime,
              duration: meeting.duration,
              participants: meetingParticipantEmails,
              creator: meeting.createdBy,
              startTime: meetingStart,
              endTime: meetingEnd
            };
          }
        }
      }
    }

    return NextResponse.json({
      hasConflict: conflictingParticipants.size > 0,
      conflictingParticipants: Array.from(conflictingParticipants),
      conflictingMeeting
    });

  } catch (error) {
    console.error('❌ Error checking meeting conflicts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification des conflits' },
      { status: 500 }
    );
  }
}