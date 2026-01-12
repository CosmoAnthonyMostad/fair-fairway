import { useState } from 'react';
import { Bell, Check, Trash2, UserPlus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'friend_request':
      return <UserPlus className="w-4 h-4 text-primary" />;
    case 'group_invite':
      return <Users className="w-4 h-4 text-accent" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

export const NotificationsPanel = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}: NotificationsPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
          <Bell className="w-6 h-6 text-primary-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[10px] h-[10px] bg-accent rounded-full flex items-center justify-center text-[8px] font-bold text-accent-foreground">
              {unreadCount > 9 ? '9+' : ''}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onMarkAllAsRead}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={onClearAll}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-secondary/50 transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''} text-foreground`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.is_read && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="p-1 rounded hover:bg-secondary transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(notification.id)}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};