#!/bin/bash

# RELIVE项目GitHub仓库创建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
REPO_NAME="relive-app"
REPO_DESCRIPTION="RELIVE AI老照片复活平台 - AI-powered photo restoration and revival platform"
REPO_VISIBILITY="public" # 可以改为 "private"

echo -e "${BLUE}🚀 RELIVE项目GitHub自动化部署脚本${NC}"
echo "================================"

# 检查GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI未安装${NC}"
    echo -e "${YELLOW}请先安装GitHub CLI: brew install gh${NC}"
    exit 1
fi

# 检查GitHub认证
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔐 请先登录GitHub${NC}"
    gh auth login
fi

# 获取当前用户名
GITHUB_USER=$(gh api user --jq .login)
echo -e "${GREEN}👤 当前用户: ${GITHUB_USER}${NC}"

# 检查仓库是否已存在
if gh repo view "${GITHUB_USER}/${REPO_NAME}" &> /dev/null; then
    echo -e "${YELLOW}⚠️  仓库已存在: ${GITHUB_USER}/${REPO_NAME}${NC}"
    read -p "是否删除现有仓库并重新创建? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}🗑️  删除现有仓库...${NC}"
        gh repo delete "${GITHUB_USER}/${REPO_NAME}" --confirm
    else
        echo -e "${YELLOW}使用现有仓库${NC}"
        REPO_EXISTS=true
    fi
fi

# 创建GitHub仓库
if [[ "$REPO_EXISTS" != "true" ]]; then
    echo -e "${GREEN}📦 创建GitHub仓库...${NC}"
    gh repo create "${REPO_NAME}" \
        --description "${REPO_DESCRIPTION}" \
        --${REPO_VISIBILITY} \
        --add-readme=false \
        --clone=false
    
    echo -e "${GREEN}✅ 仓库创建成功!${NC}"
fi

# 添加远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo -e "${GREEN}🔗 添加远程仓库...${NC}"
    git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
else
    echo -e "${YELLOW}🔄 更新远程仓库地址...${NC}"
    git remote set-url origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
fi

# 添加所有文件
echo -e "${GREEN}📁 添加项目文件...${NC}"
git add .

# 提交代码
echo -e "${GREEN}💾 提交初始代码...${NC}"
git commit -m "$(cat <<'EOF'
Initial commit: RELIVE AI老照片复活平台

✨ Features:
- 🖼️ AI-powered photo restoration
- 👤 Face animation and revival 
- 🎨 Black & white photo colorization
- 📱 Responsive web interface
- 💳 Integrated payment system
- 🔄 Docker containerized deployment

🏗️ Architecture:
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + Express + Prisma + PostgreSQL  
- AI Service: Python + GFPGAN + OpenAI APIs
- Infrastructure: Docker + Redis + GitHub Actions

🚀 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 推送到GitHub
echo -e "${GREEN}🚀 推送到GitHub...${NC}"
git branch -M main
git push -u origin main

# 设置仓库描述和主题
echo -e "${GREEN}🏷️  设置仓库信息...${NC}"
gh repo edit \
    --description "${REPO_DESCRIPTION}" \
    --add-topic "ai,photo-restoration,nextjs,nodejs,docker,typescript" \
    --add-topic "image-processing,machine-learning,web-app,full-stack"

# 创建开发分支
echo -e "${GREEN}🌿 创建开发分支...${NC}"
git checkout -b develop
git push -u origin develop
git checkout main

# 设置分支保护规则
echo -e "${GREEN}🛡️  设置分支保护...${NC}"
gh api "repos/${GITHUB_USER}/${REPO_NAME}/branches/main/protection" \
    -X PUT \
    -f required_status_checks='{"strict":true,"contexts":["test"]}' \
    -f enforce_admins=true \
    -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    -f restrictions=null \
    2>/dev/null || echo -e "${YELLOW}⚠️  分支保护设置可能需要手动配置${NC}"

# 创建环境
echo -e "${GREEN}🌍 创建部署环境...${NC}"
gh api "repos/${GITHUB_USER}/${REPO_NAME}/environments/staging" -X PUT 2>/dev/null || true
gh api "repos/${GITHUB_USER}/${REPO_NAME}/environments/production" -X PUT 2>/dev/null || true

echo -e "${GREEN}🎉 GitHub仓库设置完成!${NC}"
echo "================================"
echo -e "📍 仓库地址: ${BLUE}https://github.com/${GITHUB_USER}/${REPO_NAME}${NC}"
echo -e "🔄 Actions: ${BLUE}https://github.com/${GITHUB_USER}/${REPO_NAME}/actions${NC}"
echo -e "📦 Packages: ${BLUE}https://github.com/${GITHUB_USER}/${REPO_NAME}/pkgs/container/${REPO_NAME}${NC}"
echo ""
echo -e "${GREEN}✅ 下一步:${NC}"
echo "1. 配置环境变量 (Repository Settings > Secrets)"
echo "2. 查看GitHub Actions构建状态"
echo "3. 配置域名和SSL证书"
echo "4. 设置生产环境部署密钥"
echo ""
echo -e "${BLUE}🚀 项目已准备就绪，开始你的AI照片复活之旅!${NC}"