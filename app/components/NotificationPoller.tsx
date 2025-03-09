"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Notification {
  _id: string;
  type: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

// This component doesn't render anything visible
// It just polls for notifications in the background
export default function NotificationPoller() {
  const { data: session } = useSession();
  const router = useRouter();
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    if (!session) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Check for new notifications immediately
    checkForNewNotifications();

    // Set up polling interval (every 10 seconds)
    const interval = setInterval(checkForNewNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [session]);

  const checkForNewNotifications = async () => {
    if (!session) return;
    
    try {
      const response = await axios.get('/api/user/notifications');
      
      // Ensure we have an array of notifications
      const notifications = Array.isArray(response.data) 
        ? response.data 
        : (response.data.notifications || []);
      
      // Check if notifications is actually an array before filtering
      if (!Array.isArray(notifications)) {
        console.error('Notifications is not an array:', notifications);
        return;
      }
      
      // Filter for unread notifications that came after our last check
      const newNotifications = notifications.filter(
        notif => !notif.read && new Date(notif.createdAt) > lastChecked
      );
      
      // Update last checked time
      setLastChecked(new Date());
      
      // Process new notifications
      if (newNotifications.length > 0) {
        console.log('New notifications:', newNotifications);
        
        // Find video call notifications
        const videoNotifications = newNotifications.filter(
          notif => notif.type === 'video'
        );
        
        if (videoNotifications.length > 0) {
          // Play notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Could not play notification sound:', e));
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Video Call Started', {
              body: videoNotifications[0].message || 'Your doctor has started a video call',
              icon: '/favicon.ico',
              requireInteraction: true
            });
            
            notification.onclick = () => {
              window.focus();
              router.push('/my-appointments');
            };
          }
        }
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  };

  // This component doesn't render anything visible
  return null;
} 