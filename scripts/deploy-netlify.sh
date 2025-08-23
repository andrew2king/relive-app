#!/bin/bash

# 🚀 RELIVE AI - Netlify部署脚本

echo "🚀 开始部署RELIVE AI照片修复平台到Netlify..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录下运行此脚本"
    exit 1
fi

# 构建前端
echo "📦 构建前端应用..."
cd frontend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi
cd ..

# 检查构建输出
if [ ! -d "frontend/out" ]; then
    echo "❌ 构建输出目录不存在"
    exit 1
fi

echo "✅ 前端构建完成"

# 部署到Netlify
echo "🌐 部署到Netlify..."
echo ""
echo "📋 部署步骤:"
echo "1. 运行: npx netlify login (如果还未登录)"
echo "2. 运行: npx netlify init"
echo "3. 选择 'Create & configure a new site'"
echo "4. 设置 build command: cd frontend && npm run build"
echo "5. 设置 publish directory: frontend/out"
echo "6. 设置 functions directory: netlify/functions"
echo ""
echo "或者直接运行:"
echo "npx netlify deploy --prod --dir=frontend/out --functions=netlify/functions"
echo ""
echo "🔑 部署完成后，请在Netlify Dashboard中添加以下环境变量:"
echo "SUPABASE_URL=https://your-project-ref.supabase.co"
echo "SUPABASE_ANON_KEY=your-anon-key-here"
echo "SUPABASE_SERVICE_KEY=your-service-role-key-here"
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here"
echo ""
echo "✅ 构建完成，请按照上述步骤完成部署！"