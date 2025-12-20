import Link from 'next/link';
import { CalendarIcon } from './icons';
import { ActiveTab } from '../types/meeting';

interface EmptyStateProps {
  activeTab: ActiveTab;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ activeTab, hasActiveFilters, onResetFilters }) => {
  const getEmptyStateConfig = () => {
    const config = {
      upcoming: {
        title: 'Aucune réunion à venir',
        description: 'Toutes vos réunions à venir apparaîtront ici'
      },
      live: {
        title: 'Aucune réunion en direct',
        description: 'Revenez plus tard pour rejoindre des réunions en cours'
      },
      past: {
        title: 'Aucune réunion passée',
        description: 'Vos réunions terminées seront archivées ici'
      },
      cancelled: {
        title: 'Aucune réunion annulée',
        description: 'Vos réunions annulées (dont vous êtes organisateur) apparaîtront ici'
      },
      expired: {
        title: 'Aucune réunion expirée',
        description: 'Vos réunions planifiées dont la date est passée apparaîtront ici'
      }
    };
    return config[activeTab] || config.upcoming;
  };

  const { title, description } = getEmptyStateConfig();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CalendarIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        {hasActiveFilters 
          ? 'Aucune réunion ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
          : description
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/reunions/create"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Créer une réunion
        </Link>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  );
};