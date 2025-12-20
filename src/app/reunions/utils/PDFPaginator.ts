import jsPDF from 'jspdf';

export class PDFPaginator {
  /**
   * Génère un PDF avec pagination automatique
   */
  static generatePagedPDF(text: string, title: string = 'Procès-Verbal'): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    let currentPage = 1;
    let yPosition = margin + 20;
    const lines = text.split('\n');
    
    // Header première page
    this.addPageHeader(doc, title, currentPage, pageWidth);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Nouvelle page si nécessaire
      if (yPosition > pageHeight - margin || line.includes('--- PAGE')) {
        doc.addPage();
        currentPage++;
        yPosition = margin + 20;
        this.addPageHeader(doc, title, currentPage, pageWidth);
        
        if (line.includes('--- PAGE')) continue;
      }
      
      // Ajouter le texte
      if (line.trim()) {
        this.addTextLine(doc, line, margin, yPosition);
        yPosition += this.getLineHeight(line);
      } else {
        yPosition += 5; // Espacement pour ligne vide
      }
    }
    
    // Pied de page
    this.addPageNumbers(doc, currentPage, pageWidth, pageHeight);
    
    return doc;
  }
  
  private static addPageHeader(doc: jsPDF, title: string, pageNumber: number, pageWidth: number): void {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROCÈS-VERBAL - ${title}`, 20, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageNumber}`, pageWidth - 25, 15);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 20, pageWidth - 20, 20);
  }
  
  private static addTextLine(doc: jsPDF, line: string, x: number, y: number): void {
    // Styles selon le format
    if (line.startsWith('# ')) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(line.substring(2), x, y);
    } else if (line.startsWith('## ')) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(line.substring(3), x, y);
    } else if (line.startsWith('### ')) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(line.substring(4), x, y);
    } else if (line.includes('**')) {
      doc.setFont('helvetica', 'bold');
      doc.text(line.replace(/\*\*/g, ''), x, y);
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(line, x, y);
    }
  }
  
  private static getLineHeight(line: string): number {
    if (line.startsWith('# ')) return 12;
    if (line.startsWith('## ')) return 10;
    if (line.startsWith('### ')) return 9;
    return 7;
  }
  
  private static addPageNumbers(doc: jsPDF, totalPages: number, pageWidth: number, pageHeight: number): void {
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }
}