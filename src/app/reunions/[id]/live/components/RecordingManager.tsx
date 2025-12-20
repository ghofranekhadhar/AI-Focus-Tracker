// RecordingManager.tsx - 
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, Play, Clock, Calendar, FileVideo, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { recordingDB, RecordingDB } from '@/src/lib/indexedDB';

interface Recording {
  id: string;
  meetingId: string;
  meetingTitle: string;
  recordingDate: string;
  duration: number;
  fileName: string;
  size: number;
  fileSizeMB?: string;
  audioType?: 'system' | 'microphone' | 'none';
  pausedTime?: number;
  activeTime?: number;
  status?: 'completed' | 'pending';
  blob?: Blob;
}

interface RecordingManagerProps {
  meetingId: string;
  meetingTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordingManager: React.FC<RecordingManagerProps> = ({
  meetingId,
  meetingTitle = 'Réunion',
  isOpen,
  onClose
}) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecordings();
    }
  }, [meetingId, isOpen]);

  // Écouter les nouveaux enregistrements
  useEffect(() => {
    const handleRecordingSaved = (event: CustomEvent) => {
      if (event.detail.meetingId === meetingId) {
        console.log('🔄 Nouvel enregistrement détecté, rechargement...');
        loadRecordings();
      }
    };
    
    window.addEventListener('recording-saved', handleRecordingSaved as EventListener);
    
    return () => {
      window.removeEventListener('recording-saved', handleRecordingSaved as EventListener);
    };
  }, [meetingId]);

  const loadRecordings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Charger depuis IndexedDB
      const dbRecordings = await recordingDB.getRecordingsByMeeting(meetingId);
      
      console.log(`📁 ${dbRecordings.length} enregistrement(s) chargé(s) depuis IndexedDB`);
      
      // Convertir en format d'affichage
      const formattedRecordings: Recording[] = dbRecordings.map((rec: RecordingDB) => ({
        id: rec.id,
        meetingId: rec.meetingId,
        meetingTitle: meetingTitle,
        recordingDate: rec.timestamp,
        duration: rec.duration,
        fileName: rec.fileName,
        size: rec.fileSize,
        fileSizeMB: (rec.fileSize / (1024 * 1024)).toFixed(2),
        audioType: rec.audioType,
        pausedTime: rec.metadata.pausedTime,
        activeTime: rec.metadata.activeTime,
        status: rec.metadata.status,
        blob: rec.blob // ← Conserver le blob
      }));
      
      setRecordings(formattedRecordings);
      
    } catch (error) {
      console.error('❌ Erreur chargement enregistrements:', error);
      setRecordings([]);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, meetingTitle]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  }, []);

  const handlePlayRecording = useCallback((recording: Recording) => {
    if (recording.blob) {
      // Créer une URL blob temporaire
      const url = URL.createObjectURL(recording.blob);
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        // Libérer l'URL après que la fenêtre soit chargée
        newWindow.onload = () => {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
      } else {
        // Fallback: télécharger
        handleDownloadRecording(recording);
      }
    } else {
      alert('Aucun enregistrement disponible pour la lecture.');
    }
  }, []);

  const handleDownloadRecording = useCallback((recording: Recording) => {
    if (recording.blob) {
      try {
        const url = URL.createObjectURL(recording.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = recording.fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`📥 Téléchargement: ${recording.fileName}`);
      } catch (error) {
        console.error('❌ Erreur téléchargement:', error);
        alert('Erreur lors du téléchargement');
      }
    } else {
      alert('Aucun enregistrement disponible pour le téléchargement.');
    }
  }, []);

  const handleDeleteRecording = useCallback(async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?\n\nCette action est irréversible.')) return;
    
    try {
      await recordingDB.deleteRecording(id);
      console.log(`🗑️ Enregistrement ${id} supprimé`);
      loadRecordings(); // Recharger la liste
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }, [loadRecordings]);

  const handleExportAll = useCallback(async () => {
    if (recordings.length === 0) return;
    
    setExportingAll(true);
    
    try {
      // Vérifier si JSZip est disponible
      let JSZip: any;
      try {
        JSZip = (await import('jszip')).default;
      } catch (error) {
        console.log('JSZip non disponible, téléchargement individuel');
        // Télécharger chaque fichier individuellement
        recordings.forEach((recording, index) => {
          setTimeout(() => handleDownloadRecording(recording), index * 500);
        });
        return;
      }
      
      const zip = new JSZip();
      
      // Ajouter un fichier d'index
      const indexContent = recordings.map((rec, index) => 
        `${index + 1}. ${rec.fileName}\n   Durée: ${formatDuration(rec.duration)} | Taille: ${formatFileSize(rec.size)}\n   Type audio: ${rec.audioType || 'inconnu'}\n   Date: ${new Date(rec.recordingDate).toLocaleString()}\n`
      ).join('\n');
      
      zip.file('INDEX.txt', `ENREGISTREMENTS DE LA RÉUNION\n${meetingTitle}\nID: ${meetingId}\n\nTotal: ${recordings.length} enregistrement(s)\n\n${indexContent}`);
      
      // Ajouter chaque enregistrement
      for (const recording of recordings) {
        if (recording.blob) {
          zip.file(recording.fileName, recording.blob);
        }
      }
      
      // Générer le ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `enregistrements_${meetingId}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`📦 ${recordings.length} enregistrement(s) exporté(s) dans ZIP`);
      
    } catch (error) {
      console.error('❌ Erreur export:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setExportingAll(false);
    }
  }, [recordings, meetingId, meetingTitle, formatDuration, formatFileSize, handleDownloadRecording]);

  const clearAllRecordings = useCallback(async () => {
    if (!confirm('Supprimer TOUS les enregistrements de cette réunion ?\n\nCette action est irréversible.')) return;
    
    try {
      await recordingDB.deleteAllRecordings(meetingId);
      setRecordings([]);
      console.log('🗑️ Tous les enregistrements supprimés');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }, [meetingId]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800/50 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Enregistrements de la réunion
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {meetingTitle} • {recordings.length} enregistrement{recordings.length !== 1 ? 's' : ''} disponible{recordings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition duration-200"
            aria-label="Fermer"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>
        
        {/* Barre d'info et actions */}
        <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {recordings.length > 0 ? (
                <>
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm text-gray-300">
                    {recordings.length} enregistrement(s) sauvegardé(s)
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    Total: {(recordings.reduce((sum, r) => sum + r.size, 0) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-amber-400" />
                  <span className="text-sm text-gray-300">
                    Aucun enregistrement trouvé
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadRecordings}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                <RefreshCw size={14} />
                Actualiser
              </button>
              
              {recordings.length > 0 && (
                <button
                  onClick={clearAllRecordings}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded-lg transition"
                >
                  <Trash2 size={14} />
                  Tout supprimer
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Liste des enregistrements */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Chargement des enregistrements...</p>
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileVideo size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-300 font-medium">Aucun enregistrement</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                Les enregistrements démarrés apparaîtront ici une fois terminés
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition duration-200 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 bg-blue-900/20 rounded-lg flex-shrink-0">
                          <FileVideo size={18} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-100 truncate">
                              {recording.fileName}
                            </h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              recording.audioType === 'system' ? 'bg-green-900/40 text-green-300' :
                              recording.audioType === 'microphone' ? 'bg-blue-900/40 text-blue-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {recording.audioType === 'system' ? 'Audio système' :
                               recording.audioType === 'microphone' ? 'Microphone' : 'Sans audio'}
                            </span>
                            {recording.status === 'completed' && (
                              <span className="px-2 py-0.5 text-xs bg-green-900/40 text-green-300 rounded-full">
                                ✓ Terminé
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar size={12} />
                              {new Date(recording.recordingDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Clock size={12} />
                              {formatDuration(recording.duration)}
                              {recording.pausedTime && recording.pausedTime > 0 && (
                                <span className="text-xs text-amber-400"> (dont {recording.pausedTime}s en pause)</span>
                              )}
                            </span>
                            <span className="text-gray-300 whitespace-nowrap font-medium">
                              {recording.fileSizeMB || formatFileSize(recording.size)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayRecording(recording);
                        }}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition duration-200"
                        title="Visionner"
                        aria-label={`Visionner ${recording.fileName}`}
                      >
                        <Play size={16} className="text-blue-400" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadRecording(recording);
                        }}
                        className="p-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition duration-200"
                        title="Télécharger"
                        aria-label={`Télécharger ${recording.fileName}`}
                      >
                        <Download size={16} className="text-green-400" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecording(recording.id);
                        }}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition duration-200"
                        title="Supprimer"
                        aria-label={`Supprimer ${recording.fileName}`}
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              Stockage local (IndexedDB) • Les enregistrements sont conservés dans votre navigateur
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportAll}
                disabled={recordings.length === 0 || exportingAll}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition duration-200 ${
                  recordings.length === 0 || exportingAll
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {exportingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Export...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Exporter tout ({recordings.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};