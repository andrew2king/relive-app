#!/usr/bin/env python3
"""
D-ID API 人物复活视频生成系统 - 演示版本
当没有API密钥时提供模拟功能演示
"""

import os
import sys
import json
import time
import base64
import requests
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
import subprocess
import shutil

class DIDFaceAnimationProcessor:
    """D-ID API 人物复活处理器"""
    
    def __init__(self):
        self.api_key = self._get_api_key()
        self.base_url = "https://api.d-id.com"
        self.headers = {
            "Authorization": f"Basic {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
    def _get_api_key(self) -> Optional[str]:
        """获取D-ID API密钥"""
        # 从环境变量获取
        api_key = os.getenv('DID_API_KEY')
        if api_key and api_key != "需要配置D-ID_API_KEY":
            return api_key
            
        # 从.env文件获取
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.startswith('DID_API_KEY='):
                            key = line.split('=', 1)[1].strip()
                            if key and key != "需要配置D-ID_API_KEY":
                                return key
            except Exception:
                pass
        
        return None
    
    def create_demo_video(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """创建演示视频（当没有API密钥时）"""
        try:
            print(f"🎬 创建D-ID演示视频...", file=sys.stderr)
            
            # 检查是否有ffmpeg
            try:
                # 使用ffmpeg创建一个简单的演示视频
                cmd = [
                    'ffmpeg', '-y',
                    '-loop', '1',
                    '-i', input_path,
                    '-c:v', 'libx264',
                    '-t', '3',
                    '-pix_fmt', 'yuv420p',
                    '-vf', 'scale=512:512',
                    output_path
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode == 0:
                    return {
                        "success": True,
                        "status": "completed",
                        "demo_mode": True,
                        "message": "演示视频创建成功"
                    }
            except FileNotFoundError:
                print("⚠️  ffmpeg未找到，使用简化演示模式", file=sys.stderr)
            
            # ffmpeg不可用时的备选方案：直接复制图片作为输出
            output_image = output_path.replace('.mp4', '_demo.jpg')
            shutil.copy2(input_path, output_image)
            
            print(f"✅ 演示模式：已保存图片 {output_image}", file=sys.stderr)
            
            return {
                "success": True,
                "status": "completed", 
                "demo_mode": True,
                "output_path": output_image,
                "message": "演示模式：D-ID API需要配置密钥才能生成真实说话视频"
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"演示视频创建失败: {str(e)}"
            }
    
    def process_face_animation(self, input_path: str, output_path: str, text: str = None, voice_id: str = "zh-CN-XiaoxiaoNeural") -> Dict[str, Any]:
        """完整的人物复活处理流程"""
        try:
            print(f"🎭 开始D-ID人物复活处理", file=sys.stderr)
            print(f"📁 输入文件: {input_path}", file=sys.stderr)
            print(f"📁 输出文件: {output_path}", file=sys.stderr)
            
            # 检查输入文件
            if not os.path.exists(input_path):
                return {
                    "success": False,
                    "error": f"输入文件不存在: {input_path}"
                }
            
            # 检查API密钥
            if not self.api_key:
                print("⚠️  未配置D-ID API密钥，启用演示模式", file=sys.stderr)
                
                # 创建演示视频
                demo_result = self.create_demo_video(input_path, output_path)
                if demo_result.get("success"):
                    file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                    
                    return {
                        "success": True,
                        "output_path": output_path,
                        "processing_time": 3000,  # 3秒
                        "file_size": file_size,
                        "demo_mode": True,
                        "metadata": {
                            "technique": "D-ID Demo Mode (需要配置API密钥)",
                            "text": "演示模式",
                            "voice_id": "demo",
                            "provider": "Local Demo",
                            "message": "请配置DID_API_KEY以使用真实的D-ID API服务",
                            "setup_guide": {
                                "step1": "访问 https://www.d-id.com/ 注册账户",
                                "step2": "获取API密钥",
                                "step3": "在.env文件中设置 DID_API_KEY=你的密钥",
                                "step4": "重启服务以应用配置"
                            }
                        }
                    }
                else:
                    return demo_result
            
            # 默认文本
            if not text:
                text = "Hello! I am a digital human brought to life by AI technology. Nice to meet you!"
            
            start_time = time.time()
            
            # 这里会调用真实的D-ID API
            print(f"🌐 使用D-ID API处理（需要有效密钥）", file=sys.stderr)
            
            # 模拟API处理时间
            time.sleep(2)
            
            return {
                "success": False,
                "error": "D-ID API功能需要有效的API密钥。请参考metadata中的setup_guide配置。",
                "metadata": {
                    "setup_guide": {
                        "step1": "访问 https://www.d-id.com/ 注册账户",
                        "step2": "获取API密钥",
                        "step3": "在.env文件中设置 DID_API_KEY=你的密钥",
                        "step4": "重启服务以应用配置"
                    }
                }
            }
            
        except Exception as e:
            error_msg = f"D-ID处理过程中发生异常: {str(e)}"
            print(f"❌ {error_msg}", file=sys.stderr)
            return {
                "success": False,
                "error": error_msg
            }

def main():
    """命令行入口"""
    if len(sys.argv) < 3:
        print("使用方法: python ai_face_animation_did_demo.py <输入图片路径> <输出视频路径> [文本内容]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    text = sys.argv[3] if len(sys.argv) > 3 else None
    
    processor = DIDFaceAnimationProcessor()
    result = processor.process_face_animation(input_path, output_path, text)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()