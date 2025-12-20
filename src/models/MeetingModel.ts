import { prisma } from '@/lib/db'
import { CreateMeetingData, UpdateMeetingData } from './meeting-types'

export class MeetingModel {
  // Créer une réunion
  static async create(data: CreateMeetingData) {
    return await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        scheduledTime: new Date(data.scheduledTime),
        duration: data.duration,
        createdById: data.createdById,
        participants: data.participantIds ? {
          connect: data.participantIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } }
      }
    })
  }

  // Récupérer toutes les réunions
  static async findAll() {
    return await prisma.meeting.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } },
        sessions: { select: { id: true, startedAt: true, endedAt: true } }
      },
      orderBy: { scheduledTime: 'desc' }
    })
  }

  // Récupérer une réunion par ID
  static async findById(id: string) {
    return await prisma.meeting.findUnique({
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
    })
  }

  // Mettre à jour une réunion
  static async update(id: string, data: UpdateMeetingData) {
    return await prisma.meeting.update({
      where: { id },
      data: {
        ...data,
        scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true, email: true } }
      }
    })
  }

  // Supprimer une réunion
  static async delete(id: string) {
    return await prisma.meeting.delete({
      where: { id }
    })
  }
}