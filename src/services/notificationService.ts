import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export class NotificationService {
  // Envoyer une notification d'invitation à une réunion
  static async sendMeetingInvitation(
    meetingId: string,
    creatorEmail: string,
    participantEmails: string[],
    meetingData: {
      title: string;
      scheduledTime: Date;
      duration: number;
      description?: string;
    }
  ) {
    try {
      // 1. Créer des notifications dans la base de données
      const notifications = await this.createMeetingNotifications(
        meetingId,
        creatorEmail,
        participantEmails,
        meetingData
      );

      // 2. Envoyer des emails aux participants
      await this.sendInvitationEmails(
        participantEmails,
        creatorEmail,
        meetingData
      );

      return notifications;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      throw error;
    }
  }

  // Créer des notifications dans la base de données
  private static async createMeetingNotifications(
    meetingId: string,
    creatorEmail: string,
    participantEmails: string[],
    meetingData: {
      title: string;
      scheduledTime: Date;
      duration: number;
      description?: string;
    }
  ) {
    const notifications = [];

    for (const participantEmail of participantEmails) {
      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email: participantEmail },
      });

      if (user) {
        // Vérifier si une notification existe déjà
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            meetingId: meetingId,
            type: 'MEETING_INVITATION',
          },
        });

        if (!existingNotification) {
          const notification = await prisma.notification.create({
            data: {
              userId: user.id,
              meetingId: meetingId,
              type: 'MEETING_INVITATION',
              title: 'Nouvelle invitation à une réunion',
              message: `${creatorEmail} vous a invité à la réunion "${meetingData.title}"`,
              isRead: false,
              metadata: {
                meetingTitle: meetingData.title,
                scheduledTime: meetingData.scheduledTime,
                duration: meetingData.duration,
                creatorEmail: creatorEmail,
                description: meetingData.description,
              },
            },
          });
          notifications.push(notification);
        }
      }
    }

    return notifications;
  }

  // Envoyer des emails d'invitation
  private static async sendInvitationEmails(
    participantEmails: string[],
    creatorEmail: string,
    meetingData: {
      title: string;
      scheduledTime: Date;
      duration: number;
      description?: string;
    }
  ) {
    const formattedDate = new Date(meetingData.scheduledTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const durationHours = Math.floor(meetingData.duration / 60);
    const durationMinutes = meetingData.duration % 60;
    const durationText = durationHours > 0 
      ? `${durationHours}h${durationMinutes > 0 ? durationMinutes : ''}`
      : `${durationMinutes} min`;

    for (const email of participantEmails) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"AI Focus Tracker" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Invitation à la réunion: ${meetingData.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">AI Focus Tracker</h1>
              </div>
              
              <div style="padding: 30px; background-color: #f9fafb;">
                <h2 style="color: #374151; margin-bottom: 20px;">📅 Nouvelle invitation à une réunion</h2>
                
                <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="color: #111827; margin-top: 0;">${meetingData.title}</h3>
                  
                  ${meetingData.description ? `<p style="color: #6b7280; margin-bottom: 20px;">${meetingData.description}</p>` : ''}
                  
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div>
                      <p style="color: #6b7280; margin: 0; font-size: 14px;">📅 Date et heure</p>
                      <p style="color: #111827; margin: 5px 0 0 0; font-weight: 500;">${formattedDate}</p>
                    </div>
                    
                    <div>
                      <p style="color: #6b7280; margin: 0; font-size: 14px;">⏱️ Durée</p>
                      <p style="color: #111827; margin: 5px 0 0 0; font-weight: 500;">${durationText}</p>
                    </div>
                    
                    <div>
                      <p style="color: #6b7280; margin: 0; font-size: 14px;">👤 Organisateur</p>
                      <p style="color: #111827; margin: 5px 0 0 0; font-weight: 500;">${creatorEmail}</p>
                    </div>
                  </div>
                  
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                      Vous avez été invité à participer à cette réunion. Consultez votre tableau de bord pour plus de détails.
                    </p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reunions" 
                       style="display: inline-block; background-color: #3b82f6; color: white; 
                              padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                              font-weight: 500; margin-top: 10px;">
                      Voir la réunion
                    </a>
                  </div>
                </div>
                
                <div style="color: #6b7280; font-size: 12px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p>Cet email a été envoyé par AI Focus Tracker. Pour gérer vos notifications, 
                     <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/notifications" style="color: #3b82f6;">cliquez ici</a>.</p>
                </div>
              </div>
            </div>
          `,
        });
        console.log(`✅ Email d'invitation envoyé à ${email}`);
      } catch (emailError) {
        console.error(`❌ Erreur lors de l'envoi de l'email à ${email}:`, emailError);
      }
    }
  }

  // Récupérer les notifications non lues d'un utilisateur
  static async getUnreadNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledTime: true,
          },
        },
      },
    });
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { 
        userId, 
        isRead: false 
      },
      data: { isRead: true },
    });
  }

  // Récupérer toutes les notifications d'un utilisateur
  static async getAllNotifications(userId: string, limit: number = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledTime: true,
          },
        },
      },
    });
  }
}