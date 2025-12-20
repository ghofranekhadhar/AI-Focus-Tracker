import React from 'react';
import { X, Wifi, Download, Upload, Clock, Shield, Battery } from 'lucide-react';

interface StatsOverlayProps {
  connectionMetrics: {
    latency: number;
    jitter: number;
    packetLoss: number;
    bandwidth: number;
  };
  networkQuality: string;
  participantsCount: number;
  onClose: () => void;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({
  connectionMetrics,
  networkQuality,
  participantsCount,
  onClose
}) => {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-emerald-400';
      case 'average': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityBar = (quality: string) => {
    const bars = 4;
    const activeBars = quality === 'excellent' ? 4 : 
                      quality === 'good' ? 3 : 
                      quality === 'average' ? 2 : 1;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(bars)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-4 rounded-sm ${
              i < activeBars
                ? 'bg-gradient-to-b from-green-400 to-emerald-600'
                : 'bg-gray-700'
            }`}
          ></div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Statistiques de connexion
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition duration-200"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Qualité réseau */}
          <div className="bg-gray-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg">
                  <Wifi size={20} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Qualité réseau</h4>
                  <p className="text-sm text-gray-400">Connexion en temps réel</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getQualityColor(networkQuality)}`}>
                  {networkQuality === 'excellent' ? 'Excellente' :
                   networkQuality === 'good' ? 'Bonne' :
                   networkQuality === 'average' ? 'Moyenne' : 'Faible'}
                </div>
                {getQualityBar(networkQuality)}
              </div>
            </div>
          </div>
          
          {/* Métriques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock size={16} className="text-blue-400" />
                <span className="text-sm text-gray-400">Latence</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {connectionMetrics.latency}
                <span className="text-sm text-gray-400 ml-1">ms</span>
              </div>
              <div className={`text-xs mt-1 ${
                connectionMetrics.latency < 50 ? 'text-green-400' :
                connectionMetrics.latency < 100 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {connectionMetrics.latency < 50 ? 'Très basse' :
                 connectionMetrics.latency < 100 ? 'Bonne' : 'Élevée'}
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Battery size={16} className="text-green-400" />
                <span className="text-sm text-gray-400">Jitter</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {connectionMetrics.jitter}
                <span className="text-sm text-gray-400 ml-1">ms</span>
              </div>
              <div className={`text-xs mt-1 ${
                connectionMetrics.jitter < 5 ? 'text-green-400' :
                connectionMetrics.jitter < 10 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {connectionMetrics.jitter < 5 ? 'Stable' :
                 connectionMetrics.jitter < 10 ? 'Variable' : 'Instable'}
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download size={16} className="text-emerald-400" />
                <span className="text-sm text-gray-400">Débit ↓</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {Math.round(connectionMetrics.bandwidth / 800)}
                <span className="text-sm text-gray-400 ml-1">Mbps</span>
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Upload size={16} className="text-blue-400" />
                <span className="text-sm text-gray-400">Débit ↑</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {Math.round(connectionMetrics.bandwidth / 1000)}
                <span className="text-sm text-gray-400 ml-1">Mbps</span>
              </div>
            </div>
          </div>
          
          {/* Infos générales */}
          <div className="bg-gray-800/30 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Participants</div>
                <div className="text-lg font-bold text-white">{participantsCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Perte paquets</div>
                <div className={`text-lg font-bold ${
                  connectionMetrics.packetLoss < 1 ? 'text-green-400' :
                  connectionMetrics.packetLoss < 3 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {connectionMetrics.packetLoss.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Sécurité */}
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-4 border border-green-800/30">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-green-400" />
              <div>
                <h4 className="font-medium text-green-300">Connexion sécurisée</h4>
                <p className="text-sm text-green-400/80">Chiffrée de bout en bout</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            Ces statistiques sont mises à jour toutes les 5 secondes
          </p>
        </div>
      </div>
    </div>
  );
};