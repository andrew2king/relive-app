#!/bin/bash
# ===================================
# RELIVE APP 环境配置脚本
# ===================================

echo "🚀 RELIVE APP 环境配置向导"
echo "============================"

# 检查 .env 文件是否存在
if [ -f ".env" ]; then
    echo "⚠️  .env 文件已存在"
    read -p "是否要重新配置? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "配置取消"
        exit 0
    fi
    echo "备份现有配置到 .env.backup"
    cp .env .env.backup
fi

# 复制模板文件
echo "📋 创建配置文件..."
cp .env.example .env

echo ""
echo "📝 请按照以下步骤配置API密钥:"
echo ""

# D-ID API配置
echo "1️⃣  D-ID API 配置 (人物复活功能)"
echo "   获取地址: https://www.d-id.com/"
echo "   步骤: 注册 → 登录 → Dashboard → API Keys → 创建密钥"
read -p "   请输入 D-ID API Key: " did_key
if [ ! -z "$did_key" ]; then
    sed -i.tmp "s/DID_API_KEY=your_d_id_api_key_here/DID_API_KEY=$did_key/" .env
    rm .env.tmp 2>/dev/null
    echo "   ✅ D-ID API Key 已配置"
else
    echo "   ⚠️  跳过 D-ID API Key 配置"
fi

echo ""

# 火山引擎API配置
echo "2️⃣  火山引擎API 配置 (图生视频功能)"
echo "   获取地址: https://console.volcengine.com/"
echo "   步骤: 注册 → 开通即梦服务 → 访问控制 → 访问密钥"
read -p "   请输入火山引擎 Access Key: " volc_access_key
read -p "   请输入火山引擎 Secret Key: " volc_secret_key
if [ ! -z "$volc_access_key" ] && [ ! -z "$volc_secret_key" ]; then
    sed -i.tmp "s/VOLC_ACCESSKEY=your_volc_access_key_here/VOLC_ACCESSKEY=$volc_access_key/" .env
    sed -i.tmp "s/VOLC_SECRETKEY=your_volc_secret_key_here/VOLC_SECRETKEY=$volc_secret_key/" .env
    rm .env.tmp 2>/dev/null
    echo "   ✅ 火山引擎API密钥已配置"
else
    echo "   ⚠️  跳过火山引擎API配置"
fi

echo ""

# 阿里云OSS配置
echo "3️⃣  阿里云OSS 配置 (云存储功能)"
echo "   获取地址: https://oss.console.aliyun.com/"
echo "   步骤: 创建存储桶(公共读) → RAM控制台 → 创建AccessKey"
read -p "   请输入阿里云OSS Access Key ID: " oss_key_id
read -p "   请输入阿里云OSS Access Key Secret: " oss_key_secret
read -p "   请输入OSS存储桶名称 (默认: relive-photos): " oss_bucket
oss_bucket=${oss_bucket:-relive-photos}

if [ ! -z "$oss_key_id" ] && [ ! -z "$oss_key_secret" ]; then
    sed -i.tmp "s/OSS_ACCESS_KEY_ID=your_oss_access_key_id_here/OSS_ACCESS_KEY_ID=$oss_key_id/" .env
    sed -i.tmp "s/OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret_here/OSS_ACCESS_KEY_SECRET=$oss_key_secret/" .env
    sed -i.tmp "s/OSS_BUCKET=relive-photos/OSS_BUCKET=$oss_bucket/" .env
    rm .env.tmp 2>/dev/null
    echo "   ✅ 阿里云OSS密钥已配置"
else
    echo "   ⚠️  跳过阿里云OSS配置"
fi

echo ""

# Replicate API (已配置)
echo "4️⃣  Replicate API (图像修复功能)"
echo "   ✅ 已预配置可用"

echo ""
echo "🎉 配置完成!"
echo ""
echo "📋 配置摘要:"
echo "============"
echo "D-ID API:     $([ ! -z "$did_key" ] && echo "✅ 已配置" || echo "⚠️  未配置")"
echo "火山引擎API:   $([ ! -z "$volc_access_key" ] && echo "✅ 已配置" || echo "⚠️  未配置")"
echo "阿里云OSS:    $([ ! -z "$oss_key_id" ] && echo "✅ 已配置" || echo "⚠️  未配置")"
echo "Replicate:   ✅ 已配置"
echo ""
echo "📖 更多配置说明请查看: CONFIG.md"
echo ""
echo "🚀 现在可以启动服务:"
echo "   npm run dev"
echo ""
echo "🔍 配置测试:"
echo "   python3 python/cloud_storage.py test-image.jpg"
echo "   python3 python/ai_face_animation_did.py test-image.jpg output.mp4"
echo ""

# 权限提醒
echo "⚠️  重要提醒:"
echo "1. 确保OSS存储桶权限设置为'公共读'"
echo "2. 确认各API服务已开通并有足够额度"
echo "3. 定期检查API使用量和费用"
echo "4. 不要将 .env 文件提交到版本控制系统"
echo ""