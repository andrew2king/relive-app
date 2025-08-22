#!/bin/bash

# RELIVE 本地开发环境启动脚本（不依赖Docker）

echo "🚀 Starting RELIVE Local Development Environment..."

# 检查必要的环境变量
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Created .env file with default configuration."
fi

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js and try again."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# 检查端口是否被占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t > /dev/null 2>&1; then
        echo "⚠️  Port $port is already in use by $service"
        echo "   You can continue, but this service might not start properly."
        return 1
    fi
    return 0
}

echo "🔍 Checking required ports..."
check_port 3000 "Frontend (Next.js)"
check_port 8000 "Backend API"
check_port 8001 "AI Service"

# 创建必要的目录
echo "📁 Creating required directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp

# 安装根目录依赖
echo "📦 Installing root dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Root dependencies already installed"
fi

# 安装前端依赖
echo "📦 Installing frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing Next.js frontend dependencies..."
    cd frontend
    
    # 创建基本的Next.js配置如果不存在
    if [ ! -f "package.json" ]; then
        echo "Creating frontend package.json..."
        npm init -y
        npm install next@latest react@latest react-dom@latest typescript@latest @types/react@latest @types/node@latest tailwindcss@latest
    else
        npm install
    fi
    cd ..
else
    echo "✅ Frontend dependencies already installed"
fi

# 安装后端依赖
echo "📦 Installing backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    if [ -f "package.json" ]; then
        npm install
    else
        echo "⚠️  Backend package.json not found, skipping backend dependency installation"
    fi
    cd ..
else
    echo "✅ Backend dependencies already installed"
fi

# 安装AI服务依赖
echo "📦 Installing AI service dependencies..."
if [ ! -d "ai-service/node_modules" ]; then
    echo "Installing AI service dependencies..."
    cd ai-service
    if [ -f "package.json" ]; then
        npm install
    else
        echo "⚠️  AI service package.json not found, skipping AI service dependency installation"
    fi
    cd ..
else
    echo "✅ AI service dependencies already installed"
fi

# 创建本地开发数据库文件（SQLite）
echo "🗄️  Setting up local database..."
if [ ! -f "backend/dev.db" ]; then
    echo "Creating local SQLite database..."
    touch backend/dev.db
    echo "✅ Local database file created"
fi

# 更新.env文件为本地开发配置
echo "⚙️  Configuring local environment..."
cat > .env.local << EOF
# Local Development Configuration
NODE_ENV=development
PORT=8000
AI_SERVICE_PORT=8001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Local SQLite Database (no external database needed)
DATABASE_URL="file:./dev.db"

# Local Redis (optional, will use memory cache if not available)
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="local-development-secret-key"
JWT_EXPIRES_IN="7d"

# File Upload Configuration
MAX_FILE_SIZE="50000000"
UPLOAD_DIR="./uploads"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp,image/tiff"

# Mock AI Services (for development without API keys)
MOCK_AI_SERVICES="true"
OPENAI_API_KEY="mock-key"
CLAUDE_API_KEY="mock-key"
GEMINI_API_KEY="mock-key"

# Local file storage (no AWS needed)
USE_LOCAL_STORAGE="true"
LOCAL_STORAGE_PATH="./uploads"

# Disable payment in development
ENABLE_PAYMENT_SYSTEM="false"
STRIPE_SECRET_KEY="sk_test_mock"

# Development features
DEBUG="true"
LOG_LEVEL="debug"
ENABLE_CORS="true"
CORS_ORIGIN="http://localhost:3000"
EOF

echo "✅ Local environment configured"

# 启动服务函数
start_service() {
    local service_name=$1
    local service_path=$2
    local start_command=$3
    local port=$4
    
    echo "🚀 Starting $service_name..."
    
    if [ -d "$service_path" ] && [ -f "$service_path/package.json" ]; then
        cd "$service_path"
        
        # 检查是否有启动脚本
        if npm run | grep -q "dev\|start"; then
            echo "   Starting $service_name on port $port..."
            # 在后台启动服务
            $start_command > "../logs/${service_name}.log" 2>&1 &
            echo $! > "../logs/${service_name}.pid"
            echo "✅ $service_name started (PID: $!)"
        else
            echo "⚠️  No start script found for $service_name"
        fi
        cd ..
    else
        echo "⚠️  $service_name directory or package.json not found"
    fi
}

# 创建简单的前端应用如果不存在
if [ ! -f "frontend/src/app/page.tsx" ] && [ ! -f "frontend/pages/index.tsx" ]; then
    echo "📱 Creating basic frontend application..."
    
    mkdir -p frontend/src/app
    mkdir -p frontend/public
    
    # 创建基本的页面
    cat > frontend/src/app/page.tsx << 'EOF'
export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#D4A574' }}>🎉 RELIVE AI Platform</h1>
      <p>Welcome to RELIVE AI Photo Restoration Platform!</p>
      <div style={{ marginTop: '20px' }}>
        <h2>🚀 Development Environment Ready</h2>
        <ul>
          <li>✅ Frontend is running</li>
          <li>⚙️ Backend API: <a href="http://localhost:8000/health">http://localhost:8000/health</a></li>
          <li>🤖 AI Service: <a href="http://localhost:8001/health">http://localhost:8001/health</a></li>
        </ul>
      </div>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#FAF6F0', borderRadius: '8px' }}>
        <h3>📝 Next Steps:</h3>
        <ol>
          <li>Configure your AI API keys in .env file</li>
          <li>Set up your preferred database (PostgreSQL recommended for production)</li>
          <li>Configure payment provider (Stripe)</li>
          <li>Start building your features!</li>
        </ol>
      </div>
    </div>
  );
}
EOF

    # 创建基本的layout
    cat > frontend/src/app/layout.tsx << 'EOF'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

    echo "✅ Basic frontend application created"
fi

# 启动所有服务
echo "🌟 Starting all services..."

# 确保日志目录存在
mkdir -p logs

# 启动前端 (Next.js)
if [ -d "frontend" ]; then
    echo "🎨 Starting Frontend (Next.js)..."
    cd frontend
    if command -v npx &> /dev/null; then
        npx next dev -p 3000 > ../logs/frontend.log 2>&1 &
        echo $! > ../logs/frontend.pid
        echo "✅ Frontend started on http://localhost:3000 (PID: $!)"
    else
        echo "⚠️  npx not found, skipping frontend startup"
    fi
    cd ..
fi

# 等待一下让服务启动
sleep 3

# 检查服务状态
echo "🔍 Checking service status..."

check_service() {
    local url=$1
    local name=$2
    
    if command -v curl &> /dev/null; then
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "✅ $name is running and responding"
        else
            echo "⚠️  $name is not responding (this is normal for initial startup)"
        fi
    else
        echo "ℹ️  curl not available, cannot check $name status"
    fi
}

check_service "http://localhost:3000" "Frontend"

# 显示访问信息
echo ""
echo "🎉 RELIVE Local Development Environment is ready!"
echo ""
echo "📱 Frontend Application:  http://localhost:3000"
echo "🔧 Backend API (when started): http://localhost:8000"
echo "🤖 AI Service (when started):  http://localhost:8001"
echo ""
echo "📋 Useful commands:"
echo "   cd frontend && npm run dev    - Start frontend development server"
echo "   cd backend && npm run dev     - Start backend API server"
echo "   cd ai-service && npm run dev  - Start AI processing service"
echo "   ./scripts/stop-local.sh       - Stop all services"
echo ""
echo "📁 Project files:"
echo "   📄 Environment config: .env.local"
echo "   📊 Service logs: logs/"
echo "   📷 Upload directory: uploads/"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Check the logs in the 'logs' directory if you encounter issues"
echo "   3. Configure your API keys in .env file for full functionality"
echo "   4. Install and configure PostgreSQL and Redis for production features"
echo ""

# 可选：打开浏览器
if command -v open &> /dev/null; then
    read -p "🌐 Open frontend in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sleep 2  # 等待服务完全启动
        open http://localhost:3000
    fi
elif command -v xdg-open &> /dev/null; then
    read -p "🌐 Open frontend in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sleep 2
        xdg-open http://localhost:3000
    fi
fi

echo "✨ Happy coding! The RELIVE platform is ready for development."
echo ""
echo "💡 Tip: You can run individual services manually if needed:"
echo "   Frontend: cd frontend && npx next dev"
echo "   Backend:  cd backend && npm run dev"
echo "   AI Service: cd ai-service && npm run dev"
EOF