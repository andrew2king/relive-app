# 🚀 GitHub自动化部署完整指南

## ✅ 已完成配置

我已经为你创建了完整的GitHub自动化部署配置：

- ✅ GitHub Actions工作流 (`.github/workflows/deploy.yml`)
- ✅ Netlify自动部署配置 (`netlify.toml`)  
- ✅ 自动化部署脚本 (`scripts/setup-auto-deploy.sh`)
- ✅ 一键部署配置 (`deploy-to-netlify.md`)

## 📤 第一步：推送代码到GitHub

```bash
cd /Users/long/Downloads/Claudecode/photo/relive-app

# 推送所有配置到GitHub
git push origin main
```

如果推送失败，可以尝试：

```bash
# 方法1: 使用SSH
git remote set-url origin git@github.com:andrew2king/relive-app.git
git push origin main

# 方法2: 重新配置远程
git remote remove origin  
git remote add origin https://github.com/andrew2king/relive-app.git
git push -u origin main

# 方法3: 使用GitHub CLI
gh repo sync andrew2king/relive-app
```

## 🌐 第二步：在Netlify设置自动部署

### 方法A: 一键部署（最简单）

1. **点击一键部署链接**：
   ```
   https://app.netlify.com/start/deploy?repository=https://github.com/andrew2king/relive-app
   ```

2. **连接GitHub账户**并授权访问仓库

3. **确认构建设置**：
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/out` 
   - Functions directory: `netlify/functions`

### 方法B: 手动连接GitHub

1. **登录Netlify**: https://app.netlify.com
2. **点击**: "New site from Git"
3. **选择**: "GitHub" 
4. **选择仓库**: `andrew2king/relive-app`
5. **设置构建配置**（同上）

## 🔧 第三步：配置GitHub Secrets（可选，用于GitHub Actions）

如果要使用GitHub Actions自动部署：

1. **获取Netlify Site ID**:
   - Netlify Dashboard → Site settings → Site information
   - 复制 Site ID

2. **获取Netlify Auth Token**:
   - Netlify Dashboard → User settings → Personal access tokens
   - Generate new token

3. **在GitHub添加Secrets**:
   - 访问：`https://github.com/andrew2king/relive-app/settings/secrets/actions`
   - 添加：`NETLIFY_SITE_ID` = [你的Site ID]
   - 添加：`NETLIFY_AUTH_TOKEN` = [你的Token]

## 🔑 第四步：配置环境变量

在Netlify Dashboard → Site settings → Environment variables 添加：

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

获取这些值：
1. 访问 https://supabase.com
2. 创建项目 → Settings → API
3. 复制 Project URL 和 API Keys

## 🗄️ 第五步：设置Supabase数据库

在Supabase SQL Editor执行：

```sql
-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    credits INTEGER DEFAULT 200,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建照片表
CREATE TABLE photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_url TEXT,
    processed_url TEXT,
    processing_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'uploaded',
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建处理任务表
CREATE TABLE processing_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    result_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_tasks ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own photos" ON photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🔄 自动部署工作流程

设置完成后：

1. **推送代码到main分支** → 自动触发构建和部署
2. **监控部署过程**：
   - GitHub Actions: `https://github.com/andrew2king/relive-app/actions`
   - Netlify Deploys: Netlify Dashboard → Deploys

## ✅ 完成检查清单

- [ ] 推送代码到GitHub
- [ ] 连接Netlify到GitHub仓库  
- [ ] 配置Netlify构建设置
- [ ] 创建Supabase项目和数据库
- [ ] 配置环境变量
- [ ] 测试自动部署流程

## 🎉 最终效果

完成后你将拥有：
- 🚀 **完全自动化的CI/CD流程**
- 🌍 **全球CDN加速的网站**
- 🔒 **HTTPS安全连接**
- ⚡ **每次代码推送自动部署**
- 📱 **响应式设计支持**

---

**🎊 恭喜！你现在有了一个完全专业的自动化部署流程！**