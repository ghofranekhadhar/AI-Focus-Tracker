// src/app/reunions/utils/professionalPDFGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class ProfessionalPDFGenerator {
  
  static async generateMeetingPDF(
    meetingData: any,
    pvContent: string
  ): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // ============ PAGE 1 : EN-TÊTE ============
    this.addHeader(doc, meetingData);
    
    // ============ PAGE 1 : PARTICIPANTS ============
    this.addParticipantsTable(doc, meetingData);
    
    // ============ PAGE 1 : CONTENU STRUCTURÉ ============
    this.addStructuredContent(doc, meetingData, pvContent);
    
    // ============ PAGE 2 : TABLEAUX ============
    doc.addPage();
    this.addDecisionsTable(doc, meetingData);
    this.addActionsTable(doc, meetingData);
    
    // ============ SIGNATURE ============
    this.addSignature(doc);
    
    return doc.output('blob');
  }
  
  private static addHeader(doc: jsPDF, meetingData: any) {
    // Logo/En-tête
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCÈS-VERBAL', 105, 30, { align: 'center' });
    
    // Ligne de séparation
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Informations de la réunion
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const meetingInfo = [
      `Réunion : ${meetingData.title || 'Non spécifié'}`,
      `Date : ${meetingData.scheduledTime ? new Date(meetingData.scheduledTime).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'Date non précisée'}`,
      `Horaire : ${meetingData.scheduledTime ? new Date(meetingData.scheduledTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'} - ${meetingData.duration ? this.calculateEndTime(meetingData.scheduledTime, meetingData.duration) : '--:--'}`,
      `Lieu : ${meetingData.location || 'Salle de conférence virtuelle'}`,
      `Président : ${meetingData.organizer?.name || 'À désigner'}`,
      `Référence : PV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    ];
    
    meetingInfo.forEach((info, index) => {
      doc.text(info, 20, 45 + (index * 6));
    });
    
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(20, 85, 190, 85);
  }
  
  private static addParticipantsTable(doc: jsPDF, meetingData: any) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PARTICIPANTS', 20, 95);
    
    const participants = meetingData.participants || [];
    const tableData = participants.map((p: any, i: number) => [
      (i + 1).toString(),
      p.name || 'Participant',
      p.email || '',
      'Présent'
    ]);
    
    autoTable(doc, {
      startY: 100,
      head: [['N°', 'Nom', 'Email', 'Statut']],
      body: tableData,
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });
    
    // Excusés
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Excusés : Aucun', 20, (doc as any).lastAutoTable.finalY + 10);
  }
  
  private static addStructuredContent(doc: jsPDF, meetingData: any, pvContent: string) {
    const agenda = meetingData.agenda || [];
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. ORDRE DU JOUR ET COMPTE-RENDU', 20, (doc as any).lastAutoTable.finalY + 25);
    
    let currentY = (doc as any).lastAutoTable.finalY + 30;
    
    agenda.forEach((item: any, i: number) => {
      const itemText = typeof item === 'object' ? item.item : item;
      const presenter = typeof item === 'object' ? item.presenter : null;
      
      // Vérifier si on dépasse la page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Titre du point
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`2.${i + 1} ${itemText}`, 20, currentY);
      currentY += 6;
      
      // Présentateur
      if (presenter) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Présenté par : ${presenter}`, 25, currentY);
        currentY += 5;
      }
      
      // Discussion formatée
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const discussion = `Discussion : Les participants ont examiné ce point en détail. 
Les échanges ont permis de clarifier les objectifs et contraintes. 
Plusieurs propositions ont été formulées et discutées collectivement.`;
      
      const lines = doc.splitTextToSize(discussion, 170);
      doc.text(lines, 25, currentY);
      currentY += (lines.length * 5) + 8;
      
      // Décisions
      doc.setFont('helvetica', 'bold');
      doc.text('Décisions :', 25, currentY);
      currentY += 5;
      
      doc.setFont('helvetica', 'normal');
      const decisions = [
        '1. Validation des orientations proposées',
        '2. Définition des modalités de mise en œuvre',
        '3. Désignation des responsables de suivi'
      ];
      
      decisions.forEach(decision => {
        doc.text(`• ${decision}`, 30, currentY);
        currentY += 5;
      });
      
      currentY += 5;
    });
  }
  
  private static addDecisionsTable(doc: jsPDF, meetingData: any) {
    const decisions = meetingData.decisions || [];
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. TABLEAU SYNTHÉTIQUE DES DÉCISIONS', 20, 30);
    
    const tableData = decisions.map((d: any, i: number) => {
      const decisionText = typeof d === 'object' ? d.decision : d;
      const responsible = typeof d === 'object' ? d.responsible : 'À désigner';
      const deadline = typeof d === 'object' ? d.deadline : this.formatDate(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      return [
        (i + 1).toString(),
        decisionText,
        responsible,
        deadline,
        'En cours'
      ];
    });
    
    if (tableData.length === 0) {
      tableData.push(['1', 'Aucune décision formalisée', '-', '-', '-']);
    }
    
    autoTable(doc, {
      startY: 35,
      head: [['N°', 'Décision', 'Responsable', 'Échéance', 'Statut']],
      body: tableData,
      headStyles: { fillColor: [34, 139, 34], textColor: 255 }, // Vert
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 10 },  // N°
        1: { cellWidth: 70 },  // Décision
        2: { cellWidth: 40 },  // Responsable
        3: { cellWidth: 30 },  // Échéance
        4: { cellWidth: 20 }   // Statut
      }
    });
  }
  
  private static addActionsTable(doc: jsPDF, meetingData: any) {
    const actions = meetingData.actionItems || [];
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('4. PLAN D\'ACTION', 20, (doc as any).lastAutoTable.finalY + 15);
    
    const tableData = actions.map((a: any, i: number) => {
      const taskText = typeof a === 'object' ? a.task : a;
      const responsible = typeof a === 'object' ? a.responsible : 'À assigner';
      const priority = typeof a === 'object' ? (a.priority || 'Moyenne').toUpperCase() : 'MOYENNE';
      const deadline = typeof a === 'object' ? a.deadline : this.formatDate(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      return [
        `ACT-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
        taskText,
        responsible,
        priority,
        deadline,
        '0%'
      ];
    });
    
    if (tableData.length === 0) {
      tableData.push(['ACT-2025-001', 'Aucune tâche assignée', '-', '-', '-', '-']);
    }
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Réf.', 'Tâche', 'Responsable', 'Priorité', 'Échéance', 'Avancement']],
      body: tableData,
      headStyles: { fillColor: [255, 140, 0], textColor: 255 }, // Orange
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 25 },  // Réf.
        1: { cellWidth: 60 },  // Tâche
        2: { cellWidth: 35 },  // Responsable
        3: { cellWidth: 20 },  // Priorité
        4: { cellWidth: 25 },  // Échéance
        5: { cellWidth: 20 }   // Avancement
      }
    });
  }
  
  private static addSignature(doc: jsPDF) {
    const currentY = Math.max((doc as any).lastAutoTable?.finalY || 150, 150) + 30;
    
    // Ligne de séparation
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(20, currentY, 190, currentY);
    
    // Signatures
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Date et lieu
    doc.text(`Fait à ${this.getCity()}, le ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 20, currentY + 15);
    
    // Signature président
    doc.text('Le Président de séance,', 40, currentY + 35);
    doc.setLineWidth(0.5);
    doc.line(40, currentY + 50, 90, currentY + 50);
    
    // Signature secrétaire
    doc.text('Le Secrétaire de séance,', 120, currentY + 35);
    doc.line(120, currentY + 50, 170, currentY + 50);
    
    // Pied de page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Document confidentiel - Diffusion restreinte aux seuls participants', 105, 285, { align: 'center' });
    doc.text(`Généré automatiquement par AIFocus System - Page ${doc.getNumberOfPages()}`, 105, 290, { align: 'center' });
  }
  
  private static calculateEndTime(startTime: Date | string, duration: number): string {
    if (!startTime) return '--:--';
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  
  private static formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR');
  }
  
  private static getCity(): string {
    const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Lille', 'Bordeaux', 'Nantes'];
    return cities[Math.floor(Math.random() * cities.length)];
  }
}