#!/usr/bin/env node

/**
 * Automatic Metrics Updater for Assiduous Project
 * Runs continuously and updates metrics at regular intervals
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MetricsAutoUpdater {
    constructor() {
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.metricsScript = path.join(__dirname, 'calculate_accurate_metrics.js');
        this.isRunning = false;
        this.updateCount = 0;
    }

    start() {
        console.log('🚀 Starting Assiduous Metrics Auto-Updater');
        console.log(`📊 Updates every ${this.updateInterval / 1000} seconds`);
        console.log('Press Ctrl+C to stop\n');
        
        // Run immediately on start
        this.updateMetrics();
        
        // Set up interval for regular updates
        this.intervalId = setInterval(() => {
            this.updateMetrics();
        }, this.updateInterval);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n👋 Stopping metrics updater...');
            clearInterval(this.intervalId);
            process.exit(0);
        });
    }

    updateMetrics() {
        if (this.isRunning) {
            console.log('⏳ Previous update still running, skipping...');
            return;
        }

        this.isRunning = true;
        this.updateCount++;
        
        const timestamp = new Date().toLocaleString();
        console.log(`\n[${timestamp}] Running update #${this.updateCount}...`);
        
        const child = spawn('node', [this.metricsScript], {
            cwd: path.dirname(this.metricsScript),
            stdio: 'pipe'
        });
        
        let output = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            console.error(`❌ Error: ${data}`);
        });
        
        child.on('close', (code) => {
            this.isRunning = false;
            
            if (code === 0) {
                // Parse key metrics from output
                const lines = output.split('\n');
                const totalCostLine = lines.find(l => l.includes('TOTAL COST:'));
                const commitsLine = lines.find(l => l.includes('Total Commits:'));
                const hoursLine = lines.find(l => l.includes('Total Hours:'));
                
                if (totalCostLine) {
                    const cost = totalCostLine.split('$')[1]?.trim();
                    console.log(`✅ Update complete - Cost: $${cost}`);
                }
                if (commitsLine) {
                    const commits = commitsLine.match(/\d+/)?.[0];
                    console.log(`   Commits: ${commits}`);
                }
                if (hoursLine) {
                    const hours = hoursLine.match(/[\d.]+/)?.[0];
                    console.log(`   Hours: ${hours}`);
                }
                
                console.log(`⏰ Next update in ${this.updateInterval / 1000} seconds`);
            } else {
                console.error(`❌ Update failed with code ${code}`);
            }
        });
    }
}

// Start the auto-updater
const updater = new MetricsAutoUpdater();
updater.start();
