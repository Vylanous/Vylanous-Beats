/**
 * Capacitor bridge for native features
 * Handles app lifecycle, notifications, and device features
 */

import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initializeCapacitor(): Promise<void> {
  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a0c' });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App is active:', isActive);
      // Refresh data when app comes to foreground
      if (isActive) {
        window.dispatchEvent(new CustomEvent('app-resumed'));
      }
    });

    // Handle back button
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
  } catch (error) {
    console.warn('Capacitor initialization (not critical):', error);
  }
}

export async function initializePushNotifications(): Promise<void> {
  try {
    // Register handlers
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      // Send to your backend
      sendPushTokenToBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      // Show local notification
      if (notification.title) {
        const body = (notification as any).body || notification.message || '';
        showLocalNotification(notification.title, body);
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action:', notification.actionId);
      const beatSlug = (notification.notification.data as any)?.beatSlug;
      if (beatSlug) {
        window.location.href = `/${beatSlug}`;
      }
    });

    // Request permissions and register
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    await PushNotifications.register();
  } catch (error) {
    console.warn('Push notifications initialization failed:', error);
  }
}

async function sendPushTokenToBackend(token: string): Promise<void> {
  try {
    await fetch('/api/push/register-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'capacitor' }),
    });
  } catch (error) {
    console.error('Failed to send push token to backend:', error);
  }
}

async function showLocalNotification(title: string, body: string): Promise<void> {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      });
    }
  } catch (error) {
    console.warn('Local notification failed:', error);
  }
}
