/**
 * Firebase Logger
 * 
 * Centralized logging using Firebase services:
 * - Firebase Analytics for events
 * - Firebase Performance Monitoring for performance metrics
 * - Cloud Firestore for error logs (admin access)
 * - Session storage for client-side debug (non-production)
 * 
 * Usage:
 *   firebaseLogger.debug('Debug message', { data });
 *   firebaseLogger.info('Info message');
 *   firebaseLogger.warn('Warning message');
 *   firebaseLogger.error('Error message', error);
 */

import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getPerformance, trace } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-performance.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FirebaseLogger {
  constructor() {
    this.analytics = null;
    this.performance = null;
    this.isProduction = window.location.hostname !== 'localhost' 
                       && !window.location.hostname.includes('127.0.0.1')
                       && !window.location.hostname.includes('staging');
    
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };
    
    this.currentLevel = this.isProduction ? this.levels.INFO : this.levels.DEBUG;
    this.initialized = false;
  }

  /**
   * Initialize Firebase services for logging
   */
  async init() {
    if (this.initialized) return;

    try {
      // Get Firebase services (assumes firebase-init.js loaded first)
      if (typeof app !== 'undefined') {
        this.analytics = getAnalytics(app);
        this.performance = getPerformance(app);
        this.initialized = true;
        
        // Log initialization
        this.logAnalyticsEvent('logger_initialized', {
          environment: this.isProduction ? 'production' : 'development',
          log_level: this.getLevelName(this.currentLevel)
        });
      }
    } catch (error) {
      console.error('[FirebaseLogger] Initialization failed:', error);
    }
  }

  /**
   * Get level name from number
   */
  getLevelName(level) {
    return Object.keys(this.levels).find(key => this.levels[key] === level);
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return level >= this.currentLevel;
  }

  /**
   * Log event to Firebase Analytics
   */
  logAnalyticsEvent(eventName, params = {}) {
    if (!this.analytics) return;
    
    try {
      logEvent(this.analytics, eventName, {
        ...params,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[FirebaseLogger] Analytics event failed:', error);
    }
  }

  /**
   * Store error in Firestore for admin review
   */
  async storeErrorInFirestore(level, message, data) {
    if (!this.isProduction) return; // Only in production
    if (!window.db) return; // Firestore not available

    try {
      await addDoc(collection(window.db, 'logs'), {
        level: this.getLevelName(level),
        message,
        data: data || null,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: auth?.currentUser?.uid || 'anonymous'
      });
    } catch (error) {
      console.error('[FirebaseLogger] Firestore logging failed:', error);
    }
  }

  /**
   * Debug level logging (development only, not sent to Firebase)
   */
  debug(message, ...args) {
    if (!this.shouldLog(this.levels.DEBUG)) return;
    
    console.debug(`[DEBUG] ${message}`, ...args);
    
    // Store in session storage for debugging
    if (!this.isProduction) {
      this.storeInSessionStorage('debug', message, args);
    }
  }

  /**
   * Info level logging (sent to Firebase Analytics)
   */
  info(message, ...args) {
    if (!this.shouldLog(this.levels.INFO)) return;
    
    console.info(`[INFO] ${message}`, ...args);
    
    // Log to Firebase Analytics
    this.logAnalyticsEvent('app_info_log', {
      message: message.substring(0, 100), // Truncate for Analytics
      category: 'info'
    });
  }

  /**
   * Warning level logging (sent to Firebase Analytics)
   */
  warn(message, ...args) {
    if (!this.shouldLog(this.levels.WARN)) return;
    
    console.warn(`[WARN] ${message}`, ...args);
    
    // Log to Firebase Analytics
    this.logAnalyticsEvent('app_warning', {
      message: message.substring(0, 100),
      category: 'warning'
    });
    
    // Store in Firestore for admin review
    this.storeErrorInFirestore(this.levels.WARN, message, args[0]);
  }

  /**
   * Error level logging (always logged to Firebase)
   */
  error(message, error, ...args) {
    console.error(`[ERROR] ${message}`, error, ...args);
    
    // Log to Firebase Analytics
    this.logAnalyticsEvent('app_error', {
      message: message.substring(0, 100),
      error_name: error?.name || 'Unknown',
      error_message: error?.message?.substring(0, 100) || 'No message',
      category: 'error'
    });
    
    // Store in Firestore for admin review (production)
    this.storeErrorInFirestore(this.levels.ERROR, message, {
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      },
      additionalData: args[0]
    });
    
    // Also store in session storage for immediate debugging
    this.storeInSessionStorage('error', message, { error, args });
  }

  /**
   * Store log in session storage (non-production debugging)
   */
  storeInSessionStorage(level, message, data) {
    try {
      const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
      logs.push({
        level,
        message,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Keep last 100 logs
      if (logs.length > 100) logs.shift();
      
      sessionStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (e) {
      // Fail silently
    }
  }

  /**
   * Log user action to Firebase Analytics
   */
  logAction(actionName, params = {}) {
    this.logAnalyticsEvent(`user_${actionName}`, params);
    this.debug(`User action: ${actionName}`, params);
  }

  /**
   * Log page view to Firebase Analytics
   */
  logPageView(pageName, params = {}) {
    this.logAnalyticsEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...params
    });
  }

  /**
   * Start performance trace
   */
  startTrace(traceName) {
    if (!this.performance) return null;
    
    try {
      const performanceTrace = trace(this.performance, traceName);
      performanceTrace.start();
      return performanceTrace;
    } catch (error) {
      console.error('[FirebaseLogger] Performance trace failed:', error);
      return null;
    }
  }

  /**
   * Stop performance trace
   */
  stopTrace(performanceTrace) {
    if (!performanceTrace) return;
    
    try {
      performanceTrace.stop();
    } catch (error) {
      console.error('[FirebaseLogger] Stop trace failed:', error);
    }
  }

  /**
   * Time an async operation with Firebase Performance Monitoring
   */
  async timeAsync(label, callback) {
    const performanceTrace = this.startTrace(label);
    
    try {
      return await callback();
    } finally {
      this.stopTrace(performanceTrace);
    }
  }

  /**
   * Set custom user property for Analytics
   */
  setUserProperty(name, value) {
    if (!this.analytics) return;
    
    try {
      import('https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js')
        .then(({ setUserProperties }) => {
          setUserProperties(this.analytics, { [name]: value });
        });
    } catch (error) {
      console.error('[FirebaseLogger] Set user property failed:', error);
    }
  }

  /**
   * Get logs from session storage (debugging)
   */
  getSessionLogs() {
    try {
      return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear session logs
   */
  clearSessionLogs() {
    sessionStorage.removeItem('app_logs');
  }
}

// Create singleton instance
const firebaseLogger = new FirebaseLogger();

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    firebaseLogger.init();
  });
} else {
  firebaseLogger.init();
}

// Export
window.firebaseLogger = firebaseLogger;

// Create global aliases for convenience
window.logger = firebaseLogger;

// Intercept console.error in production to log to Firebase
if (firebaseLogger.isProduction) {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    firebaseLogger.error('Console error intercepted', args[0], ...args.slice(1));
  };
}
