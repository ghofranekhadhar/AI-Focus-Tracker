import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendInviteEmail(to: string, link: string) {
  await transporter.sendMail({
    from: `"AI Focus Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Invitation à rejoindre AI Focus Tracker",
    html: `
      <p>Bonjour 👋,</p>
      <p>Vous avez été invité à rejoindre l'équipe <b>AI Focus Tracker</b>.</p>
      <p>Veuillez cliquer sur le lien ci-dessous pour compléter votre inscription :</p>
      <p><a href="${link}" target="_blank">${link}</a></p>
      <p>Ce lien est valable 24 heures.</p>
    `,
  });
}
