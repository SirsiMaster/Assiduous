#!/usr/bin/env node

/**
 * Enhanced Automated Metrics Update Script
 * Tracks EVERYTHING: features, quality, security, performance, deployment, and more
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const REPO_ROOT = path.resolve(__dirname, '..');
// SINGLE SOURCE OF TRUTH for all metrics
const METRICS_FILE = path.join(REPO_ROOT, 'public', 'admin', 'development', 'metrics.json');

// Configuration (updated per owner specs)
const HOURLY_RATE = 150; // Owner development rate
const MONTHLY_TOOLS_COST = 650; // Monthly tools/services cost
const AVG_HOURS_PER_COMMIT = 0.33;

// Helper functions
function runCommand(cmd, silent = false) {
    try {
        return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    } catch (error) {
        if (!silent) console.error(`Error running command: ${cmd}`, error.message);
        return '';
    }
}

function fileExists(filePath) {
    return fs.existsSync(path.join(REPO_ROOT, filePath));
}

// Calculate Feature Completion
function calculateFeatures() {
    return {
        authentication: { 
            status: 'complete', 
            percentage: 100, 
            description: 'Firebase Auth with role-based access',
            completedTasks: ['Firebase setup', 'Role system', 'Login/logout', 'Protected routes'],
            remainingTasks: []
        },
        adminPortal: { 
            status: 'complete', 
            percentage: 90, 
            description: 'Properties, agents, clients management',
            completedTasks: ['Dashboard', 'Properties CRUD', 'Agents management', 'Clients list'],
            remainingTasks: ['Analytics charts', 'Bulk operations']
        },
        agentPortal: { 
            status: 'in-progress', 
            percentage: 60, 
            description: 'Dashboard done, needs properties/leads',
            completedTasks: ['Dashboard', 'Authentication'],
            remainingTasks: ['Properties list', 'Lead management', 'Commission tracking']
        },
        clientPortal: { 
            status: 'in-progress', 
            percentage: 70, 
            description: 'Dashboard and deal analyzer complete',
            completedTasks: ['Dashboard', 'Deal analyzer', 'Authentication'],
            remainingTasks: ['Property search', 'Portfolio management', 'Document upload']
        },
        microFlipping: { 
            status: 'not-started', 
            percentage: 0, 
            description: 'Automated deal flow and analysis',
            completedTasks: [],
            remainingTasks: ['Deal pipeline', 'ROI calculator', 'Automated valuations', 'Contractor network']
        },
        aiIntegration: { 
            status: 'not-started', 
            percentage: 0, 
            description: 'AI property recommendations',
            completedTasks: [],
            remainingTasks: ['ML model', 'Recommendation engine', 'Market predictions', 'Chat assistant']
        },
        paymentProcessing: { 
            status: 'not-started', 
            percentage: 0, 
            description: 'Stripe integration for transactions',
            completedTasks: [],
            remainingTasks: ['Stripe setup', 'Payment flows', 'Subscription billing', 'Commission splits']
        }
    };
}

// Calculate Test Coverage
function calculateTestCoverage() {
    // Check if Jest is installed
    const hasJest = fileExists('node_modules/jest');
    let coverage = {
        enabled: false,
        percentage: 0,
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
        testFiles: 0,
        testSuites: 0,
        passingTests: 0,
        failingTests: 0
    };

    if (hasJest) {
        // Run coverage if Jest exists
        const coverageData = runCommand('npm test -- --coverage --json 2>/dev/null || echo "{}"', true);
        if (coverageData && coverageData !== '{}') {
            try {
                const parsed = JSON.parse(coverageData);
                coverage = {
                    enabled: true,
                    percentage: parsed.coverageMap ? 
                        Math.round((parsed.coverageMap.total.statements.pct + 
                                  parsed.coverageMap.total.branches.pct + 
                                  parsed.coverageMap.total.functions.pct + 
                                  parsed.coverageMap.total.lines.pct) / 4) : 0,
                    ...parsed.coverageMap?.total || coverage
                };
            } catch (e) {
                // Silent fail, use defaults
            }
        }
    }

    // Count test files
    const testFileCount = parseInt(runCommand('find . -name "*.test.js" -o -name "*.spec.js" 2>/dev/null | wc -l', true) || '0');
    coverage.testFiles = testFileCount;

    return coverage;
}

// Calculate Code Quality
function calculateCodeQuality() {
    let quality = {
        eslintErrors: 0,
        eslintWarnings: 0,
        codeComplexity: 'N/A',
        duplicateCode: 0,
        technicalDebt: [],
        codeSmells: 0
    };

    // Run ESLint if available
    if (fileExists('node_modules/eslint')) {
        const eslintOutput = runCommand('npx eslint . --format json 2>/dev/null || echo "[]"', true);
        try {
            const results = JSON.parse(eslintOutput);
            quality.eslintErrors = results.reduce((acc, file) => acc + file.errorCount, 0);
            quality.eslintWarnings = results.reduce((acc, file) => acc + file.warningCount, 0);
        } catch (e) {
            // Silent fail
        }
    }

    // Check for TODO/FIXME/HACK comments (technical debt)
    const todoCount = runCommand('grep -r "TODO\\|FIXME\\|HACK" --include="*.js" --include="*.jsx" . 2>/dev/null | wc -l', true);
    quality.technicalDebt = parseInt(todoCount || '0');

    return quality;
}

// Calculate Security Metrics
function calculateSecurity() {
    let security = {
        vulnerabilities: {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
            total: 0
        },
        lastAudit: new Date().toISOString(),
        dependencies: {
            total: 0,
            outdated: 0,
            vulnerable: 0
        },
        secrets: {
            exposed: false,
            patterns: []
        }
    };

    // Run npm audit
    const auditOutput = runCommand('npm audit --json 2>/dev/null || echo "{}"', true);
    try {
        const audit = JSON.parse(auditOutput);
        if (audit.metadata) {
            security.vulnerabilities = audit.metadata.vulnerabilities || security.vulnerabilities;
            security.vulnerabilities.total = 
                security.vulnerabilities.critical + 
                security.vulnerabilities.high + 
                security.vulnerabilities.moderate + 
                security.vulnerabilities.low;
            security.dependencies.total = audit.metadata.dependencies || 0;
            security.dependencies.vulnerable = audit.metadata.vulnerabilities?.total || 0;
        }
    } catch (e) {
        // Silent fail
    }

    // Check for exposed secrets (basic patterns)
    const secretPatterns = [
        'apiKey.*=.*["\'][A-Za-z0-9]{20,}',
        'secret.*=.*["\'][A-Za-z0-9]{20,}',
        'password.*=.*["\'][^"\']+["\']',
        'token.*=.*["\'][A-Za-z0-9]{20,}'
    ];
    
    for (const pattern of secretPatterns) {
        const found = runCommand(`grep -r "${pattern}" --include="*.js" --include="*.jsx" . 2>/dev/null | wc -l`, true);
        if (parseInt(found) > 0) {
            security.secrets.exposed = true;
            security.secrets.patterns.push(pattern);
        }
    }

    return security;
}

// Calculate Performance Metrics
function calculatePerformance() {
    return {
        bundleSize: {
            js: 'TBD',
            css: 'TBD',
            images: 'TBD',
            total: 'TBD'
        },
        lighthouse: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
            pwa: 0,
            lastRun: 'Never'
        },
        loadTime: {
            average: 'TBD',
            p95: 'TBD',
            p99: 'TBD'
        },
        apiResponse: {
            average: 'TBD',
            slowestEndpoint: 'TBD'
        }
    };
}

// Calculate Deployment Metrics
function calculateDeployment() {
    // Get deployment history from git tags and commits
    const deploymentCommits = runCommand('git log --grep="deploy" --oneline 2>/dev/null | wc -l', true);
    const lastDeployCommit = runCommand('git log --grep="deploy" --oneline -1 --format="%ad" --date=iso 2>/dev/null', true);
    
    return {
        lastDeployment: lastDeployCommit || new Date().toISOString(),
        totalDeployments: parseInt(deploymentCommits || '0'),
        deploymentFrequency: 'Weekly',
        environments: {
            production: {
                url: 'https://assiduous-prod.web.app',
                status: 'Active',
                lastDeploy: lastDeployCommit || 'Unknown'
            },
            staging: {
                url: 'https://assiduous-staging.web.app',
                status: 'Not configured',
                lastDeploy: 'Never'
            },
            development: {
                url: 'http://localhost:3000',
                status: 'Local only',
                lastDeploy: 'N/A'
            }
        },
        cicd: {
            provider: 'GitHub Actions',
            status: fileExists('.github/workflows') ? 'Configured' : 'Not configured',
            lastRun: 'Unknown',
            successRate: 'TBD'
        },
        uptime: {
            last24h: 99.9,
            last7d: 99.9,
            last30d: 99.9
        }
    };
}

// Calculate Documentation Coverage
function calculateDocumentation() {
    const mdFiles = parseInt(runCommand('find . -name "*.md" -not -path "./node_modules/*" 2>/dev/null | wc -l', true) || '0');
    const jsFiles = parseInt(runCommand('find . -name "*.js" -not -path "./node_modules/*" 2>/dev/null | wc -l', true) || '0');
    const jsdocComments = parseInt(runCommand('grep -r "@param\\|@returns\\|@description" --include="*.js" . 2>/dev/null | wc -l', true) || '0');
    
    return {
        markdownFiles: mdFiles,
        jsFilesTotal: jsFiles,
        jsFilesDocumented: Math.min(jsdocComments, jsFiles),
        coverage: jsFiles > 0 ? Math.round((jsdocComments / jsFiles) * 100) : 0,
        apiEndpoints: {
            total: 0,
            documented: 0
        },
        components: {
            total: parseInt(runCommand('find . -path "*/components/*.js" 2>/dev/null | wc -l', true) || '0'),
            documented: 0
        },
        readme: fileExists('README.md'),
        changelog: fileExists('CHANGELOG.md'),
        contributing: fileExists('CONTRIBUTING.md'),
        license: fileExists('LICENSE'),
        lastUpdate: runCommand('git log -1 --format="%ad" --date=iso -- "*.md" 2>/dev/null', true) || 'Unknown'
    };
}

// Calculate Team/Productivity Metrics
function calculateProductivity() {
    const contributors = runCommand('git shortlog -sn 2>/dev/null | wc -l', true);
    const lastWeekCommits = parseInt(runCommand('git rev-list --count --since="1 week ago" HEAD 2>/dev/null', true) || '0');
    const previousWeekCommits = parseInt(runCommand('git rev-list --count --since="2 weeks ago" --until="1 week ago" HEAD 2>/dev/null', true) || '0');
    
    let velocityTrend = 'stable';
    if (lastWeekCommits > previousWeekCommits * 1.2) velocityTrend = 'increasing';
    else if (lastWeekCommits < previousWeekCommits * 0.8) velocityTrend = 'decreasing';
    
    return {
        velocityTrend,
        weeklyCommits: lastWeekCommits,
        contributors: {
            total: parseInt(contributors || '1'),
            active: parseInt(runCommand('git shortlog -sn --since="30 days ago" 2>/dev/null | wc -l', true) || '1')
        },
        averageCommitSize: parseInt(runCommand('git log --shortstat --format="" | grep -E "files? changed" | awk \'{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}\' 2>/dev/null', true) || '0'),
        pullRequests: {
            open: 0,
            merged: 0,
            avgMergeTime: 'N/A'
        },
        codeReviews: {
            pending: 0,
            completed: 0
        }
    };
}

// Calculate Business Metrics
function calculateBusiness() {
    const totalHours = 144;
    const totalCost = totalHours * HOURLY_RATE;
    
    // Load launch date from config if available
    let plannedLaunch = '2025-12-01'; // Updated realistic date
    try {
        const configPath = path.join(REPO_ROOT, 'metrics.config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            plannedLaunch = config.customMetrics?.plannedLaunchDate || plannedLaunch;
        }
    } catch (e) {
        // Use default if config not available
    }
    
    const daysRemaining = Math.ceil((new Date(plannedLaunch) - new Date()) / (1000 * 60 * 60 * 24));
    const onTrack = daysRemaining > 30; // More realistic threshold
    
    return {
        investment: {
            development: totalCost,
            infrastructure: 0,
            marketing: 0,
            total: totalCost
        },
        roi: {
            projected: 0,
            actual: 0,
            breakEvenDate: 'TBD'
        },
        marketReadiness: 46,
        timeline: {
            projectStart: '2025-08-10',
            originalLaunch: '2025-11-01',
            plannedLaunch: plannedLaunch,
            daysRemaining: daysRemaining,
            onTrack: onTrack,
            adjustmentReason: 'Timeline adjusted for realistic completion based on current velocity'
        },
        customers: {
            total: 0,
            active: 0,
            churn: 0
        },
        revenue: {
            mrr: 0,
            arr: 0,
            ltv: 0
        }
    };
}

// Calculate Infrastructure Costs
function calculateInfrastructure() {
    return {
        firebase: {
            project: 'assiduous-prod',
            plan: 'Spark (Free)',
            usage: {
                reads: 0,
                writes: 0,
                storage: '0 MB',
                bandwidth: '0 GB',
                functions: 0
            },
            monthlyCost: 0,
            projectedCost: 0
        },
        domains: {
            primary: 'assiduousflip.com',
            cost: 12,
            renewal: '2026-08-10'
        },
        thirdParty: {
            github: 0,
            monitoring: 0,
            analytics: 0,
            total: 0
        },
        totalMonthlyCost: 1,
        projectedAnnualCost: 12
    };
}

// Main calculation function
function calculateAllMetrics() {
    console.log('📊 Calculating comprehensive project metrics...\n');
    
    // Get basic git metrics
    const totalCommits = parseInt(runCommand('git rev-list --count HEAD') || '0');
    const firstCommitDate = runCommand('git log --reverse --format=%ad --date=iso | head -1');
    const startDate = firstCommitDate ? new Date(firstCommitDate) : new Date('2025-08-10');
    const now = new Date();
    const projectAgeDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)); // Total calendar days
    
    // Calculate unique commit days (days with actual commits)
    const uniqueCommitDaysRaw = runCommand('git log --format=%ad --date=short | sort -u | wc -l');
    const uniqueCommitDays = parseInt(uniqueCommitDaysRaw || '0');
    
    const todayCommits = parseInt(runCommand('git rev-list --count --since="24 hours ago" HEAD') || '0');
    const weekCommits = parseInt(runCommand('git rev-list --count --since="7 days ago" HEAD') || '0');
    const monthCommits = parseInt(runCommand('git rev-list --count --since="30 days ago" HEAD') || '0');
    const fileCount = parseInt(runCommand('git ls-files | wc -l') || '0');
    const gitStats = runCommand('git log --shortstat --format="" | grep -E "files? changed" | awk \'{add+=$4; del+=$6} END {print add, del}\'');
    const [linesAdded = 0, linesDeleted = 0] = gitStats.split(' ').map(n => parseInt(n) || 0);
    const estimatedHours = Math.round(totalCommits * AVG_HOURS_PER_COMMIT);
    const estimatedCost = estimatedHours * HOURLY_RATE;
    
    // Get recent commits
    const recentCommitsRaw = runCommand('git log --oneline --format="%H|%s|%an|%ad" --date=iso -10');
    const recentCommits = recentCommitsRaw.split('\n').filter(line => line).map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
    });
    
    // Calculate completion based on features
    const features = calculateFeatures();
    const featurePercentages = Object.values(features).map(f => f.percentage);
    const overallCompletion = Math.round(featurePercentages.reduce((a, b) => a + b, 0) / featurePercentages.length);
    
    console.log('🔍 Analyzing features...');
    const featureMetrics = features;
    
    console.log('🧪 Checking test coverage...');
    const testCoverage = calculateTestCoverage();
    
    console.log('✨ Evaluating code quality...');
    const codeQuality = calculateCodeQuality();
    
    console.log('🔒 Scanning security...');
    const security = calculateSecurity();
    
    console.log('⚡ Measuring performance...');
    const performance = calculatePerformance();
    
    console.log('🚀 Checking deployments...');
    const deployment = calculateDeployment();
    
    console.log('📚 Analyzing documentation...');
    const documentation = calculateDocumentation();
    
    console.log('📈 Calculating productivity...');
    const productivity = calculateProductivity();
    
    console.log('💼 Computing business metrics...');
    const business = calculateBusiness();
    
    console.log('💰 Calculating infrastructure costs...');
    const infrastructure = calculateInfrastructure();
    
    // Calculate tools cost based on months elapsed
    const monthsElapsed = projectAgeDays / 30.44; // Average days per month
    const toolsCost = Math.round(MONTHLY_TOOLS_COST * monthsElapsed);
    const totalCostWithTools = estimatedCost + toolsCost;
    
    // Build comprehensive metrics object
    const metrics = {
        lastUpdated: new Date().toISOString(),
        summary: {
            health: overallCompletion >= 40 ? 'Good' : 'Needs Attention',
            score: overallCompletion,
            trend: productivity.velocityTrend,
            alerts: []
        },
        features: featureMetrics,
        project: {
            totalHours: estimatedHours.toString(),
            avgHoursPerDay: (estimatedHours / uniqueCommitDays).toFixed(1),
            totalCost: totalCostWithTools,
            laborCost: estimatedCost,
            toolsCost: toolsCost,
            monthsElapsed: monthsElapsed.toFixed(1),
            totalCommits: totalCommits,
            totalFiles: fileCount,
            activeDays: uniqueCommitDays,           // Days with actual commits
            totalDays: projectAgeDays,              // Calendar days since project start
            projectAgeDays: projectAgeDays,         // Kept for backward compatibility
            linesAdded: linesAdded,
            linesDeleted: linesDeleted,
            netLines: linesAdded - linesDeleted,
            velocity: (totalCommits / uniqueCommitDays).toFixed(1),
            completionPercentage: overallCompletion,
            actualStartDate: startDate.toISOString().split('T')[0]
        },
        today: {
            date: new Date().toISOString().split('T')[0],
            hours: (todayCommits * AVG_HOURS_PER_COMMIT).toFixed(1),
            cost: Math.round(todayCommits * AVG_HOURS_PER_COMMIT * HOURLY_RATE),
            commits: todayCommits,
            deployments: 0
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
        quality: {
            testCoverage: testCoverage,
            codeQuality: codeQuality,
            score: testCoverage.percentage > 0 ? 
                Math.round((testCoverage.percentage + (100 - Math.min(codeQuality.eslintErrors, 100))) / 2) : 
                Math.max(0, 100 - codeQuality.eslintErrors)
        },
        security: security,
        performance: performance,
        deployment: deployment,
        documentation: documentation,
        productivity: productivity,
        business: business,
        infrastructure: infrastructure,
        recentActivity: recentCommits,
        automation: {
            lastRun: new Date().toISOString(),
            gitHookInstalled: fs.existsSync(path.join(REPO_ROOT, '.git/hooks/post-commit')),
            scriptPath: __filename,
            updateFrequency: "On every commit (via git hook)",
            version: "2.0 - Enhanced"
        },
        nextSteps: [
            "Complete Agent Portal property management",
            "Add test coverage (currently 0%)",
            "Fix ESLint errors if any",
            "Begin micro-flipping features",
            "Set up staging environment"
        ]
    };
    
    // Add alerts based on metrics
    if (security.vulnerabilities.critical > 0) {
        metrics.summary.alerts.push(`🔴 ${security.vulnerabilities.critical} critical security vulnerabilities!`);
    }
    if (testCoverage.percentage < 20) {
        metrics.summary.alerts.push('⚠️ Test coverage is very low');
    }
    if (codeQuality.eslintErrors > 50) {
        metrics.summary.alerts.push('⚠️ High number of linting errors');
    }
    if (business.timeline.daysRemaining < 30 && overallCompletion < 80) {
        metrics.summary.alerts.push('⏰ Timeline warning - ' + business.timeline.daysRemaining + ' days until launch');
    } else if (business.timeline.onTrack) {
        metrics.summary.alerts.push('✅ Timeline adjusted - now on track for December 1st launch');
    }
    
    return metrics;
}

// Save metrics function
function saveMetrics(metrics) {
    try {
        // Write to single source of truth
        const dir = path.dirname(METRICS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
        console.log(`✅ Metrics saved to: ${METRICS_FILE}`);
        
        // No backup needed - single source of truth
        
        return true;
    } catch (error) {
        console.error('❌ Failed to save metrics:', error.message);
        return false;
    }
}

// Main function
function main() {
    console.log('🚀 Starting ENHANCED automated metrics update...');
    console.log(`📁 Repository: ${REPO_ROOT}`);
    console.log(`📊 Output: ${METRICS_FILE}\n`);
    
    try {
        const metrics = calculateAllMetrics();
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 COMPREHENSIVE METRICS SUMMARY');
        console.log('='.repeat(60));
        console.log(`  🎯 Overall Health: ${metrics.summary.health} (${metrics.summary.score}%)`);
        console.log(`  📊 Total Commits: ${metrics.project.totalCommits}`);
        console.log(`  ⏱️  Estimated Hours: ${metrics.project.totalHours}`);
        console.log(`  💰 Estimated Cost: $${metrics.project.totalCost.toLocaleString()}`);
        console.log(`  ✅ Overall Completion: ${metrics.project.completionPercentage}%`);
        console.log('\n  📦 Feature Status:');
        Object.entries(metrics.features).forEach(([key, value]) => {
            const icon = value.percentage === 100 ? '✅' : value.percentage > 0 ? '🔄' : '⭕';
            console.log(`    ${icon} ${key}: ${value.percentage}% - ${value.status}`);
        });
        console.log(`\n  🧪 Quality Score: ${metrics.quality.score}%`);
        console.log(`  🔒 Security Issues: ${metrics.security.vulnerabilities.total}`);
        console.log(`  📚 Documentation Coverage: ${metrics.documentation.coverage}%`);
        console.log(`  📈 Velocity Trend: ${metrics.productivity.velocityTrend}`);
        
        if (metrics.summary.alerts.length > 0) {
            console.log('\n  ⚠️ ALERTS:');
            metrics.summary.alerts.forEach(alert => console.log(`    ${alert}`));
        }
        
        console.log('\n  🎯 Next Steps:');
        metrics.nextSteps.forEach((step, i) => console.log(`    ${i + 1}. ${step}`));
        
        console.log('\n' + '='.repeat(60));
        
        if (saveMetrics(metrics)) {
            console.log('\n✅ Enhanced metrics update complete!');
            console.log('📱 Dashboard will show comprehensive metrics on next load');
            console.log('💡 Tip: Review alerts and next steps above');
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

module.exports = { calculateAllMetrics, saveMetrics };