#!/usr/bin/env node

/**
 * Complete Historical Development Data Sync for Assiduous Project
 * 
 * This script captures EVERY single development action from the first commit
 * to the current state and populates the Firebase development tracking system
 * with comprehensive metrics, costs, timelines, and file changes.
 * 
 * Usage:
 *   node scripts/sync_all_development_history.js [--dry-run] [--github-token TOKEN]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveHistorySync {
    constructor() {
        this.hourlyRate = 300;
        this.projectStartDate = null;
        this.totalCommits = 0;
        this.totalFiles = 0;
        this.totalCost = 0;
        this.totalHours = 0;
        this.dailyMetrics = new Map();
        this.commitAnalytics = [];
        this.fileChangeLog = [];
        this.deploymentHistory = [];
        this.costBreakdown = {
            byType: {},
            byAuthor: {},
            byMonth: {},
            byPhase: {}
        };
    }

    /**
     * Main sync function - processes all history
     */
    async syncAllHistory(options = {}) {
        console.log('🚀 Starting comprehensive development history sync...');
        console.log('📊 This will capture every commit, file change, and metric from project inception');

        try {
            // Step 1: Extract complete git history
            const commits = await this.extractCompleteGitHistory();
            console.log(`📝 Found ${commits.length} total commits`);

            // Step 2: Analyze file changes and calculate costs
            await this.analyzeFileChanges(commits);
            
            // Step 3: Process commits into sessions and metrics
            await this.processCommitsIntoSessions(commits);
            
            // Step 4: Generate deployment timeline
            await this.generateDeploymentHistory(commits);
            
            // Step 5: Calculate comprehensive metrics
            await this.calculateProjectMetrics();
            
            // Step 6: Write to Firebase (or local files if dry-run)
            if (options.dryRun) {
                await this.writeToLocalFiles();
            } else {
                await this.writeToFirebase(options.githubToken);
            }
            
            console.log('✅ Complete history sync finished successfully!');
            this.printSummary();
            
        } catch (error) {
            console.error('❌ History sync failed:', error);
            throw error;
        }
    }

    /**
     * Extract complete git history with all metadata
     */
    async extractCompleteGitHistory() {
        console.log('🔍 Extracting complete git history...');
        
        try {
            // First, get basic commit info
            const basicCommits = await this.getBasicCommits();
            console.log(`📊 Found ${basicCommits.length} commits`);
            
            // Then get file stats for each commit in batches
            const commits = await this.addFileStatsToCommits(basicCommits);
            
            // Set project start date
            if (commits.length > 0) {
                this.projectStartDate = new Date(commits[commits.length - 1].date);
                console.log(`📅 Project started: ${this.projectStartDate.toISOString().split('T')[0]}`);
            }
            
            this.totalCommits = commits.length;
            return commits;
            
        } catch (error) {
            console.error('Error extracting git history:', error);
            throw error;
        }
    }
    
    /**
     * Get basic commit information without file stats
     */
    async getBasicCommits() {
        const gitLogCommand = `git log --all --format="%H|%an|%ae|%ad|%s|%P" --date=iso`;
        const gitOutput = execSync(gitLogCommand, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 });
        
        const commits = [];
        const lines = gitOutput.trim().split('\n');
        
        for (const line of lines) {
            if (line.includes('|')) {
                const [sha, author, email, date, message, parents] = line.split('|');
                commits.push({
                    sha: sha.trim(),
                    author: author.trim(),
                    email: email.trim(),
                    date: date.trim(),
                    message: message.trim(),
                    parents: parents ? parents.trim().split(' ').filter(p => p) : [],
                    filesChanged: [],
                    insertions: 0,
                    deletions: 0,
                    type: this.extractCommitType(message.trim()),
                    scope: this.extractCommitScope(message.trim()),
                    sessionData: this.extractSessionMetadata(message.trim())
                });
            }
        }
        
        return commits.reverse(); // Return in chronological order
    }
    
    /**
     * Add file statistics to commits in batches
     */
    async addFileStatsToCommits(commits) {
        const batchSize = 10; // Process 10 commits at a time
        
        for (let i = 0; i < commits.length; i += batchSize) {
            const batch = commits.slice(i, i + batchSize);
            console.log(`📂 Processing file stats for commits ${i + 1}-${Math.min(i + batchSize, commits.length)}/${commits.length}`);
            
            for (const commit of batch) {
                try {
                    const fileStats = await this.getCommitFileStats(commit.sha);
                    commit.filesChanged = fileStats.filesChanged;
                    commit.insertions = fileStats.insertions;
                    commit.deletions = fileStats.deletions;
                } catch (error) {
                    console.warn(`⚠️  Failed to get file stats for commit ${commit.sha.substring(0, 7)}: ${error.message}`);
                    // Continue with empty file stats
                }
            }
            
            // Small delay between batches to avoid overwhelming the system
            if (i + batchSize < commits.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return commits;
    }
    
    /**
     * Get file statistics for a single commit
     */
    async getCommitFileStats(commitSha) {
        try {
            const statCommand = `git show --numstat --format="" ${commitSha}`;
            const statOutput = execSync(statCommand, { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
            
            const filesChanged = [];
            let insertions = 0;
            let deletions = 0;
            
            const lines = statOutput.trim().split('\n').filter(line => line);
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    const ins = parseInt(parts[0]) || 0;
                    const dels = parseInt(parts[1]) || 0;
                    const filename = parts.slice(2).join(' ');
                    
                    filesChanged.push({
                        filename,
                        insertions: ins,
                        deletions: dels,
                        netChange: ins - dels
                    });
                    
                    insertions += ins;
                    deletions += dels;
                }
            }
            
            return { filesChanged, insertions, deletions };
            
        } catch (error) {
            // Return empty stats if we can't get file info
            return { filesChanged: [], insertions: 0, deletions: 0 };
        }
    }


    /**
     * Analyze file changes and calculate development effort
     */
    async analyzeFileChanges(commits) {
        console.log('📁 Analyzing file changes and calculating effort...');
        
        const fileStats = new Map();
        let totalFiles = new Set();
        
        for (const commit of commits) {
            for (const fileChange of commit.filesChanged) {
                const filename = fileChange.filename;
                totalFiles.add(filename);
                
                if (!fileStats.has(filename)) {
                    fileStats.set(filename, {
                        filename,
                        totalCommits: 0,
                        totalInsertions: 0,
                        totalDeletions: 0,
                        firstSeen: commit.date,
                        lastModified: commit.date,
                        authors: new Set(),
                        complexity: this.calculateFileComplexity(filename)
                    });
                }
                
                const stats = fileStats.get(filename);
                stats.totalCommits++;
                stats.totalInsertions += fileChange.insertions;
                stats.totalDeletions += fileChange.deletions;
                stats.lastModified = commit.date;
                stats.authors.add(commit.author);
            }
        }
        
        this.totalFiles = totalFiles.size;
        this.fileChangeLog = Array.from(fileStats.values()).map(stats => ({
            ...stats,
            authors: Array.from(stats.authors),
            estimatedHours: this.estimateFileEffort(stats),
            category: this.categorizeFile(stats.filename)
        }));
        
        console.log(`📊 Analyzed ${this.totalFiles} unique files across ${commits.length} commits`);
    }

    /**
     * Process all commits into development sessions
     */
    async processCommitsIntoSessions(commits) {
        console.log('⚡ Processing commits into development sessions...');
        
        // Group commits by date and author
        const sessionGroups = new Map();
        
        for (const commit of commits) {
            const date = commit.date.split('T')[0];
            const sessionKey = `${date}_${commit.author}`;
            
            if (!sessionGroups.has(sessionKey)) {
                sessionGroups.set(sessionKey, {
                    date,
                    author: commit.author,
                    email: commit.email,
                    commits: [],
                    totalInsertions: 0,
                    totalDeletions: 0,
                    filesModified: new Set(),
                    types: new Set()
                });
            }
            
            const session = sessionGroups.get(sessionKey);
            session.commits.push(commit);
            session.totalInsertions += commit.insertions;
            session.totalDeletions += commit.deletions;
            commit.filesChanged.forEach(f => session.filesModified.add(f.filename));
            session.types.add(commit.type);
        }
        
        // Convert to sessions with metrics
        for (const [sessionKey, sessionData] of sessionGroups) {
            const sessionHours = this.estimateSessionHours(sessionData);
            const sessionCost = sessionHours * this.hourlyRate;
            
            const session = {
                sessionId: sessionKey.replace('_', '_session_'),
                date: sessionData.date,
                author: sessionData.author,
                email: sessionData.email,
                startTime: this.estimateSessionStart(sessionData.commits),
                endTime: this.estimateSessionEnd(sessionData.commits),
                duration: sessionHours,
                
                costTracking: {
                    hourlyRate: this.hourlyRate,
                    totalCost: Math.round(sessionCost),
                    billable: true,
                    estimatedFromPattern: !this.hasExplicitSessionData(sessionData.commits)
                },
                
                metrics: {
                    commitsCreated: sessionData.commits.length,
                    filesModified: sessionData.filesModified.size,
                    linesAdded: sessionData.totalInsertions,
                    linesDeleted: sessionData.totalDeletions,
                    netLinesChanged: sessionData.totalInsertions - sessionData.totalDeletions,
                    typesWorked: Array.from(sessionData.types),
                    deploymentsSuccess: this.countDeployments(sessionData.commits),
                    bugsFixed: this.countBugFixes(sessionData.commits),
                    featuresAdded: this.countFeatures(sessionData.commits)
                },
                
                technologies: this.identifyTechnologies(sessionData.commits),
                achievements: this.extractAchievements(sessionData.commits),
                filesChanged: this.summarizeFileChanges(sessionData.commits),
                
                velocity: {
                    commitsPerHour: sessionHours > 0 ? sessionData.commits.length / sessionHours : 0,
                    costPerCommit: sessionData.commits.length > 0 ? sessionCost / sessionData.commits.length : 0,
                    hoursPerDay: sessionHours,
                    efficiency: this.calculateSessionEfficiency(sessionData, sessionHours)
                }
            };
            
            // Store daily metrics
            this.updateDailyMetrics(sessionData.date, session);
            
            this.commitAnalytics.push(session);
            this.totalHours += sessionHours;
            this.totalCost += sessionCost;
        }
        
        console.log(`📈 Created ${sessionGroups.size} development sessions`);
    }

    /**
     * Generate deployment history from commit patterns
     */
    async generateDeploymentHistory(commits) {
        console.log('🚀 Generating deployment history...');
        
        const deploymentCommits = commits.filter(commit => 
            commit.message.includes('deploy') ||
            commit.message.includes('release') ||
            commit.message.includes('version') ||
            commit.message.includes('bump') ||
            commit.type === 'chore' && commit.message.includes('release')
        );
        
        let deploymentId = 1;
        for (const commit of deploymentCommits) {
            const deployment = {
                deploymentId: `deploy_${deploymentId.toString().padStart(3, '0')}_${commit.date.split('T')[0]}`,
                commitSha: commit.sha,
                date: commit.date,
                author: commit.author,
                message: commit.message,
                environment: this.inferEnvironment(commit.message),
                version: this.extractVersion(commit.message),
                type: this.classifyDeployment(commit.message),
                estimatedDuration: this.estimateDeploymentDuration(commit),
                filesDeployed: commit.filesChanged.length,
                success: true // Assume success since commit exists
            };
            
            this.deploymentHistory.push(deployment);
            deploymentId++;
        }
        
        console.log(`🎯 Identified ${this.deploymentHistory.length} deployment events`);
    }

    /**
     * Calculate comprehensive project metrics
     */
    async calculateProjectMetrics() {
        console.log('📊 Calculating comprehensive project metrics...');
        
        // Cost breakdown by type
        for (const session of this.commitAnalytics) {
            for (const type of session.metrics.typesWorked) {
                if (!this.costBreakdown.byType[type]) {
                    this.costBreakdown.byType[type] = { cost: 0, hours: 0, commits: 0 };
                }
                this.costBreakdown.byType[type].cost += session.costTracking.totalCost / session.metrics.typesWorked.length;
                this.costBreakdown.byType[type].hours += session.duration / session.metrics.typesWorked.length;
                this.costBreakdown.byType[type].commits += session.metrics.commitsCreated / session.metrics.typesWorked.length;
            }
            
            // Cost by author
            const author = session.author;
            if (!this.costBreakdown.byAuthor[author]) {
                this.costBreakdown.byAuthor[author] = { cost: 0, hours: 0, commits: 0 };
            }
            this.costBreakdown.byAuthor[author].cost += session.costTracking.totalCost;
            this.costBreakdown.byAuthor[author].hours += session.duration;
            this.costBreakdown.byAuthor[author].commits += session.metrics.commitsCreated;
            
            // Cost by month
            const month = session.date.substring(0, 7);
            if (!this.costBreakdown.byMonth[month]) {
                this.costBreakdown.byMonth[month] = { cost: 0, hours: 0, commits: 0 };
            }
            this.costBreakdown.byMonth[month].cost += session.costTracking.totalCost;
            this.costBreakdown.byMonth[month].hours += session.duration;
            this.costBreakdown.byMonth[month].commits += session.metrics.commitsCreated;
        }
        
        console.log(`💰 Total project cost: $${this.totalCost.toLocaleString()}`);
        console.log(`⏰ Total development hours: ${this.totalHours.toFixed(1)}`);
        console.log(`📝 Total commits: ${this.totalCommits}`);
        console.log(`📁 Total files: ${this.totalFiles}`);
    }

    /**
     * Write all data to Firebase
     */
    async writeToFirebase(githubToken = null) {
        console.log('🔥 Writing complete history to Firebase...');
        
        // This would integrate with your existing Firebase setup
        // For now, we'll create the structure that would be uploaded
        
        const firebaseData = {
            development_sessions: {},
            development_metrics: {},
            git_commits: {},
            deployment_logs: {},
            file_change_history: {},
            project_analytics: {
                totalCost: this.totalCost,
                totalHours: this.totalHours,
                totalCommits: this.totalCommits,
                totalFiles: this.totalFiles,
                startDate: this.projectStartDate,
                costBreakdown: this.costBreakdown,
                fileStats: this.fileChangeLog.slice(0, 100) // Top 100 most changed files
            }
        };
        
        // Structure sessions
        for (const session of this.commitAnalytics) {
            firebaseData.development_sessions[session.sessionId] = {
                ...session,
                createdAt: new Date().toISOString(),
                syncedAt: new Date().toISOString()
            };
        }
        
        // Structure daily metrics
        for (const [date, metrics] of this.dailyMetrics) {
            firebaseData.development_metrics[date] = {
                ...metrics,
                createdAt: new Date().toISOString(),
                syncedAt: new Date().toISOString()
            };
        }
        
        // Structure deployments
        for (const deployment of this.deploymentHistory) {
            firebaseData.deployment_logs[deployment.deploymentId] = {
                ...deployment,
                createdAt: new Date().toISOString()
            };
        }
        
        // Write to file for now (would be Firebase in production)
        await this.writeToLocalFiles(firebaseData);
        
        console.log('✅ Firebase data structure ready for upload');
    }

    /**
     * Write data to local files for review/testing
     */
    async writeToLocalFiles(data = null) {
        console.log('💾 Writing comprehensive data to local files...');
        
        const outputDir = path.join(__dirname, '../data/development_history');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Write individual data files
        fs.writeFileSync(
            path.join(outputDir, `sessions_${timestamp}.json`),
            JSON.stringify(this.commitAnalytics, null, 2)
        );
        
        fs.writeFileSync(
            path.join(outputDir, `daily_metrics_${timestamp}.json`),
            JSON.stringify(Object.fromEntries(this.dailyMetrics), null, 2)
        );
        
        fs.writeFileSync(
            path.join(outputDir, `deployments_${timestamp}.json`),
            JSON.stringify(this.deploymentHistory, null, 2)
        );
        
        fs.writeFileSync(
            path.join(outputDir, `file_changes_${timestamp}.json`),
            JSON.stringify(this.fileChangeLog, null, 2)
        );
        
        fs.writeFileSync(
            path.join(outputDir, `cost_breakdown_${timestamp}.json`),
            JSON.stringify(this.costBreakdown, null, 2)
        );
        
        // Write summary report
        const summary = this.generateSummaryReport();
        fs.writeFileSync(
            path.join(outputDir, `project_summary_${timestamp}.md`),
            summary
        );
        
        console.log(`📁 Data written to: ${outputDir}`);
    }

    /**
     * Helper methods for data analysis
     */
    
    extractCommitType(message) {
        const match = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]+\))?:/);
        return match ? match[1] : 'unknown';
    }
    
    extractCommitScope(message) {
        const match = message.match(/^[^(]+\(([^)]+)\):/);
        return match ? match[1] : null;
    }
    
    extractSessionMetadata(message) {
        const sessionMatch = message.match(/\[session:([\d.]+)\]/);
        const costMatch = message.match(/\[cost:\$?([\d.]+)\]/);
        
        return {
            explicitHours: sessionMatch ? parseFloat(sessionMatch[1]) : null,
            explicitCost: costMatch ? parseFloat(costMatch[1]) : null
        };
    }
    
    calculateFileComplexity(filename) {
        const ext = path.extname(filename).toLowerCase();
        const complexityMap = {
            '.js': 3, '.ts': 3, '.jsx': 3, '.tsx': 3,
            '.html': 2, '.css': 2, '.scss': 2,
            '.json': 1, '.md': 1, '.txt': 1,
            '.py': 3, '.java': 3, '.cpp': 4, '.c': 4
        };
        return complexityMap[ext] || 2;
    }
    
    estimateFileEffort(stats) {
        const baseHours = (stats.totalInsertions + stats.totalDeletions) / 100; // 100 lines per hour
        const complexityMultiplier = stats.complexity;
        const collaborationPenalty = stats.authors.length > 1 ? 1.2 : 1.0;
        
        return Math.max(0.1, baseHours * complexityMultiplier * collaborationPenalty);
    }
    
    categorizeFile(filename) {
        if (filename.includes('test') || filename.includes('spec')) return 'testing';
        if (filename.includes('doc') || filename.endsWith('.md')) return 'documentation';
        if (filename.includes('config') || filename.includes('.json')) return 'configuration';
        if (filename.includes('style') || filename.endsWith('.css')) return 'styling';
        if (filename.includes('component') || filename.includes('ui')) return 'ui_component';
        if (filename.includes('service') || filename.includes('api')) return 'backend_service';
        if (filename.includes('util') || filename.includes('helper')) return 'utility';
        return 'application_logic';
    }
    
    estimateSessionHours(sessionData) {
        // Check for explicit session data first
        for (const commit of sessionData.commits) {
            if (commit.sessionData.explicitHours) {
                return commit.sessionData.explicitHours;
            }
        }
        
        // Calculate actual time between first and last commit of the day
        if (sessionData.commits.length === 1) {
            // Single commit - estimate minimum session time based on work type
            const commit = sessionData.commits[0];
            const linesChanged = sessionData.totalInsertions + sessionData.totalDeletions;
            
            // Base time estimates for single commits
            let baseHours = 0.5; // Minimum 30 minutes
            
            // Adjust based on commit type
            switch (commit.type) {
                case 'feat': baseHours = Math.max(1.0, linesChanged / 100); break;
                case 'fix': baseHours = Math.max(0.5, linesChanged / 150); break;
                case 'refactor': baseHours = Math.max(0.75, linesChanged / 80); break;
                case 'docs': baseHours = Math.max(0.25, linesChanged / 200); break;
                case 'test': baseHours = Math.max(0.5, linesChanged / 120); break;
                case 'chore': baseHours = Math.max(0.25, linesChanged / 250); break;
                default: baseHours = Math.max(0.5, linesChanged / 100); break;
            }
            
            return Math.min(baseHours, 4); // Cap single commits at 4 hours
        }
        
        // Multiple commits - calculate time between first and last commit
        const commits = sessionData.commits.sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstCommitTime = new Date(commits[0].date);
        const lastCommitTime = new Date(commits[commits.length - 1].date);
        
        const timeDiffMs = lastCommitTime - firstCommitTime;
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60); // Convert to hours
        
        // If commits span more than reasonable working hours, cap it
        if (timeDiffHours > 12) {
            console.log(`  📅 Day ${sessionData.date}: Commits span ${timeDiffHours.toFixed(1)}h, capping at 12h`);
            return 12; // Max 12 hour work day
        }
        
        // If commits are very close together, ensure minimum time
        if (timeDiffHours < 0.5) {
            const minHours = Math.max(0.5, sessionData.commits.length * 0.25); // 15 min per commit minimum
            console.log(`  ⏰ Day ${sessionData.date}: Commits close together (${timeDiffHours.toFixed(1)}h), using minimum ${minHours.toFixed(1)}h`);
            return Math.min(minHours, 2);
        }
        
        // Add buffer time for actual work (commits don't capture all work time)
        const bufferMultiplier = 1.2; // 20% buffer for work between commits
        const actualHours = Math.min(timeDiffHours * bufferMultiplier, 12);
        
        console.log(`  📊 Day ${sessionData.date}: ${commits.length} commits over ${timeDiffHours.toFixed(1)}h (${firstCommitTime.toLocaleTimeString()} - ${lastCommitTime.toLocaleTimeString()}), calculated: ${actualHours.toFixed(1)}h`);
        
        return Math.max(actualHours, 0.5); // Minimum 30 minutes
    }
    
    updateDailyMetrics(date, session) {
        if (!this.dailyMetrics.has(date)) {
            this.dailyMetrics.set(date, {
                date,
                type: 'daily',
                hours: 0,
                cost: 0,
                commits: 0,
                deployments: 0,
                filesModified: 0,
                linesChanged: 0,
                authors: new Set(),
                technologies: new Set(),
                achievements: []
            });
        }
        
        const daily = this.dailyMetrics.get(date);
        daily.hours += session.duration;
        daily.cost += session.costTracking.totalCost;
        daily.commits += session.metrics.commitsCreated;
        daily.deployments += session.metrics.deploymentsSuccess;
        daily.filesModified += session.metrics.filesModified;
        daily.linesChanged += session.metrics.netLinesChanged;
        daily.authors.add(session.author);
        session.technologies.forEach(tech => daily.technologies.add(tech));
        daily.achievements.push(...session.achievements);
        
        // Convert Sets to Arrays for JSON serialization
        this.dailyMetrics.set(date, {
            ...daily,
            authors: Array.from(daily.authors),
            technologies: Array.from(daily.technologies)
        });
    }
    
    generateSummaryReport() {
        const startDate = this.projectStartDate;
        const endDate = new Date();
        const projectDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        return `# Assiduous Project Development History Summary

## Project Overview
- **Start Date:** ${startDate.toISOString().split('T')[0]}
- **Analysis Date:** ${endDate.toISOString().split('T')[0]}
- **Total Project Days:** ${projectDays}
- **Active Development Days:** ${this.dailyMetrics.size}

## Development Metrics
- **Total Commits:** ${this.totalCommits}
- **Total Files:** ${this.totalFiles}
- **Total Development Hours:** ${this.totalHours.toFixed(1)}
- **Total Project Cost:** $${this.totalCost.toLocaleString()}
- **Average Cost Per Commit:** $${(this.totalCost / this.totalCommits).toFixed(2)}
- **Development Sessions:** ${this.commitAnalytics.length}
- **Deployment Events:** ${this.deploymentHistory.length}

## Cost Breakdown by Type
${Object.entries(this.costBreakdown.byType)
    .sort(([,a], [,b]) => b.cost - a.cost)
    .map(([type, data]) => `- **${type}:** $${Math.round(data.cost).toLocaleString()} (${data.hours.toFixed(1)}h, ${Math.round(data.commits)} commits)`)
    .join('\n')}

## Monthly Development Activity
${Object.entries(this.costBreakdown.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => `- **${month}:** $${Math.round(data.cost).toLocaleString()} (${data.hours.toFixed(1)}h, ${Math.round(data.commits)} commits)`)
    .join('\n')}

## Top Modified Files
${this.fileChangeLog
    .sort((a, b) => b.totalCommits - a.totalCommits)
    .slice(0, 10)
    .map(file => `- **${file.filename}:** ${file.totalCommits} commits, +${file.totalInsertions}/-${file.totalDeletions} lines`)
    .join('\n')}

Generated on ${new Date().toISOString()}
`;
    }
    
    printSummary() {
        console.log('\n🎉 COMPREHENSIVE DEVELOPMENT HISTORY SYNC COMPLETE');
        console.log('=' .repeat(60));
        console.log(`📊 Total Commits Processed: ${this.totalCommits}`);
        console.log(`📁 Total Files Analyzed: ${this.totalFiles}`);
        console.log(`⏰ Total Development Hours: ${this.totalHours.toFixed(1)}`);
        console.log(`💰 Total Project Cost: $${this.totalCost.toLocaleString()}`);
        console.log(`📈 Development Sessions: ${this.commitAnalytics.length}`);
        console.log(`🚀 Deployment Events: ${this.deploymentHistory.length}`);
        console.log(`📅 Active Development Days: ${this.dailyMetrics.size}`);
        console.log('=' .repeat(60));
    }
    
    // Additional helper methods would continue here...
    estimateSessionStart(commits) {
        // Sort commits by time and return the earliest
        const sortedCommits = commits.sort((a, b) => new Date(a.date) - new Date(b.date));
        return sortedCommits[0].date;
    }
    
    estimateSessionEnd(commits) {
        // Sort commits by time and return the latest
        const sortedCommits = commits.sort((a, b) => new Date(a.date) - new Date(b.date));
        return sortedCommits[sortedCommits.length - 1].date;
    }
    
    hasExplicitSessionData(commits) {
        return commits.some(c => c.sessionData.explicitHours || c.sessionData.explicitCost);
    }
    
    countDeployments(commits) {
        return commits.filter(c => 
            c.message.includes('deploy') || 
            c.message.includes('release') ||
            c.type === 'chore' && c.message.includes('bump')
        ).length;
    }
    
    countBugFixes(commits) {
        return commits.filter(c => c.type === 'fix').length;
    }
    
    countFeatures(commits) {
        return commits.filter(c => c.type === 'feat').length;
    }
    
    identifyTechnologies(commits) {
        const technologies = new Set();
        const techPatterns = {
            'JavaScript': /\.js$/,
            'HTML': /\.html$/,
            'CSS': /\.css$/,
            'Firebase': /firebase|firestore/i,
            'GitHub': /github|gh-pages/i,
            'Node.js': /package\.json|node_modules/i,
            'Chart.js': /chart\.js|chartjs/i,
            'Bootstrap': /bootstrap/i
        };
        
        for (const commit of commits) {
            for (const file of commit.filesChanged) {
                for (const [tech, pattern] of Object.entries(techPatterns)) {
                    if (pattern.test(file.filename) || pattern.test(commit.message)) {
                        technologies.add(tech);
                    }
                }
            }
        }
        
        return Array.from(technologies);
    }
    
    extractAchievements(commits) {
        const achievements = [];
        
        for (const commit of commits) {
            if (commit.type === 'feat') {
                achievements.push(`Feature: ${commit.message.replace(/^feat(\([^)]+\))?:\s*/, '')}`);
            } else if (commit.message.includes('complete') || commit.message.includes('implement')) {
                achievements.push(`Completed: ${commit.message.replace(/^[^:]+:\s*/, '')}`);
            } else if (commit.insertions > 500) {
                achievements.push(`Major code addition: ${commit.insertions} lines added`);
            }
        }
        
        return achievements.slice(0, 5); // Top 5 achievements
    }
    
    summarizeFileChanges(commits) {
        const fileChanges = [];
        const fileMap = new Map();
        
        for (const commit of commits) {
            for (const file of commit.filesChanged) {
                if (!fileMap.has(file.filename)) {
                    fileMap.set(file.filename, {
                        path: file.filename,
                        insertions: 0,
                        deletions: 0,
                        type: this.categorizeFile(file.filename)
                    });
                }
                
                const summary = fileMap.get(file.filename);
                summary.insertions += file.insertions;
                summary.deletions += file.deletions;
            }
        }
        
        return Array.from(fileMap.values())
            .sort((a, b) => (b.insertions + b.deletions) - (a.insertions + a.deletions))
            .slice(0, 20); // Top 20 most changed files
    }
    
    calculateSessionEfficiency(sessionData, hours) {
        const commitsPerHour = sessionData.commits.length / Math.max(hours, 0.1);
        const linesPerHour = (sessionData.totalInsertions + sessionData.totalDeletions) / Math.max(hours, 0.1);
        
        if (commitsPerHour >= 4 && linesPerHour >= 100) return 'high';
        if (commitsPerHour >= 2 && linesPerHour >= 50) return 'medium';
        return 'low';
    }
    
    inferEnvironment(message) {
        if (message.includes('prod') || message.includes('release')) return 'production';
        if (message.includes('staging') || message.includes('test')) return 'staging';
        return 'development';
    }
    
    extractVersion(message) {
        const versionMatch = message.match(/v?(\d+\.\d+\.\d+)/);
        return versionMatch ? versionMatch[1] : null;
    }
    
    classifyDeployment(message) {
        if (message.includes('hotfix') || message.includes('emergency')) return 'hotfix';
        if (message.includes('release') || message.includes('version')) return 'release';
        if (message.includes('feature') || message.includes('feat')) return 'feature_deploy';
        return 'regular_deploy';
    }
    
    estimateDeploymentDuration(commit) {
        const filesCount = commit.filesChanged.length;
        const linesChanged = commit.insertions + commit.deletions;
        
        // Base duration in seconds
        let duration = 60; // 1 minute base
        duration += filesCount * 5; // 5 seconds per file
        duration += linesChanged / 20; // Additional time for large changes
        
        return Math.min(duration, 300); // Cap at 5 minutes
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        githubToken: args.includes('--github-token') ? 
            args[args.indexOf('--github-token') + 1] : null
    };
    
    console.log('🚀 Assiduous Complete Development History Sync');
    console.log(`Options: dry-run=${options.dryRun}, token=${!!options.githubToken}`);
    
    const sync = new ComprehensiveHistorySync();
    
    try {
        await sync.syncAllHistory(options);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ComprehensiveHistorySync;
