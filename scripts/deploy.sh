#!/bin/bash

# RELIVE项目自动化部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-latest}"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${BLUE}🚀 RELIVE项目自动化部署${NC}"
echo "================================"
echo -e "🌍 环境: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "🏷️  镜像标签: ${GREEN}${IMAGE_TAG}${NC}"

# 验证环境
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ 无效环境: $ENVIRONMENT${NC}"
    echo -e "${YELLOW}请使用: staging 或 production${NC}"
    exit 1
fi

# 检查必要工具
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker未安装${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose未安装${NC}"; exit 1; }

# 加载环境变量
ENV_FILE=".env.${ENVIRONMENT}"
if [[ -f "$ENV_FILE" ]]; then
    echo -e "${GREEN}📄 加载环境配置: $ENV_FILE${NC}"
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  环境文件不存在: $ENV_FILE${NC}"
    echo -e "${YELLOW}使用默认配置...${NC}"
fi

# 设置镜像标签
export IMAGE_TAG="$IMAGE_TAG"

# 健康检查函数
health_check() {
    local service_url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ 等待 $service_name 服务启动...${NC}"
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$service_url/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name 服务健康检查通过${NC}"
            return 0
        fi
        
        echo -ne "尝试 $attempt/$max_attempts...\r"
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name 服务启动失败${NC}"
    return 1
}

# 备份函数
backup_database() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo -e "${GREEN}💾 备份生产数据库...${NC}"
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres \
            pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-relive}" > "backups/$BACKUP_FILE"
        echo -e "${GREEN}✅ 数据库备份完成: $BACKUP_FILE${NC}"
    fi
}

# 回滚函数
rollback() {
    echo -e "${RED}🔄 执行回滚...${NC}"
    if [[ -f "docker-compose.backup.yml" ]]; then
        docker-compose -f docker-compose.backup.yml up -d
        echo -e "${GREEN}✅ 回滚完成${NC}"
    else
        echo -e "${YELLOW}⚠️  无备份配置，请手动回滚${NC}"
    fi
}

# 主部署流程
main() {
    # 创建备份目录
    mkdir -p backups logs

    # 备份当前配置
    if [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        cp "$DOCKER_COMPOSE_FILE" "docker-compose.backup.yml"
    fi

    # 备份数据库（仅生产环境）
    backup_database

    # 拉取最新镜像
    echo -e "${GREEN}📥 拉取最新镜像...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull || {
        echo -e "${RED}❌ 镜像拉取失败${NC}"
        exit 1
    }

    # 停止旧服务
    echo -e "${YELLOW}🛑 停止旧服务...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down || true

    # 清理旧容器和镜像
    echo -e "${GREEN}🧹 清理旧资源...${NC}"
    docker system prune -f

    # 启动新服务
    echo -e "${GREEN}🚀 启动新服务...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || {
        echo -e "${RED}❌ 服务启动失败${NC}"
        rollback
        exit 1
    }

    # 等待服务启动
    sleep 10

    # 运行数据库迁移
    if [[ "$ENVIRONMENT" == "production" ]] || [[ "$ENVIRONMENT" == "staging" ]]; then
        echo -e "${GREEN}🗄️  运行数据库迁移...${NC}"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend \
            npx prisma migrate deploy || {
            echo -e "${RED}❌ 数据库迁移失败${NC}"
            rollback
            exit 1
        }
    fi

    # 健康检查
    health_check "http://localhost:8000" "Backend API" || {
        rollback
        exit 1
    }

    health_check "http://localhost:3000" "Frontend" || {
        rollback
        exit 1
    }

    # 显示服务状态
    echo -e "${GREEN}📊 服务状态:${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps

    # 显示日志摘要
    echo -e "${GREEN}📝 最近日志:${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20

    echo -e "${GREEN}🎉 部署成功完成!${NC}"
    echo "================================"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo -e "🌐 生产环境地址: ${BLUE}https://relive-app.com${NC}"
        echo -e "📊 监控面板: ${BLUE}https://grafana.relive-app.com${NC}"
    else
        echo -e "🌐 暂存环境地址: ${BLUE}https://staging.relive-app.com${NC}"
        echo -e "📊 本地监控: ${BLUE}http://localhost:3001${NC}"
    fi
    
    echo -e "📈 API健康检查: ${BLUE}http://localhost:8000/health${NC}"
    echo -e "📚 API文档: ${BLUE}http://localhost:8000/api-docs${NC}"
    echo ""
    echo -e "${GREEN}✅ 部署完成! 🎊${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 部署过程中出现错误${NC}"; rollback; exit 1' ERR

# 执行主流程
main

# 清理备份文件
rm -f docker-compose.backup.yml

echo -e "${BLUE}🏁 部署脚本执行完毕${NC}"