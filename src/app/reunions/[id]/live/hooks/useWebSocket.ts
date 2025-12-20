//usewebsocket
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ParticipantStatus } from '../types';

export const useWebSocket = (
  meetingId: string,
  user: any,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setParticipantsStatus: React.Dispatch<React.SetStateAction<ParticipantStatus[]>>,
  addNotification?: (message: string, type: 'join' | 'leave') => void
) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastStatusUpdateRef = useRef<Map<string, number>>(new Map());

  // Charger les messages sauvegardés
  useEffect(() => {
    if (!meetingId || !user) return;
    
    const loadSavedMessages = () => {
      if (typeof window === 'undefined') return;
      
      const storageKey = `meeting-chat-${meetingId}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          if (parsed.meetingEnded) {
            console.log('📁 Chargement du chat d\'une réunion terminée');
          }
          
          const messagesArray = parsed.messages || parsed;
          
          if (Array.isArray(messagesArray)) {
            const messages = messagesArray.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              type: msg.type || 'text'
            }));
            
            console.log('📂 Messages chargés:', messages.length);
            setChatMessages(messages);
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement messages:', error);
      }
    };
    
    loadSavedMessages();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSavedMessages();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [meetingId, user, setChatMessages]);

  // Pour envoyer des presence pings réguliers
  useEffect(() => {
    if (connectionStatus !== 'connected' || !user || !meetingId || !wsRef.current) return;
    
    console.log('🟢 Démarrage des presence pings');
    
    const presenceInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'presence_ping',
          userId: user.id,
          timestamp: new Date().toISOString()
        }));
        
        console.log('📤 Presence ping envoyé');
      } else {
        console.log('⚠️ Impossible d\'envoyer presence ping - WebSocket fermé');
      }
    }, 10000);
    
    return () => {
      console.log('🧹 Nettoyage des presence pings');
      clearInterval(presenceInterval);
    };
  }, [connectionStatus, user, meetingId]);

  // Synchronisation des messages
  useEffect(() => {
    if (!meetingId || connectionStatus !== 'connected') return;
    
    const syncInterval = setInterval(() => {
      if (typeof window === 'undefined') return;
      
      const storageKey = `meeting-chat-${meetingId}`;
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const messagesArray = parsed.messages || parsed;
          
          if (Array.isArray(messagesArray)) {
            const latestMessages = messagesArray.map((msg: any) => ({
              id: msg.id,
              senderId: msg.senderId,
              senderName: msg.senderName,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              type: msg.type || 'text'
            }));
            
            latestMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            
            setChatMessages(prev => {
              if (latestMessages.length > prev.length) {
                console.log(`🔄 Synchronisation: ${latestMessages.length - prev.length} nouveau(x) message(s)`);
                return latestMessages;
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('❌ Erreur synchronisation:', error);
        }
      }
    }, 3000);
    
    return () => clearInterval(syncInterval);
  }, [meetingId, connectionStatus, setChatMessages]);

  // CORRECTION : initializeWebSocket avec useCallback et dépendances correctes
  const initializeWebSocket = useCallback(() => {
    if (!user) {
      console.error('❌ User non défini pour WebSocket');
      setConnectionStatus('disconnected');
      return;
    }

    if (wsRef.current) {
      console.log('🧹 Fermeture WebSocket existant');
      wsRef.current.close();
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const wsPath = `${wsUrl}/meetings/${meetingId}`; // ← DÉFINI ICI
    console.log(`🔗 Connexion à: ${wsPath}`);
    
    const ws = new WebSocket(wsPath);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connecté avec succès');
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
      
      setTimeout(() => {
        if (user && ws.readyState === WebSocket.OPEN) {
          const joinMessage = {
            type: 'join',
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            timestamp: new Date().toISOString()
          };
          
          console.log('📤 Envoi message join après délai');
          ws.send(JSON.stringify(joinMessage));
          
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'get_participants',
                timestamp: new Date().toISOString()
              }));
            }
          }, 1000);
        }
      }, 500);
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ping',
          userId: user?.id,
          timestamp: new Date().toISOString()
        }));
      }
    }, 20000);

    // Fonction pour sauvegarder un message
    const saveMessage = (messageData: any) => {
      if (typeof window === 'undefined') return;
      
      const storageKey = `meeting-chat-${meetingId}`;
      try {
        const saved = localStorage.getItem(storageKey);
        let messages = [];
        
        if (saved) {
          const parsed = JSON.parse(saved);
          messages = Array.isArray(parsed) ? parsed : parsed.messages || [];
        }
        
        if (messageData.type === 'system') {
          const recentSimilarSystemMessage = messages.find(msg => 
            msg.type === 'system' &&
            msg.content === messageData.content &&
            Math.abs(new Date(msg.timestamp).getTime() - new Date(messageData.timestamp).getTime()) < 10000
          );
          
          if (recentSimilarSystemMessage) {
            console.log('⏭️ Message système en double ignoré:', messageData.content);
            return;
          }
        }
        
        if (messageData.isPending) {
          const existingPendingIndex = messages.findIndex(msg => 
            msg.id === messageData.id && msg.isPending === true
          );
          
          if (existingPendingIndex !== -1) {
            console.log('⏭️ Message en attente déjà sauvegardé');
            return;
          }
        }
        
        if (!messageData.isPending && messageData.id) {
          const pendingIndex = messages.findIndex(msg => 
            msg.id === messageData.id && msg.isPending === true
          );
          
          if (pendingIndex !== -1) {
            console.log('🔄 Remplacement message en attente par version confirmée');
            messages[pendingIndex] = {
              ...messageData,
              isPending: false
            };
          } else {
            messages.push(messageData);
          }
        } else {
          messages.push(messageData);
        }
        
        if (messages.length > 500) {
          messages = messages.slice(-500);
        }
        
        localStorage.setItem(storageKey, JSON.stringify({
          meetingId,
          lastUpdated: new Date().toISOString(),
          messages
        }));
        
        console.log('💾 Message sauvegardé. Total:', messages.length);
      } catch (error) {
        console.error('❌ Erreur sauvegarde message:', error);
      }
    };

    ws.onmessage = (event) => {
      console.log('🟢 Message reçu:', event.data.substring(0, 100));

      try {
        const data = JSON.parse(event.data);
        
        // 🔥 Ignorer les messages de soi-même (sauf chat)
        if (data.userId === user?.id && data.type !== 'chat_message') {
          console.log('⏭️ Message de soi-même ignoré');
          return;
        }
        
        switch (data.type) {
          case 'welcome':
            console.log('👋 Serveur:', data.message);
            break;
            
          case 'join_ack':
            console.log('✅ Serveur a confirmé votre connexion');
            break;
            
          case 'participants_list':
            console.log('👥 Liste participants reçue:', data.participants?.length || 0, 'participants');
            
            if (data.participants) {
              const updatedParticipants = (data.participants || [])
                .filter(p => p.userId !== user?.id)
                .map(p => ({
                  userId: p.userId,
                  userName: p.userName,
                  isActive: p.isActive,
                  isOnline: p.isOnline !== undefined ? p.isOnline : true,
                  audioEnabled: p.audioEnabled ?? true,
                  videoEnabled: p.videoEnabled ?? true,
                  handRaised: p.handRaised,
                  joinedAt: new Date(p.joinedAt),
                  lastSeen: p.lastSeen ? new Date(p.lastSeen) : new Date(p.joinedAt)
                }));
              
              console.log('📊 Participants avec statut en ligne:', 
                updatedParticipants.filter(p => p.isOnline).length, '/', updatedParticipants.length);
              
              setParticipantsStatus(updatedParticipants);
            }
            break;
            
          case 'user_joined':
            console.log('👤 Nouvel utilisateur:', data.userName);
            
            setParticipantsStatus(prev => [
              ...prev.filter(p => p.userId !== data.userId),
              {
                userId: data.userId,
                userName: data.userName,
                isActive: true,
                isOnline: true,
                audioEnabled: data.audioEnabled ?? true,
                videoEnabled: data.videoEnabled ?? true,
                joinedAt: new Date(data.timestamp),
                lastSeen: new Date(data.timestamp)
              }
            ]);
            
            if (addNotification && data.userId !== user?.id) {
              addNotification(`${data.userName} a rejoint la réunion`, 'join');
            }
            break;
            
          case 'user_left':
            console.log('👋 Utilisateur parti:', data.userName, 'intentionnel:', data.intentionally);
            
            if (data.intentionally === false) {
              console.log('🌐 Déconnexion réseau détectée pour:', data.userName);
              
              setParticipantsStatus(prev => 
                prev.map(p => 
                  p.userId === data.userId 
                    ? { ...p, isOnline: false }
                    : p
                )
              );
              
              if (addNotification) {
                setTimeout(() => {
                  setParticipantsStatus(prev => {
                    const userStillOffline = prev.find(p => p.userId === data.userId && p.isOnline === false);
                    if (userStillOffline && addNotification) {
                      addNotification(`${data.userName} s'est déconnecté`, 'leave');
                    }
                    return prev;
                  });
                }, 4000);
              }
            } else {
              console.log('🚪 Départ intentionnel détecté pour:', data.userName);
              
              setParticipantsStatus(prev => 
                prev.filter(p => p.userId !== data.userId)
              );
              
              if (addNotification) {
                addNotification(`${data.userName} a quitté la réunion`, 'leave');
              }
            }
            break;
            
          case 'user_status_update':
            // 🔥 ANTI-SPAM : ignorer si trop récent
            const lastUpdate = lastStatusUpdateRef.current.get(data.userId);
            const now = Date.now();
            
            if (lastUpdate && now - lastUpdate < 1000) {
              console.log('⏭️ Statut ignoré (trop rapide) pour:', data.userName);
              return;
            }
            
            lastStatusUpdateRef.current.set(data.userId, now);
            console.log('🔄 Mise à jour statut:', data.userName, data);
            
            setParticipantsStatus(prev => 
              prev.map(p => 
                p.userId === data.userId 
                  ? { 
                      ...p, 
                      isOnline: true,
                      audioEnabled: data.audioEnabled ?? p.audioEnabled,
                      videoEnabled: data.videoEnabled ?? p.videoEnabled,
                      lastSeen: new Date(data.timestamp)
                    }
                  : p
              )
            );
            break;
            
          case 'chat_message':
            console.log('💬 Message chat reçu du serveur:', {
              sender: data.senderName,
              content: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
              messageId: data.messageId,
              isFromMe: data.senderId === user?.id
            });

            const chatMessage: ChatMessage = {
              id: data.messageId,
              senderId: data.senderId,
              senderName: data.senderName,
              content: data.content,
              timestamp: new Date(data.timestamp),
              type: 'text' as const 
            };
            
            setChatMessages(prev => {
              if (data.senderId === user?.id) {
                const pendingIndex = prev.findIndex(msg => 
                  msg.id === data.messageId && msg.isPending === true
                );
                
                if (pendingIndex !== -1) {
                  console.log('🔄 Message en attente trouvé, remplacement');
                  const newMessages = [...prev];
                  newMessages[pendingIndex] = chatMessage;
                  return newMessages;
                }
              }
              
              const alreadyExists = prev.some(msg => 
                msg.id === chatMessage.id || 
                (msg.senderId === chatMessage.senderId && 
                 msg.content === chatMessage.content && 
                 Math.abs(msg.timestamp.getTime() - chatMessage.timestamp.getTime()) < 1000)
              );
              
              if (alreadyExists) {
                console.log('⏭️ Message déjà présent, ignoré');
                return prev;
              }
              
              console.log('✅ Ajout nouveau message au state');
              return [...prev, chatMessage];
            });
            
            saveMessage(chatMessage);
            break;
            
          case 'heartbeat':
            console.log('❤️ Heartbeat reçu');
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
            }
            break;
            
          case 'presence_ack':
            console.log('✅ Presence ack reçu du serveur');
            break;
            
          default:
            console.log('📨 Message non géré:', data.type, data);
        }
        
      } catch (error) {
        console.error('❌ Erreur parsing message:', error, event.data);
      }
    };

    ws.onerror = (error) => {
      if (process.env.NODE_ENV === 'development') {
    console.log('ℹ️ WebSocket: Serveur non démarré (mode développement)');
    setConnectionStatus('disconnected');
    clearInterval(pingInterval);
    return;
  }
    };

    ws.onclose = (event) => {
  // En développement, log simplifié
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 WebSocket déconnecté');
  } else {
    console.log('🔌 WebSocket fermé', {
      code: event.code,
      reason: event.reason || 'Aucune raison',
      wasClean: event.wasClean
    });
  }
  
  clearInterval(pingInterval);
  setConnectionStatus('disconnected');
      
      if (reconnectAttemptRef.current < 3) {
        reconnectAttemptRef.current += 1;
        const delay = Math.min(3000 * reconnectAttemptRef.current, 10000);
        
        console.log(`⏳ Reconnexion dans ${delay}ms... (${reconnectAttemptRef.current}/3)`);
        
        setTimeout(() => {
          console.log('🔄 Tentative de reconnexion...');
          setConnectionStatus('reconnecting');
          initializeWebSocket();
        }, delay);
      } else {
        console.log('🚫 Nombre maximum de tentatives atteint');
      }
    };

    return () => {
      clearInterval(pingInterval);
    };

  }, [user?.id, meetingId, setConnectionStatus, setChatMessages, setParticipantsStatus, addNotification]); // ← DÉPENDANCES CORRECTES

  const sendUserStatus = useCallback((updates: Partial<ParticipantStatus>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) {
      console.log('⚠️ Impossible d\'envoyer le statut - WebSocket non prêt');
      return;
    }
    
    const statusMessage = {
      type: 'user_status_update',
      userId: user.id,
      ...updates,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Envoi statut:', statusMessage);
    wsRef.current.send(JSON.stringify(statusMessage));
  }, [user?.id]);

  const sendChatMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) {
      console.log('❌ WebSocket non prêt - État:', wsRef.current?.readyState);
      return;
    }
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const messageId = `msg-${user.id}-${timestamp}-${randomStr}`;
    
    console.log('🚀 ENVOI MESSAGE CHAT:', {
      messageId,
      content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      user: user.name,
      wsReady: wsRef.current.readyState === WebSocket.OPEN
    });
    
    const messageData = {
      type: 'chat_message',
      messageId,
      senderId: user.id,
      senderName: user.name,
      content,
      timestamp: new Date().toISOString()
    };
    
    const uiMessage: ChatMessage = {
      id: messageId,
      senderId: user.id,
      senderName: user.name,
      content,
      timestamp: new Date(),
      type: 'text' as const,
      isPending: true
    };
    
    setChatMessages(prev => {
      const alreadyExists = prev.some(msg => 
        msg.id === messageId || 
        (msg.senderId === user.id && 
         msg.content === content && 
         Math.abs(msg.timestamp.getTime() - Date.now()) < 1000)
      );
      
      if (alreadyExists) {
        console.log('⚠️ Message déjà dans le state, ignoré');
        return prev;
      }
      
      console.log('✅ Message ajouté au state (en attente)');
      return [...prev, uiMessage];
    });
    
    if (typeof window !== 'undefined') {
      const storageKey = `meeting-chat-${meetingId}`;
      try {
        const saved = localStorage.getItem(storageKey);
        let savedData = saved ? JSON.parse(saved) : { meetingId, messages: [] };
        
        if (!savedData.messages || !Array.isArray(savedData.messages)) {
          savedData = { meetingId, messages: savedData.messages || savedData || [] };
        }
        
        const messageExists = savedData.messages.some((msg: any) => 
          msg.id === messageId || 
          (msg.senderId === user.id && 
           msg.content === content && 
           Math.abs(new Date(msg.timestamp).getTime() - Date.now()) < 1000)
        );
        
        if (!messageExists) {
          savedData.messages.push({
            ...uiMessage,
            timestamp: new Date().toISOString()
          });
          
          if (savedData.messages.length > 500) {
            savedData.messages = savedData.messages.slice(-500);
          }
          
          savedData.lastUpdated = new Date().toISOString();
          localStorage.setItem(storageKey, JSON.stringify(savedData));
          
          console.log('💾 Message sauvegardé localement (en attente)');
        } else {
          console.log('⏭️ Message déjà sauvegardé localement, ignoré');
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde locale:', error);
      }
    }
    
    wsRef.current.send(JSON.stringify(messageData));
    
  }, [user?.id, meetingId, setChatMessages]);

  const endMeeting = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    const endMessage = {
      type: 'meeting_ended',
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString()
    };
    
    wsRef.current.send(JSON.stringify(endMessage));
  }, [user?.id]);

  const leaveMeeting = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) return;
    
    const leaveMessage = {
      type: 'leave',
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString()
    };
    
    wsRef.current.send(JSON.stringify(leaveMessage));
  }, [user?.id]);

  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      console.log('🧹 Nettoyage WebSocket');
      wsRef.current.close(1000, 'Composant démonté');
      wsRef.current = null;
    }
  }, []);

  return {
    connectionStatus,
    initializeWebSocket,
    sendUserStatus,
    sendChatMessage,
    endMeeting,
    leaveMeeting,
    cleanupWebSocket
  };
};