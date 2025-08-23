# 🚀 一键自动部署到Netlify

## 点击下方按钮开始自动部署：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/andrew2king/relive-app)

## 📋 部署配置信息

当Netlify询问构建设置时，请使用以下配置：

- **Build command**: `cd frontend && npm run build`
- **Publish directory**: `frontend/out`
- **Functions directory**: `netlify/functions`

## 🔧 环境变量配置

部署后，在Netlify Dashboard中添加以下环境变量：

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🎯 自动部署流程

1. **点击部署按钮** → 连接GitHub仓库
2. **确认设置** → 开始首次部署  
3. **配置环境变量** → 重新部署
4. **完成！** → 每次推送代码都会自动部署

---

**部署后你将获得：**
- ✅ 自动化CI/CD流程
- ✅ HTTPS加密域名
- ✅ 全球CDN加速
- ✅ 自动SSL证书