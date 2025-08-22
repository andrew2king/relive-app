#!/bin/bash

# RELIVE 开发环境启动脚本

echo "🚀 Starting RELIVE Development Environment..."

# 检查必要的环境变量
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before proceeding."
    exit 1
fi

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# 检查端口是否被占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t > /dev/null; then
        echo "⚠️  Port $port is already in use. Please stop the service using this port and try again."
        echo "   This port is needed for: $service"
        return 1
    fi
    return 0
}

echo "🔍 Checking required ports..."
check_port 3000 "Frontend (Next.js)" || exit 1
check_port 8000 "Backend API" || exit 1
check_port 8001 "AI Service" || exit 1
check_port 5432 "PostgreSQL Database" || exit 1
check_port 6379 "Redis Cache" || exit 1

# 创建必要的目录
echo "📁 Creating required directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p ssl

# 安装依赖
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "ai-service/node_modules" ]; then
    echo "Installing AI service dependencies..."
    cd ai-service && npm install && cd ..
fi

# 构建Docker镜像
echo "🐳 Building Docker images..."
docker-compose build

# 启动数据库服务
echo "🗄️  Starting database services..."
docker-compose up -d postgres redis

# 等待数据库启动
echo "⏳ Waiting for database to be ready..."
sleep 10

# 运行数据库迁移
echo "🔄 Running database migrations..."
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..

# 启动所有服务
echo "🌟 Starting all services..."
docker-compose up -d

# 等待服务启动
echo "⏳ Waiting for services to start..."
sleep 15

# 检查服务状态
echo "🔍 Checking service status..."

check_service() {
    local url=$1
    local name=$2
    if curl -s -f "$url" > /dev/null; then
        echo "✅ $name is running"
    else
        echo "❌ $name is not responding"
    fi
}

check_service "http://localhost:3000" "Frontend"
check_service "http://localhost:8000/health" "Backend API"
check_service "http://localhost:8001/health" "AI Service"

# 显示访问信息
echo ""
echo "🎉 RELIVE Development Environment is ready!"
echo ""
echo "📱 Frontend:           http://localhost:3000"
echo "🔧 Backend API:        http://localhost:8000"
echo "🤖 AI Service:         http://localhost:8001"
echo "📊 API Documentation:  http://localhost:8000/api-docs"
echo "🗄️  Database Admin:     http://localhost:5432 (PostgreSQL)"
echo "💾 Redis:              http://localhost:6379"
echo "📈 Monitoring:         http://localhost:3001 (Grafana)"
echo ""
echo "📋 Useful commands:"
echo "   npm run dev          - Start development servers"
echo "   npm run build        - Build all services"
echo "   npm run test         - Run tests"
echo "   docker-compose logs  - View logs"
echo "   docker-compose down  - Stop all services"
echo ""
echo "📝 Don't forget to:"
echo "   1. Configure your AI API keys in .env"
echo "   2. Set up your payment provider credentials"
echo "   3. Configure email settings for notifications"
echo ""

# 可选：打开浏览器
if command -v open > /dev/null; then
    read -p "🌐 Open frontend in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:3000
    fi
fi

echo "✨ Happy coding!"