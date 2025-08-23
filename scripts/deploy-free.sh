#!/bin/bash

# RELIVE项目免费部署脚本
# 使用Netlify + Supabase免费方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🆓 RELIVE项目免费部署方案${NC}"
echo "================================"
echo -e "${GREEN}使用: Netlify (前端) + Supabase (数据库)${NC}"
echo ""

# 检查必要工具
check_tools() {
    echo -e "${YELLOW}🔧 检查部署工具...${NC}"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js未安装${NC}"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm未安装${NC}"
        exit 1
    fi
    
    # 安装Netlify CLI
    if ! command -v netlify &> /dev/null; then
        echo -e "${YELLOW}📦 安装Netlify CLI...${NC}"
        npm install -g netlify-cli
    fi
    
    echo -e "${GREEN}✅ 工具检查完成${NC}"
}

# 准备前端构建
prepare_frontend() {
    echo -e "${YELLOW}📱 准备前端构建...${NC}"
    
    cd frontend
    
    # 安装依赖
    echo -e "${BLUE}📦 安装前端依赖...${NC}"
    npm install
    
    # 配置Next.js静态导出
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://your-site.netlify.app/.netlify/functions',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

module.exports = nextConfig
EOF
    
    # 构建前端
    echo -e "${BLUE}🏗️ 构建前端应用...${NC}"
    npm run build
    
    cd ..
    echo -e "${GREEN}✅ 前端准备完成${NC}"
}

# 创建Netlify Functions
create_netlify_functions() {
    echo -e "${YELLOW}⚡ 创建Netlify Functions...${NC}"
    
    mkdir -p netlify/functions
    
    # API网关函数
    cat > netlify/functions/api.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const { httpMethod, path, body, headers } = event;
    const apiPath = path.replace('/.netlify/functions/api', '');
    
    // CORS头部
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    
    // 处理预检请求
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    try {
        let response;
        
        switch (apiPath) {
            case '/health':
                response = await handleHealth();
                break;
                
            case '/auth/register':
                response = await handleRegister(JSON.parse(body));
                break;
                
            case '/auth/login':
                response = await handleLogin(JSON.parse(body));
                break;
                
            case '/photos':
                if (httpMethod === 'GET') {
                    response = await handleGetPhotos(event);
                } else if (httpMethod === 'POST') {
                    response = await handleUploadPhoto(JSON.parse(body));
                }
                break;
                
            default:
                response = {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'API路径不存在' })
                };
        }
        
        return {
            ...response,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        };
        
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: '服务器内部错误',
                message: error.message 
            })
        };
    }
};

// 健康检查
async function handleHealth() {
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'RELIVE API'
        })
    };
}

// 用户注册
async function handleRegister(data) {
    const { email, password, username } = data;
    
    const { data: user, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username }
        }
    });
    
    if (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message })
        };
    }
    
    // 创建用户记录
    const { error: dbError } = await supabase
        .from('users')
        .insert([
            { 
                id: user.user.id,
                email, 
                username,
                credits: 200 
            }
        ]);
    
    if (dbError) {
        console.error('Database error:', dbError);
    }
    
    return {
        statusCode: 201,
        body: JSON.stringify({ 
            message: '注册成功',
            user: { id: user.user.id, email }
        })
    };
}

// 用户登录
async function handleLogin(data) {
    const { email, password } = data;
    
    const { data: auth, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: '登录失败' })
        };
    }
    
    // 获取用户信息
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', auth.user.id)
        .single();
    
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            message: '登录成功',
            token: auth.session.access_token,
            user
        })
    };
}

// 获取照片列表
async function handleGetPhotos(event) {
    const authHeader = event.headers.authorization;
    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: '需要登录' })
        };
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: '无效的认证令牌' })
        };
    }
    
    const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (photosError) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '获取照片失败' })
        };
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ photos })
    };
}

// 上传照片
async function handleUploadPhoto(data) {
    // 这里需要集成Cloudinary或其他免费图片存储服务
    // 简化版本，直接存储URL
    const { filename, url, userId } = data;
    
    const { data: photo, error } = await supabase
        .from('photos')
        .insert([
            {
                user_id: userId,
                filename,
                original_url: url,
                status: 'uploaded'
            }
        ])
        .select()
        .single();
    
    if (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '上传失败' })
        };
    }
    
    return {
        statusCode: 201,
        body: JSON.stringify({ 
            message: '上传成功',
            photo 
        })
    };
}
EOF
    
    echo -e "${GREEN}✅ Netlify Functions创建完成${NC}"
}

# 创建Netlify配置
create_netlify_config() {
    echo -e "${YELLOW}⚙️ 创建Netlify配置...${NC}"
    
    # netlify.toml配置文件
    cat > netlify.toml << 'EOF'
[build]
  publish = "frontend/out"
  command = "cd frontend && npm run build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  command = "cd frontend && npm run dev"
  port = 3000
  publish = "frontend/out"
  functions = "netlify/functions"
EOF
    
    # package.json for functions
    cat > package.json << 'EOF'
{
  "name": "relive-app-netlify",
  "version": "1.0.0",
  "description": "RELIVE AI照片复活平台 - Netlify部署版本",
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "cloudinary": "^1.41.0"
  },
  "scripts": {
    "build": "echo 'Netlify Functions build complete'",
    "dev": "netlify dev"
  }
}
EOF
    
    echo -e "${GREEN}✅ Netlify配置创建完成${NC}"
}

# 安装Functions依赖
install_functions_deps() {
    echo -e "${YELLOW}📦 安装Functions依赖...${NC}"
    npm install
    echo -e "${GREEN}✅ Functions依赖安装完成${NC}"
}

# 部署到Netlify
deploy_to_netlify() {
    echo -e "${YELLOW}🚀 部署到Netlify...${NC}"
    
    # 登录Netlify (如果没有登录)
    if ! netlify status > /dev/null 2>&1; then
        echo -e "${BLUE}请登录Netlify账户...${NC}"
        netlify login
    fi
    
    # 初始化Netlify站点
    echo -e "${BLUE}初始化Netlify站点...${NC}"
    netlify init
    
    # 部署
    echo -e "${BLUE}执行部署...${NC}"
    netlify deploy --prod
    
    echo -e "${GREEN}✅ Netlify部署完成${NC}"
}

# 创建Supabase设置指南
create_supabase_guide() {
    echo -e "${YELLOW}📋 创建Supabase设置指南...${NC}"
    
    cat > SUPABASE_SETUP.md << 'EOF'
# Supabase数据库设置指南

## 1. 注册Supabase账户
1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用GitHub账户登录

## 2. 创建新项目
1. 点击 "New Project"
2. 项目名称: relive-app
3. 数据库密码: 设置强密码
4. 地区: 选择最近的地区

## 3. 创建数据表

在SQL Editor中执行以下SQL:

```sql
-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    credits INTEGER DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 照片表
CREATE TABLE photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_url TEXT,
    processed_url TEXT,
    processing_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'uploaded',
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 处理任务表
CREATE TABLE processing_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分交易记录表
CREATE TABLE credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'purchased'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_processing_tasks_user_id ON processing_tasks(user_id);
CREATE INDEX idx_processing_tasks_status ON processing_tasks(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
```

## 4. 配置认证

1. 进入 Authentication > Settings
2. 启用 Email 认证
3. 配置邮件模板 (可选)

## 5. 获取API密钥

1. 进入 Settings > API
2. 复制以下信息:
   - Project URL
   - anon/public key
   - service_role key (私钥，仅后端使用)

## 6. 配置Netlify环境变量

在Netlify Dashboard中设置以下环境变量:

```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key  
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 7. 测试连接

部署完成后，访问 /api/health 检查API是否正常工作。
EOF
    
    echo -e "${GREEN}✅ Supabase设置指南已创建${NC}"
}

# 主执行流程
main() {
    echo -e "${BLUE}开始免费部署流程...${NC}"
    
    # 检查工具
    check_tools
    
    # 准备前端
    prepare_frontend
    
    # 创建后端Functions
    create_netlify_functions
    
    # 创建配置文件
    create_netlify_config
    
    # 安装依赖
    install_functions_deps
    
    # 创建数据库设置指南
    create_supabase_guide
    
    # 部署到Netlify
    deploy_to_netlify
    
    # 完成提示
    echo ""
    echo -e "${GREEN}🎉 免费部署完成!${NC}"
    echo "================================"
    echo -e "${YELLOW}📋 下一步操作:${NC}"
    echo "1. 📖 阅读 SUPABASE_SETUP.md 设置数据库"
    echo "2. ⚙️ 在Netlify Dashboard配置环境变量"
    echo "3. 🌐 配置自定义域名 (可选)"
    echo "4. 🧪 测试所有功能"
    echo ""
    echo -e "${BLUE}💰 总成本: $0 (完全免费!)${NC}"
    echo -e "${GREEN}🎊 恭喜! 你的AI照片复活平台已免费上线!${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 部署过程中出现错误${NC}"; exit 1' ERR

# 执行主流程
main "$@"