/**
 * Development Metrics Service
 * Real-time development metrics tracking with Firebase Firestore
 * 
 * Provides real-time listeners for:
 * - Development sessions
 * - Daily metrics
 * - Git commits
 * - Deployment logs
 * 
 * Usage:
 *   const service = new DevelopmentMetricsService();
 *   await service.initialize();
 *   service.subscribeToMetrics((data) => updateDashboard(data));
 */

class DevelopmentMetricsService {
    constructor() {
        this.db = null;
        this.listeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize Firebase connection
     */
    async initialize() {
        try {
            // Wait for Firebase to be ready
            if (window.firebaseDb) {
                this.db = window.firebaseDb;
                this.isInitialized = true;
                console.log('✅ DevelopmentMetricsService initialized with Firebase');
                return true;
            }

            // Wait for firebase-ready event
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase initialization timeout'));
                }, 10000);

                window.addEventListener('firebase-ready', (event) => {
                    clearTimeout(timeout);
                    this.db = event.detail.db || window.firebaseDb;
                    this.isInitialized = true;
                    console.log('✅ DevelopmentMetricsService initialized with Firebase');
                    resolve(true);
                }, { once: true });
            });
        } catch (error) {
            console.error('❌ Failed to initialize DevelopmentMetricsService:', error);
            return false;
        }
    }

    /**
     * Subscribe to real-time development metrics updates
     * @param {Function} callback - Called with aggregated metrics data
     * @returns {Function} Unsubscribe function
     */
    subscribeToMetrics(callback) {
        if (!this.isInitialized) {
            console.error('Service not initialized. Call initialize() first.');
            return () => {};
        }

        const metricsData = {
            project: {},
            today: {},
            thisWeek: {},
            features: {},
            recentActivity: [],
            automation: {},
            deployment: {}
        };

        // Subscribe to development_metrics collection (daily aggregates)
        const metricsUnsubscribe = this.db.collection('development_metrics')
            .orderBy('date', 'desc')
            .limit(30)
            .onSnapshot((snapshot) => {
                const metrics = [];
                snapshot.forEach(doc => {
                    metrics.push({ id: doc.id, ...doc.data() });
                });

                // Calculate aggregates
                metricsData.project = this.calculateProjectTotals(metrics);
                metricsData.today = this.getTodayMetrics(metrics);
                metricsData.thisWeek = this.getWeekMetrics(metrics);

                callback(metricsData);
            }, (error) => {
                console.error('Error in metrics subscription:', error);
            });

        // Subscribe to recent git commits
        const commitsUnsubscribe = this.db.collection('git_commits')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot((snapshot) => {
                metricsData.recentActivity = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    metricsData.recentActivity.push({
                        id: doc.id,
                        hash: data.hash,
                        message: data.message,
                        author: data.author,
                        date: data.timestamp?.toDate?.() || new Date(data.timestamp),
                        timeAgo: this.getTimeAgo(data.timestamp?.toDate?.() || new Date(data.timestamp))
                    });
                });

                callback(metricsData);
            }, (error) => {
                console.error('Error in commits subscription:', error);
            });

        // Subscribe to development sessions
        const sessionsUnsubscribe = this.db.collection('development_sessions')
            .orderBy('date', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const sessions = [];
                snapshot.forEach(doc => {
                    sessions.push({ id: doc.id, ...doc.data() });
                });

                // Update session-based metrics
                const sessionMetrics = this.calculateSessionMetrics(sessions);
                Object.assign(metricsData.project, sessionMetrics);

                callback(metricsData);
            }, (error) => {
                console.error('Error in sessions subscription:', error);
            });

        // Subscribe to feature progress
        const featuresUnsubscribe = this.db.collection('feature_progress')
            .onSnapshot((snapshot) => {
                metricsData.features = {};
                snapshot.forEach(doc => {
                    metricsData.features[doc.id] = doc.data();
                });

                callback(metricsData);
            }, (error) => {
                console.error('Error in features subscription:', error);
            });

        // Store unsubscribe functions
        this.listeners.set('metrics', metricsUnsubscribe);
        this.listeners.set('commits', commitsUnsubscribe);
        this.listeners.set('sessions', sessionsUnsubscribe);
        this.listeners.set('features', featuresUnsubscribe);

        // Return combined unsubscribe function
        return () => {
            this.listeners.forEach((unsubscribe) => unsubscribe());
            this.listeners.clear();
        };
    }

    /**
     * Calculate project totals from metrics array
     */
    calculateProjectTotals(metrics) {
        if (!metrics || metrics.length === 0) {
            return {
                totalHours: 0,
                totalCost: 0,
                totalCommits: 0,
                totalFiles: 0,
                avgHoursPerDay: 0,
                velocity: 0,
                activeDays: 0,
                totalDays: 0
            };
        }

        let totalHours = 0;
        let totalCost = 0;
        let totalCommits = 0;
        let activeDays = 0;

        metrics.forEach(metric => {
            totalHours += metric.hours || 0;
            totalCost += metric.cost || 0;
            totalCommits += metric.commits || 0;
            if ((metric.hours || 0) > 0) activeDays++;
        });

        const totalDays = metrics.length;
        const avgHoursPerDay = activeDays > 0 ? (totalHours / activeDays).toFixed(1) : 0;
        const velocity = activeDays > 0 ? (totalCommits / activeDays).toFixed(1) : 0;

        return {
            totalHours: totalHours.toFixed(1),
            totalCost: totalCost.toFixed(0),
            totalCommits,
            avgHoursPerDay,
            velocity,
            activeDays,
            totalDays,
            laborCost: (totalHours * 150).toFixed(0), // $150/hr
            toolsCost: (totalDays * 7.5).toFixed(0) // $225/month = ~$7.50/day
        };
    }

    /**
     * Get today's metrics
     */
    getTodayMetrics(metrics) {
        const today = new Date().toISOString().split('T')[0];
        const todayMetric = metrics.find(m => m.date === today);

        return {
            hours: todayMetric?.hours || 0,
            cost: todayMetric?.cost || 0,
            commits: todayMetric?.commits || 0
        };
    }

    /**
     * Get this week's metrics
     */
    getWeekMetrics(metrics) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        let weekHours = 0;
        let weekCommits = 0;

        metrics.forEach(metric => {
            const metricDate = new Date(metric.date);
            if (metricDate >= weekAgo && metricDate <= today) {
                weekHours += metric.hours || 0;
                weekCommits += metric.commits || 0;
            }
        });

        return {
            hours: weekHours.toFixed(1),
            commits: weekCommits
        };
    }

    /**
     * Calculate metrics from sessions
     */
    calculateSessionMetrics(sessions) {
        let totalHours = 0;
        let totalCost = 0;

        sessions.forEach(session => {
            totalHours += session.duration || 0;
            totalCost += session.costTracking?.totalCost || 0;
        });

        return {
            sessionsCount: sessions.length,
            totalSessionHours: totalHours.toFixed(1),
            totalSessionCost: totalCost.toFixed(0)
        };
    }

    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        if (!date) return 'Recently';
        
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            return `${mins} minute${mins > 1 ? 's' : ''} ago`;
        }
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        const days = Math.floor(seconds / 86400);
        if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
        
        const months = Math.floor(days / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    /**
     * Create or update a development session
     */
    async createSession(sessionData) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized');
        }

        try {
            await this.db.collection('development_sessions').add({
                ...sessionData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Session created successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Error creating session:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Log a git commit
     */
    async logCommit(commitData) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized');
        }

        try {
            await this.db.collection('git_commits').add({
                ...commitData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('❌ Error logging commit:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update daily metrics
     */
    async updateDailyMetrics(date, metrics) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized');
        }

        try {
            const docRef = this.db.collection('development_metrics').doc(date);
            await docRef.set({
                date,
                ...metrics,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('❌ Error updating daily metrics:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update feature progress
     */
    async updateFeatureProgress(featureId, progressData) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized');
        }

        try {
            await this.db.collection('feature_progress').doc(featureId).set({
                ...progressData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('❌ Error updating feature progress:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get dashboard metrics (one-time fetch)
     */
    async getDashboardMetrics() {
        if (!this.isInitialized) {
            throw new Error('Service not initialized');
        }

        try {
            const [metricsSnapshot, commitsSnapshot, sessionsSnapshot] = await Promise.all([
                this.db.collection('development_metrics').orderBy('date', 'desc').limit(30).get(),
                this.db.collection('git_commits').orderBy('timestamp', 'desc').limit(20).get(),
                this.db.collection('development_sessions').orderBy('date', 'desc').limit(50).get()
            ]);

            const metrics = [];
            metricsSnapshot.forEach(doc => metrics.push({ id: doc.id, ...doc.data() }));

            const commits = [];
            commitsSnapshot.forEach(doc => {
                const data = doc.data();
                commits.push({
                    id: doc.id,
                    hash: data.hash,
                    message: data.message,
                    author: data.author,
                    date: data.timestamp?.toDate?.() || new Date(data.timestamp),
                    timeAgo: this.getTimeAgo(data.timestamp?.toDate?.() || new Date(data.timestamp))
                });
            });

            const sessions = [];
            sessionsSnapshot.forEach(doc => sessions.push({ id: doc.id, ...doc.data() }));

            return {
                project: this.calculateProjectTotals(metrics),
                today: this.getTodayMetrics(metrics),
                thisWeek: this.getWeekMetrics(metrics),
                recentActivity: commits,
                sessions: this.calculateSessionMetrics(sessions)
            };
        } catch (error) {
            console.error('❌ Error fetching dashboard metrics:', error);
            throw error;
        }
    }

    /**
     * Cleanup all listeners
     */
    destroy() {
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners.clear();
        this.isInitialized = false;
        console.log('🔌 DevelopmentMetricsService destroyed');
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevelopmentMetricsService;
}

// Make available globally
window.DevelopmentMetricsService = DevelopmentMetricsService;
