import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  type: string;
  fromUser?: {
    _id: string;
    name: string;
    image?: string;
  };
  postId?: {
    _id: string;
    content: string;
  };
  message?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      // Fetch notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user/notifications");
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId?: string) => {
    try {
      // If notificationId is provided, mark specific notification as read
      // Otherwise mark all as read
      await axios.patch("/api/user/notifications", 
        notificationId ? { notificationId } : {}
      );
      
      // Update local state
      if (notificationId) {
        setNotifications(
          notifications.map((notification) =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      } else {
        setNotifications(
          notifications.map((notification) => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification._id);
    
    // Navigate based on notification type
    if (notification.type === 'appointment' || notification.type === 'video') {
      router.push('/my-appointments');
    } else if (notification.postId) {
      router.push(`/post/${notification.postId._id}`);
    }
    
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const getNotificationContent = (notification: Notification) => {
    if (notification.message) {
      return notification.message;
    }
    
    switch (notification.type) {
      case "like":
        return `${notification.fromUser?.name} liked your post`;
      case "comment":
        return `${notification.fromUser?.name} commented on your post`;
      case "appointment":
        return `Appointment scheduled with ${notification.fromUser?.name}`;
      case "video":
        return `Video call started by ${notification.fromUser?.name}`;
      default:
        return "New notification";
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications && unreadCount > 0) {
            markAsRead();
          }
        }}
        className="relative p-2 text-gray-300 hover:text-blue-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-orange-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${
                    !notification.read ? "bg-gray-700/50" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {notification.fromUser?.image ? (
                        <img
                          src={notification.fromUser.image}
                          alt={notification.fromUser.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                          {notification.type === 'appointment' || notification.type === 'video' ? 'MD' : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        {getNotificationContent(notification)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={() => {
                  markAsRead();
                  setShowNotifications(false);
                }}
                className="w-full text-center text-sm text-blue-500 hover:text-blue-400 py-1"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}