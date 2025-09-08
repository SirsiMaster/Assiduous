#!/bin/bash

# Stop the Assiduous Metrics Auto-Updater

PID_FILE="/tmp/assiduous-metrics-updater.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  Metrics updater is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null 2>&1; then
    echo "🛑 Stopping metrics updater (PID: $PID)..."
    kill $PID
    rm "$PID_FILE"
    echo "✅ Updater stopped"
else
    echo "⚠️  Process $PID not found (updater may have already stopped)"
    rm "$PID_FILE"
fi
