const WebSocket = require('ws');

const userConnectionStates = new Map();
const userLastSeen = new Map(); // ← NOUVEAU

const wss = new WebSocket.Server({ 
  port: 3001,
  clientTracking: true
});

console.log('✅ Serveur WebSocket démarré sur ws://localhost:3001');

const activeMeetings = new Map();
let lastBroadcastTime = 0;

// Fonction pour mettre à jour les statuts
function updateParticipantStatus(meetingId, userId, updates) {
  const meeting = activeMeetings.get(meetingId);
  if (!meeting) return;
  
  const participant = meeting.participants.get(userId);
  if (participant) {
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        participant[key] = updates[key];
      }
    });
    meeting.participants.set(userId, participant);
  }
}

// Fonction pour diffuser à tous
function broadcastToAll(meetingId, message) {
  const meeting = activeMeetings.get(meetingId);
  if (!meeting) return;
  
  const now = Date.now();
  if (message.type === 'participants_list' && now - lastBroadcastTime < 1000) {
    console.log('⏳ Skipping participants_list (trop récent)');
    return;
  }
  
  if (message.type === 'participants_list') {
    lastBroadcastTime = now;
  }
  
  meeting.participants.forEach(participant => {
    if (participant.ws && participant.ws.readyState === WebSocket.OPEN) {
      try {
        participant.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Erreur envoi broadcast:', error);
      }
    }
  });
}

// Fonction pour diffuser aux autres
function broadcastToOthers(meetingId, excludeUserId, message) {
  const meeting = activeMeetings.get(meetingId);
  if (!meeting) return;
  
  meeting.participants.forEach(participant => {
    if (participant.userId !== excludeUserId && 
        participant.ws && 
        participant.ws.readyState === WebSocket.OPEN) {
      try {
        participant.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Erreur envoi:', error);
      }
    }
  });
}

wss.on('connection', (ws, req) => {
  console.log('🔗 Connexion établie');
  
  const url = req.url;
  const meetingId = url.split('/').pop() || 'unknown';
  
  console.log(`📋 Réunion ID: ${meetingId}`);
  
  if (!activeMeetings.has(meetingId)) {
    activeMeetings.set(meetingId, {
      participants: new Map(),
      createdAt: new Date()
    });
    console.log(`🏁 Nouvelle réunion créée: ${meetingId}`);
  }
  
  const meeting = activeMeetings.get(meetingId);
  let currentUser = null;
  
  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, 25000);
  
  // Message de bienvenue
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connecté au serveur de réunion',
    meetingId: meetingId,
    timestamp: new Date().toISOString()
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 [${meetingId}] Message: ${message.type}`, 
                 message.userName ? `de ${message.userName}` : '');
      
      // Mettre à jour lastSeen pour TOUS les messages
      if (currentUser && meeting) {
        const lastSeenMap = userLastSeen.get(meetingId) || new Map();
        lastSeenMap.set(currentUser.userId, Date.now());
        userLastSeen.set(meetingId, lastSeenMap);
      }
      
      switch (message.type) {
        case 'join':
          currentUser = {
            userId: message.userId,
            userName: message.userName,
            userEmail: message.userEmail,
            isActive: true,
            audioEnabled: true,
            videoEnabled: true,
            joinedAt: new Date(message.timestamp),
            ws: ws
          };
          
          // Enregistrer la première activité
          const lastSeenMap = userLastSeen.get(meetingId) || new Map();
          lastSeenMap.set(message.userId, Date.now());
          userLastSeen.set(meetingId, lastSeenMap);
          
          meeting.participants.set(message.userId, currentUser);
          
          ws.send(JSON.stringify({
            type: 'join_ack',
            message: 'Vous avez rejoint la réunion',
            userId: message.userId,
            timestamp: new Date().toISOString()
          }));
          
          broadcastToOthers(meetingId, message.userId, {
            type: 'user_joined',
            userId: message.userId,
            userName: message.userName,
            audioEnabled: true,
            videoEnabled: true,
            timestamp: new Date().toISOString()
          });
          
          setTimeout(() => {
            broadcastToAll(meetingId, {
              type: 'participants_list',
              participants: Array.from(meeting.participants.values()).map(p => ({
                userId: p.userId,
                userName: p.userName,
                isActive: p.isActive,
                audioEnabled: p.audioEnabled,
                videoEnabled: p.videoEnabled,
                joinedAt: p.joinedAt
              })),
              timestamp: new Date().toISOString()
            });
          }, 300);
          
          console.log(`👤 ${message.userName} a rejoint (${meeting.participants.size} participants)`);
          break;
          
        case 'get_participants':
          const lastSeenMapParticipants = userLastSeen.get(meetingId) || new Map();
          
          const participantsWithStatus = Array.from(meeting.participants.values()).map(p => {
            const lastSeenTimestamp = lastSeenMapParticipants.get(p.userId);
            const isOnline = lastSeenTimestamp ? (Date.now() - lastSeenTimestamp) < 45000 : true;
            
            return {
              userId: p.userId,
              userName: p.userName,
              isActive: p.isActive,
              isOnline: isOnline,
              audioEnabled: p.audioEnabled,
              videoEnabled: p.videoEnabled,
              joinedAt: p.joinedAt,
              lastSeen: lastSeenTimestamp ? new Date(lastSeenTimestamp).toISOString() : p.joinedAt
            };
          });
          
          ws.send(JSON.stringify({
            type: 'participants_list',
            participants: participantsWithStatus,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'presence_ping':
          console.log(`❤️ [${meetingId}] Presence ping de ${currentUser?.userName}`);
          
          if (currentUser && meeting) {
            const presenceLastSeenMap = userLastSeen.get(meetingId) || new Map();
            presenceLastSeenMap.set(currentUser.userId, Date.now());
            userLastSeen.set(meetingId, presenceLastSeenMap);
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'presence_ack',
                timestamp: new Date().toISOString()
              }));
            }
          }
          break;
          
        case 'user_status_update':
          if (currentUser) {
            updateParticipantStatus(meetingId, currentUser.userId, {
              audioEnabled: message.audioEnabled,
              videoEnabled: message.videoEnabled
            });
            
            const updatedUser = meeting.participants.get(currentUser.userId);
            
            broadcastToOthers(meetingId, currentUser.userId, {
              type: 'user_status_update',
              userId: currentUser.userId,
              userName: currentUser.userName,
              audioEnabled: updatedUser.audioEnabled,
              videoEnabled: updatedUser.videoEnabled,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case 'chat_message':
          console.log(`💬 [${meetingId}] Message chat de ${message.senderName}: "${message.content}"`);
          
          broadcastToAll(meetingId, {
            type: 'chat_message',
            messageId: message.messageId,
            senderId: message.senderId,
            senderName: message.senderName,
            content: message.content,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'leave':
          if (currentUser) {
            console.log(`👋 ${currentUser.userName} a quitté la réunion`);
            
            const leaveLastSeenMap = userLastSeen.get(meetingId) || new Map();
            leaveLastSeenMap.delete(currentUser.userId);
            userLastSeen.set(meetingId, leaveLastSeenMap);
            
            meeting.participants.delete(currentUser.userId);
            
            broadcastToOthers(meetingId, currentUser.userId, {
              type: 'user_left',
              userId: currentUser.userId,
              userName: currentUser.userName,
              timestamp: new Date().toISOString(),
              intentionally: true
            });
            
            if (meeting.participants.size > 0) {
              setTimeout(() => {
                broadcastToAll(meetingId, {
                  type: 'participants_list',
                  participants: Array.from(meeting.participants.values()).map(p => ({
                    userId: p.userId,
                    userName: p.userName,
                    isActive: p.isActive,
                    audioEnabled: p.audioEnabled,
                    videoEnabled: p.videoEnabled,
                    joinedAt: p.joinedAt
                  })),
                  timestamp: new Date().toISOString()
                });
              }, 200);
            }
          }
          break;
          
        case 'meeting_ended':
          if (currentUser) {
            console.log(`🏁 ${currentUser.userName} a terminé la réunion`);
            
            broadcastToAll(meetingId, {
              type: 'meeting_ended',
              endedBy: currentUser.userName,
              timestamp: new Date().toISOString()
            });
            
            meeting.participants.forEach(participant => {
              if (participant.ws && participant.ws.readyState === WebSocket.OPEN) {
                participant.ws.close(1000, 'Réunion terminée');
              }
            });
            
            activeMeetings.delete(meetingId);
            userLastSeen.delete(meetingId);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Erreur traitement message:', error);
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 [${meetingId}] Déconnexion`, 
               currentUser ? `de ${currentUser.userName}` : '',
               `Code: ${code}, Raison: ${reason}`);
    
    clearInterval(heartbeatInterval);
    
    if (currentUser) {
      setTimeout(() => {
        if (meeting.participants.has(currentUser.userId)) {
          console.log(`⚠️ [${meetingId}] ${currentUser.userName} considéré hors ligne`);
          
          broadcastToOthers(meetingId, currentUser.userId, {
            type: 'user_left',
            userId: currentUser.userId,
            userName: currentUser.userName,
            timestamp: new Date().toISOString(),
            intentionally: false
          });
        }
      }, 3000);
    }
  });
  
  ws.on('error', (error) => {
    console.error(`❌ [${meetingId}] Erreur WebSocket:`, error);
  });
});

// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  
  activeMeetings.forEach((meeting, meetingId) => {
    const lastSeenMap = userLastSeen.get(meetingId);
    
    meeting.participants.forEach((participant, userId) => {
      if (participant.ws && participant.ws.readyState !== WebSocket.OPEN) {
        console.log(`💀 [${meetingId}] Connexion morte pour ${participant.userName}`);
        meeting.participants.delete(userId);
        
        if (lastSeenMap) {
          lastSeenMap.delete(userId);
        }
      }
    });
    
    if (meeting.participants.size === 0) {
      activeMeetings.delete(meetingId);
      userLastSeen.delete(meetingId);
      console.log(`🗑️ Réunion ${meetingId} supprimée (vide)`);
    }
  });
}, 60000);

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt propre du serveur...');
  
  activeMeetings.forEach((meeting, meetingId) => {
    meeting.participants.forEach(participant => {
      if (participant.ws && participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.close(1000, 'Serveur arrêté');
      }
    });
  });
  
  wss.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});