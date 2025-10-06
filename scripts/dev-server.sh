#!/bin/bash

# Development Server Manager
# Runs local servers for dev, test, and staging environments in the background

PROJECT_ROOT="/Users/thekryptodragon/Development/assiduous"
LOG_DIR="$PROJECT_ROOT/logs"
PID_DIR="$PROJECT_ROOT/.server-pids"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Port assignments
DEV_PORT=8081
TEST_PORT=8082
STAGING_PORT=8083

# Function to start a server
start_server() {
    local env=$1
    local port=$2
    local dir="$PROJECT_ROOT/environments/$env"
    local pid_file="$PID_DIR/${env}.pid"
    local log_file="$LOG_DIR/${env}.log"
    
    # Check if already running
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "✓ $env server already running on port $port (PID: $pid)"
            return 0
        fi
    fi
    
    # Start server in background
    cd "$dir"
    python3 -m http.server $port > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    
    echo "✓ Started $env server on port $port (PID: $pid)"
    echo "  URL: http://localhost:$port"
    echo "  Log: $log_file"
}

# Function to stop a server
stop_server() {
    local env=$1
    local pid_file="$PID_DIR/${env}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            echo "✓ Stopped $env server (PID: $pid)"
        fi
        rm "$pid_file"
    else
        echo "✗ $env server not running"
    fi
}

# Function to stop all servers
stop_all() {
    echo "Stopping all development servers..."
    stop_server "dev"
    stop_server "test"
    stop_server "staging"
}

# Function to show status
status() {
    echo "Development Server Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    for env in dev test staging; do
        local pid_file="$PID_DIR/${env}.pid"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p $pid > /dev/null 2>&1; then
                case $env in
                    dev) port=$DEV_PORT ;;
                    test) port=$TEST_PORT ;;
                    staging) port=$STAGING_PORT ;;
                esac
                echo "✓ $env: RUNNING on port $port (PID: $pid)"
                echo "   http://localhost:$port"
            else
                echo "✗ $env: STOPPED (stale PID)"
                rm "$pid_file"
            fi
        else
            echo "✗ $env: STOPPED"
        fi
    done
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main command handler
case "${1:-start}" in
    start)
        echo "Starting development servers..."
        start_server "dev" $DEV_PORT
        start_server "test" $TEST_PORT
        start_server "staging" $STAGING_PORT
        echo ""
        status
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 1
        start_server "dev" $DEV_PORT
        start_server "test" $TEST_PORT
        start_server "staging" $STAGING_PORT
        echo ""
        status
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
