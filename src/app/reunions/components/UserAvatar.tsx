import { User } from '../types/meeting';
import { getRandomColor, getInitials } from '../hooks/useMeetingUtils';

interface UserAvatarProps {
  user: User;
  currentUserId?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, currentUserId }) => {
  const isCurrentUser = user.id === currentUserId;
  const firstName = user.name.split(' ')[0];

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs">👤</span>
        <span className="text-xs text-gray-700">
          {firstName}
        </span>
      </div>
      {isCurrentUser && (
        <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">vous</span>
      )}
    </div>
  );
};