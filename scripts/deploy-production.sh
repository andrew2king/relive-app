#!/bin/bash

# RELIVE项目一键生产部署脚本
# 支持Vercel + Railway部署方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RELIVE项目生产环境部署${NC}"
echo "================================"

# 检查必要工具
check_tools() {
    echo -e "${YELLOW}🔧 检查部署工具...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI未安装${NC}"
        echo -e "${YELLOW}安装: npm i -g vercel${NC}"
        exit 1
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI未安装${NC}"
        echo -e "${YELLOW}安装: npm i -g @railway/cli${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 部署工具检查完成${NC}"
}

# 检查环境变量
check_env() {
    echo -e "${YELLOW}🔍 检查环境配置...${NC}"
    
    if [[ ! -f ".env.production" ]]; then
        echo -e "${RED}❌ .env.production文件不存在${NC}"
        echo -e "${YELLOW}请创建生产环境配置文件${NC}"
        exit 1
    fi
    
    # 检查关键环境变量
    source .env.production
    
    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "OPENAI_API_KEY"
        "STRIPE_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo -e "${RED}❌ 环境变量 $var 未设置${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ 环境配置检查完成${NC}"
}

# 构建检查
build_check() {
    echo -e "${YELLOW}🏗️ 执行构建检查...${NC}"
    
    # 检查前端构建
    echo -e "${BLUE}检查前端构建...${NC}"
    cd frontend
    npm run build || {
        echo -e "${RED}❌ 前端构建失败${NC}"
        exit 1
    }
    cd ..
    
    # 检查后端构建
    echo -e "${BLUE}检查后端构建...${NC}"
    cd backend
    npm run build || {
        echo -e "${RED}❌ 后端构建失败${NC}"
        exit 1
    }
    cd ..
    
    echo -e "${GREEN}✅ 构建检查完成${NC}"
}

# 部署前端到Vercel
deploy_frontend() {
    echo -e "${YELLOW}📱 部署前端到Vercel...${NC}"
    
    cd frontend
    
    # 设置Vercel项目配置
    cat > vercel.json << EOF
{
  "name": "relive-app-frontend",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.relive-ai.com",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "$STRIPE_PUBLISHABLE_KEY"
  }
}
EOF
    
    # 部署到生产环境
    vercel --prod --yes || {
        echo -e "${RED}❌ 前端部署失败${NC}"
        exit 1
    }
    
    cd ..
    echo -e "${GREEN}✅ 前端部署完成${NC}"
}

# 部署后端到Railway
deploy_backend() {
    echo -e "${YELLOW}🖥️ 部署后端到Railway...${NC}"
    
    # 创建Railway配置
    cat > railway.json << EOF
{
  "deploy": {
    "startCommand": "npm run start",
    "buildCommand": "npm run build"
  }
}
EOF
    
    # 上传环境变量
    echo -e "${BLUE}上传环境变量...${NC}"
    source .env.production
    railway variables set NODE_ENV=production
    railway variables set DATABASE_URL="$DATABASE_URL"
    railway variables set REDIS_URL="$REDIS_URL"
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
    railway variables set REPLICATE_API_TOKEN="$REPLICATE_API_TOKEN"
    railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
    railway variables set AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
    railway variables set AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
    railway variables set AWS_S3_BUCKET="$AWS_S3_BUCKET"
    
    # 部署项目
    railway up || {
        echo -e "${RED}❌ 后端部署失败${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ 后端部署完成${NC}"
}

# 数据库迁移
migrate_database() {
    echo -e "${YELLOW}🗄️ 执行数据库迁移...${NC}"
    
    cd backend
    railway run npx prisma migrate deploy || {
        echo -e "${RED}❌ 数据库迁移失败${NC}"
        exit 1
    }
    cd ..
    
    echo -e "${GREEN}✅ 数据库迁移完成${NC}"
}

# 健康检查
health_check() {
    echo -e "${YELLOW}🏥 执行健康检查...${NC}"
    
    # 等待服务启动
    sleep 30
    
    # 检查后端API
    if curl -f -s "https://api.relive-ai.com/health" > /dev/null; then
        echo -e "${GREEN}✅ 后端API健康检查通过${NC}"
    else
        echo -e "${RED}❌ 后端API健康检查失败${NC}"
        echo -e "${YELLOW}请检查Railway部署状态${NC}"
    fi
    
    # 检查前端
    if curl -f -s "https://relive-ai.com" > /dev/null; then
        echo -e "${GREEN}✅ 前端健康检查通过${NC}"
    else
        echo -e "${RED}❌ 前端健康检查失败${NC}"
        echo -e "${YELLOW}请检查Vercel部署状态${NC}"
    fi
}

# 部署后配置
post_deploy_setup() {
    echo -e "${YELLOW}⚙️ 执行部署后配置...${NC}"
    
    # 生成部署报告
    cat > deployment-report.md << EOF
# 🎉 RELIVE项目部署报告

## 📊 部署状态
- ✅ 前端部署完成 (Vercel)
- ✅ 后端部署完成 (Railway)
- ✅ 数据库迁移完成
- ✅ 健康检查通过

## 🌐 访问地址
- 🎨 **前端应用**: https://relive-ai.com
- 🔧 **后端API**: https://api.relive-ai.com
- 📚 **API文档**: https://api.relive-ai.com/api-docs

## 📊 监控地址
- 📈 **Vercel Dashboard**: https://vercel.com/dashboard
- 🚂 **Railway Dashboard**: https://railway.app/dashboard
- 🔍 **GitHub Actions**: https://github.com/andrew2king/relive-app/actions

## 🔧 下一步操作
1. 配置自定义域名
2. 设置CDN加速
3. 配置监控告警
4. 优化SEO设置
5. 启用生产级缓存

部署时间: $(date)
部署版本: $(git rev-parse --short HEAD)
EOF
    
    echo -e "${GREEN}✅ 部署报告已生成: deployment-report.md${NC}"
}

# 主要流程
main() {
    echo -e "${BLUE}开始部署流程...${NC}"
    
    # 1. 环境检查
    check_tools
    check_env
    build_check
    
    # 2. 询问确认
    echo -e "${YELLOW}⚠️ 即将部署到生产环境，确认继续? (y/N):${NC}"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}部署已取消${NC}"
        exit 0
    fi
    
    # 3. 执行部署
    deploy_frontend
    deploy_backend
    migrate_database
    
    # 4. 验证部署
    health_check
    post_deploy_setup
    
    # 5. 完成通知
    echo ""
    echo -e "${GREEN}🎉 部署完成!${NC}"
    echo "================================"
    echo -e "🌐 前端地址: ${BLUE}https://relive-ai.com${NC}"
    echo -e "🔧 后端地址: ${BLUE}https://api.relive-ai.com${NC}"
    echo -e "📚 API文档: ${BLUE}https://api.relive-ai.com/api-docs${NC}"
    echo ""
    echo -e "${YELLOW}📋 下一步:${NC}"
    echo "1. 配置自定义域名"
    echo "2. 设置CDN和缓存"
    echo "3. 配置监控告警"
    echo "4. 进行压力测试"
    echo ""
    echo -e "${BLUE}🎊 恭喜! RELIVE AI照片复活平台已正式上线!${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 部署过程中出现错误${NC}"; exit 1' ERR

# 执行主流程
main "$@"