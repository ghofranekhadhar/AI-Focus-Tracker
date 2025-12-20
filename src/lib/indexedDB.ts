const DB_NAME = 'MeetingRecordingsDB';
const DB_VERSION = 2; // ← CHANGER DE 1 À 2
const STORE_NAME = 'recordings';

export interface RecordingDB {
  id: string;
  meetingId: string;
  fileName: string;
  fileSize: number;
  duration: number;
  timestamp: string;
  audioType: 'system' | 'microphone' | 'none';
  blob: Blob;
  metadata: {
    pausedTime: number;
    activeTime: number;
    status: 'completed' | 'pending';
  };
}

class RecordingDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log(`✅ IndexedDB ${DB_NAME} v${DB_VERSION} prêt`);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log(`🔄 Mise à jour IndexedDB: v${event.oldVersion} → v${DB_VERSION}`);
        
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // 1. NOUVELLE BASE : créer le store et les indexes
          console.log(`📦 Création store: ${STORE_NAME}`);
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Créer les indexes
          store.createIndex('meetingId', 'meetingId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          
          console.log('✅ Indexes créés: meetingId, timestamp');
        } else {
          // 2. MISE À JOUR : vérifier et ajouter les indexes manquants
          const store = transaction!.objectStore(STORE_NAME);
          const indexNames = Array.from(store.indexNames);
          
          console.log(`📊 Indexes existants:`, indexNames);
          
          // Ajouter l'index meetingId s'il n'existe pas
          if (!indexNames.includes('meetingId')) {
            console.log('➕ Ajout index: meetingId');
            store.createIndex('meetingId', 'meetingId', { unique: false });
          }
          
          // Ajouter l'index timestamp s'il n'existe pas
          if (!indexNames.includes('timestamp')) {
            console.log('➕ Ajout index: timestamp');
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        }
      };

      // Gérer les versions trop récentes
      request.onblocked = () => {
        console.warn('⚠️ IndexedDB bloqué par une autre connexion');
        alert('Veuillez fermer les autres onglets de cette application');
      };
    });
  }

  async saveRecording(recording: RecordingDB): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put(recording);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`💾 Enregistrement ${recording.id} sauvegardé`);
        resolve();
      };
    });
  }

  async getRecordingsByMeeting(meetingId: string): Promise<RecordingDB[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      try {
        // Essayer avec l'index
        const index = store.index('meetingId');
        const request = index.getAll(meetingId);

        request.onerror = (event) => {
          console.warn('⚠️ Index meetingId non accessible, fallback manuel');
          this.fallbackGetByMeeting(store, meetingId).then(resolve).catch(reject);
        };
        
        request.onsuccess = () => {
          const result = request.result || [];
          console.log(`📁 ${result.length} enregistrement(s) trouvé(s) via index`);
          resolve(result);
        };
        
      } catch (error) {
        console.warn('⚠️ Erreur avec index, fallback manuel:', error);
        this.fallbackGetByMeeting(store, meetingId).then(resolve).catch(reject);
      }
    });
  }

  // Fallback si l'index n'existe pas
  private async fallbackGetByMeeting(store: IDBObjectStore, meetingId: string): Promise<RecordingDB[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allRecordings = request.result || [];
        const filtered = allRecordings.filter((rec: RecordingDB) => 
          rec.meetingId === meetingId
        );
        console.log(`📁 ${filtered.length}/${allRecordings.length} enregistrement(s) via fallback`);
        resolve(filtered);
      };
    });
  }

  async deleteRecording(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`🗑️ Enregistrement ${id} supprimé`);
        resolve();
      };
    });
  }

  async deleteAllRecordings(meetingId: string): Promise<void> {
    const recordings = await this.getRecordingsByMeeting(meetingId);
    console.log(`🗑️ Suppression de ${recordings.length} enregistrement(s)`);
    
    for (const recording of recordings) {
      await this.deleteRecording(recording.id);
    }
  }

  async getRecordingCount(meetingId: string): Promise<number> {
    const recordings = await this.getRecordingsByMeeting(meetingId);
    return recordings.length;
  }

  // Méthode utilitaire pour vérifier l'état de la base
  async debugInfo(): Promise<{ version: number; storeNames: string[]; indexes: string[] }> {
    if (!this.db) await this.init();
    
    const storeNames = Array.from(this.db!.objectStoreNames);
    const indexes: string[] = [];
    
    if (storeNames.length > 0) {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      indexes.push(...Array.from(store.indexNames));
    }
    
    return {
      version: this.db!.version,
      storeNames,
      indexes
    };
  }
}

export const recordingDB = new RecordingDBService();