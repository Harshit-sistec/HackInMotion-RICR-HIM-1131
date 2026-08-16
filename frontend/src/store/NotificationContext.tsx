import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSocket } from '@/services/socket';
import { useAuth } from '@/store/AuthContext';

export interface AppNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const MAX_NOTIFICATIONS = 30;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    const push = (message: string) => {
      setNotifications((prev) =>
        [
          {
            id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            message,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...prev,
        ].slice(0, MAX_NOTIFICATIONS),
      );
    };

    const onInvitationNew = (invitation: { invitedByName: string; groupName: string }) =>
      push(`${invitation.invitedByName} invited you to join "${invitation.groupName}".`);

    const onInvitationResponded = (payload: { status: string; groupName: string; respondedByName: string }) =>
      push(
        payload.status === 'accepted'
          ? `${payload.respondedByName} accepted your invitation to ${payload.groupName}.`
          : `${payload.respondedByName} declined your invitation to ${payload.groupName}.`,
      );

    const onGroupUpdated = ({ group }: { group: { name: string } }) => push(`"${group.name}" was updated.`);

    const onGroupRemoved = ({ groupName }: { groupName: string }) => push(`You were removed from ${groupName}.`);

    socket.on('invitation:new', onInvitationNew);
    socket.on('invitation:responded', onInvitationResponded);
    socket.on('group:updated', onGroupUpdated);
    socket.on('group:removed', onGroupRemoved);

    return () => {
      socket.off('invitation:new', onInvitationNew);
      socket.off('invitation:responded', onInvitationResponded);
      socket.off('group:updated', onGroupUpdated);
      socket.off('group:removed', onGroupRemoved);
    };
  }, [user]);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
