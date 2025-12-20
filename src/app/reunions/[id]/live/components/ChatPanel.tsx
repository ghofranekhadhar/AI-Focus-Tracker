// src/app/reunions/[id]/live/components/ChatPanel.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Send, Mic, MicOff, Video, VideoOff, Wifi, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  newMessage: string;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  user: any;
  connectionStatus: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  user,
  connectionStatus
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSystemMessages, setShowSystemMessages] = useState(true);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);

  // Filtrer et dédoublonner les messages
  useEffect(() => {
    // 1. Filtrer par type
    let filtered = chatMessages.filter(msg => 
      showSystemMessages || msg.type === 'text'
    );

    // 2. Supprimer les doublons (même ID)
    filtered = filtered.reduce((unique: ChatMessage[], msg) => {
      const existing = unique.find(m => m.id === msg.id);
      if (!existing) {
        unique.push(msg);
      } else {
        // Si doublon, garder le plus récent
        const existingIndex = unique.findIndex(m => m.id === msg.id);
        if (msg.timestamp > existing.timestamp) {
          unique[existingIndex] = msg;
        }
      }
      return unique;
    }, []);

    // 3. Trier par date
    filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    setFilteredMessages(filtered);
  }, [chatMessages, showSystemMessages]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        onSendMessage();
      }
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'reconnecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connecté';
      case 'connecting': return 'Connexion...';
      case 'reconnecting': return 'Reconnexion...';
      case 'disconnected': return 'Déconnecté';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-950 to-gray-900">
      {/* En-tête du chat */}
      <div className="p-4 border-b border-gray-800/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              Chat de la réunion
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Bouton messages système */}
            <button
              onClick={() => setShowSystemMessages(!showSystemMessages)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition duration-200 ${
                showSystemMessages 
                  ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-400' 
                  : 'bg-gray-800/30 text-gray-400 hover:text-gray-300'
              }`}
              title={showSystemMessages ? "Masquer messages système" : "Afficher messages système"}
            >
              {showSystemMessages ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="text-xs font-medium">
                {showSystemMessages ? 'Système' : 'Caché'}
              </span>
            </button>
            
            {/* Statut de connexion */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-xs font-medium text-gray-300">
                {getConnectionStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone des messages - DÉFILANTE */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="p-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                  <Send size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-300 font-medium">Aucun message</p>
                <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                  {showSystemMessages 
                    ? 'Envoyez le premier message pour démarrer la conversation'
                    : 'Activez "Système" pour voir les messages système'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((msg, index) => {
                  // Créer une clé UNIQUE combinant ID, index et timestamp
                  const uniqueKey = `${msg.id}-${index}-${msg.timestamp.getTime()}`;
                  return (
                    <ChatMessageItem
                      key={uniqueKey}
                      message={msg}
                      isCurrentUser={msg.senderId === user?.id}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone de saisie */}
      <div className="border-t border-gray-800/50 p-4 flex-shrink-0 bg-gradient-to-t from-gray-900 to-gray-950">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Écrire un message..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 resize-none pr-12"
              rows={2}
              maxLength={500}
              disabled={connectionStatus !== 'connected'}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-500">
              {newMessage.length}/500
            </div>
          </div>
          
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim() || connectionStatus !== 'connected'}
            className={`self-end px-4 py-3 rounded-xl transition duration-200 flex items-center justify-center ${
              newMessage.trim() && connectionStatus === 'connected'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
            title={connectionStatus !== 'connected' ? "Non connecté" : "Envoyer"}
          >
            <Send size={18} />
          </button>
        </div>
        
        {/* Indicateur de connexion */}
        {connectionStatus !== 'connected' && (
          <div className="mt-3 p-2 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 rounded-lg border border-amber-800/30">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-400" />
              <span className="text-xs text-amber-300">
                {connectionStatus === 'disconnected' 
                  ? 'Déconnecté - Impossible d\'envoyer des messages'
                  : 'Connexion en cours...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;