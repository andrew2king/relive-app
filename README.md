# RELIVE AI老照片复活平台

<div align="center">
  <img src="https://img.shields.io/badge/AI-Powered-blue" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-20-green" alt="Node.js" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue" alt="Docker" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://github.com/your-username/relive-app/workflows/CI/badge.svg" alt="CI Status" />
</div>

## 🌟 项目简介

RELIVE是一个基于AI技术的老照片修复和复活平台，通过先进的机器学习算法，为用户提供照片修复、人物复活、智能标注和社交分享功能。

### ✨ 核心功能

- 🖼️ **智能照片修复**: 自动修复破损、模糊、划痕等问题
- 🎨 **黑白照片上色**: AI驱动的自然色彩还原
- 👤 **人物复活动画**: 让静态照片中的人物动起来
- 📱 **响应式界面**: 完美适配各种设备
- 💳 **积分系统**: 灵活的消费和会员模式
- 🔐 **安全可靠**: 多层安全防护

## 技术架构

```
Frontend (React + TypeScript)
    ↓
API Gateway
    ↓ 
Backend Services (Node.js)
├── User Service
├── File Service
├── AI Processing Service
├── Payment Service
└── Analytics Service
    ↓
AI Services (Claude + Gemini + Specialized Models)
    ↓
Database (PostgreSQL + Redis + S3)
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装所有子项目依赖
npm run install:all
```

### 启动开发环境

```bash
# 启动所有服务
npm run dev

# 或分别启动
npm run dev:frontend   # 前端 (http://localhost:3000)
npm run dev:backend    # 后端 (http://localhost:8000)
npm run dev:ai         # AI服务 (http://localhost:8001)
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
relive-app/
├── frontend/          # React前端应用
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── utils/         # 工具函数
│   │   ├── store/         # 状态管理
│   │   └── types/         # TypeScript类型定义
│   ├── public/        # 静态资源
│   └── package.json
├── backend/           # Node.js后端服务
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由定义
│   │   └── utils/         # 工具函数
│   ├── tests/         # 测试文件
│   └── package.json
├── ai-service/        # AI服务
│   ├── src/
│   │   ├── processors/    # AI处理器
│   │   ├── models/        # AI模型封装
│   │   └── utils/         # 工具函数
│   └── package.json
├── tests/             # 集成测试
├── docs/              # 文档
└── package.json       # 根配置文件
```

## 开发规范

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 使用 TypeScript 进行类型检查
- 使用 Husky + lint-staged 进行提交前检查

### 提交规范

使用 Conventional Commits 规范：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 分支管理

- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支
- `release/*`: 发布分支

## API文档

API文档使用 Swagger 生成，启动后端服务后访问：
http://localhost:8000/api-docs

## 测试

```bash
# 运行所有测试
npm test

# 运行前端测试
npm run test:frontend

# 运行后端测试  
npm run test:backend

# 生成测试覆盖率报告
npm run test:coverage
```

## 部署

### Docker部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 环境配置

创建 `.env` 文件：

```bash
# 环境配置详见 .env.example
```

## 性能监控

- 使用 Prometheus + Grafana 进行性能监控
- 使用 Sentry 进行错误追踪
- 使用 New Relic 进行APM监控

## 安全

- 所有API接口使用JWT进行身份验证
- 敏感数据加密存储
- 图片上传安全检查
- SQL注入防护
- XSS防护
- CSRF防护

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 版本发布

- 遵循语义化版本规范 (SemVer)
- 使用 GitHub Releases 进行版本发布
- 自动化CI/CD流程

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 团队

- **产品经理**: 负责产品规划和需求管理
- **前端工程师**: React/TypeScript开发
- **后端工程师**: Node.js/PostgreSQL开发  
- **AI工程师**: AI模型集成和优化
- **UI/UX设计师**: 界面设计和用户体验

## 联系我们

- 邮箱: team@relive-app.com
- 官网: https://relive-app.com
- 技术支持: support@relive-app.com

---

Made with ❤️ by RELIVE Team