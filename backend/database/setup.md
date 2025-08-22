# PostgreSQL 数据库设置指南

## 快速设置（macOS）

### 1. 安装 PostgreSQL
```bash
# 使用 Homebrew 安装
brew install postgresql@14

# 启动 PostgreSQL 服务
brew services start postgresql@14
```

### 2. 创建数据库和用户
```bash
# 连接到 PostgreSQL
psql postgres

# 在 psql 中执行以下命令：
CREATE DATABASE relive_app;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE relive_app TO postgres;
ALTER USER postgres CREATEDB;
\q
```

### 3. 运行数据库迁移
```bash
# 在项目根目录执行
npm run db:generate  # 生成 Prisma 客户端
npm run migrate      # 运行数据库迁移
```

### 4. (可选) 填充测试数据
```bash
npm run seed
```

## 验证安装

### 检查数据库连接
```bash
psql -U postgres -d relive_app -h localhost -p 5432
```

### 测试应用连接
重启开发服务器后应该看到：
```
✅ Database connected successfully
```

## 故障排除

### 连接被拒绝
```
Error: connect ECONNREFUSED ::1:5432
```
解决方案：
1. 确保 PostgreSQL 服务正在运行：`brew services start postgresql@14`
2. 检查端口是否正确：`lsof -i :5432`

### 认证失败
```
Error: password authentication failed
```
解决方案：
1. 重置密码：`ALTER USER postgres PASSWORD 'password';`
2. 检查 .env 文件中的 DATABASE_URL

### 权限错误
```
Error: permission denied for database relive_app
```
解决方案：
```sql
GRANT ALL PRIVILEGES ON DATABASE relive_app TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
```

## 生产环境配置

生产环境建议使用托管的 PostgreSQL 服务：
- AWS RDS
- Google Cloud SQL
- Heroku Postgres
- Supabase
- PlanetScale

更新 .env 文件中的 DATABASE_URL 即可。