/**
 * Notification Service - In-app notifications
 * Day 4: Real-time user notifications
 */

// Notifications now flow through the Go API via Firebase.APIService
// (Cloud Functions /api proxy), rather than the legacy /app/api/v1 surface.

/**
 * Get authentication token
 */
async function getAuthToken() {
  try {
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Not authenticated');
    }
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Auth token error:', error);
    throw error;
  }
}

/**
 * Get notifications for current user
 * @param {Object} options - Query options
 * @param {number} options.limit - Max notifications to return (default: 50)
 * @param {boolean} options.unreadOnly - Only return unread notifications
 */
export async function getNotifications(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.unreadOnly) params.append('unreadOnly', 'true');

    if (!window.Firebase || !window.Firebase.APIService) {
      throw new Error('Notification API not available');
    }

    const result = await window.Firebase.APIService.callAPI(
      `/notifications?${params.toString()}`,
      'GET',
      null,
    );

    if (!result || !result.success) {
      throw new Error(result && result.error ? result.error : 'Failed to get notifications');
    }

    const payload = result.data || {};
    const data = payload.data || payload.notifications || [];
    return data;
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export async function markNotificationRead(notificationId) {
  try {
    if (!window.Firebase || !window.Firebase.APIService) {
      throw new Error('Notification API not available');
    }

    const result = await window.Firebase.APIService.callAPI(
      `/notifications/${notificationId}/read`,
      'PUT',
      {},
    );

    if (!result || !result.success) {
      throw new Error(result && result.error ? result.error : 'Failed to mark notification as read');
    }

    return result.data || { success: true };
  } catch (error) {
    console.error('Mark notification read error:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time notifications using Firestore
 * @param {Function} callback - Called when notifications update
 * @returns {Function} Unsubscribe function
 */
export async function subscribeToNotifications(callback) {
  try {
    const { getFirestore, collection, query, where, orderBy, onSnapshot } = 
      await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
    
    const auth = getAuth();
    const db = getFirestore();
    
    if (!auth.currentUser) {
      throw new Error('Not authenticated');
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  } catch (error) {
    console.error('Subscribe to notifications error:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  try {
    const notifications = await getNotifications({ unreadOnly: true });
    return notifications.length;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
}

/**
 * Display notification toast/banner (UI helper)
 * @param {Object} notification - Notification object
 */
export function displayNotification(notification) {
  // Simple browser notification for now
  // Can be enhanced with custom toast UI
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id
    });
  }
  
  // Also show in-app banner (implement in UI)
  console.log('New notification:', notification);
  return notification;
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
}
