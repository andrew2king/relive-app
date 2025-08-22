#!/bin/bash

# RELIVE 本地开发环境停止脚本

echo "🛑 Stopping RELIVE Local Development Environment..."

# 停止服务函数
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "🛑 Stopping $service_name (PID: $pid)..."
            kill $pid
            sleep 2
            
            # 强制杀死如果还在运行
            if ps -p $pid > /dev/null 2>&1; then
                echo "   Force killing $service_name..."
                kill -9 $pid
            fi
            
            rm -f "$pid_file"
            echo "✅ $service_name stopped"
        else
            echo "ℹ️  $service_name was not running"
            rm -f "$pid_file"
        fi
    else
        echo "ℹ️  No PID file found for $service_name"
    fi
}

# 停止已知的服务
stop_service "frontend"
stop_service "backend"
stop_service "ai-service"

# 查找并停止可能的Node.js进程
echo "🔍 Checking for remaining Node.js processes on development ports..."

# 查找端口3000上的进程
if lsof -Pi :3000 -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "🛑 Stopping process on port 3000..."
    lsof -Pi :3000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

# 查找端口8000上的进程
if lsof -Pi :8000 -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "🛑 Stopping process on port 8000..."
    lsof -Pi :8000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

# 查找端口8001上的进程
if lsof -Pi :8001 -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "🛑 Stopping process on port 8001..."
    lsof -Pi :8001 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

# 清理临时文件
echo "🧹 Cleaning up temporary files..."
rm -f logs/*.pid 2>/dev/null || true

echo ""
echo "✅ RELIVE Local Development Environment stopped successfully!"
echo ""
echo "📋 Clean up completed:"
echo "   🛑 All services stopped"
echo "   🧹 PID files removed"
echo "   🔓 Development ports freed"
echo ""
echo "💡 To start again, run: ./scripts/start-local.sh"