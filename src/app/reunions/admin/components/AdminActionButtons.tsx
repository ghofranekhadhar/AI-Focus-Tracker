'use client';

import { useState } from 'react';
import { BaseActionButtonsProps } from '../../types/action-buttons';
import { isMeetingDatePassed } from '../../hooks/useMeetingUtils';
import { 
  PlayIcon, 
  ClockIcon, 
  FileTextIcon, 
  RefreshCwIcon, 
  TrashIcon, 
  CalendarIcon, 
  EditIcon, 
  XIcon, 
  StopIcon,
  FileVideoIcon
} from '../../components/icons';
import { Loader2, Check } from 'lucide-react';

export const AdminActionButtons: React.FC<BaseActionButtonsProps> = ({ 
  meeting, 
  user, 
  onJoinMeeting, 
  onStartMeeting, 
  onEndMeeting,
  onCancelMeeting,
  onDeleteMeeting,
  onRestoreMeeting,
  onExportPDF,
  onReprogramMeeting, 
  onEditMeeting,
  onExportRecordings
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleGeneratePDF = async (exportType: 'pdf' | 'report' = 'pdf') => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    setPdfError(null);
    
    console.log(`🚀 Début génération ${exportType.toUpperCase()} avec AIPVGenerator...`);
    
    try {
      const response = await fetch(`/api/meetings/${meeting.id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const meetingData = await response.json();
      
      const dataForPV = {
        title: meetingData.title || meeting.title,
        participants: meetingData.participants || [],
        agenda: meetingData.agenda || [],
        decisions: meetingData.decisions || [],
        actionItems: meetingData.actionItems || [],
        scheduledTime: meetingData.scheduledTime,
        duration: meetingData.duration,
        location: meetingData.location || 'Réunion virtuelle',
        organizer: meetingData.createdBy || { name: 'Organisateur' }
      };
      
      const { AIPVGenerator } = await import('../../services/AIPVGenerator');
      
      if (exportType === 'pdf') {
        // Télécharger le PDF classique
        const pvText = await AIPVGenerator.generateProfessionalPV(dataForPV);
        
        const jsPDF = (await import('jspdf')).jsPDF;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        let currentPage = 1;
        let yPosition = margin;
        const lines = pvText.split('\n');
        
        const addPageHeader = (doc: any, title: string, pageNumber: number, pageWidth: number) => {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(`PROCÈS-VERBAL - ${title}`, 20, 15);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page ${pageNumber}`, pageWidth - 25, 15);
          
          doc.setDrawColor(200, 200, 200);
          doc.line(20, 20, pageWidth - 20, 20);
        };
        
        const addStyledText = (doc: any, line: string, x: number, y: number) => {
          if (line.startsWith('# ')) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(2), x, y);
            doc.setFontSize(11);
          } else if (line.startsWith('## ')) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(3), x, y);
            doc.setFontSize(11);
          } else if (line.startsWith('### ')) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(line.substring(4), x, y);
            doc.setFontSize(11);
          } else if (line.includes('**')) {
            doc.setFont('helvetica', 'bold');
            doc.text(line.replace(/\*\*/g, ''), x, y);
            doc.setFont('helvetica', 'normal');
          } else {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(line, x, y);
          }
        };
        
        const addPageNumbers = (doc: any, totalPages: number, pageWidth: number, pageHeight: number) => {
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.setTextColor(0, 0, 0);
          }
        };
        
        addPageHeader(doc, meeting.title, currentPage, pageWidth);
        yPosition = margin + 30;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes('--- PAGE') || yPosition > pageHeight - margin) {
            doc.addPage();
            currentPage++;
            yPosition = margin + 30;
            addPageHeader(doc, meeting.title, currentPage, pageWidth);
            
            if (line.includes('--- PAGE')) continue;
          }
          
          if (line.trim()) {
            addStyledText(doc, line, margin, yPosition);
            
            if (line.startsWith('# ')) yPosition += 12;
            else if (line.startsWith('## ')) yPosition += 10;
            else if (line.startsWith('### ')) yPosition += 9;
            else if (line.includes('**')) yPosition += 8;
            else yPosition += 7;
          } else {
            yPosition += 5;
          }
        }
        
        addPageNumbers(doc, currentPage, pageWidth, pageHeight);
        
        const safeTitle = meeting.title
          .replace(/[^a-z0-9À-ÿ\s]/gi, '')
          .replace(/\s+/g, '_')
          .substring(0, 30);
        
        const fileName = `PV_${safeTitle}.pdf`;
        doc.save(fileName);
        
        console.log('✅ PDF téléchargé avec', doc.getNumberOfPages(), 'pages');
        
      } else {
        // Afficher le rapport HTML dans une nouvelle fenêtre
        const htmlReport = await AIPVGenerator.generateFormattedReport(dataForPV);
        
        // Créer une nouvelle fenêtre avec le rapport
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          reportWindow.document.write(htmlReport);
          reportWindow.document.close();
          reportWindow.focus();
        }
      }
      
      setPdfGenerated(true);
      setTimeout(() => setPdfGenerated(false), 3000);
      
    } catch (error: any) {
      console.error(`❌ Erreur génération ${exportType}:`, error);
      setPdfError(error.message);
      
      // Fallback simple
      const fallbackWindow = window.open('', '_blank');
      if (fallbackWindow) {
        fallbackWindow.document.write(`
          <html>
            <head><title>Rapport de réunion</title></head>
            <body style="padding: 40px; font-family: Arial;">
              <h1>Rapport: ${meeting.title}</h1>
              <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
              <button onclick="window.print()">Imprimer</button>
            </body>
          </html>
        `);
        fallbackWindow.document.close();
      }
      
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateFallbackPDF = async (meeting: any) => {
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('PROCÈS-VERBAL', 105, 30, { align: 'center' });
      doc.setFontSize(16);
      doc.text(meeting.title, 20, 50);
      
      doc.addPage();
      doc.text('Page 2', 20, 20);
      doc.text('Document généré en mode secours', 20, 40);
      
      doc.save(`PV_SECOURS_${meeting.title}.pdf`);
      
      setPdfGenerated(true);
      setTimeout(() => setPdfGenerated(false), 2000);
      
    } catch (error) {
      console.error('Fallback échoué:', error);
      alert('Erreur critique lors de la génération du PDF');
    }
  };

  // === DÉCLARATIONS ===
  const isDatePassed = isMeetingDatePassed(meeting.scheduledTime);
  const userIsOrganizer = meeting.createdBy.id === user.id;
  
  const showStartButton = meeting.status === 'PLANNED' && userIsOrganizer && !isDatePassed;
  const showJoinButton = meeting.status === 'IN_PROGRESS';
  const showEndButton = meeting.status === 'IN_PROGRESS';
  const showCompletedActions = meeting.status === 'COMPLETED';
  const showCancelledActions = meeting.status === 'CANCELLED';
  const isExpiredCancelledMeeting = meeting.status === 'CANCELLED' && isDatePassed;

  if (isExpiredCancelledMeeting) {
    return (
      <div className="flex justify-center">
        <div className="text-center text-gray-500 text-sm">
          Expirée
        </div>
      </div>
    );
  }

  if (showCompletedActions) {
    return (
      <div className="flex flex-col gap-1.5 items-center">
        {/* Bouton Exporter PDF */}
        <button
          onClick={() => handleGeneratePDF('pdf')}
          disabled={isGeneratingPDF}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all duration-200 
            transform hover:scale-105 text-xs w-full justify-center
            disabled:opacity-50 disabled:cursor-not-allowed
            ${pdfGenerated 
              ? 'bg-green-50 text-green-700 border-green-300' 
              : pdfError 
                ? 'bg-red-50 text-red-700 border-red-300' 
                : 'text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
          title={pdfGenerated 
            ? "PV téléchargé ✓" 
            : pdfError 
              ? `Erreur: ${pdfError}` 
              : `Générer le PV de "${meeting.title}"`
          }
        >
          <div className="flex items-center justify-center w-3.5 h-3.5">
            {isGeneratingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : pdfGenerated ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : pdfError ? (
              <FileTextIcon className="w-3.5 h-3.5 text-red-600" />
            ) : (
              <FileTextIcon className="w-3.5 h-3.5" />
            )}
          </div>
          
          <span className="font-medium">
            {isGeneratingPDF ? 'Génération...' : 
             pdfGenerated ? 'PV Téléchargé ✓' : 
             pdfError ? 'Erreur' : 
             'Exporter PV'}
          </span>
        </button>
        
        {/* NOUVEAU: Bouton Afficher Rapport */}
        <button
          onClick={() => handleGeneratePDF('report')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all duration-200 transform hover:scale-105 text-xs w-full justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          title="Afficher le rapport détaillé"
        >
          <span className="text-sm"></span>
          <span className="font-medium"> Afficher Rapport</span>
        </button>
        
        {onExportRecordings && (
          <button
            onClick={() => onExportRecordings(meeting.id, meeting.title)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-white hover:text-gray-100 rounded-md bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 text-xs w-full justify-center"
            title="Voir les enregistrements vidéo"
          >
            <FileVideoIcon className="w-3.5 h-3.5" />
            Enregistrements
          </button>
        )}
      </div>
    );
  }

  if (showCancelledActions) {
    return (
      <div className="flex justify-center space-x-1">
        <button
          onClick={() => onRestoreMeeting(meeting.id)}
          className="p-2 text-green-600 hover:text-green-700 hover:scale-110 transition-all duration-200"
          title="Restaurer"
        >
          <RefreshCwIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDeleteMeeting(meeting.id)}
          className="p-2 text-red-600 hover:text-red-700 hover:scale-110 transition-all duration-200"
          title="Supprimer"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReprogramMeeting(meeting.id)}
          className="p-2 text-blue-600 hover:text-blue-700 hover:scale-110 transition-all duration-200"
          title="Reprogrammer"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEditMeeting(meeting.id)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-200"
          title="Modifier"
        >
          <EditIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (meeting.status === 'PLANNED' && isDatePassed) {
    return (
      <div className="space-y-2">
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => onRestoreMeeting(meeting.id)}
            className="p-2 text-green-600 hover:text-green-700 hover:scale-110 transition-all duration-200"
            title="Reprogrammer"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteMeeting(meeting.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200"
            title="Supprimer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (showEndButton) {
    return (
      <div className="space-y-1">
        <div className="flex space-x-1">
          <button 
            onClick={() => onJoinMeeting(meeting.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-xs font-medium"
          >
            <PlayIcon className="w-3 h-3" />
            Rejoindre
          </button>
          <button 
            onClick={() => onEndMeeting(meeting.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200"
            title="Terminer"
          >
            <StopIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (showJoinButton) {
    return (
      <div className="flex justify-center">
        <button 
          onClick={() => onJoinMeeting(meeting.id)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-sm font-medium"
        >
          <PlayIcon className="w-3 h-3" />
          Rejoindre
        </button>
      </div>
    );
  }

  if (meeting.status === 'PLANNED') {
    if (userIsOrganizer) {
      return (
        <div className="space-y-2">
          {!isDatePassed ? (
            <button 
              onClick={() => onStartMeeting(meeting.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-sm font-medium"
            >
              <PlayIcon className="w-3 h-3" />
              Démarrer
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-400 text-white rounded-md text-sm font-medium cursor-not-allowed">
              <ClockIcon className="w-3 h-3" />
              Date dépassée
            </div>
          )}
          
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => onReprogramMeeting(meeting.id)}
              className="p-2 text-blue-600 hover:text-blue-700 hover:scale-110 transition-all duration-200"
              title="Reprogrammer"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditMeeting(meeting.id)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-200"
              title="Modifier"
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCancelMeeting(meeting.id)}
              className="p-2 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200"
              title="Annuler"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => onReprogramMeeting(meeting.id)}
            className="p-2 text-blue-600 hover:text-blue-700 hover:scale-110 transition-all duration-200"
            title="Reprogrammer"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditMeeting(meeting.id)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-200"
            title="Modifier"
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCancelMeeting(meeting.id)}
            className="p-2 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200"
            title="Annuler"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      );
    }
  }

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 px-3 py-2 text-gray-500 bg-gray-50 rounded-md text-sm">
        <ClockIcon className="w-3 h-3" />
        Planifiée
      </div>
    </div>
  );
};