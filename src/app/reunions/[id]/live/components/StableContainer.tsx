import React, { memo, useMemo } from 'react';

interface StableContainerProps {
  children: React.ReactNode;
  stabilityKey?: string;
}

export const StableContainer = memo(function StableContainer({ 
  children, 
  stabilityKey = 'default' 
}: StableContainerProps) {
  
  const memoizedChildren = useMemo(() => children, [children]);
  
  return (
    <div 
      key={stabilityKey} 
      className="contents"
      data-stable-key={stabilityKey}
    >
      {memoizedChildren}
    </div>
  );
});

export default StableContainer;