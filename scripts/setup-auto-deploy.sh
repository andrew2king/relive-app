#!/bin/bash

# 🚀 RELIVE AI - GitHub自动部署设置脚本

echo "🚀 设置GitHub自动部署到Netlify..."

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录下运行此脚本"
    exit 1
fi

echo "📋 自动化部署设置步骤："
echo ""

echo "1️⃣  创建Netlify站点"
echo "   访问: https://app.netlify.com"
echo "   点击: New site from Git → GitHub"
echo "   选择: andrew2king/relive-app 仓库"
echo "   构建设置:"
echo "   - Build command: cd frontend && npm run build"
echo "   - Publish directory: frontend/out"
echo "   - Functions directory: netlify/functions"
echo ""

echo "2️⃣  获取Netlify密钥"
echo "   Netlify Dashboard → Site settings → Site information"
echo "   复制: Site ID (例如: abc123def-456g-789h-ijkl-mnopqrstuvwx)"
echo ""
echo "   Netlify Dashboard → User settings → Personal access tokens"
echo "   创建新token，复制token值"
echo ""

echo "3️⃣  在GitHub设置Secrets"
echo "   访问: https://github.com/andrew2king/relive-app/settings/secrets/actions"
echo "   添加以下Secrets:"
echo "   - NETLIFY_SITE_ID: [你的Site ID]"
echo "   - NETLIFY_AUTH_TOKEN: [你的Personal Access Token]"
echo ""

echo "4️⃣  配置Supabase环境变量"
echo "   在Netlify Dashboard → Site settings → Environment variables 添加:"
echo "   - SUPABASE_URL=https://your-project-ref.supabase.co"
echo "   - SUPABASE_ANON_KEY=your-anon-key-here"
echo "   - SUPABASE_SERVICE_KEY=your-service-role-key-here"
echo "   - NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here"
echo ""

echo "5️⃣  测试自动部署"
echo "   推送代码到main分支即可触发自动部署"
echo "   git add . && git commit -m \"Test auto deploy\" && git push origin main"
echo ""

echo "✅ 自动化部署配置完成！"
echo ""
echo "📊 工作流程:"
echo "   代码推送 → GitHub Actions → 自动构建 → 部署到Netlify"
echo ""
echo "🔍 监控部署:"
echo "   GitHub: https://github.com/andrew2king/relive-app/actions"
echo "   Netlify: https://app.netlify.com/sites/[your-site]/deploys"