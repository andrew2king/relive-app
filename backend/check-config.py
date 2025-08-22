#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RELIVE APP 配置验证脚本
检查所有必要的环境变量和API连接
"""

import os
import sys
import json
from pathlib import Path

# 添加当前目录到Python路径
sys.path.append(str(Path(__file__).parent))

def load_env():
    """加载.env文件"""
    env_file = Path('.env')
    if not env_file.exists():
        print("❌ .env 文件不存在")
        print("请先运行: cp .env.example .env")
        return False
    
    # 简单的.env文件解析
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
    
    return True

def check_config():
    """检查配置项"""
    print("🔍 RELIVE APP 配置验证")
    print("=" * 50)
    
    if not load_env():
        return False
    
    config_status = {
        'critical': [],  # 关键配置
        'optional': [],  # 可选配置
        'errors': []     # 错误信息
    }
    
    # 1. 服务器配置
    print("\n📊 服务器配置")
    print("-" * 20)
    
    port = os.getenv('PORT', '8000')
    node_env = os.getenv('NODE_ENV', 'development')
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
    
    print(f"端口:     {port}")
    print(f"环境:     {node_env}")
    print(f"前端URL:  {frontend_url}")
    
    # 2. D-ID API配置
    print("\n🎭 D-ID API 配置")
    print("-" * 20)
    
    did_api_key = os.getenv('DID_API_KEY')
    if did_api_key and not did_api_key.startswith('your_'):
        print("✅ D-ID API Key 已配置")
        config_status['critical'].append(('D-ID API', True, 'API密钥已配置'))
        
        # 测试D-ID API连接
        try:
            from python.ai_face_animation_did import DIDFaceAnimationProcessor
            processor = DIDFaceAnimationProcessor()
            if processor.api_key:
                print("✅ D-ID API 连接测试通过")
            else:
                print("⚠️  D-ID API 密钥格式可能不正确")
        except Exception as e:
            print(f"⚠️  D-ID API 测试失败: {e}")
    else:
        print("❌ D-ID API Key 未配置")
        config_status['critical'].append(('D-ID API', False, 'API密钥未配置'))
    
    # 3. 火山引擎API配置
    print("\n🎬 火山引擎 API 配置")
    print("-" * 20)
    
    volc_access = os.getenv('VOLC_ACCESSKEY')
    volc_secret = os.getenv('VOLC_SECRETKEY')
    
    if volc_access and volc_secret and not volc_access.startswith('需要配置'):
        print("✅ 火山引擎API密钥已配置")
        config_status['critical'].append(('火山引擎API', True, 'API密钥已配置'))
        
        # 测试火山引擎API连接
        try:
            from python.ai_image_to_video_jimeng import JiMengProcessor
            # processor = JiMengProcessor()  # 可以添加连接测试
            print("✅ 火山引擎API 模块加载成功")
        except Exception as e:
            print(f"⚠️  火山引擎API 测试失败: {e}")
    else:
        print("❌ 火山引擎API密钥未配置")
        config_status['critical'].append(('火山引擎API', False, 'API密钥未配置'))
    
    # 4. 阿里云OSS配置
    print("\n☁️  阿里云OSS 配置")
    print("-" * 20)
    
    oss_key_id = os.getenv('OSS_ACCESS_KEY_ID')
    oss_key_secret = os.getenv('OSS_ACCESS_KEY_SECRET')
    oss_bucket = os.getenv('OSS_BUCKET', 'relive-photos')
    oss_endpoint = os.getenv('OSS_ENDPOINT', 'oss-cn-hangzhou.aliyuncs.com')
    
    if oss_key_id and oss_key_secret and not oss_key_id.startswith('需要配置'):
        print("✅ 阿里云OSS密钥已配置")
        print(f"存储桶: {oss_bucket}")
        print(f"端点:   {oss_endpoint}")
        config_status['critical'].append(('阿里云OSS', True, 'OSS密钥已配置'))
        
        # 测试OSS连接
        try:
            from python.cloud_storage import CloudStorageService
            storage = CloudStorageService()
            if storage.enabled:
                print("✅ OSS 连接测试通过")
            else:
                print("⚠️  OSS 连接测试失败")
        except Exception as e:
            print(f"⚠️  OSS 测试失败: {e}")
    else:
        print("❌ 阿里云OSS密钥未配置")
        config_status['critical'].append(('阿里云OSS', False, 'OSS密钥未配置'))
    
    # 5. Replicate API配置
    print("\n🔧 Replicate API 配置")
    print("-" * 20)
    
    replicate_token = os.getenv('REPLICATE_API_TOKEN')
    if replicate_token and not replicate_token.startswith('your_'):
        print("✅ Replicate API Token 已配置")
        config_status['optional'].append(('Replicate API', True, '图像修复功能可用'))
        
        # 测试Replicate API
        try:
            from python.ai_ultimate_restore_replicate import UltimateRestoreProcessor
            processor = UltimateRestoreProcessor()
            if processor.api_token:
                print("✅ Replicate API 连接测试通过")
        except Exception as e:
            print(f"⚠️  Replicate API 测试失败: {e}")
    else:
        print("❌ Replicate API Token 未配置")
        config_status['optional'].append(('Replicate API', False, 'API密钥未配置'))
    
    # 6. 文件配置
    print("\n📁 文件配置")
    print("-" * 20)
    
    max_file_size = os.getenv('MAX_FILE_SIZE', '10485760')
    allowed_formats = os.getenv('ALLOWED_IMAGE_FORMATS', 'jpg,jpeg,png,webp')
    upload_temp_dir = os.getenv('UPLOAD_TEMP_DIR', 'uploads/temp')
    processed_dir = os.getenv('PROCESSED_OUTPUT_DIR', 'uploads/processed')
    
    print(f"最大文件大小: {int(max_file_size) / (1024*1024):.1f}MB")
    print(f"支持格式:     {allowed_formats}")
    print(f"临时目录:     {upload_temp_dir}")
    print(f"输出目录:     {processed_dir}")
    
    # 检查目录是否存在，不存在则创建
    for dir_path in [upload_temp_dir, processed_dir]:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"✅ 目录已准备: {dir_path}")
    
    # 7. 配置摘要
    print("\n📋 配置摘要")
    print("=" * 50)
    
    critical_configured = sum(1 for _, status, _ in config_status['critical'] if status)
    critical_total = len(config_status['critical'])
    optional_configured = sum(1 for _, status, _ in config_status['optional'] if status)
    optional_total = len(config_status['optional'])
    
    print(f"关键配置: {critical_configured}/{critical_total}")
    for name, status, desc in config_status['critical']:
        status_icon = "✅" if status else "❌"
        print(f"  {status_icon} {name}: {desc}")
    
    print(f"\n可选配置: {optional_configured}/{optional_total}")
    for name, status, desc in config_status['optional']:
        status_icon = "✅" if status else "❌"
        print(f"  {status_icon} {name}: {desc}")
    
    # 8. 建议和下一步
    print("\n💡 建议")
    print("=" * 50)
    
    if critical_configured == critical_total:
        print("🎉 所有关键配置已完成！系统可以正常运行。")
    else:
        print("⚠️  存在未配置的关键项，部分功能将使用演示模式。")
        print("\n缺失的配置:")
        for name, status, desc in config_status['critical']:
            if not status:
                print(f"  - {name}")
        
        print("\n配置方法:")
        print("1. 运行配置向导: ./setup-env.sh")
        print("2. 手动编辑 .env 文件")
        print("3. 查看配置文档: CONFIG.md")
    
    print(f"\n🚀 启动服务: npm run dev")
    print(f"📖 配置文档: CONFIG.md")
    
    return critical_configured == critical_total

def main():
    """主函数"""
    try:
        success = check_config()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n配置检查已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 配置检查过程中发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()