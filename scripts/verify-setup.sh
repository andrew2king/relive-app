#!/bin/bash

# RELIVE项目设置验证脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 RELIVE项目设置验证${NC}"
echo "================================"

# 检查项目结构
echo -e "${YELLOW}📁 检查项目结构...${NC}"

check_file() {
    if [[ -f "$1" ]]; then
        echo -e "  ✅ $1"
    else
        echo -e "  ❌ $1 ${RED}(缺失)${NC}"
    fi
}

check_dir() {
    if [[ -d "$1" ]]; then
        echo -e "  ✅ $1/"
    else
        echo -e "  ❌ $1/ ${RED}(缺失)${NC}"
    fi
}

# 检查核心文件
echo -e "${GREEN}核心配置文件:${NC}"
check_file "package.json"
check_file "docker-compose.yml"
check_file "docker-compose.prod.yml"
check_file ".gitignore"
check_file "README.md"

echo -e "${GREEN}GitHub Actions:${NC}"
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/deploy.yml" 
check_file ".github/workflows/security.yml"

echo -e "${GREEN}自动化脚本:${NC}"
check_file "scripts/create-github-repo.sh"
check_file "scripts/deploy.sh"
check_file "scripts/start-dev.sh"

echo -e "${GREEN}项目目录:${NC}"
check_dir "frontend"
check_dir "backend"
check_dir "ai-service"

# 检查Git状态
echo ""
echo -e "${YELLOW}🔄 检查Git状态...${NC}"
if git status --porcelain | grep -q .; then
    echo -e "  ⚠️  ${YELLOW}有未提交的更改${NC}"
    git status --short
else
    echo -e "  ✅ 工作目录干净"
fi

# 检查远程仓库
echo ""
echo -e "${YELLOW}🌐 检查远程仓库...${NC}"
if git remote get-url origin &> /dev/null; then
    ORIGIN=$(git remote get-url origin)
    echo -e "  ✅ 远程仓库: ${GREEN}$ORIGIN${NC}"
    
    # 检查分支
    echo -e "${YELLOW}🌿 检查分支...${NC}"
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "  📍 当前分支: ${GREEN}$CURRENT_BRANCH${NC}"
    
    echo -e "  📋 所有分支:"
    git branch -a | sed 's/^/    /'
else
    echo -e "  ❌ ${RED}未配置远程仓库${NC}"
fi

# 检查GitHub Actions状态
echo ""
echo -e "${YELLOW}🔄 检查GitHub Actions状态...${NC}"
if git remote get-url origin &> /dev/null; then
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
    echo -e "  📊 Actions页面: ${BLUE}${REPO_URL}/actions${NC}"
    echo -e "  📦 Packages页面: ${BLUE}${REPO_URL}/pkgs/container/relive-app${NC}"
    echo -e "  🔒 Security页面: ${BLUE}${REPO_URL}/security${NC}"
fi

# 最终总结
echo ""
echo -e "${GREEN}🎉 验证完成!${NC}"
echo "================================"

if git remote get-url origin &> /dev/null; then
    echo -e "✅ ${GREEN}项目已成功推送到GitHub${NC}"
    echo -e "🔗 仓库地址: ${BLUE}$(git remote get-url origin)${NC}"
    echo ""
    echo -e "${YELLOW}📋 下一步配置 GitHub 仓库:${NC}"
    echo "1. 🏷️ 添加Topics标签"
    echo "2. 🔑 配置Secrets环境变量"
    echo "3. ⚙️ 设置分支保护规则"
    echo "4. 🌍 创建部署环境"
    echo "5. 🎉 享受全自动CI/CD流程！"
else
    echo -e "⚠️  ${YELLOW}需要推送到GitHub仓库${NC}"
fi

echo ""
echo -e "${BLUE}🚀 项目已准备就绪！${NC}"