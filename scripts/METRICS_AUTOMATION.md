# 🤖 Automatic Metrics Updates for Assiduous

The development metrics for the Assiduous project update automatically using multiple methods. You never need to manually run the metrics calculator.

## ✅ Currently Active Automation

### 1. **macOS LaunchAgent Service** (INSTALLED & RUNNING)
- Updates every 5 minutes automatically
- Runs in the background as a system service
- Survives system restarts

**Status Check:**
```bash
./scripts/install_metrics_service.sh status
```

**Logs:**
```bash
tail -f /tmp/assiduous-metrics.log
```

### 2. **Git Post-Commit Hook** (ACTIVE)
- Updates metrics after every commit
- Runs automatically in the background
- No configuration needed

Location: `.git/hooks/post-commit`

### 3. **Dashboard Auto-Update**
- Dashboard attempts to trigger updates when loaded
- Refreshes data every 30 seconds
- Updates metrics every 5 minutes while dashboard is open

## 🚀 Additional Automation Options

### Option A: Continuous Updater Script
Run a Node.js process that updates metrics continuously:

**Start:**
```bash
./scripts/start_metrics_updater.sh
```

**Stop:**
```bash
./scripts/stop_metrics_updater.sh
```

**View Logs:**
```bash
tail -f /tmp/assiduous-metrics-updater.log
```

### Option B: Direct Background Process
Run the updater directly (stays active in current terminal):

```bash
node scripts/metrics_auto_updater.js
```

Press `Ctrl+C` to stop.

## 📊 Viewing Metrics

The metrics are automatically available at:
- **Dashboard:** http://localhost:8080/admin/development/dashboard.html
- **Cache File:** `admin/development/metrics_cache.json`
- **Daily Sessions:** `data/development_history/daily_sessions.json`

## 🔧 Managing the Service

### Check Service Status
```bash
./scripts/install_metrics_service.sh status
```

### Reinstall Service (if needed)
```bash
./scripts/install_metrics_service.sh uninstall
./scripts/install_metrics_service.sh install
```

### Manual Update (rarely needed)
```bash
node scripts/calculate_accurate_metrics.js
```

## 📝 Metrics Configuration

- **Update Frequency:** Every 5 minutes
- **Development Rate:** $150/hour
- **Tool Cost:** $225/month
- **Project Start:** August 10, 2025
- **Time Calculation:** First to last commit each day

## 🐛 Troubleshooting

### Service Not Running
```bash
# Check status
launchctl list | grep assiduous

# Restart service
launchctl stop com.assiduous.metrics
launchctl start com.assiduous.metrics
```

### Permissions Issues
```bash
# Fix script permissions
chmod +x scripts/*.js scripts/*.sh
```

### View Error Logs
```bash
# Service errors
cat /tmp/assiduous-metrics-error.log

# Git hook output
git config --global alias.last 'log -1 HEAD'
git last
```

## 📌 Important Notes

1. **No Manual Updates Needed** - The system handles everything automatically
2. **Multiple Redundancy** - If one method fails, others continue working
3. **Real-time Data** - Metrics update within 5 minutes of any changes
4. **Background Operation** - All updates run without blocking your work

## 🎯 Quick Status Check

Run this command to verify everything is working:
```bash
echo "=== METRICS AUTOMATION STATUS ===" && \
echo "" && \
./scripts/install_metrics_service.sh status && \
echo "" && \
echo "Last update:" && \
stat -f "%Sm" admin/development/metrics_cache.json
```

---

**Remember:** You never need to manually run the metrics calculator. The automation handles everything!
