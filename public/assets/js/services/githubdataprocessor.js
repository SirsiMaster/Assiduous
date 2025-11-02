/**
 * GitHub Data Processor Service
 *
 * Extracts development metrics from GitHub repository data
 * Can be used for both real-time webhook processing and batch analysis
 */

class githubdataprocessor {
  constructor() {
    this.githubToken = null;
    this.repositoryOwner = 'SirsiMaster';
    this.repositoryName = 'Assiduous';
    this.hourlyRate = 300;
  }

  /**
   * Initialize with GitHub token (optional for public repos)
   */
  initialize(githubToken = null) {
    this.githubToken = githubToken;
    console.log('githubdataprocessor initialized');
  }

  /**
   * Extract session metadata from commit message
   */
  extractSessionMetadata(commitMessage) {
    const sessionMatch = commitMessage.match(/\[session:(\d+\.?\d*)\]/);
    const costMatch = commitMessage.match(/\[cost:\$?(\d+\.?\d*)\]/);
    const typeMatch = commitMessage.match(
      /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([^)]+\))?:/
    );

    return {
      sessionHours: sessionMatch ? parseFloat(sessionMatch[1]) : null,
      explicitCost: costMatch ? parseFloat(costMatch[1]) : null,
      type: typeMatch ? typeMatch[1] : 'unknown',
      scope: typeMatch && typeMatch[2] ? typeMatch[2].slice(1, -1) : null,
    };
  }

  /**
   * Estimate development session from commit patterns
   */
  estimateSessionFromCommits(commits) {
    if (!commits || commits.length === 0) return { hours: 0, cost: 0 };

    // Sort commits by timestamp
    const sortedCommits = commits.sort(
      (a, b) =>
        new Date(a.timestamp || a.commit?.committer?.date) -
        new Date(b.timestamp || b.commit?.committer?.date)
    );

    let totalHours = 0;
    let totalCost = 0;
    let explicitSessionData = false;

    // Process each commit
    for (let i = 0; i < sortedCommits.length; i++) {
      const commit = sortedCommits[i];
      const message = commit.message || commit.commit?.message || '';
      const metadata = this.extractSessionMetadata(message);

      if (metadata.sessionHours && metadata.explicitCost) {
        // Use explicit session data
        totalHours += metadata.sessionHours;
        totalCost += metadata.explicitCost;
        explicitSessionData = true;
      } else if (metadata.sessionHours) {
        // Use explicit hours, calculate cost
        totalHours += metadata.sessionHours;
        totalCost += metadata.sessionHours * this.hourlyRate;
        explicitSessionData = true;
      }
    }

    // If no explicit session data, estimate from commit patterns
    if (!explicitSessionData) {
      // Estimate based on commit frequency and types
      const timeSpan = this.calculateTimeSpan(sortedCommits);
      const estimatedHours = this.estimateHoursFromPattern(sortedCommits, timeSpan);

      totalHours = estimatedHours;
      totalCost = estimatedHours * this.hourlyRate;
    }

    return {
      hours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      cost: Math.round(totalCost),
      estimatedFromPattern: !explicitSessionData,
    };
  }

  /**
   * Calculate time span between first and last commit
   */
  calculateTimeSpan(commits) {
    if (commits.length <= 1) return { hours: 0.5, days: 0 };

    const first = new Date(commits[0].timestamp || commits[0].commit?.committer?.date);
    const last = new Date(
      commits[commits.length - 1].timestamp || commits[commits.length - 1].commit?.committer?.date
    );

    const diffMs = last - first;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return { hours: diffHours, days: diffDays };
  }

  /**
   * Estimate hours from commit patterns
   */
  estimateHoursFromPattern(commits, timeSpan) {
    const commitCount = commits.length;

    // Analyze commit types
    const featureCommits = commits.filter(c =>
      (c.message || c.commit?.message || '').startsWith('feat')
    ).length;

    const fixCommits = commits.filter(c =>
      (c.message || c.commit?.message || '').startsWith('fix')
    ).length;

    const docsCommits = commits.filter(c =>
      (c.message || c.commit?.message || '').startsWith('docs')
    ).length;

    // Base estimation on commit types and frequency
    let estimatedHours = 0;

    // Feature commits: 1-3 hours each
    estimatedHours += featureCommits * 2;

    // Fix commits: 0.5-2 hours each
    estimatedHours += fixCommits * 1;

    // Documentation: 0.25-1 hour each
    estimatedHours += docsCommits * 0.5;

    // Other commits: 0.5 hours each
    const otherCommits = commitCount - featureCommits - fixCommits - docsCommits;
    estimatedHours += otherCommits * 0.5;

    // Adjust based on time span
    if (timeSpan.hours < 1) {
      // Very quick session
      estimatedHours = Math.min(estimatedHours, 1);
    } else if (timeSpan.hours > 8) {
      // Multi-day session, cap daily hours
      const days = Math.ceil(timeSpan.days);
      estimatedHours = Math.min(estimatedHours, days * 8);
    }

    // Minimum 0.1 hours, maximum 8 hours per day
    return Math.max(0.1, Math.min(estimatedHours, timeSpan.days * 8 + 8));
  }

  /**
   * Analyze commits for file change patterns
   */
  analyzeFileChanges(commits) {
    let totalFiles = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;

    commits.forEach(commit => {
      // From webhook data
      if (commit.added && commit.removed && commit.modified) {
        totalFiles += commit.added.length + commit.removed.length + commit.modified.length;
      }

      // From GitHub API data
      if (commit.stats) {
        totalAdditions += commit.stats.additions || 0;
        totalDeletions += commit.stats.deletions || 0;
      }
    });

    return {
      filesChanged: totalFiles,
      linesAdded: totalAdditions,
      linesDeleted: totalDeletions,
      netLines: totalAdditions - totalDeletions,
    };
  }

  /**
   * Process commits into development sessions
   */
  processCommitsIntoSessions(commits, date) {
    if (!commits || commits.length === 0) {
      return null;
    }

    const sessionEstimate = this.estimateSessionFromCommits(commits);
    const fileChanges = this.analyzeFileChanges(commits);

    // Extract commit details
    const commitDetails = commits.map(commit => ({
      id: commit.id || commit.sha,
      message: commit.message || commit.commit?.message || '',
      author: commit.author?.name || commit.commit?.author?.name || 'Unknown',
      timestamp: commit.timestamp || commit.commit?.committer?.date,
      url: commit.url || commit.html_url,
      ...this.extractSessionMetadata(commit.message || commit.commit?.message || ''),
    }));

    // Calculate velocity metrics
    const velocity = {
      commitsPerHour: sessionEstimate.hours > 0 ? commits.length / sessionEstimate.hours : 0,
      costPerCommit: commits.length > 0 ? sessionEstimate.cost / commits.length : 0,
      hoursPerDay: sessionEstimate.hours,
      efficiency: Math.min((commits.length / Math.max(sessionEstimate.hours, 1)) * 10, 100),
    };

    return {
      sessionId: `${date}_${commits.length}_${sessionEstimate.hours}`,
      date: date,
      duration: sessionEstimate.hours,
      costTracking: {
        totalCost: sessionEstimate.cost,
        hourlyRate: this.hourlyRate,
        estimatedFromPattern: sessionEstimate.estimatedFromPattern,
      },
      metrics: {
        commitsCreated: commits.length,
        filesModified: fileChanges.filesChanged,
        linesAdded: fileChanges.linesAdded,
        linesDeleted: fileChanges.linesDeleted,
        netLinesChanged: fileChanges.netLines,
      },
      velocity: velocity,
      commits: commitDetails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch commits from GitHub API (for batch processing)
   */
  async fetchCommitsFromGitHub(since = null, until = null) {
    try {
      const url = `https://api.github.com/repos/${this.repositoryOwner}/${this.repositoryName}/commits`;
      const params = new URLSearchParams();

      if (since) params.append('since', since);
      if (until) params.append('until', until);

      const headers = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }

      const response = await fetch(`${url}?${params}`, { headers });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const commits = await response.json();
      console.log(`Fetched ${commits.length} commits from GitHub`);

      return commits;
    } catch (error) {
      console.error('Error fetching commits from GitHub:', error);
      throw error;
    }
  }

  /**
   * Group commits by date
   */
  groupCommitsByDate(commits) {
    const grouped = {};

    commits.forEach(commit => {
      const timestamp = commit.timestamp || commit.commit?.committer?.date;
      const date = new Date(timestamp).toISOString().split('T')[0];

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(commit);
    });

    return grouped;
  }

  /**
   * Process GitHub repository data into Firebase-ready format
   */
  async processRepositoryData(daysBack = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      const commits = await this.fetchCommitsFromGitHub(since.toISOString());
      const groupedCommits = this.groupCommitsByDate(commits);

      const sessions = [];
      const dailyMetrics = {};

      // Process each day's commits
      for (const [date, dayCommits] of Object.entries(groupedCommits)) {
        const session = this.processCommitsIntoSessions(dayCommits, date);

        if (session) {
          sessions.push(session);

          // Create daily metrics
          dailyMetrics[date] = {
            date,
            hours: session.duration,
            cost: session.costTracking.totalCost,
            commits: session.metrics.commitsCreated,
            deployments: 0, // Will be updated separately
            filesModified: session.metrics.filesModified,
            velocity: session.velocity,
            type: 'daily',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }

      return {
        sessions,
        dailyMetrics,
        totalDays: Object.keys(groupedCommits).length,
        totalCommits: commits.length,
      };
    } catch (error) {
      console.error('Error processing repository data:', error);
      throw error;
    }
  }
}

// Export for use in Node.js and browsers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = githubdataprocessor;
} else if (typeof window !== 'undefined') {
  window.githubdataprocessor = githubdataprocessor;
}
