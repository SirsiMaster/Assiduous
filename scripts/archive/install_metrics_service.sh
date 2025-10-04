#!/bin/bash

# Installation script for Assiduous Metrics Auto-Update Service
# Run with: ./install_metrics_service.sh [install|uninstall|status]

SERVICE_NAME="com.assiduous.metrics"
PLIST_FILE="$SERVICE_NAME.plist"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOURCE_PLIST="$SCRIPT_DIR/$PLIST_FILE"
TARGET_PLIST="$HOME/Library/LaunchAgents/$PLIST_FILE"

function install_service() {
    echo "📦 Installing Assiduous Metrics Service..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Get actual node path
    NODE_PATH=$(which node)
    echo "   Found Node.js at: $NODE_PATH"
    
    # Create LaunchAgents directory if it doesn't exist
    mkdir -p "$HOME/Library/LaunchAgents"
    
    # Update the plist file with correct node path
    sed "s|/usr/local/bin/node|$NODE_PATH|g" "$SOURCE_PLIST" > "$TARGET_PLIST"
    
    # Load the service
    launchctl load "$TARGET_PLIST" 2>/dev/null
    
    # Start the service immediately
    launchctl start "$SERVICE_NAME"
    
    echo "✅ Service installed and started!"
    echo "   Metrics will update every 5 minutes"
    echo "   Logs: /tmp/assiduous-metrics.log"
    echo ""
    echo "To check status: ./install_metrics_service.sh status"
    echo "To uninstall: ./install_metrics_service.sh uninstall"
}

function uninstall_service() {
    echo "🗑️  Uninstalling Assiduous Metrics Service..."
    
    # Stop and unload the service
    launchctl stop "$SERVICE_NAME" 2>/dev/null
    launchctl unload "$TARGET_PLIST" 2>/dev/null
    
    # Remove the plist file
    rm -f "$TARGET_PLIST"
    
    echo "✅ Service uninstalled!"
}

function check_status() {
    echo "📊 Assiduous Metrics Service Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -f "$TARGET_PLIST" ]; then
        echo "✅ Service is installed"
        
        # Check if service is running
        if launchctl list | grep -q "$SERVICE_NAME"; then
            echo "✅ Service is loaded"
            
            # Get last run time from log
            if [ -f "/tmp/assiduous-metrics.log" ]; then
                echo ""
                echo "📝 Recent activity:"
                tail -n 5 /tmp/assiduous-metrics.log | sed 's/^/   /'
            fi
        else
            echo "⚠️  Service is not loaded"
            echo "   Run: launchctl load $TARGET_PLIST"
        fi
    else
        echo "❌ Service is not installed"
        echo "   Run: ./install_metrics_service.sh install"
    fi
    
    echo ""
    echo "📁 Cache file:"
    if [ -f "$SCRIPT_DIR/../admin/development/metrics_cache.json" ]; then
        CACHE_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$SCRIPT_DIR/../admin/development/metrics_cache.json")
        echo "   Last updated: $CACHE_TIME"
    else
        echo "   Not found"
    fi
}

# Main script
case "${1:-status}" in
    install)
        install_service
        ;;
    uninstall)
        uninstall_service
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 [install|uninstall|status]"
        echo ""
        echo "Commands:"
        echo "  install   - Install and start the metrics service"
        echo "  uninstall - Stop and remove the metrics service"
        echo "  status    - Check service status (default)"
        exit 1
        ;;
esac
