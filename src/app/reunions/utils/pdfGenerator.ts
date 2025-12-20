// src/app/reunions/utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

// Types améliorés
export interface MeetingPDFData {
  id: string;
  title: string;
  scheduledTime: string;
  createdBy: {
    name: string;
    email?: string;
    department?: string;
  };
  participants: Array<{
    name: string;
    email?: string;
    role?: string;
    department?: string;
  }>;
  duration?: number;
  location?: string;
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
  recordings?: RecordingPDFData[];
}

export interface RecordingPDFData {
  fileName: string;
  duration: string;
  size: string;
  date: string;
  type: 'video' | 'audio' | 'screen';
  thumbnail?: string;
}

// Constantes de design professionnel - CORRIGÉES pour TypeScript
const DESIGN_CONFIG = {
  colors: {
    primary: [41, 128, 185] as [number, number, number],    // Bleu professionnel
    secondary: [52, 152, 219] as [number, number, number],  // Bleu clair
    accent: [46, 204, 113] as [number, number, number],     // Vert
    dark: [44, 62, 80] as [number, number, number],         // Bleu foncé
    light: [236, 240, 241] as [number, number, number],     // Gris clair
    gray: [149, 165, 166] as [number, number, number],      // Gris
    white: [255, 255, 255] as [number, number, number],
    warning: [231, 76, 60] as [number, number, number],     // Rouge
    highlight: [241, 196, 15] as [number, number, number]   // Jaune
  },
  fonts: {
    title: 'helvetica',
    subtitle: 'helvetica',
    body: 'helvetica'
  },
  spacing: {
    margin: 20,
    padding: 10,
    lineHeight: 1.5
  }
};

// Fonctions utilitaires pour un meilleur rendu - CORRIGÉES
const addProfessionalHeader = (doc: jsPDF, title: string, subtitle?: string): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Rectangle d'en-tête
  doc.setFillColor(DESIGN_CONFIG.colors.primary[0], DESIGN_CONFIG.colors.primary[1], DESIGN_CONFIG.colors.primary[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Titre
  doc.setTextColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
  doc.setFontSize(16);
  doc.setFont(DESIGN_CONFIG.fonts.title, 'bold');
  doc.text(title, DESIGN_CONFIG.spacing.margin, 25);
  
  // Sous-titre si présent
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont(DESIGN_CONFIG.fonts.subtitle, 'normal');
    doc.text(subtitle, DESIGN_CONFIG.spacing.margin, 32);
  }
  
  return 50;
};

const addSectionHeader = (doc: jsPDF, text: string, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(DESIGN_CONFIG.colors.light[0], DESIGN_CONFIG.colors.light[1], DESIGN_CONFIG.colors.light[2]);
  doc.rect(0, y, pageWidth, 25, 'F');
  
  doc.setTextColor(DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]);
  doc.setFontSize(12);
  doc.setFont(DESIGN_CONFIG.fonts.title, 'bold');
  doc.text(text, DESIGN_CONFIG.spacing.margin, y + 16);
  
  return y + 30;
};

const addInfoCard = (
  doc: jsPDF, 
  label: string, 
  value: string, 
  x: number, 
  y: number, 
  width: number = 85
): void => {
  // Fond de la carte
  doc.setFillColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
  doc.setDrawColor(DESIGN_CONFIG.colors.light[0], DESIGN_CONFIG.colors.light[1], DESIGN_CONFIG.colors.light[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, 30, 3, 3, 'FD');
  
  // Label
  doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
  doc.setFontSize(8);
  doc.setFont(DESIGN_CONFIG.fonts.body, 'normal');
  doc.text(label, x + 10, y + 10);
  
  // Valeur
  doc.setTextColor(DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]);
  doc.setFontSize(10);
  doc.setFont(DESIGN_CONFIG.fonts.body, 'bold');
  doc.text(value, x + 10, y + 20);
};

/**
 * Génère un PDF professionnel pour une réunion - VERSION CORRIGÉE
 */
export const generateProfessionalMeetingPDF = (
  meetingData: MeetingPDFData,
  includeRecordings: boolean = true
): { pdf: jsPDF; blob: Blob; fileName: string } => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // ===== PAGE 1 : PAGE DE COUVERTURE =====
  doc.setFillColor(DESIGN_CONFIG.colors.primary[0], DESIGN_CONFIG.colors.primary[1], DESIGN_CONFIG.colors.primary[2]);
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  // Titre principal
  doc.setTextColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
  doc.setFontSize(32);
  doc.setFont(DESIGN_CONFIG.fonts.title, 'bold');
  doc.text('PROCÈS-VERBAL', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text('DE RÉUNION', pageWidth / 2, 75, { align: 'center' });
  
  // Informations de la réunion dans un cadre élégant
  const infoBoxY = 120;
  doc.setFillColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
  doc.setDrawColor(DESIGN_CONFIG.colors.primary[0], DESIGN_CONFIG.colors.primary[1], DESIGN_CONFIG.colors.primary[2]);
  doc.setLineWidth(1);
  doc.roundedRect(30, infoBoxY, pageWidth - 60, 80, 5, 5, 'FD');
  
  // Titre de la réunion
  doc.setTextColor(DESIGN_CONFIG.colors.primary[0], DESIGN_CONFIG.colors.primary[1], DESIGN_CONFIG.colors.primary[2]);
  doc.setFontSize(16);
  doc.setFont(DESIGN_CONFIG.fonts.title, 'bold');
  const meetingTitle = doc.splitTextToSize(meetingData.title, pageWidth - 100);
  doc.text(meetingTitle, pageWidth / 2, infoBoxY + 20, { align: 'center' });
  
  // Informations détaillées
  const meetingDate = new Date(meetingData.scheduledTime);
  doc.setTextColor(DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]);
  doc.setFontSize(10);
  doc.setFont(DESIGN_CONFIG.fonts.body, 'normal');
  
  const detailsY = infoBoxY + 40;
  const col1 = 40;
  const col2 = pageWidth / 2;
  
  doc.text(`Date: ${meetingDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, col1, detailsY);
  
  doc.text(`Heure: ${meetingDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`, col1, detailsY + 8);
  
  doc.text(`Organisateur: ${meetingData.createdBy.name}`, col1, detailsY + 16);
  
  if (meetingData.location && meetingData.location !== 'Non spécifié') {
    doc.text(`Lieu: ${meetingData.location}`, col2, detailsY);
  }
  
  doc.text(`Participants: ${meetingData.participants.length}`, col2, detailsY + 8);
  
  if (meetingData.duration) {
    doc.text(`Durée: ${meetingData.duration} minutes`, col2, detailsY + 16);
  }
  
  // Référence et date de génération
  const footerY = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
  doc.text('Document confidentiel • Généré automatiquement', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Référence: ${meetingData.id}`, pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, footerY + 12, { align: 'center' });
  
  // ===== PAGE 2 : PARTICIPANTS =====
  doc.addPage();
  let yPosition = addProfessionalHeader(doc, 'Liste des Participants', `Total: ${meetingData.participants.length} participants`);
  




  
 // Tableau avec organisateur en premier
const participantsData: RowInput[] = meetingData.participants
  .sort((a, b) => {
    // Met l'organisateur en premier
    if (a.name === meetingData.createdBy.name) return -1;
    if (b.name === meetingData.createdBy.name) return 1;
    return 0;
  })
  .map((p, index) => [
    (index + 1).toString(),
    p.name,
    p.email || 'Non renseigné',
    p.name === meetingData.createdBy.name ? 'Organisateur' : (p.role || 'Participant'),
    p.department || 'Non spécifié'
  ]);
  








  autoTable(doc, {
    startY: yPosition,
    head: [['N°', 'Nom', 'Email', 'Rôle', 'Département']],
    body: participantsData,
    theme: 'striped',
    headStyles: {
      fillColor: [DESIGN_CONFIG.colors.secondary[0], DESIGN_CONFIG.colors.secondary[1], DESIGN_CONFIG.colors.secondary[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 5,
      textColor: [DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    styles: {
      lineColor: [DESIGN_CONFIG.colors.light[0], DESIGN_CONFIG.colors.light[1], DESIGN_CONFIG.colors.light[2]],
      lineWidth: 0.1
    },
    margin: { left: DESIGN_CONFIG.spacing.margin, right: DESIGN_CONFIG.spacing.margin }
  });
  
  // ===== PAGE 3 : ORDRE DU JOUR =====
  doc.addPage();
  yPosition = addProfessionalHeader(doc, 'Ordre du Jour');
  
  if (meetingData.agenda && meetingData.agenda.length > 0) {
    let agendaY = yPosition;
    
    meetingData.agenda.forEach((item, index) => {
      if (agendaY > pageHeight - 50) {
        doc.addPage();
        agendaY = 40;
      }
      
      // Carte pour chaque point de l'ordre du jour
      doc.setFillColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
      doc.setDrawColor(DESIGN_CONFIG.colors.light[0], DESIGN_CONFIG.colors.light[1], DESIGN_CONFIG.colors.light[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(DESIGN_CONFIG.spacing.margin, agendaY, pageWidth - 40, 30, 3, 3, 'FD');
      
      // Numéro
      doc.setFillColor(DESIGN_CONFIG.colors.primary[0], DESIGN_CONFIG.colors.primary[1], DESIGN_CONFIG.colors.primary[2]);
      doc.circle(DESIGN_CONFIG.spacing.margin + 15, agendaY + 15, 10, 'F');
      doc.setTextColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
      doc.setFontSize(10);
      doc.setFont(DESIGN_CONFIG.fonts.body, 'bold');
      doc.text((index + 1).toString(), DESIGN_CONFIG.spacing.margin + 15, agendaY + 18, { align: 'center' });
      
      // Contenu
      const contentX = DESIGN_CONFIG.spacing.margin + 35;
      doc.setTextColor(DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]);
      doc.setFontSize(11);
      doc.setFont(DESIGN_CONFIG.fonts.body, 'bold');
      
      const titleLines = doc.splitTextToSize(item.item, pageWidth - 80);
      doc.text(titleLines, contentX, agendaY + 12);
      
      // Métadonnées
      doc.setFontSize(9);
      doc.setFont(DESIGN_CONFIG.fonts.body, 'normal');
      doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
      
      const metaY = agendaY + 20;
      let metaText = '';
      if (item.presenter) metaText += `Animateur: ${item.presenter}`;
      if (item.duration) metaText += (metaText ? ' • ' : '') + `Durée: ${item.duration} min`;
      
      if (metaText) {
        doc.text(metaText, contentX, metaY);
      }
      
      agendaY += 40;
    });
  } else {
    doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
    doc.setFontSize(12);
    doc.setFont(DESIGN_CONFIG.fonts.body, 'italic');
    doc.text('Aucun ordre du jour n\'a été défini pour cette réunion.', 
      DESIGN_CONFIG.spacing.margin, yPosition + 30);
  }
  
  // ===== PAGE 4 : DÉCISIONS & ACTIONS =====
  doc.addPage();
  
  // Section Décisions
  if (meetingData.decisions && meetingData.decisions.length > 0) {
    yPosition = addProfessionalHeader(doc, 'Décisions Prises', `${meetingData.decisions.length} décisions`);
    
    let decisionsY = yPosition;
    
    meetingData.decisions.forEach((decision, index) => {
      if (decisionsY > pageHeight - 60) {
        doc.addPage();
        decisionsY = 40;
      }
      
      // Carte de décision
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(DESIGN_CONFIG.colors.light[0], DESIGN_CONFIG.colors.light[1], DESIGN_CONFIG.colors.light[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(DESIGN_CONFIG.spacing.margin, decisionsY, pageWidth - 40, 35, 3, 3, 'FD');
      
      // Icône de validation
      doc.setTextColor(DESIGN_CONFIG.colors.accent[0], DESIGN_CONFIG.colors.accent[1], DESIGN_CONFIG.colors.accent[2]);
      doc.setFontSize(14);
      doc.text('✓', DESIGN_CONFIG.spacing.margin + 10, decisionsY + 22);
      
      // Texte de la décision
      doc.setTextColor(DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]);
      doc.setFontSize(10);
      doc.setFont(DESIGN_CONFIG.fonts.body, 'bold');
      doc.text(`Décision ${index + 1}:`, DESIGN_CONFIG.spacing.margin + 25, decisionsY + 12);
      
      doc.setFont(DESIGN_CONFIG.fonts.body, 'normal');
      const decisionLines = doc.splitTextToSize(decision.decision, pageWidth - 80);
      doc.text(decisionLines, DESIGN_CONFIG.spacing.margin + 25, decisionsY + 20);
      
      // Responsable et échéance
      if (decision.responsible || decision.deadline) {
        doc.setFontSize(8);
        doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
        
        const infoText = [
          decision.responsible ? `Responsable: ${decision.responsible}` : '',
          decision.deadline ? `Échéance: ${decision.deadline}` : ''
        ].filter(Boolean).join(' • ');
        
        doc.text(infoText, DESIGN_CONFIG.spacing.margin + 25, decisionsY + 32);
      }
      
      decisionsY += 45;
    });
    
    yPosition = decisionsY + 10;
  }
  
  // Section Actions
  if (meetingData.actionItems && meetingData.actionItems.length > 0) {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 40;
    }
    
    addSectionHeader(doc, 'Actions Assignées', yPosition);
    yPosition += 40;
    
    const actionsData: RowInput[] = meetingData.actionItems.map((action, index) => [
      (index + 1).toString(),
      action.task,
      action.responsible,
      action.deadline,
      getPriorityLabel(action.priority)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['N°', 'Tâche', 'Responsable', 'Échéance', 'Priorité']],
      body: actionsData,
      theme: 'grid',
      headStyles: {
        fillColor: [DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: DESIGN_CONFIG.spacing.margin, right: DESIGN_CONFIG.spacing.margin }
    });
  } else {
    // Si pas de décisions ni d'actions, on peut ajouter un message
    if (!meetingData.decisions || meetingData.decisions.length === 0) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'Décisions & Actions');
      doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
      doc.setFontSize(12);
      doc.setFont(DESIGN_CONFIG.fonts.body, 'italic');
      doc.text('Aucune décision ou action n\'a été enregistrée pour cette réunion.', 
        DESIGN_CONFIG.spacing.margin, yPosition + 30);
    }
  }
  
  // ===== PAGE FINALE : RÉSUMÉ =====
  doc.addPage();
  
  // En-tête de synthèse
  doc.setFillColor(DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
  doc.setFontSize(18);
  doc.setFont(DESIGN_CONFIG.fonts.title, 'bold');
  doc.text('Synthèse de la Réunion', pageWidth / 2, 25, { align: 'center' });
  
  // Carte de statistiques
  const summaryY = 60;
  doc.setFillColor(DESIGN_CONFIG.colors.white[0], DESIGN_CONFIG.colors.white[1], DESIGN_CONFIG.colors.white[2]);
  doc.setDrawColor(DESIGN_CONFIG.colors.light[0], DESIGN_CONFIG.colors.light[1], DESIGN_CONFIG.colors.light[2]);
  doc.setLineWidth(1);
  doc.roundedRect(DESIGN_CONFIG.spacing.margin, summaryY, pageWidth - 40, 100, 5, 5, 'FD');
  
  doc.setTextColor(DESIGN_CONFIG.colors.primary[0], DESIGN_CONFIG.colors.primary[1], DESIGN_CONFIG.colors.primary[2]);
  doc.setFontSize(14);
  doc.setFont(DESIGN_CONFIG.fonts.title, 'bold');
  doc.text('Statistiques', DESIGN_CONFIG.spacing.margin + 15, summaryY + 20);
  









  
  // Liste des statistiques

  const stats = [
    { icon: '📅', label: 'Date', value: meetingDate.toLocaleDateString('fr-FR') },
    { icon: '👥', label: 'Participants', value: meetingData.participants.length.toString() },
    { icon: '⏱️', label: 'Durée', value: `${meetingData.duration || 'N/A'} minutes` },
    { icon: '📝', label: 'Points à l\'ordre du jour', value: (meetingData.agenda?.length || 0).toString() },
    { icon: '✅', label: 'Décisions prises', value: (meetingData.decisions?.length || 0).toString() },
    { icon: '🎯', label: 'Actions assignées', value: (meetingData.actionItems?.length || 0).toString() }
  ];
  





let statY = summaryY + 35;
stats.forEach(stat => {
  doc.setTextColor(DESIGN_CONFIG.colors.dark[0], DESIGN_CONFIG.colors.dark[1], DESIGN_CONFIG.colors.dark[2]);
  doc.setFontSize(10);
  doc.setFont(DESIGN_CONFIG.fonts.body, 'normal');
  
  // SOLUTION 1 : Supprimer les icônes et utiliser du texte simple
  doc.text(`${stat.label}:`, DESIGN_CONFIG.spacing.margin + 20, statY);
  
  // OU SOLUTION 2 : Utiliser des caractères ASCII simples
  // Remplacez par :
  // let iconText = '';
  // switch(stat.icon) {
  //   case '📅': iconText = '📅'; break;
  //   case '👥': iconText = '👥'; break;
  //   case '⏱️': iconText = '⏱'; break;
  //   case '📝': iconText = '📝'; break;
  //   case '✅': iconText = '✓'; break;
  //   case '🎯': iconText = '→'; break;
  //   default: iconText = '•';
  // }
  // doc.text(`${iconText} ${stat.label}:`, DESIGN_CONFIG.spacing.margin + 20, statY);
  
  doc.setFont(DESIGN_CONFIG.fonts.body, 'bold');
  doc.text(stat.value, pageWidth - 60, statY, { align: 'right' });
  
  statY += 10;
});















  
  // Section Contact
  const contactY = summaryY + 110;
  doc.setDrawColor(DESIGN_CONFIG.colors.light[0], DESIGN_CONFIG.colors.light[1], DESIGN_CONFIG.colors.light[2]);
  doc.line(DESIGN_CONFIG.spacing.margin, contactY, pageWidth - DESIGN_CONFIG.spacing.margin, contactY);
  
  doc.setTextColor(DESIGN_CONFIG.colors.primary[0], DESIGN_CONFIG.colors.primary[1], DESIGN_CONFIG.colors.primary[2]);
  doc.setFontSize(12);
  doc.setFont(DESIGN_CONFIG.fonts.title, 'bold');
  doc.text('Contact', DESIGN_CONFIG.spacing.margin, contactY + 15); // Sans emoji
  
  doc.setFontSize(10);
  doc.setFont(DESIGN_CONFIG.fonts.body, 'normal');
  doc.text('Pour toute question concernant ce procès-verbal :', DESIGN_CONFIG.spacing.margin, contactY + 28);
  
  const contactInfo = [
    `• Organisateur: ${meetingData.createdBy.name}`,
    meetingData.createdBy.email ? `• Email: ${meetingData.createdBy.email}` : null,
    meetingData.createdBy.department && meetingData.createdBy.department !== 'Non spécifié' 
      ? `• Département: ${meetingData.createdBy.department}` 
      : null
  ].filter(Boolean) as string[];
  
  contactInfo.forEach((info, index) => {
    doc.text(info, DESIGN_CONFIG.spacing.margin + 10, contactY + 38 + (index * 8));
  });
  
  // Footer final
  const finalFooterY = pageHeight - 25;
  doc.setFontSize(8);
  doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
  doc.text('MeetingManager Pro • Version Professionnelle 2.0', pageWidth / 2, finalFooterY, { align: 'center' });
  doc.text(`ID: ${meetingData.id} • Généré le: ${new Date().toLocaleString('fr-FR')}`, 
    pageWidth / 2, finalFooterY + 6, { align: 'center' });
  
  // ===== PAGINATION =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(DESIGN_CONFIG.colors.gray[0], DESIGN_CONFIG.colors.gray[1], DESIGN_CONFIG.colors.gray[2]);
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - DESIGN_CONFIG.spacing.margin, pageHeight - 10, { align: 'right' });
    
    // Logo en bas à gauche (optionnel)
    doc.setFontSize(7);
    doc.text('MeetingManager', DESIGN_CONFIG.spacing.margin, pageHeight - 10);
  }
  
  // ===== GÉNÉRATION DU FICHIER =====
  const safeTitle = meetingData.title
    .replace(/[^a-z0-9À-ÿ\s]/gi, '')
    .replace(/\s+/g, '_')
    .substring(0, 40);
  
  const dateStr = meetingDate.toISOString().split('T')[0];
  const fileName = `PV_${safeTitle}_${dateStr}.pdf`;
  
  return {
    pdf: doc,
    blob: doc.output('blob'),
    fileName
  };
};

// Fonctions utilitaires
const getPriorityLabel = (priority: 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'high': return 'Haute';
    case 'medium': return 'Moyenne';
    case 'low': return 'Basse';
    default: return 'Normale';
  }
};

/**
 * Fonction simplifiée pour le téléchargement
 */
/**
 * Fonction simplifiée pour le téléchargement
 */
export const downloadProfessionalMeetingPDF = async (
  meetingId: string,
  meetingTitle: string,
  notes?: string
): Promise<boolean> => {
  try {
    console.log(`📄 Génération du PDF pour: ${meetingTitle} (ID: ${meetingId})`);
    
    // OPTION 1 : Utiliser l'API export-pdf qui génère directement le PDF
    console.log('🔄 Appel API export-pdf...');
    const response = await fetch(`/api/meetings/${meetingId}/export-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: notes ? JSON.stringify({ notes }) : '{}'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API export-pdf:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // OPTION 2 : Fallback - générer localement
      console.log('🔄 Tentative de génération locale...');
      return await generatePDFLocally(meetingId, meetingTitle, notes);
    }
    
    // Récupérer le blob PDF
    const blob = await response.blob();
    
    // Extraire le nom de fichier des headers
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = `PV_${meetingTitle.replace(/[^a-z0-9À-ÿ]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      }
    }
    
    console.log(`✅ PDF généré: ${fileName} (${blob.size} bytes)`);
    
    // Télécharger
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    
    // Fallback ultime
    const fallbackDoc = new jsPDF();
    fallbackDoc.setFontSize(16);
    fallbackDoc.text('PROCÈS-VERBAL', 105, 20, { align: 'center' });
    fallbackDoc.setFontSize(12);
    fallbackDoc.text(`Titre: ${meetingTitle}`, 20, 40);
    fallbackDoc.text(`ID: ${meetingId}`, 20, 50);
    fallbackDoc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 60);
    fallbackDoc.text('⚠️ PDF généré en mode secours', 20, 80);
    fallbackDoc.text('(Les données détaillées ne sont pas disponibles)', 20, 90);
    
    const fileName = `PV_SECOURS_${meetingId}.pdf`;
    fallbackDoc.save(fileName);
    
    return false;
  }
};

// Fonction de fallback pour générer localement
const generatePDFLocally = async (
  meetingId: string,
  meetingTitle: string,
  notes?: string
): Promise<boolean> => {
  try {
    console.log('🔄 Génération locale du PDF...');
    
    // 1. Récupérer les données via auto-minutes
    const minutesResponse = await fetch(`/api/meetings/${meetingId}/auto-minutes`);
    
    if (!minutesResponse.ok) {
      throw new Error('Impossible de récupérer les données');
    }
    
    const minutesData = await minutesResponse.json();
    console.log('📊 Données récupérées:', {
      agenda: minutesData.structuredData?.agenda?.length || 0,
      decisions: minutesData.structuredData?.decisions?.length || 0,
      actions: minutesData.structuredData?.actionItems?.length || 0
    });
    
    // 2. Préparer les données pour le PDF
    const pdfData: MeetingPDFData = {
      id: meetingId,
      title: meetingTitle,
      scheduledTime: minutesData.structuredData?.scheduledTime || new Date().toISOString(),
      createdBy: {
        name: minutesData.structuredData?.createdBy?.name || 'Non spécifié',
        email: minutesData.structuredData?.createdBy?.email || '',
        department: minutesData.structuredData?.createdBy?.email?.split('@')[1]?.split('.')[0] || 'Non spécifié'
      },
      participants: (minutesData.structuredData?.participants || []).map((p: any) => ({
        name: p.name,
        email: p.email,
        role: 'Participant',
        department: p.email?.split('@')[1]?.split('.')[0] || 'Non spécifié'
      })),
      duration: minutesData.structuredData?.duration || 60,
      location: minutesData.structuredData?.location || 'Non spécifié',
      agenda: minutesData.structuredData?.agenda || [],
      decisions: minutesData.structuredData?.decisions || [],
      actionItems: minutesData.structuredData?.actionItems || [],
      nextSteps: minutesData.structuredData?.nextSteps || []
    };
    
    // 3. Générer le PDF
    const { blob, fileName } = generateProfessionalMeetingPDF(pdfData, false);
    
    // 4. Télécharger
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    
    console.log(`✅ PDF généré localement: ${fileName}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur génération locale:', error);
    return false;
  }
};






/**
 * Version basique pour les cas simples
 */
export const generateBasicProfessionalPDF = (
  meetingId: string,
  meetingTitle: string,
  data: Partial<MeetingPDFData>
): boolean => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête simple mais propre
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCÈS-VERBAL', 20, 20);
    
    // Contenu
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(meetingTitle, 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Référence: ${meetingId}`, 20, 70);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 80);
    
    if (data.createdBy?.name) {
      doc.text(`Organisateur: ${data.createdBy.name}`, 20, 90);
    }
    
    if (data.participants) {
      doc.text(`Participants: ${data.participants.length}`, 20, 100);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Document généré automatiquement', pageWidth / 2, 280, { align: 'center' });
    
    const fileName = `PV_${meetingTitle.substring(0, 30).replace(/\s/g, '_')}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Fonction pour prévisualiser le PDF (optionnel)
 */
export const previewMeetingPDF = async (meetingId: string): Promise<Blob | null> => {
  try {
    const response = await fetch(`/api/meetings/${meetingId}/pdf-data`);
    
    if (!response.ok) {
      return null;
    }
    
    const pdfData = await response.json();
    const { blob } = generateProfessionalMeetingPDF(pdfData, false);
    
    return blob;
  } catch {
    return null;
  }
};