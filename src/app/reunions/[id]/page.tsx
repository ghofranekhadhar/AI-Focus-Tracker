'use client';

import { useUser } from '@/src/app/contexts/UserContext';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Trash2, 
  Play, 
  Users, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  Download,
  RefreshCw,
  FileText,
  Eye,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  Check
} from 'lucide-react';
import { EditMeetingPopup } from '@/src/app/reunions/components/EditMeetingPopup';
import { ReprogramPopup } from '@/src/app/reunions/components/ReprogramPopup';

interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  duration: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: 'EMPLOYEE' | 'ADMIN';
  };
  participants: {
    id: string;
    name: string;
    email: string;
  }[];
  meetingUrl?: string;
  room?: string;
  concentrationScore?: number;
  agenda?: any[];
  decisions?: any[];
  actionItems?: any[];
  location?: string;
}

export default function MeetingDetailModalPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showReprogramPopup, setShowReprogramPopup] = useState(false);
  
  // États pour la génération PDF
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const meetingId = params.id as string;

  // Empêcher le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Gérer la touche Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    const loadMeeting = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/meetings/${meetingId}`);
        
        if (!response.ok) {
          throw new Error('Réunion non trouvée');
        }
        
        let meetingData: Meeting = await response.json();
        
        // Si la réunion est PLANNED mais que la date est passée, la marquer comme EXPIRED
        const now = new Date();
        const meetingDate = new Date(meetingData.scheduledTime);
        
        if (meetingData.status === 'PLANNED' && meetingDate < now) {
          meetingData = {
            ...meetingData,
            status: 'EXPIRED'
          };
        }
        
        setMeeting(meetingData);
        
      } catch (err) {
        console.error('Erreur chargement réunion:', err);
        setError('Erreur lors du chargement de la réunion');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadMeeting();
    }
  }, [user, meetingId]);

  // --- FONCTIONS D'ACTION ---
  const handleStartMeeting = async () => {
    if (!meeting) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'IN_PROGRESS',
          meetingUrl: `/reunions/${meetingId}/live`
        }),
      });

      if (response.ok) {
        router.push(`/reunions/${meetingId}/live`);
      } else {
        alert('Erreur lors du démarrage de la réunion');
      }
    } catch (error) {
      console.error('Erreur démarrage réunion:', error);
      alert('Erreur lors du démarrage de la réunion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    router.push(`/reunions/${meetingId}/live`);
  };




const handleGeneratePDF = async (exportType: 'pdf' | 'report' = 'pdf') => {
  if (!meeting || isGeneratingPDF) return;
  
  setIsGeneratingPDF(true);
  setPdfError(null);
  
  try {
    if (exportType === 'pdf') {
      // GÉNÉRATION DIRECTE DU PDF (SANS AIPVGenerator)
      const jsPDF = (await import('jspdf')).jsPDF;
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      
      // Fonction pour ajouter du texte avec retour à la ligne
      const addText = (text: string, size: number = 11, isBold: boolean = false, align: 'left' | 'center' = 'left') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        // Diviser le texte en lignes
        const maxWidth = pageWidth - 2 * margin;
        const lines = doc.splitTextToSize(text, maxWidth);
        
        for (let line of lines) {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          
          // Ajouter la ligne
          const x = align === 'center' ? pageWidth / 2 : margin;
          doc.text(line, x, yPosition, { align: align });
          
          yPosition += size / 3; // Espacement
        }
        
        yPosition += 5; // Espacement supplémentaire entre paragraphes
      };
      
      // TITRE PRINCIPAL
      addText('PROCÈS-VERBAL', 24, true, 'center');
      yPosition += 10;
      
      // TITRE DE LA RÉUNION
      addText(meeting.title, 18, true, 'center');
      yPosition += 15;
      
      // DATE
      const meetingDate = new Date(meeting.scheduledTime);
      addText(`Date: ${meetingDate.toLocaleDateString('fr-FR')}`, 12);
      yPosition += 10;
      
      // EN-TÊTE OFFICIEL
      addText('# EN-TÊTE OFFICIEL', 14, true);
      yPosition += 5;
      
      const formattedDate = meetingDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const startTime = meetingDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const endDate = new Date(meetingDate.getTime() + meeting.duration * 60000);
      const endTime = endDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      addText(`Référence : Réunion du ${formattedDate}`, 11);
      addText(`Date : ${formattedDate}`, 11);
      addText(`Lieu : ${meeting.location || 'Virtuel'}`, 11);
      addText(`Horaires : ${startTime} - ${endTime}`, 11);
      yPosition += 10;
      
      // PRÉSENTS/ABSENTS/EXCUSÉS
      addText('# PRÉSENTS/ABSENTS/EXCUSÉS', 14, true);
      yPosition += 5;
      
      addText('Les participants suivants étaient présents :', 11);
      yPosition += 5;
      
      meeting.participants.forEach((participant, index) => {
        const role = participant.email === 'admin@gmail.com' ? 'Directeur Général' : 
                    participant.email === 'user@gmail.com' ? 'Président' :
                    'Responsable Commercial';
        addText(`${index + 1}. **${participant.name}** - ${role} (${participant.email})`, 11);
      });
      
      yPosition += 10;
      
      // ORDRE DU JOUR DÉVELOPPÉ (si disponible)
      if (meeting.agenda && meeting.agenda.length > 0) {
        addText('# ORDRE DU JOUR DÉVELOPPÉ', 14, true);
        yPosition += 5;
        
        meeting.agenda.forEach((item: any, index: number) => {
          addText(`### ${index + 1}. ${item.title || 'Point'} [${item.duration || 10} min]`, 12, true);
          
          if (item.description) {
            addText(item.description, 11);
          }
          yPosition += 5;
        });
        
        yPosition += 10;
      }
      
      // DÉCISIONS (si disponibles)
      if (meeting.decisions && meeting.decisions.length > 0) {
        addText('# DÉCISIONS FORMALISÉES', 14, true);
        yPosition += 5;
        
        meeting.decisions.forEach((decision: any, index: number) => {
          addText(`- Décision ${index + 1} : **${decision.title || 'Décision'}** - ${decision.description || ''}`, 11);
        });
        
        yPosition += 10;
        
        // TABLEAU DES DÉCISIONS
        addText('# TABLEAU DES DÉCISIONS', 14, true);
        yPosition += 5;
        
        // Ligne d'en-tête du tableau
        addText('N° | Description | Responsable | Échéance | Statut', 10, true);
        addText('---|-------------|-------------|----------|--------', 10);
        yPosition += 5;
        
        meeting.decisions.forEach((decision: any, index: number) => {
          const responsible = decision.responsible || meeting.participants[0]?.name || 'À définir';
          const dueDate = decision.dueDate ? new Date(decision.dueDate).toLocaleDateString('fr-FR') : 'À définir';
          const status = decision.status || 'En cours';
          
          addText(`${index + 1} | ${decision.title || 'Décision'} | ${responsible} | ${dueDate} | ${status}`, 10);
        });
      }
      
      // Pied de page avec numérotation
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
      
      // TÉLÉCHARGER LE PDF
      const safeTitle = meeting.title
        .replace(/[^a-z0-9À-ÿ\s]/gi, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      
      const fileName = `PV_${safeTitle}.pdf`;
      doc.save(fileName);
      
      setPdfGenerated(true);
      setTimeout(() => setPdfGenerated(false), 3000);
      
    } else {
      // Pour 'report' : afficher un rapport HTML simple
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(`
          <html>
            <head>
              <title>Rapport - ${meeting.title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #333; }
                .section { margin-top: 30px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>PROCÈS-VERBAL</h1>
              <h2>${meeting.title}</h2>
              <p>Date: ${new Date(meeting.scheduledTime).toLocaleDateString('fr-FR')}</p>
              
              <div class="section">
                <h3>EN-TÊTE OFFICIEL</h3>
                <p>Référence : Réunion du ${new Date(meeting.scheduledTime).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Lieu : ${meeting.location || 'Virtuel'}</p>
              </div>
              
              <button onclick="window.print()">Imprimer</button>
            </body>
          </html>
        `);
        reportWindow.document.close();
        reportWindow.focus();
      }
    }
  } catch (error: any) {
    console.error('Erreur export:', error);
    setPdfError(error.message);
  } finally {
    setIsGeneratingPDF(false);
  }
};





  const handleRestoreMeeting = async () => {
    if (!meeting) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PLANNED' }),
      });

      if (response.ok) {
        setMeeting(prev => prev ? { ...prev, status: 'PLANNED' } : null);
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la restauration: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erreur restauration:', error);
      alert('Erreur lors de la restauration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMeetingSubmit = async (updatedData: any) => {
    if (!meeting) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedMeeting = await response.json();
        setMeeting(updatedMeeting);
        setShowEditPopup(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la modification: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('Erreur lors de la modification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReprogramMeetingSubmit = async (newDateTime: string) => {
    if (!meeting) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          scheduledTime: newDateTime 
        }),
      });

      if (response.ok) {
        const updatedMeeting = await response.json();
        setMeeting(updatedMeeting);
        setShowReprogramPopup(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la reprogrammation: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erreur reprogrammation:', error);
      alert('Erreur lors de la reprogrammation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meeting) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setTimeout(() => {
          router.back();
          router.refresh();
        }, 300);
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la suppression: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!meeting) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (response.ok) {
        setMeeting(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
        setShowCancelConfirm(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de l'annulation: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
      alert('Erreur lors de l\'annulation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndMeeting = async () => {
    if (!meeting) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (response.ok) {
        setMeeting(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la fin de réunion: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erreur fin réunion:', error);
      alert('Erreur lors de la fin de la réunion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (!user) {
    return null;
  }

  const isOrganizer = meeting?.createdBy.id === user.id;
  const isAdmin = user.role === 'ADMIN';
  
  // --- CALCUL DES PERMISSIONS ---
  const isExpiredMeeting = meeting?.status === 'EXPIRED';
  const isCancelledMeeting = meeting?.status === 'CANCELLED';
  const isCompletedMeeting = meeting?.status === 'COMPLETED';
  const isPlannedMeeting = meeting?.status === 'PLANNED';
  const isInProgressMeeting = meeting?.status === 'IN_PROGRESS';

  // Permissions pour les employés
  const employeeCanStart = isOrganizer && isPlannedMeeting;
  const employeeCanJoin = isInProgressMeeting;
  const employeeCanEdit = isOrganizer && isPlannedMeeting;
  const employeeCanCancel = isOrganizer && isPlannedMeeting;
  const employeeCanDelete = isOrganizer && (isCancelledMeeting || isExpiredMeeting || isCompletedMeeting);
  const employeeCanRestore = isOrganizer && (isCancelledMeeting || isExpiredMeeting);
  const employeeCanExport = isCompletedMeeting;
  const employeeCanReprogram = isOrganizer && (isCancelledMeeting || isExpiredMeeting);
  const employeeCanView = true;
  const employeeCanEnd = isOrganizer && isInProgressMeeting;

  // Permissions pour les administrateurs
  const adminCanStart = isOrganizer && isPlannedMeeting;
  const adminCanJoin = isInProgressMeeting;
  const adminCanEdit = (isAdmin && isPlannedMeeting) || (isOrganizer && isPlannedMeeting);
  const adminCanCancel = (isAdmin && isPlannedMeeting) || (isOrganizer && isPlannedMeeting);
  const adminCanDelete = isAdmin && (isCancelledMeeting || isExpiredMeeting || isCompletedMeeting);
  const adminCanRestore = isAdmin && (isCancelledMeeting || isExpiredMeeting);
  const adminCanExport = isAdmin && isCompletedMeeting;
  const adminCanReprogram = isAdmin && (isCancelledMeeting || isExpiredMeeting);
  const adminCanEnd = isAdmin && isInProgressMeeting;

  // Permissions finales selon le rôle
  const canStart = isAdmin ? adminCanStart : employeeCanStart;
  const canJoin = isAdmin ? adminCanJoin : employeeCanJoin;
  const canEdit = isAdmin ? adminCanEdit : employeeCanEdit;
  const canCancel = isAdmin ? adminCanCancel : employeeCanCancel;
  const canDelete = isAdmin ? adminCanDelete : employeeCanDelete;
  const canRestore = isAdmin ? adminCanRestore : employeeCanRestore;
  const canExport = isAdmin ? adminCanExport : employeeCanExport;
  const canReprogram = isAdmin ? adminCanReprogram : employeeCanReprogram;
  const canView = employeeCanView;
  const canEnd = isAdmin ? adminCanEnd : employeeCanEnd;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'EXPIRED': return 'bg-gray-50 text-gray-500 border border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Planifiée';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      case 'EXPIRED': return 'Expirée';
      default: return status;
    }
  };

  const calculateEndTime = (startDateTime: string, duration: number) => {
    if (!startDateTime) return '-';
    
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    return endDate.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rendu conditionnel pour les boutons d'actions
  const renderActionButtons = () => {
    // Pour les réunions expirées, afficher seulement Supprimer
    if (isExpiredMeeting) {
      return (
        <div className="grid grid-cols-1 gap-3">
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={actionLoading}
              className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          )}
        </div>
      );
    }

    // Pour les réunions annulées (CANCELLED), afficher seulement Restaurer et Supprimer
    if (isCancelledMeeting) {
      return (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleRestoreMeeting}
            disabled={actionLoading}
            className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Restaurer
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={actionLoading}
            className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      );
    }

    // Pour les réunions terminées (COMPLETED), afficher le bouton d'export PDF
    if (isCompletedMeeting) {
      return (
        <div className="grid grid-cols-1 gap-3">
          {canExport && (
            <button
              onClick={() => handleGeneratePDF('pdf')}
              disabled={isGeneratingPDF}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed w-full
                ${pdfGenerated 
                  ? 'bg-green-50 text-green-700 border border-green-300' 
                  : pdfError 
                    ? 'bg-red-50 text-red-700 border border-red-300' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
              title={pdfGenerated 
                ? "PV téléchargé ✓" 
                : pdfError 
                  ? `Erreur: ${pdfError}` 
                  : `Générer le PV de "${meeting?.title}"`
              }
            >
              <div className="flex items-center justify-center w-5 h-5">
                {isGeneratingPDF ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                ) : pdfGenerated ? (
                  <Check size={16} className="text-green-600" />
                ) : pdfError ? (
                  <FileText size={16} className="text-red-600" />
                ) : (
                  <FileText size={16} className="text-gray-600" />
                )}
              </div>
              
              <span className="font-medium">
                {isGeneratingPDF ? 'Génération...' : 
                 pdfGenerated ? 'Téléchargé ✓' : 
                 pdfError ? 'Erreur' : 
                 '📄 Exporter PV'}
              </span>
            </button>
          )}
        </div>
      );
    }

    // Pour les autres statuts, afficher les boutons normaux
    return (
      <>
        {/* Actions principales */}
        <div className="space-y-3">
          {canStart && (
            <button
              onClick={handleStartMeeting}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3.5 px-4 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              <Play size={18} />
              Démarrer la réunion
            </button>
          )}
          
          {canJoin && (
            <button
              onClick={handleJoinMeeting}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-3.5 px-4 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <ExternalLink size={18} />
              Rejoindre la réunion
            </button>
          )}
          
          {canEnd && (
            <button
              onClick={handleEndMeeting}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white py-3.5 px-4 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <X size={18} />
              Terminer la réunion
            </button>
          )}
        </div>
        
        {/* Séparateur pour les actions de gestion */}
        {(canEdit || canExport || canCancel || canRestore || canDelete || canReprogram) && (
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Actions de gestion</span>
            </div>
          </div>
        )}
        
        {/* Actions secondaires en grille */}
        {(canEdit || canExport || canCancel || canRestore || canDelete || canReprogram) && (
          <div className="grid grid-cols-2 gap-3">
            {canEdit && (
              <button
                onClick={() => setShowEditPopup(true)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Modifier
              </button>
            )}
            
            {canExport && (
              <button
                onClick={() => handleGeneratePDF('pdf')}
                disabled={isGeneratingPDF}
                className={`
                  flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-xl transition-colors 
                  font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                  ${pdfGenerated 
                    ? 'bg-green-50 text-green-700 border-green-300' 
                    : pdfError 
                      ? 'bg-red-50 text-red-700 border-red-300' 
                      : ''
                  }
                `}
              >
                <div className="flex items-center justify-center w-4 h-4">
                  {isGeneratingPDF ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  ) : pdfGenerated ? (
                    <Check size={14} className="text-green-600" />
                  ) : pdfError ? (
                    <FileText size={14} className="text-red-600" />
                  ) : (
                    <FileText size={14} className="text-gray-600" />
                  )}
                </div>
                
                <span className="font-medium">
                  {isGeneratingPDF ? 'Génération...' : 
                   pdfGenerated ? 'Téléchargé ✓' : 
                   pdfError ? 'Erreur' : 
                   'Exporter PV'}
                </span>
              </button>
            )}
            
            {canReprogram && (
              <button
                onClick={() => setShowReprogramPopup(true)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Reprogrammer
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={actionLoading}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <AlertCircle size={16} />
                Annuler
              </button>
            )}
            
            {canRestore && (
              <button
                onClick={handleRestoreMeeting}
                disabled={actionLoading}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Restaurer
              </button>
            )}
            
            {canDelete && !isCompletedMeeting && !isCancelledMeeting && !isExpiredMeeting && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading}
                className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay flou */}
      <div 
        className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal principal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-title"
        >
          {/* Header avec bouton retour */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleClose}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="font-medium">Retour</span>
              </button>
              
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-150"
                aria-label="Fermer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                <Users size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900" id="meeting-title">
                    {meeting?.title || 'Chargement...'}
                  </h1>
                  {meeting && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                      {getStatusText(meeting.status)}
                    </span>
                  )}
                </div>
                {meeting?.description && (
                  <p className="text-gray-600 text-sm mt-1.5 max-w-2xl line-clamp-1">
                    {meeting.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Contenu du modal */}
          <div className="flex-1 overflow-auto p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Chargement des détails de la réunion...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Retour
                  </button>
                </div>
              </div>
            ) : meeting && canView ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne gauche - Informations détaillées */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Section Date et Heure */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar size={20} className="text-gray-500" />
                        Informations de planification
                      </h2>
                      {/* Bouton Reprogrammer */}
                      {canReprogram && (
                        <button
                          onClick={() => setShowReprogramPopup(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors font-medium"
                        >
                          <RefreshCw size={16} />
                          Reprogrammer
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500 font-medium">DATE ET HEURE</div>
                        <div className="text-xl font-semibold text-gray-900">
                          {formatDate(meeting.scheduledTime)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500 font-medium">DURÉE</div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                              <Clock size={16} className="text-gray-500" />
                              <span className="font-semibold text-gray-900">
                                {meeting.duration >= 60 
                                  ? `${Math.floor(meeting.duration / 60)}h${meeting.duration % 60 ? `${meeting.duration % 60}min` : ''}`
                                  : `${meeting.duration}min`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500 font-medium text-right">HEURE DE FIN</div>
                          <div className="text-gray-900 font-semibold">
                            {calculateEndTime(meeting.scheduledTime, meeting.duration)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Description */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Description détaillée</h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {meeting.description || 'Aucune description fournie pour cette réunion.'}
                      </p>
                    </div>
                  </div>

                  {/* Section Organisateur */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User size={20} className="text-gray-500" />
                      Responsable de la réunion
                    </h2>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">
                        {meeting.createdBy.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{meeting.createdBy.name}</div>
                        <div className="text-gray-600 text-sm">{meeting.createdBy.email}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {/* Rôle (Employé/Administrateur) */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle size={12} />
                            {meeting.createdBy.role === 'ADMIN' || meeting.createdBy.email === 'admin@gmail.com' 
                              ? 'Administrateur' 
                              : 'Employé'}
                          </span>
                          
                          {/* TOUJOURS afficher "Organisateur" pour le créateur */}
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            <User size={12} />
                            Organisateur
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonne droite - Actions et participants */}
                <div className="space-y-8">
                  {/* Section Actions principales */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Actions disponibles</h2>
                    
                    <div className="space-y-4">
                      {renderActionButtons()}
                    </div>
                  </div>

                  {/* Section Participants */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users size={20} className="text-gray-500" />
                      Participants ({meeting.participants.length})
                    </h2>
                    
                    <div className="space-y-2">
                      {meeting.participants.map((participant) => {
                        const isCurrentUser = participant.id === user.id;
                        const isOrganizer = participant.id === meeting.createdBy.id;
                        
                        return (
                          <div key={participant.id} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${
                              isCurrentUser ? 'bg-blue-500' :
                              isOrganizer ? 'bg-gray-800' : 'bg-gray-400'
                            }`}></div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {participant.name}
                                </span>
                                {isCurrentUser && (
                                  <span className="text-xs text-blue-600">(Vous)</span>
                                )}
                                {isOrganizer && !isCurrentUser && (
                                  <span className="text-xs text-gray-600">(Organisateur)</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {participant.email}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <Eye size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès restreint</h3>
                  <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette réunion.</p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup de modification */}
      {showEditPopup && meeting && (
        <EditMeetingPopup
          meeting={meeting}
          isOpen={showEditPopup}
          onClose={() => setShowEditPopup(false)}
          onConfirm={handleEditMeetingSubmit}
        />
      )}

      {/* Popup de reprogrammation */}
      {showReprogramPopup && meeting && (
        <ReprogramPopup
          meeting={meeting}
          isOpen={showReprogramPopup}
          onClose={() => setShowReprogramPopup(false)}
          onConfirm={handleReprogramMeetingSubmit}
        />
      )}

      {/* Modales de confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mr-5 border border-red-200">
                  <AlertCircle size={28} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Supprimer la réunion</h3>
                  <p className="text-gray-600">
                    Êtes-vous certain de vouloir supprimer définitivement cette réunion ? Cette action ne peut pas être annulée.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                  className="px-5 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteMeeting}
                  disabled={actionLoading}
                  className="px-5 py-3 text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Suppression...
                    </>
                  ) : (
                    'Supprimer définitivement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mr-5 border border-amber-200">
                  <AlertCircle size={28} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Annuler la réunion</h3>
                  <p className="text-gray-600">
                    Êtes-vous sûr de vouloir annuler cette réunion ? Tous les participants seront notifiés de l'annulation.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={actionLoading}
                  className="px-5 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCancelMeeting}
                  disabled={actionLoading}
                  className="px-5 py-3 text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Annulation...
                    </>
                  ) : (
                    'Annuler la réunion'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}