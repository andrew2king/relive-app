# 🚀 RELIVE项目生产部署指南

## 📊 部署平台推荐 (按推荐度排序)

### 🥇 Tier 1 - 云平台 (推荐)

#### 1. **Vercel + Railway** (最简单)
- **前端**: Vercel (自动CI/CD)
- **后端+AI**: Railway (支持Docker)
- **数据库**: Vercel PostgreSQL 或 Railway PostgreSQL
- **优势**: 零配置部署，自动SSL，全球CDN
- **费用**: $0-20/月起步

#### 2. **Netlify + Render**
- **前端**: Netlify (静态站点)
- **后端+AI**: Render (容器化部署)
- **数据库**: Render PostgreSQL
- **优势**: 简单易用，自动扩容
- **费用**: $0-25/月起步

#### 3. **AWS (企业级)**
- **前端**: CloudFront + S3
- **后端**: ECS Fargate 或 Lambda
- **AI服务**: SageMaker 或 EC2 GPU
- **数据库**: RDS PostgreSQL
- **优势**: 最全面，可扩展性强
- **费用**: $50-500/月

### 🥈 Tier 2 - 云平台

#### 4. **Google Cloud Platform**
- **前端**: Firebase Hosting
- **后端**: Cloud Run
- **AI**: Vertex AI 或 Compute Engine
- **数据库**: Cloud SQL
- **费用**: $30-300/月

#### 5. **Azure**
- **前端**: Static Web Apps
- **后端**: Container Instances
- **AI**: Cognitive Services
- **数据库**: PostgreSQL Flexible Server
- **费用**: $40-400/月

### 🥉 Tier 3 - VPS平台

#### 6. **DigitalOcean** (性价比高)
- **服务器**: Droplets + App Platform
- **数据库**: Managed PostgreSQL
- **CDN**: Spaces CDN
- **费用**: $20-100/月

#### 7. **Linode/Vultr**
- **服务器**: VPS实例
- **负载均衡**: NodeBalancer
- **费用**: $15-80/月

## 🎯 推荐方案：Vercel + Railway

### ✅ 为什么选择这个组合？

1. **零配置部署** - 连接GitHub自动部署
2. **自动SSL证书** - 免费HTTPS
3. **全球CDN** - 极速访问
4. **自动扩容** - 按需付费
5. **开发者友好** - 优秀的DX体验

## 📋 部署清单 - Vercel + Railway方案

### 第一阶段：基础部署 (1-2小时)

#### 1. 🎯 前端部署到Vercel
```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署前端
cd frontend
vercel --prod

# 4. 设置环境变量
vercel env add NEXT_PUBLIC_API_URL production
```

#### 2. 🚂 后端+AI部署到Railway
```bash
# 1. 安装Railway CLI
npm install -g @railway/cli

# 2. 登录Railway
railway login

# 3. 创建项目
railway init

# 4. 部署后端
railway up
```

#### 3. 🗄️ 数据库配置
- Railway PostgreSQL
- Redis (Railway或Upstash)
- 运行数据库迁移

### 第二阶段：域名和SSL (30分钟)

#### 1. 购买域名
推荐域名商：
- **Cloudflare** (最便宜，集成度高)
- **Namecheap** (性价比高)
- **GoDaddy** (知名度高)

建议域名：
- `relive-ai.com`
- `photorevive.app`
- `airestorephoto.com`

#### 2. DNS配置
```bash
# Vercel前端域名配置
# 在Vercel Dashboard添加自定义域名
# 添加DNS记录：
CNAME www your-project.vercel.app
A @ 76.76.19.61
AAAA @ 2606:4700:10::6814:1c3d
```

```bash
# Railway后端域名配置
# 在Railway Dashboard添加自定义域名
# 添加DNS记录：
CNAME api your-backend.railway.app
```

### 第三阶段：生产优化 (2-3小时)

#### 1. 📊 监控配置
- **Sentry** - 错误追踪
- **LogRocket** - 用户行为录制
- **New Relic** - 性能监控

#### 2. 🔒 安全加固
```bash
# 环境变量加密
# API密钥轮换
# CORS严格配置
# 请求频率限制
```

#### 3. ⚡ 性能优化
- CDN配置 (Cloudflare)
- 图片压缩和WebP转换
- 代码分割和懒加载
- 数据库索引优化

#### 4. 📈 SEO优化
- Meta标签优化
- OpenGraph配置
- 站点地图生成
- Google Analytics

## 💰 费用预估

### 免费版本 (适合MVP)
- **Vercel**: 免费版 ($0)
- **Railway**: 免费额度 ($0)
- **域名**: $10-15/年
- **总计**: ~$15/年

### 专业版本 (适合正式运营)
- **Vercel Pro**: $20/月
- **Railway Pro**: $20/月  
- **数据库**: $15/月
- **CDN**: $10/月
- **监控**: $15/月
- **域名**: $15/年
- **总计**: ~$80/月 + $15/年

### 企业版本 (高流量)
- **总计**: $200-500/月

## 🛠️ 详细部署步骤

### Step 1: 准备工作

1. **确保代码已推送到GitHub**
2. **检查所有环境变量**
3. **运行本地测试确保功能正常**

### Step 2: 前端部署 (Vercel)

1. **连接GitHub仓库**
   - 访问 https://vercel.com
   - 点击 "New Project"
   - 选择 `andrew2king/relive-app`
   - Root Directory: `frontend`

2. **配置构建设置**
   ```bash
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **设置环境变量**
   ```bash
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

### Step 3: 后端部署 (Railway)

1. **创建Railway项目**
   - 访问 https://railway.app
   - 连接GitHub仓库
   - 选择根目录部署

2. **配置服务**
   ```dockerfile
   # 使用项目中的docker-compose.prod.yml
   # Railway会自动检测并部署
   ```

3. **添加数据库**
   - 点击 "Add PostgreSQL"
   - 点击 "Add Redis"
   - 获取连接字符串

4. **设置环境变量**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your-production-secret
   OPENAI_API_KEY=sk-...
   REPLICATE_API_TOKEN=r8_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

### Step 4: 域名配置

1. **购买域名**
   ```bash
   推荐：relive-ai.com ($12/年)
   ```

2. **Cloudflare设置**
   ```bash
   # 添加站点到Cloudflare
   # 更新域名服务器
   # 启用代理模式
   ```

3. **DNS记录**
   ```bash
   # 根域名指向前端
   A @ 76.76.19.61
   AAAA @ 2606:4700:10::6814:1c3d
   
   # API子域名指向后端
   CNAME api your-backend.railway.app
   
   # 邮件配置(可选)
   MX @ 10 mail.yourdomain.com
   ```

### Step 5: SSL证书
- Vercel和Railway都会自动配置SSL
- Cloudflare提供额外的SSL层

### Step 6: 最终测试

1. **功能测试**
   - 用户注册/登录
   - 照片上传
   - AI处理功能
   - 支付流程

2. **性能测试**
   - PageSpeed Insights
   - GTmetrix测试
   - 移动端测试

3. **安全测试**
   - SSL Labs测试
   - OWASP扫描

## 🚀 一键部署脚本

创建部署自动化脚本：

\`\`\`bash
#!/bin/bash
# deploy-production.sh

echo "🚀 开始RELIVE项目生产部署..."

# 检查环境
if [[ -z "$VERCEL_TOKEN" || -z "$RAILWAY_TOKEN" ]]; then
    echo "❌ 请设置VERCEL_TOKEN和RAILWAY_TOKEN环境变量"
    exit 1
fi

# 部署前端到Vercel
echo "📱 部署前端到Vercel..."
cd frontend
vercel --prod --token=$VERCEL_TOKEN

# 部署后端到Railway
echo "🖥️ 部署后端到Railway..."
cd ..
railway up --token=$RAILWAY_TOKEN

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
railway run npx prisma migrate deploy

echo "✅ 部署完成！"
echo "🌐 前端地址: https://relive-ai.com"
echo "🔧 后端地址: https://api.relive-ai.com"
\`\`\`

## 📞 部署后支持

部署完成后，你将拥有：

✅ **全自动CI/CD** - 代码推送自动部署
✅ **全球CDN加速** - 毫秒级访问速度  
✅ **自动SSL证书** - HTTPS安全连接
✅ **弹性扩容** - 自动处理流量峰值
✅ **专业监控** - 实时性能和错误追踪
✅ **SEO优化** - 搜索引擎友好

**总部署时间**: 2-4小时
**维护成本**: 极低，几乎全自动化
**可扩展性**: 支持从个人项目到企业级应用

🎉 **恭喜！你的AI照片复活平台即将正式上线！**