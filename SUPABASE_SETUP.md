# 📚 Supabase数据库设置完整指南

## 🎯 第一步：创建Supabase项目

1. **访问Supabase**
   - 打开 https://supabase.com
   - 点击 "Start your project"
   - 使用GitHub账户登录

2. **创建新项目**
   - 点击 "New Project"
   - Organization: 选择个人账户
   - 项目名称: `relive-app`
   - 数据库密码: 设置一个强密码（记住这个密码！）
   - 地区: 选择 `Northeast Asia (ap-northeast-1)` (距离中国最近)
   - 点击 "Create new project"

⏰ **等待时间**: 大约2-3分钟项目创建完成

## 🗄️ 第二步：设置数据库表结构

项目创建完成后：

1. **进入SQL Editor**
   - 左侧菜单点击 "SQL Editor"
   - 点击 "New query"

2. **执行建表SQL**
   
复制粘贴以下SQL代码并执行：

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

-- 创建积分交易记录表
CREATE TABLE credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'purchased', 'refund'
    description TEXT,
    reference_id UUID, -- 关联的照片ID或订单ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户会话表 (可选，用于扩展功能)
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引提升查询性能
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);

CREATE INDEX idx_processing_tasks_user_id ON processing_tasks(user_id);
CREATE INDEX idx_processing_tasks_status ON processing_tasks(status);
CREATE INDEX idx_processing_tasks_photo_id ON processing_tasks(photo_id);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 创建触发器自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_tasks_updated_at BEFORE UPDATE ON processing_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例数据 (可选)
INSERT INTO users (email, username, credits) VALUES 
('demo@relive-app.com', 'demo_user', 500);

-- 创建RLS (Row Level Security) 政策
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own photos" ON photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON photos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON photos
    FOR DELETE USING (auth.uid() = user_id);

-- 处理任务政策
CREATE POLICY "Users can view own tasks" ON processing_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON processing_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 积分交易政策
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. **点击"Run"执行SQL**

✅ 如果看到 "Success. No rows returned" 表示表创建成功！

## 🔑 第三步：配置身份验证

1. **进入Authentication设置**
   - 左侧菜单点击 "Authentication"
   - 点击 "Settings"

2. **配置认证设置**
   - Site URL: 暂时填写 `http://localhost:3000`
   - 启用 "Email" 提供商
   - 确认邮件: 可以暂时关闭 (开发阶段)

3. **邮件模板 (可选)**
   - 点击 "Email Templates"
   - 自定义确认邮件模板

## 🔧 第四步：获取API密钥

1. **进入API设置**
   - 左侧菜单点击 "Settings"
   - 点击 "API"

2. **复制重要信息**
   ```
   Project URL: https://your-project-ref.supabase.co
   anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **重要**: 
- `anon key` 可以在前端使用
- `service_role key` 只能在后端使用，不要暴露！

## 📋 第五步：配置环境变量

将以下信息保存到 `.env.local` 文件中：

```bash
# Supabase配置
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# 前端环境变量
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🧪 第六步：测试数据库连接

1. **在Supabase Dashboard测试**
   - 进入 "Table Editor"
   - 点击 "users" 表
   - 尝试添加一条测试数据

2. **测试API连接**
   ```bash
   # 测试健康检查
   curl https://your-netlify-site.netlify.app/.netlify/functions/api/health
   ```

## 🔒 第七步：安全配置

1. **设置RLS策略**
   - 已在SQL中配置，确保用户只能访问自己的数据

2. **配置CORS (跨域)**
   - Authentication > Settings
   - Additional URLs: 添加你的Netlify域名

3. **数据库访问限制**
   - Settings > Database
   - 配置网络访问限制（可选）

## 📊 第八步：监控和日志

1. **查看实时日志**
   - 左侧菜单 "Logs"
   - 查看API请求和错误

2. **监控使用情况**
   - Settings > Usage
   - 查看数据库大小和API调用次数

## 🎯 免费额度说明

**Supabase免费版包含:**
- ✅ 500MB数据库存储
- ✅ 50,000次身份验证请求/月
- ✅ 500MB数据传输/月
- ✅ 2GB带宽
- ✅ 50MB文件上传
- ✅ 实时订阅
- ✅ 2个免费项目

**超出限制后:**
- 数据库会暂停，但数据不丢失
- 升级到付费版恢复服务 ($25/月起)

## 🔄 第九步：集成到Netlify

在Netlify站点设置中添加环境变量:

1. 进入Netlify Dashboard
2. 选择你的站点
3. Settings > Environment variables
4. 添加以下变量:

```
SUPABASE_URL = https://your-project-ref.supabase.co
SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_SERVICE_KEY = your-service-role-key-here
NEXT_PUBLIC_SUPABASE_URL = https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
```

## ✅ 完成检查清单

- [ ] Supabase项目创建完成
- [ ] 数据库表结构创建完成
- [ ] 身份验证配置完成
- [ ] API密钥获取完成
- [ ] 环境变量配置完成
- [ ] RLS安全策略设置完成
- [ ] 测试连接成功

---

🎉 **恭喜！Supabase数据库设置完成！**

现在你可以继续Netlify部署流程了。