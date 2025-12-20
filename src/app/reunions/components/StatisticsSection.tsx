import { CalendarIcon, PlayIcon, ClockIcon, CheckCircleIcon } from './icons';

interface StatisticsSectionProps {
  statistics: {
    totalMeetings: number;
    liveMeetings: number;
    plannedMeetings: number;
    completedMeetings: number;
  };
}

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'red';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200'
  };

  const textColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  };

  return (
    <div className={`bg-white rounded-xl p-6 border-2 ${colorClasses[color]} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${textColorClasses[color]}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const StatisticsSection: React.FC<StatisticsSectionProps> = ({ statistics }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <StatCard
      title="Total"
      value={statistics.totalMeetings}
      icon={<CalendarIcon className="w-5 h-5 text-blue-600" />}
      color="blue"
    />
    <StatCard
      title="En direct"
      value={statistics.liveMeetings}
      icon={<PlayIcon className="w-5 h-5 text-green-600" />}
      color="green"
    />
    <StatCard
      title="Planifiées"
      value={statistics.plannedMeetings}
      icon={<ClockIcon className="w-5 h-5 text-blue-600" />}
      color="blue"
    />
    <StatCard
      title="Terminées"
      value={statistics.completedMeetings}
      icon={<CheckCircleIcon className="w-5 h-5 text-green-600" />}
      color="green"
    />
  </div>
);