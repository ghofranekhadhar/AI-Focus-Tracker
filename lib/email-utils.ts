import { createTransport } from 'nodemailer';

// Configuration du transporteur email avec ignore SSL
const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // ⚠️ Désactive la vérification SSL (pour développement seulement)
    rejectUnauthorized: false
  }
});

export async function sendInvitationEmail(
  email: string, 
  invitationToken: string, 
  inviterName: string
): Promise<void> {
  const activationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${invitationToken}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Invitation à rejoindre AIFocus',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenue sur AIFocus !</h2>
        <p>Bonjour,</p>
        <p><strong>${inviterName}</strong> vous a invité à rejoindre la plateforme AIFocus.</p>
        <p>Pour activer votre compte et choisir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Activer mon compte
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <em>Ce lien d'activation expirera dans 7 jours.</em>
        </p>
      </div>
    `,
  };

  try {
    await transporter.verify();
    console.log('✅ Configuration SMTP valide');
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à: ${email}`, info.messageId);
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
}

export async function testSMTPConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie');
    return true;
  } catch (error) {
    console.error('❌ Échec connexion SMTP:', error);
    return false;
  }
}