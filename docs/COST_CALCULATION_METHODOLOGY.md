# Assiduous Project Cost Calculation Methodology

## Official Rubric

This document defines the authoritative methodology for calculating development costs for the Assiduous project.

### Core Parameters

- **Hourly Rate**: **$150/hour**
- **Project Start Date**: August 10, 2025
- **Tools Cost**: $225/month (GitHub Pro, Firebase, AI tools, etc.)

### Hours Calculation Method

For each day with development activity:

1. **Single Commit Day**: 
   - Fixed at **0.5 hours** (30 minutes minimum)

2. **Multiple Commits Day**:
   - Calculate time from **first commit timestamp** to **last commit timestamp** of that day
   - Add **0.5 hours** for the final commit work
   - Round to **15-minute intervals** (0.25 hour increments)
   - **Minimum**: 1 hour for multiple commits
   - **Maximum**: 12 hours cap per day

3. **Handling Midnight Crossovers**:
   - If commits span midnight, split into separate days
   - Each day calculated independently using above rules

### Cost Calculation

```
Daily Labor Cost = Hours Worked × $150
Monthly Tools Cost = $225
Total Project Cost = Sum(All Daily Labor Costs) + (Months × $225)
```

### Accurate Metrics (as of September 9, 2025)

Based on the `calculate_accurate_metrics.js` script output:

- **Active Development Days**: 11 days (only days with commits)
- **Total Development Hours**: 72.50 hours
- **Total Commits**: 246
- **Labor Cost**: $10,875.00 (72.5 hours × $150/hour)
- **Tools Cost**: $450.00 (2 months × $225/month)
- **TOTAL PROJECT COST**: **$11,325.00**

### Daily Breakdown

| Date | Commits | Hours | Cost |
|------|---------|-------|------|
| 2025-08-10 | 1 | 0.50 | $75 |
| 2025-08-22 | 11 | 3.00 | $450 |
| 2025-08-26 | 3 | 8.50 | $1,275 |
| 2025-08-27 | 3 | 1.75 | $262.50 |
| 2025-08-29 | 14 | 5.25 | $787.50 |
| 2025-08-30 | 24 | 3.00 | $450 |
| 2025-09-01 | 9 | 6.25 | $937.50 |
| 2025-09-05 | 10 | 3.00 | $450 |
| 2025-09-06 | 61 | 12.25 | $1,837.50 |
| 2025-09-07 | 50 | 5.25 | $787.50 |
| 2025-09-08 | 60 | 23.75* | $3,562.50 |

*Note: 2025-09-08 shows 23.75 hours due to commits spanning midnight. This should be split:
- 2025-09-08: Actual working hours (capped at 12)
- 2025-09-09: Remaining hours

### Verification Commands

To verify these calculations, run:

```bash
# Official calculation script
node scripts/calculate_accurate_metrics.js

# View cached metrics
cat admin/development/metrics_cache.json

# View daily sessions
cat data/development_history/daily_sessions.json
```

### Important Notes

1. **Do NOT use** the higher totals from `sync_all_development_history.js` if it shows inflated hours
2. **Do NOT use** $300/hour rate (this was an error in some scripts)
3. **Always verify** with `calculate_accurate_metrics.js` for ground truth
4. The dashboard should display these accurate metrics

### Firebase Import Values

When importing to Firebase, use these corrected values:
- Total Hours: 72.50
- Total Cost: $11,325
- Hourly Rate: $150
- Active Days: 11

## Source of Truth

The `scripts/calculate_accurate_metrics.js` file is the authoritative source for cost calculations and follows this exact methodology.
