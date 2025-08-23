# 🚀 RELIVE AI - 免费部署指南

## ✅ 当前状态
- [x] TypeScript编译错误已解决
- [x] 前端构建成功
- [x] Netlify Functions配置完成
- [ ] 需要部署到Netlify
- [ ] 需要配置Supabase数据库

## 🎯 下一步部署操作

### 1. 准备部署

项目已经构建成功！当前需要完成以下步骤：

```bash
# 在项目根目录运行部署脚本
./scripts/deploy-netlify.sh
```

### 2. 部署到Netlify

#### 选项A: 使用命令行部署（推荐）

```bash
# 1. 登录Netlify
npx netlify login

# 2. 初始化站点
npx netlify init

# 3. 按照提示选择：
#    - Create & configure a new site
#    - 站点名称: relive-ai-photo-restoration
#    - Build command: cd frontend && npm run build  
#    - Publish directory: frontend/out
#    - Functions directory: netlify/functions

# 4. 部署
npx netlify deploy --prod
```

#### 选项B: 手动上传

1. 访问 [netlify.com](https://netlify.com)
2. 登录你的账户
3. 点击 "Add new site" > "Deploy manually"
4. 将 `frontend/out` 文件夹拖拽到部署区域

### 3. 配置Supabase数据库

#### 创建Supabase项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目：
   - 项目名称: `relive-app`
   - 数据库密码: 设置强密码并记住
   - 地区: Northeast Asia (ap-northeast-1)

#### 设置数据库表

在Supabase Dashboard的SQL Editor中运行：

```sql
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

-- 启用RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_tasks ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own photos" ON photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. 配置环境变量

在Netlify Dashboard中，进入你的站点设置：

**Site settings > Environment variables > Add variable**

添加以下变量：

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

获取这些密钥：
1. Supabase Dashboard > Settings > API
2. 复制 Project URL 和 API Keys

### 5. 重新部署

配置环境变量后，重新部署：

```bash
npx netlify deploy --prod
```

## 🎉 完成！

部署完成后，你将获得：
- ✅ 免费的Netlify托管URL
- ✅ 全功能的AI照片修复平台  
- ✅ Supabase数据库支持
- ✅ 用户认证系统
- ✅ 照片上传和处理功能

## 📊 免费额度

**Netlify免费版:**
- ✅ 100GB月带宽
- ✅ 无限站点
- ✅ 125,000次函数调用/月
- ✅ 自定义域名支持

**Supabase免费版:**
- ✅ 500MB数据库存储
- ✅ 50,000次身份验证请求/月
- ✅ 2GB带宽

## 🔧 故障排除

如果遇到问题：

1. **构建失败**: 检查 `frontend/out` 目录是否存在
2. **函数错误**: 确保环境变量配置正确
3. **数据库连接失败**: 检查Supabase URL和密钥

## 📞 需要帮助？

如果部署过程中遇到问题，请检查：
- 构建日志：`npx netlify logs`
- 函数日志：Netlify Dashboard > Functions
- Supabase日志：Supabase Dashboard > Logs

---

💡 **提示**: 整个部署过程大约需要15-30分钟，完全免费！