#!/usr/bin/env node

/**
 * Automated Metrics Update Script
 * Updates metrics_cache.json with real git data
 * Can be run manually or via git hooks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const REPO_ROOT = path.resolve(__dirname, '..');
const METRICS_FILE = path.join(REPO_ROOT, 'firebase-migration-package', 'assiduous-build', 'admin', 'development', 'metrics_cache.json');

// Configuration
const HOURLY_RATE = 150;
const AVG_HOURS_PER_COMMIT = 0.33; // ~20 minutes per commit average

function runCommand(cmd) {
    try {
        return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    } catch (error) {
        console.error(`Error running command: ${cmd}`, error.message);
        return '';
    }
}

function calculateMetrics() {
    console.log('📊 Calculating project metrics from git...');
    
    // Get total commit count
    const totalCommits = parseInt(runCommand('git rev-list --count HEAD') || '0');
    
    // Get project start date (first commit)
    const firstCommitDate = runCommand('git log --reverse --format=%ad --date=iso | head -1');
    const startDate = firstCommitDate ? new Date(firstCommitDate) : new Date('2025-08-10');
    
    // Calculate project age in days
    const now = new Date();
    const projectAgeDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    
    // Get commits in last 24 hours
    const todayCommits = parseInt(runCommand('git rev-list --count --since="24 hours ago" HEAD') || '0');
    
    // Get commits in last 7 days
    const weekCommits = parseInt(runCommand('git rev-list --count --since="7 days ago" HEAD') || '0');
    
    // Get commits in last 30 days
    const monthCommits = parseInt(runCommand('git rev-list --count --since="30 days ago" HEAD') || '0');
    
    // Calculate file statistics
    const fileCount = parseInt(runCommand('git ls-files | wc -l') || '0');
    
    // Get line statistics (additions and deletions)
    const gitStats = runCommand('git log --shortstat --format="" | grep -E "files? changed" | awk \'{add+=$4; del+=$6} END {print add, del}\'');
    const [linesAdded = 0, linesDeleted = 0] = gitStats.split(' ').map(n => parseInt(n) || 0);
    
    // Estimate hours based on commits (more accurate than arbitrary numbers)
    const estimatedHours = Math.round(totalCommits * AVG_HOURS_PER_COMMIT);
    const estimatedCost = estimatedHours * HOURLY_RATE;
    
    // Calculate completion percentage based on planned features
    // Admin: 90%, Agent: 60%, Client: 70%, Micro-flipping: 0%, AI: 0%
    const completionPercentage = Math.round((90 + 60 + 70 + 0 + 0) / 5);
    
    // Get recent commits for activity feed
    const recentCommitsRaw = runCommand('git log --oneline --format="%H|%s|%an|%ad" --date=iso -10');
    const recentCommits = recentCommitsRaw.split('\n').filter(line => line).map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
    });
    
    // Calculate daily averages
    const avgCommitsPerDay = (totalCommits / projectAgeDays).toFixed(1);
    const avgHoursPerDay = (estimatedHours / projectAgeDays).toFixed(1);
    
    // Build metrics object
    const metrics = {
        lastUpdated: new Date().toISOString(),
        features: {
            authentication: { status: 'complete', percentage: 100, description: 'Firebase Auth with role-based access' },
            adminPortal: { status: 'complete', percentage: 90, description: 'Properties, agents, clients management' },
            agentPortal: { status: 'in-progress', percentage: 60, description: 'Dashboard done, needs properties/leads' },
            clientPortal: { status: 'in-progress', percentage: 70, description: 'Dashboard and deal analyzer complete' },
            microFlipping: { status: 'not-started', percentage: 0, description: 'Automated deal flow and analysis' },
            aiIntegration: { status: 'not-started', percentage: 0, description: 'AI property recommendations' },
            paymentProcessing: { status: 'not-started', percentage: 0, description: 'Stripe integration for transactions' }
        },
        project: {
            totalHours: estimatedHours.toString(),
            avgHoursPerDay: avgHoursPerDay,
            totalCost: estimatedCost,
            laborCost: estimatedCost,
            toolsCost: 450,
            totalCommits: totalCommits,
            totalFiles: fileCount,
            activeDays: projectAgeDays,
            projectAgeDays: projectAgeDays,
            linesAdded: linesAdded,
            linesDeleted: linesDeleted,
            netLines: linesAdded - linesDeleted,
            velocity: avgCommitsPerDay,
            completionPercentage: completionPercentage,
            actualStartDate: startDate.toISOString().split('T')[0]
        },
        today: {
            date: new Date().toISOString().split('T')[0],
            hours: (todayCommits * AVG_HOURS_PER_COMMIT).toFixed(1),
            cost: Math.round(todayCommits * AVG_HOURS_PER_COMMIT * HOURLY_RATE),
            commits: todayCommits,
            deployments: 0 // Would need to track this separately
        },
        thisWeek: {
            hours: (weekCommits * AVG_HOURS_PER_COMMIT).toFixed(1),
            cost: Math.round(weekCommits * AVG_HOURS_PER_COMMIT * HOURLY_RATE),
            commits: weekCommits,
            days: Math.min(7, projectAgeDays)
        },
        thisMonth: {
            hours: (monthCommits * AVG_HOURS_PER_COMMIT).toFixed(1),
            cost: Math.round(monthCommits * AVG_HOURS_PER_COMMIT * HOURLY_RATE),
            commits: monthCommits
        },
        recentActivity: recentCommits,
        automation: {
            lastRun: new Date().toISOString(),
            gitHookInstalled: fs.existsSync(path.join(REPO_ROOT, '.git/hooks/post-commit')),
            scriptPath: __filename,
            updateFrequency: "On every commit (via git hook)"
        }
    };
    
    return metrics;
}

function saveMetrics(metrics) {
    try {
        // Ensure directory exists
        const dir = path.dirname(METRICS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write metrics file
        fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
        console.log(`✅ Metrics saved to: ${METRICS_FILE}`);
        
        // Also save a backup in the root for debugging
        const backupFile = path.join(REPO_ROOT, 'metrics_cache_backup.json');
        fs.writeFileSync(backupFile, JSON.stringify(metrics, null, 2));
        console.log(`📋 Backup saved to: ${backupFile}`);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to save metrics:', error.message);
        return false;
    }
}

function main() {
    console.log('🚀 Starting automated metrics update...');
    console.log(`📁 Repository: ${REPO_ROOT}`);
    console.log(`📊 Output: ${METRICS_FILE}`);
    
    try {
        const metrics = calculateMetrics();
        
        console.log('\n📈 Metrics Summary:');
        console.log(`  - Total Commits: ${metrics.project.totalCommits}`);
        console.log(`  - Estimated Hours: ${metrics.project.totalHours}`);
        console.log(`  - Estimated Cost: $${metrics.project.totalCost.toLocaleString()}`);
        console.log(`  - Completion: ${metrics.project.completionPercentage}%`);
        console.log(`  - Today's Commits: ${metrics.today.commits}`);
        console.log(`  - This Week: ${metrics.thisWeek.commits} commits`);
        
        if (saveMetrics(metrics)) {
            console.log('\n✅ Metrics update complete!');
            console.log('📱 Dashboard will show updated metrics on next load');
            process.exit(0);
        } else {
            console.error('\n❌ Failed to update metrics');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { calculateMetrics, saveMetrics };