'use client';

import { 
  CalendarIcon, 
  SearchIcon, 
  UserIcon, 
  PinIcon, 
  ArrowUpDownIcon, 
  XIcon 
} from './icons';

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  organizerFilter: string;
  setOrganizerFilter: (filter: string) => void;
  pinnedFilter: string;
  setPinnedFilter: (filter: string) => void;
  sortOrder: string;
  toggleSortOrder: () => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  organizerFilter,
  setOrganizerFilter,
  pinnedFilter,
  setPinnedFilter,
  sortOrder,
  toggleSortOrder,
  hasActiveFilters,
  resetFilters
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div className="relative w-full lg:flex-1 lg:max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une réunion..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm shadow-sm transition-all"
        />
      </div>

      <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
        <button
          onClick={() => setOrganizerFilter(organizerFilter === 'me' ? 'all' : 'me')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 font-medium text-sm whitespace-nowrap ${
            organizerFilter === 'me' 
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Mes réunions</span>
        </button>

        <button
          onClick={() => setPinnedFilter(pinnedFilter === 'pinned' ? 'all' : 'pinned')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 font-medium text-sm whitespace-nowrap ${
            pinnedFilter === 'pinned' 
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          <PinIcon className={`w-4 h-4 ${pinnedFilter === 'pinned' ? 'text-yellow-600 fill-current' : ''}`} />
          <span>Épinglées</span>
        </button>

        <div className="relative">
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="appearance-none bg-white text-gray-600 border border-gray-200 hover:border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 font-medium text-sm whitespace-nowrap cursor-pointer"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="tomorrow">Demain</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-gray-600 hover:text-gray-700 transition-all duration-300 font-medium text-sm whitespace-nowrap"
        >
          <ArrowUpDownIcon className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          <span>{sortOrder === 'asc' ? 'Plus anciennes' : 'Plus récentes'}</span>
        </button>

        <button
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap ${
            hasActiveFilters
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              : 'bg-gray-50 text-gray-400 border border-gray-100'
          }`}
        >
          <XIcon className="w-4 h-4" />
          <span>Réinitialiser</span>
        </button>
      </div>
    </div>
  );
};