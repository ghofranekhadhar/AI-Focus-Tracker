import React from 'react';
import { AlertCircle, VideoOff, MicOff, HelpCircle, RefreshCw, Shield } from 'lucide-react';

interface MediaPermissionFallbackProps {
  onRetry: () => void;
  onContinueWithout: () => void;
  errorMessage?: string;
}

export const MediaPermissionFallback: React.FC<MediaPermissionFallbackProps> = ({
  onRetry,
  onContinueWithout,
  errorMessage
}) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-900/20 to-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-800/30">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">
            Permissions requises
          </h3>
          <p className="text-gray-300 mb-4">
            L'application a besoin d'accéder à votre caméra et microphone pour fonctionner correctement.
          </p>
          
          {errorMessage && (
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Guide d'activation */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-200">
              <Shield size={16} />
              Pour activer les permissions :
            </h4>
            <ol className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                  1
                </div>
                <span>Cliquez sur l'icône <span className="text-blue-400">🔒</span> dans la barre d'adresse</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                  2
                </div>
                <span>Sélectionnez <span className="text-green-400">"Autoriser"</span> pour la caméra et le microphone</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                  3
                </div>
                <span>Rafraîchissez la page ou cliquez sur "Réessayer"</span>
              </li>
            </ol>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              <RefreshCw size={18} />
              Réessayer maintenant
            </button>
            
            <button
              onClick={onContinueWithout}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 py-3 rounded-xl font-medium transition duration-200 border border-gray-700"
            >
              Continuer sans caméra/microphone
            </button>
            
            <div className="flex items-center justify-center gap-4 mt-2">
              <a
                href="/aide-permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <HelpCircle size={14} />
                Guide détaillé
              </a>
              
              <span className="text-gray-500">•</span>
              
              <a
                href="https://support.google.com/chrome/answer/2693767"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Aide Chrome
              </a>
            </div>
          </div>
        </div>
        
        {/* Informations supplémentaires */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <VideoOff size={12} />
              <span>Caméra</span>
            </div>
            <div className="flex items-center gap-2">
              <MicOff size={12} />
              <span>Microphone</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Vous pourrez activer les médias plus tard depuis les paramètres
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaPermissionFallback;