import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'deal' | 'voucher' | 'reservation' | 'system';
  timestamp: Date;
  read: boolean;
}

export function usePushNotifications() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  const showBrowserNotification = (title: string, body: string, icon?: string) => {
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'dealspot-notification',
        requireInteraction: true,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
    return null;
  };

  const addNotification = (notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: PushNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications

    // Show browser notification
    showBrowserNotification(notification.title, notification.message);

    // Show toast notification as fallback
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Check for real voucher expiry notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkVoucherExpiry = async () => {
      try {
        const response = await fetch('/api/vouchers');
        if (!response.ok) return;
        
        const vouchers = await response.json();
        const now = new Date();
        
        vouchers.forEach((voucher: any) => {
          if (voucher.status !== 'active') return;
          
          const expiresAt = new Date(voucher.expiresAt);
          const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Notify 3 days before expiry
          if (daysUntilExpiry === 3 && !notifications.some(n => n.message.includes(voucher.code))) {
            addNotification({
              title: "Voucher verloopt binnenkort",
              message: `Uw voucher voor ${voucher.deal?.title || 'unknown deal'} verloopt over 3 dagen`,
              type: 'voucher' as const,
            });
          }
          
          // Notify 1 day before expiry  
          if (daysUntilExpiry === 1 && !notifications.some(n => n.message.includes(voucher.code))) {
            addNotification({
              title: "Voucher verloopt morgen!",
              message: `Uw voucher voor ${voucher.deal?.title || 'unknown deal'} verloopt morgen`,
              type: 'voucher' as const,
            });
          }
        });
      } catch (error) {
        console.error('Error checking voucher expiry:', error);
      }
    };

    // Check voucher expiry every hour
    const interval = setInterval(checkVoucherExpiry, 60 * 60 * 1000);
    
    // Initial check after 5 seconds
    const initialTimeout = setTimeout(checkVoucherExpiry, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [isAuthenticated, notifications]);

  return {
    notifications,
    permission,
    requestPermission,
    addNotification,
    markAsRead,
    removeNotification,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length,
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    permission, 
    requestPermission, 
    markAsRead, 
    removeNotification, 
    clearAll 
  } = usePushNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 px-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Notificaties ({notifications.length})
            </h2>
            <div className="flex items-center space-x-2">
              {permission !== 'granted' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={requestPermission}
                  className="text-xs"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Toestaan
                </Button>
              )}
              {notifications.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAll}
                  className="text-xs"
                >
                  Wis alles
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {permission === 'denied' && (
            <p className="text-sm text-muted-foreground mt-2">
              Browser notificaties zijn uitgeschakeld. Schakel ze in via uw browser instellingen.
            </p>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Geen notificaties</p>
              <p className="text-sm text-muted-foreground mt-1">
                We laten u weten wanneer er iets nieuws is!
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-colors ${
                    notification.read ? 'bg-muted/30' : 'bg-background border-primary/20'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          notification.read ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.timestamp.toLocaleTimeString('nl-NL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="p-1 ml-2 opacity-50 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full absolute top-3 right-3" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}