import React, { useState } from 'react';
import NotificationPanel from './NotificationPanel';
import NotificationBell from './NotificationBell';

interface MobileNotificationDropdownProps {
  currentUserId: string;
  onAction: any;
}

const MobileNotificationDropdown: React.FC<MobileNotificationDropdownProps> = ({ currentUserId, onAction }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <NotificationBell onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50">
          <NotificationPanel
            isOpen={open}
            onClose={() => setOpen(false)}
            onAction={onAction}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
};

export default MobileNotificationDropdown;
