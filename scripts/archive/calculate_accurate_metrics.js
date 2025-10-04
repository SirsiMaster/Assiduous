#!/usr/bin/env node

/**
 * Accurate Development Metrics Calculator for Assiduous Project
 * 
 * Rules:
 * 1. Only Assiduous repository data (starts Aug 10, 2025)
 * 2. Time = first commit to last commit each day
 * 3. Rate = $150/hour
 * 4. Tools = $225/month since project start
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AccurateMetricsCalculator {
    constructor() {
        this.hourlyRate = 150; // $150 per hour
        this.monthlyToolCost = 225; // $225 per month
        this.projectStartDate = new Date('2025-08-10');
        this.dailySessions = new Map();
        this.totalStats = {
            days: 0,
            hours: 0,
            commits: 0,
            laborCost: 0,
            toolsCost: 0,
            totalCost: 0,
            files: new Set()
        };
    }

    run() {
        console.log('📊 Calculating Accurate Assiduous Project Metrics...\n');
        console.log('📅 Project Start: August 10, 2025');
        console.log('💵 Rate: $150/hour');
        console.log('🛠️  Tools: $225/month\n');
        
        // Get all commits for this repository only
        this.calculateDailyMetrics();
        this.calculateToolsCost();
        this.generateDashboardData();
        
        console.log('\n✅ Metrics calculation complete!');
    }

    calculateDailyMetrics() {
        console.log('⏰ Calculating daily work sessions...\n');
        
        // Get all commits with timestamps
        const gitLog = execSync(
            'git log --all --format="%H|%ad|%an|%s" --date=iso-local',
            { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        
        const commits = gitLog.trim().split('\n')
            .filter(line => line)
            .map(line => {
                const [sha, timestamp, author, message] = line.split('|');
                return {
                    sha,
                    timestamp: new Date(timestamp),
                    author,
                    message,
                    date: timestamp.split(' ')[0]
                };
            });

        // Group commits by day
        const dailyCommits = {};
        commits.forEach(commit => {
            const day = commit.date;
            if (!dailyCommits[day]) {
                dailyCommits[day] = [];
            }
            dailyCommits[day].push(commit);
        });

        // Calculate time for each day (first to last commit)
        Object.entries(dailyCommits).forEach(([date, dayCommits]) => {
            const timestamps = dayCommits.map(c => c.timestamp).sort((a, b) => a - b);
            const firstCommit = timestamps[0];
            const lastCommit = timestamps[timestamps.length - 1];
            
            // Calculate hours worked (with minimum 0.5 hours if single commit)
            let hoursWorked = 0;
            if (timestamps.length === 1) {
                hoursWorked = 0.5; // Single commit = 30 minutes minimum
            } else {
                const milliseconds = lastCommit - firstCommit;
                hoursWorked = milliseconds / (1000 * 60 * 60);
                
                // Add 30 minutes for the last commit work
                hoursWorked += 0.5;
                
                // Round to 15-minute intervals
                hoursWorked = Math.round(hoursWorked * 4) / 4;
                
                // Minimum 1 hour if multiple commits
                hoursWorked = Math.max(hoursWorked, 1);
            }
            
            const laborCost = hoursWorked * this.hourlyRate;
            
            this.dailySessions.set(date, {
                date,
                firstCommit: firstCommit.toISOString(),
                lastCommit: lastCommit.toISOString(),
                commits: dayCommits.length,
                hoursWorked: hoursWorked,
                laborCost: laborCost,
                commitMessages: dayCommits.map(c => c.message.substring(0, 50))
            });
            
            // Update totals
            this.totalStats.days++;
            this.totalStats.hours += hoursWorked;
            this.totalStats.commits += dayCommits.length;
            this.totalStats.laborCost += laborCost;
        });

        console.log(`📅 Active Days: ${this.totalStats.days}`);
        console.log(`⏱️  Total Hours: ${this.totalStats.hours.toFixed(2)}`);
        console.log(`📝 Total Commits: ${this.totalStats.commits}`);
        console.log(`💰 Labor Cost: $${this.totalStats.laborCost.toFixed(2)}`);
    }

    calculateToolsCost() {
        // Calculate months since project start
        const now = new Date();
        const monthsDiff = (now.getFullYear() - this.projectStartDate.getFullYear()) * 12 
            + (now.getMonth() - this.projectStartDate.getMonth()) + 1;
        
        this.totalStats.toolsCost = monthsDiff * this.monthlyToolCost;
        this.totalStats.totalCost = this.totalStats.laborCost + this.totalStats.toolsCost;
        
        console.log(`\n🛠️  Tools Cost (${monthsDiff} months): $${this.totalStats.toolsCost.toFixed(2)}`);
        console.log(`💵 TOTAL PROJECT COST: $${this.totalStats.totalCost.toFixed(2)}`);
    }

    generateDashboardData() {
        console.log('\n📊 Generating dashboard data...');
        
        // Get file count
        try {
            const files = execSync('git ls-files | wc -l', { encoding: 'utf-8' });
            this.totalStats.files = parseInt(files.trim());
        } catch (e) {
            this.totalStats.files = 0;
        }
        
        // Get today's metrics
        const today = new Date().toISOString().split('T')[0];
        const todaySession = this.dailySessions.get(today) || {
            commits: 0,
            hoursWorked: 0,
            laborCost: 0
        };
        
        // Get this week's metrics
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        let weekStats = { hours: 0, commits: 0, cost: 0, days: 0 };
        
        this.dailySessions.forEach((session, date) => {
            if (new Date(date) >= weekAgo) {
                weekStats.hours += session.hoursWorked;
                weekStats.commits += session.commits;
                weekStats.cost += session.laborCost;
                weekStats.days++;
            }
        });
        
        // Get this month's metrics
        const thisMonth = new Date().toISOString().substring(0, 7);
        let monthStats = { hours: 0, commits: 0, cost: 0, days: 0 };
        
        this.dailySessions.forEach((session, date) => {
            if (date.startsWith(thisMonth)) {
                monthStats.hours += session.hoursWorked;
                monthStats.commits += session.commits;
                monthStats.cost += session.laborCost;
                monthStats.days++;
            }
        });
        
        // Create dashboard cache
        const dashboardData = {
            project: {
                startDate: this.projectStartDate.toISOString().split('T')[0],
                totalDays: this.totalStats.days,
                totalHours: this.totalStats.hours.toFixed(2),
                totalCommits: this.totalStats.commits,
                totalFiles: this.totalStats.files,
                laborCost: this.totalStats.laborCost.toFixed(2),
                toolsCost: this.totalStats.toolsCost.toFixed(2),
                totalCost: this.totalStats.totalCost.toFixed(2),
                velocity: (this.totalStats.commits / this.totalStats.days).toFixed(1),
                avgHoursPerDay: (this.totalStats.hours / this.totalStats.days).toFixed(2),
                avgCostPerDay: (this.totalStats.totalCost / this.totalStats.days).toFixed(2)
            },
            today: {
                date: today,
                commits: todaySession.commits,
                hours: todaySession.hoursWorked.toFixed(2),
                cost: todaySession.laborCost.toFixed(2)
            },
            thisWeek: {
                days: weekStats.days,
                commits: weekStats.commits,
                hours: weekStats.hours.toFixed(2),
                cost: weekStats.cost.toFixed(2)
            },
            thisMonth: {
                month: thisMonth,
                days: monthStats.days,
                commits: monthStats.commits,
                hours: monthStats.hours.toFixed(2),
                cost: monthStats.cost.toFixed(2)
            },
            recentSessions: Array.from(this.dailySessions.values())
                .slice(-10)
                .reverse(),
            updated: new Date().toISOString()
        };
        
        // Save to cache file
        const cacheFile = path.join(__dirname, '..', 'admin', 'development', 'metrics_cache.json');
        fs.writeFileSync(cacheFile, JSON.stringify(dashboardData, null, 2));
        
        // Save detailed daily sessions
        const sessionsFile = path.join(__dirname, '..', 'data', 'development_history', 'daily_sessions.json');
        fs.writeFileSync(sessionsFile, JSON.stringify(
            Array.from(this.dailySessions.values()),
            null, 2
        ));
        
        console.log(`✅ Dashboard cache updated: ${cacheFile}`);
        console.log(`✅ Daily sessions saved: ${sessionsFile}`);
        
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 ASSIDUOUS PROJECT METRICS SUMMARY');
        console.log('='.repeat(60));
        console.log(`📅 Project Duration: ${this.totalStats.days} days`);
        console.log(`⏰ Total Hours Worked: ${this.totalStats.hours.toFixed(2)} hours`);
        console.log(`📝 Total Commits: ${this.totalStats.commits}`);
        console.log(`📁 Total Files: ${this.totalStats.files}`);
        console.log(`💼 Labor Cost: $${this.totalStats.laborCost.toFixed(2)}`);
        console.log(`🛠️  Tools Cost: $${this.totalStats.toolsCost.toFixed(2)}`);
        console.log(`💰 TOTAL COST: $${this.totalStats.totalCost.toFixed(2)}`);
        console.log(`📈 Velocity: ${(this.totalStats.commits / this.totalStats.days).toFixed(1)} commits/day`);
        console.log(`⏱️  Avg Hours/Day: ${(this.totalStats.hours / this.totalStats.days).toFixed(2)} hours`);
        console.log('='.repeat(60));
    }
}

// Run the calculator
const calculator = new AccurateMetricsCalculator();
calculator.run();
