#!/usr/bin/env python3
"""
D-ID API 测试脚本
"""

import os
import requests
import json

def test_did_api():
    # 检查API密钥
    api_key = os.getenv('DID_API_KEY')
    print(f"API Key exists: {api_key is not None}")
    print(f"API Key value: {api_key}")
    
    if not api_key or api_key == "需要配置D-ID_API_KEY":
        print("❌ D-ID API密钥未配置")
        return
    
    # 测试API连接
    try:
        headers = {
            "Authorization": f"Basic {api_key}",
            "Content-Type": "application/json"
        }
        
        print("Testing D-ID API connection...")
        
        # 简单的API测试
        response = requests.get(
            "https://api.d-id.com/talks",
            headers=headers,
            timeout=10
        )
        
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_did_api()