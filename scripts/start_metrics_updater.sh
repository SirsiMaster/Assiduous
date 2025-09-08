#!/bin/bash

# Start the Assiduous Metrics Auto-Updater in the background
# This runs the updater continuously with updates every 5 minutes

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
UPDATER_SCRIPT="$SCRIPT_DIR/metrics_auto_updater.js"
LOG_FILE="/tmp/assiduous-metrics-updater.log"
PID_FILE="/tmp/assiduous-metrics-updater.pid"

# Function to check if updater is already running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Check if already running
if is_running; then
    echo "⚠️  Metrics updater is already running (PID: $(cat $PID_FILE))"
    echo "   To stop it, run: ./stop_metrics_updater.sh"
    exit 0
fi

echo "🚀 Starting Assiduous Metrics Auto-Updater..."
echo "   Updates every 5 minutes"
echo "   Log file: $LOG_FILE"

# Start the updater in background
nohup node "$UPDATER_SCRIPT" > "$LOG_FILE" 2>&1 &
PID=$!

# Save PID for stopping later
echo $PID > "$PID_FILE"

echo "✅ Updater started with PID: $PID"
echo ""
echo "Commands:"
echo "  View logs:    tail -f $LOG_FILE"
echo "  Check status: ps -p $PID"
echo "  Stop updater: ./stop_metrics_updater.sh"
echo ""
echo "The updater will continue running even after you close this terminal."
