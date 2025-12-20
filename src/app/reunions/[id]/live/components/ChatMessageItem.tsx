// src/app/reunions/[id]/live/components/ChatMessageItem.tsx
import React from 'react';

interface ChatMessageItemProps {
  message: any;
  isCurrentUser: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isCurrentUser }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`rounded-lg p-3 ${
        message.type === 'system'
          ? 'bg-blue-900/20 border border-blue-800/30'
          : isCurrentUser
          ? 'bg-gray-800 ml-8'
          : 'bg-gray-800/50'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {message.type === 'system' ? (
            <span className="text-xs font-medium text-blue-400">
              {message.senderName}
            </span>
          ) : (
            <>
              <span className={`text-sm font-medium ${
                isCurrentUser ? 'text-blue-400' : 'text-gray-300'
              }`}>
                {message.senderName}
              </span>
              {isCurrentUser && (
                <span className="text-xs text-gray-400">(Vous)</span>
              )}
            </>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {formatTime(new Date(message.timestamp))}
        </span>
      </div>
      <p className="text-sm text-gray-200">{message.content}</p>
    </div>
  );
};