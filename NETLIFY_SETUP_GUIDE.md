# 🌐 Netlify 手动部署设置指南

## 🔧 GitHub Actions 失败的原因

GitHub Actions 失败是因为缺少必要的 Netlify Secrets：
- `NETLIFY_AUTH_TOKEN` 
- `NETLIFY_SITE_ID`

**解决方案：使用Netlify原生GitHub集成（更简单、更可靠）**

## 🚀 推荐方案：Netlify GitHub 集成

### 步骤1: 连接GitHub到Netlify

1. **访问 Netlify**: https://app.netlify.com
2. **点击**: "Add new site" → "Import from Git"  
3. **选择**: "GitHub"
4. **选择仓库**: `andrew2king/relive-app`
5. **确认授权**

### 步骤2: 配置构建设置

Netlify会自动检测到 `netlify.toml` 配置，但请确认：

- **Build command**: `cd frontend && npm run build`
- **Publish directory**: `frontend/out`
- **Functions directory**: `netlify/functions`

### 步骤3: 部署

点击 "Deploy site" - Netlify将：
- ✅ 自动检出代码
- ✅ 安装依赖
- ✅ 构建应用
- ✅ 部署到CDN

## 🔄 自动化部署

连接成功后：
- **每次推送到main分支** → 自动触发部署
- **Pull Request** → 创建预览部署
- **构建状态** → 显示在GitHub

## 🔑 配置环境变量

部署成功后，在Netlify Dashboard添加环境变量：

**Site settings → Environment variables → Add variable**

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📊 监控部署

- **Netlify Dashboard**: 实时构建日志
- **GitHub**: 构建状态徽章
- **域名**: 自动生成的 `.netlify.app` 域名

## 🎯 优势

相比GitHub Actions方式：
- ✅ **无需配置Secrets**
- ✅ **更好的错误报告**  
- ✅ **自动预览部署**
- ✅ **域名管理集成**
- ✅ **表单处理支持**

---

**🎊 这种方式更简单、更可靠，是Netlify的推荐部署方法！**