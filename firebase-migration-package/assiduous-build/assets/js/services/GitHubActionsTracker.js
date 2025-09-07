/**
 * GitHub Actions Deployment Tracker
 * Integrates with FirebaseAnalyticsService to track automated deployments
 */

class GitHubActionsTracker {
    constructor() {
        this.deploymentData = window.DEPLOYMENT_ANALYTICS || null;
        this.localStorageKey = 'github_actions_deployments';
    }

    /**
     * Initialize and integrate with FirebaseAnalyticsService
     */
    init() {
        if (this.deploymentData) {
            console.log('📊 GitHub Actions deployment detected:', this.deploymentData);
            this.trackDeployment();
            this.updateDashboardMetrics();
        }
        
        // Check for GitHub Actions deployments on page load
        this.displayDeploymentStatus();
    }

    /**
     * Track deployment in local storage and Firebase
     */
    trackDeployment() {
        if (!this.deploymentData) return;

        const deployment = {
            timestamp: this.deploymentData.lastDeployment || new Date().toISOString(),
            type: 'github-actions',
            buildNumber: this.deploymentData.buildNumber,
            commitSha: this.deploymentData.commitSha,
            commitAuthor: this.deploymentData.commitAuthor,
            filesDeployed: this.deploymentData.filesDeployed,
            deploymentCount: this.deploymentData.deploymentCount,
            environment: this.deploymentData.environment || 'production',
            workflowRun: this.deploymentData.workflowRun
        };

        // Save to local storage
        const history = this.getDeploymentHistory();
        history.push(deployment);
        
        // Keep only last 50 deployments
        if (history.length > 50) {
            history.shift();
        }
        
        localStorage.setItem(this.localStorageKey, JSON.stringify(history));

        // Integrate with FirebaseAnalyticsService if available
        if (window.FirebaseAnalyticsService) {
            const analyticsService = new FirebaseAnalyticsService();
            analyticsService.captureDeployment({
                services: ['hosting'],
                filesCount: deployment.filesDeployed,
                status: 'success',
                environment: deployment.environment,
                source: 'github-actions'
            });
        }
    }

    /**
     * Get deployment history from local storage
     */
    getDeploymentHistory() {
        const stored = localStorage.getItem(this.localStorageKey);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Update dashboard metrics with deployment info
     */
    updateDashboardMetrics() {
        // Update deployment count if element exists
        const deploymentCountEl = document.getElementById('deploymentCount');
        if (deploymentCountEl && this.deploymentData) {
            deploymentCountEl.textContent = this.deploymentData.deploymentCount || '0';
        }

        // Update last deployment time
        const lastDeploymentEl = document.getElementById('lastDeployment');
        if (lastDeploymentEl && this.deploymentData) {
            const date = new Date(this.deploymentData.lastDeployment);
            lastDeploymentEl.textContent = this.getTimeAgo(date);
        }

        // Update files deployed
        const filesDeployedEl = document.getElementById('filesDeployed');
        if (filesDeployedEl && this.deploymentData) {
            filesDeployedEl.textContent = this.deploymentData.filesDeployed || '0';
        }
    }

    /**
     * Display deployment status indicator
     */
    displayDeploymentStatus() {
        const history = this.getDeploymentHistory();
        if (history.length === 0) return;

        const lastDeployment = history[history.length - 1];
        const timeSince = this.getTimeAgo(new Date(lastDeployment.timestamp));

        // Create or update status indicator
        let statusEl = document.getElementById('github-actions-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'github-actions-status';
            statusEl.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1000;
                cursor: pointer;
                transition: all 0.3s;
            `;
            statusEl.onmouseover = () => {
                statusEl.style.transform = 'translateY(-2px)';
                statusEl.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            };
            statusEl.onmouseout = () => {
                statusEl.style.transform = 'translateY(0)';
                statusEl.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            };
            statusEl.onclick = () => {
                this.showDeploymentDetails();
            };
            document.body.appendChild(statusEl);
        }

        statusEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
                <span>Deployed ${timeSince}</span>
                <span style="opacity: 0.8; font-size: 11px;">#${lastDeployment.buildNumber || 'N/A'}</span>
            </div>
        `;

        // Add pulse animation
        if (!document.getElementById('github-actions-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'github-actions-pulse-style';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show detailed deployment information
     */
    showDeploymentDetails() {
        const history = this.getDeploymentHistory();
        const recent = history.slice(-10).reverse();

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #1f2937;">🚀 GitHub Actions Deployments</h3>
            <div style="color: #6b7280; font-size: 14px;">
                ${recent.map(d => `
                    <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
                        <div style="font-weight: 600; color: #374151;">Build #${d.buildNumber || 'N/A'}</div>
                        <div style="font-size: 12px; margin-top: 4px;">
                            <span>📅 ${new Date(d.timestamp).toLocaleString()}</span><br>
                            <span>👤 ${d.commitAuthor || 'Unknown'}</span><br>
                            <span>📦 ${d.filesDeployed || 0} files</span><br>
                            <span>🔗 ${d.commitSha ? d.commitSha.substring(0, 7) : 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 16px;
                padding: 8px 16px;
                background: #6366f1;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">Close</button>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Get deployment statistics
     */
    getStatistics() {
        const history = this.getDeploymentHistory();
        
        return {
            total: history.length,
            today: history.filter(d => {
                const date = new Date(d.timestamp);
                const today = new Date();
                return date.toDateString() === today.toDateString();
            }).length,
            thisWeek: history.filter(d => {
                const date = new Date(d.timestamp);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date > weekAgo;
            }).length,
            avgFilesPerDeploy: history.length > 0 
                ? Math.round(history.reduce((sum, d) => sum + (d.filesDeployed || 0), 0) / history.length)
                : 0
        };
    }
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const tracker = new GitHubActionsTracker();
        tracker.init();
        window.GitHubActionsTracker = tracker;
    });
} else {
    const tracker = new GitHubActionsTracker();
    tracker.init();
    window.GitHubActionsTracker = tracker;
}
