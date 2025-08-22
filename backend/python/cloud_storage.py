#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
云存储服务模块
支持将本地图片上传到阿里云OSS并获取公网访问URL
"""

import os
import sys
import time
import hashlib
from urllib.parse import quote
import oss2

class CloudStorageService:
    def __init__(self):
        """初始化云存储服务"""
        # 从环境变量获取配置
        self.access_key_id = os.getenv('OSS_ACCESS_KEY_ID')
        self.access_key_secret = os.getenv('OSS_ACCESS_KEY_SECRET')
        self.bucket_name = os.getenv('OSS_BUCKET', 'relive-photos')
        self.endpoint = os.getenv('OSS_ENDPOINT', 'oss-cn-hangzhou.aliyuncs.com')
        self.region = os.getenv('OSS_REGION', 'cn-hangzhou')
        
        # 检查必要的配置
        if not self.access_key_id or not self.access_key_secret:
            print("⚠️  OSS配置不完整，使用演示模式", file=sys.stderr)
            self.enabled = False
            return
        
        if self.access_key_id.startswith('需要配置') or self.access_key_secret.startswith('需要配置'):
            print("⚠️  OSS密钥未配置，使用演示模式", file=sys.stderr)
            self.enabled = False
            return
            
        try:
            # 创建OSS认证和Bucket对象
            auth = oss2.Auth(self.access_key_id, self.access_key_secret)
            self.bucket = oss2.Bucket(auth, self.endpoint, self.bucket_name)
            self.enabled = True
            print(f"✅ OSS云存储服务初始化成功: {self.bucket_name}", file=sys.stderr)
        except Exception as e:
            print(f"❌ OSS初始化失败: {e}", file=sys.stderr)
            self.enabled = False
    
    def generate_object_key(self, local_path, folder="images"):
        """
        生成OSS对象键名
        Args:
            local_path: 本地文件路径
            folder: OSS存储文件夹名称
        Returns:
            str: OSS对象键名
        """
        # 获取文件扩展名
        _, ext = os.path.splitext(local_path)
        
        # 使用文件内容的MD5作为文件名（避免重复上传）
        try:
            with open(local_path, 'rb') as f:
                file_hash = hashlib.md5(f.read()).hexdigest()
        except:
            # 如果无法读取文件，使用时间戳
            file_hash = str(int(time.time() * 1000))
        
        # 构建对象键名：folder/hash.ext
        object_key = f"{folder}/{file_hash}{ext.lower()}"
        return object_key
    
    def upload_image(self, local_path, folder="images"):
        """
        上传图片到OSS
        Args:
            local_path: 本地图片路径
            folder: OSS存储文件夹名称，默认为"images"
        Returns:
            dict: 包含成功状态和公网URL的字典
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "OSS云存储服务未启用",
                "public_url": None
            }
        
        if not os.path.exists(local_path):
            return {
                "success": False,
                "error": f"本地文件不存在: {local_path}",
                "public_url": None
            }
        
        try:
            # 生成对象键名
            object_key = self.generate_object_key(local_path, folder)
            print(f"📤 开始上传图片到OSS: {object_key}", file=sys.stderr)
            
            # 检查文件是否已经存在
            if self.bucket.object_exists(object_key):
                print(f"✅ 文件已存在，跳过上传: {object_key}", file=sys.stderr)
            else:
                # 上传文件
                result = self.bucket.put_object_from_file(object_key, local_path)
                print(f"✅ 上传成功: {object_key}", file=sys.stderr)
            
            # 生成公网访问URL
            public_url = f"https://{self.bucket_name}.{self.endpoint}/{quote(object_key)}"
            
            return {
                "success": True,
                "public_url": public_url,
                "object_key": object_key,
                "bucket": self.bucket_name
            }
            
        except Exception as e:
            print(f"❌ 上传失败: {e}", file=sys.stderr)
            return {
                "success": False,
                "error": f"上传失败: {str(e)}",
                "public_url": None
            }
    
    def delete_image(self, object_key):
        """
        删除OSS中的图片
        Args:
            object_key: OSS对象键名
        Returns:
            dict: 包含操作结果的字典
        """
        if not self.enabled:
            return {"success": False, "error": "OSS云存储服务未启用"}
        
        try:
            self.bucket.delete_object(object_key)
            print(f"✅ 删除成功: {object_key}", file=sys.stderr)
            return {"success": True}
        except Exception as e:
            print(f"❌ 删除失败: {e}", file=sys.stderr)
            return {"success": False, "error": f"删除失败: {str(e)}"}
    
    def generate_presigned_url(self, object_key, expires=3600):
        """
        生成预签名URL（临时访问URL）
        Args:
            object_key: OSS对象键名
            expires: 过期时间（秒），默认1小时
        Returns:
            str: 预签名URL
        """
        if not self.enabled:
            return None
        
        try:
            url = self.bucket.sign_url('GET', object_key, expires)
            return url
        except Exception as e:
            print(f"❌ 生成预签名URL失败: {e}", file=sys.stderr)
            return None

def main():
    """测试函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='云存储服务测试')
    parser.add_argument('image_path', help='要上传的图片路径')
    parser.add_argument('--folder', default='test', help='OSS存储文件夹')
    
    args = parser.parse_args()
    
    # 创建云存储服务实例
    storage = CloudStorageService()
    
    # 上传图片
    result = storage.upload_image(args.image_path, args.folder)
    
    if result['success']:
        print(f"🎉 上传成功！")
        print(f"📍 公网URL: {result['public_url']}")
        print(f"📦 OSS路径: {result['object_key']}")
    else:
        print(f"❌ 上传失败: {result['error']}")

if __name__ == "__main__":
    main()