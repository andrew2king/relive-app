#!/usr/bin/env python3
"""
D-ID API 人物复活视频生成系统
支持将静态人物照片转换为说话的视频
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
from cloud_storage import CloudStorageService

class DIDFaceAnimationProcessor:
    """D-ID API 人物复活处理器"""
    
    def __init__(self):
        self.api_key = self._get_api_key()
        self.base_url = "https://api.d-id.com"
        self.cloud_storage = CloudStorageService()
        
        if self.api_key:
            self.headers = {
                "Authorization": f"Basic {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        else:
            self.headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        
    def _get_api_key(self) -> Optional[str]:
        """获取D-ID API密钥"""
        # 从环境变量获取
        api_key = os.getenv('DID_API_KEY')
        if api_key:
            # 如果是base64编码的密钥，需要解码
            if ':' in api_key:
                try:
                    import base64
                    decoded = base64.b64decode(api_key).decode('utf-8')
                    return decoded.split(':')[1] if ':' in decoded else api_key
                except:
                    return api_key
            return api_key
            
        # 从.env文件获取
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            with open(env_file, 'r') as f:
                for line in f:
                    if line.startswith('DID_API_KEY='):
                        key = line.split('=', 1)[1].strip()
                        # 如果是base64编码的密钥，需要解码
                        if ':' in key:
                            try:
                                import base64
                                decoded = base64.b64decode(key).decode('utf-8')
                                return decoded.split(':')[1] if ':' in decoded else key
                            except:
                                return key
                        return key
        
        return None
    
    def encode_image_to_base64_url(self, image_path: str) -> str:
        """将图片编码为base64 data URL"""
        try:
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
                base64_encoded = base64.b64encode(image_data).decode('utf-8')
                
                # 检测图片格式
                if image_path.lower().endswith('.png'):
                    mime_type = 'image/png'
                elif image_path.lower().endswith('.jpg') or image_path.lower().endswith('.jpeg'):
                    mime_type = 'image/jpeg'
                else:
                    mime_type = 'image/jpeg'  # 默认
                
                return f"data:{mime_type};base64,{base64_encoded}"
        except Exception as e:
            print(f"❌ 图片编码失败: {e}", file=sys.stderr)
            return ""
    
    def create_demo_video(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """创建演示视频（当API调用失败时的回退方案）"""
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
                "message": "演示模式：D-ID API需要有效密钥才能生成真实说话视频"
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"演示视频创建失败: {str(e)}"
            }
    
    def create_talking_video(self, image_path: str, text: str, voice_id: str = "zh-CN-XiaoxiaoNeural", output_path: str = None) -> Dict[str, Any]:
        """创建说话视频任务"""
        try:
            if not self.api_key:
                # 如果没有API密钥，尝试使用演示模式
                print("⚠️  未配置D-ID API密钥，将使用本地演示处理", file=sys.stderr)
                return {
                    "success": False,
                    "error": "D-ID API密钥未配置，请在.env文件中设置DID_API_KEY",
                    "demo_mode": True
                }
            
            print(f"🎬 开始创建D-ID说话视频...", file=sys.stderr)
            
            # 检查图片文件
            if not os.path.exists(image_path):
                return {
                    "success": False,
                    "error": f"输入图片文件不存在: {image_path}"
                }
            
            # 上传图片到云存储获取公网URL
            print(f"📤 上传图片到云存储...", file=sys.stderr)
            upload_result = self.cloud_storage.upload_image(image_path, "did-images")
            
            if not upload_result['success']:
                print(f"⚠️  云存储上传失败，使用演示模式: {upload_result['error']}", file=sys.stderr)
                return self._fallback_to_demo(image_path, output_path, text)
            
            image_url = upload_result['public_url']
            print(f"✅ 图片上传成功: {image_url}", file=sys.stderr)
            
            # 构建请求数据 - 根据D-ID API文档格式
            payload = {
                "script": {
                    "type": "text",
                    "input": text,
                    "provider": {
                        "type": "microsoft",
                        "voice_id": voice_id
                    }
                },
                "source_url": image_url
            }
            
            print(f"📤 发送创建请求到D-ID API...", file=sys.stderr)
            
            # 发送创建请求
            response = requests.post(
                f"{self.base_url}/talks",
                headers=self.headers,
                json=payload,
                timeout=30,
                verify=True
            )
            
            if response.status_code == 201:
                result = response.json()
                talk_id = result.get('id')
                print(f"✅ 视频创建任务已提交，ID: {talk_id}", file=sys.stderr)
                
                return {
                    "success": True,
                    "talk_id": talk_id,
                    "status": "created",
                    "message": "视频生成任务已创建"
                }
            else:
                error_msg = f"创建失败，状态码: {response.status_code}"
                try:
                    error_data = response.json()
                    print(f"🔍 完整响应数据: {error_data}", file=sys.stderr)
                    error_msg += f", 错误: {error_data.get('description', error_data.get('message', '未知错误'))}"
                    if 'details' in error_data:
                        error_msg += f", 详情: {error_data['details']}"
                except:
                    error_msg += f", 响应: {response.text}"
                    print(f"🔍 原始响应: {response.text}", file=sys.stderr)
                
                print(f"❌ {error_msg}", file=sys.stderr)
                return {
                    "success": False,
                    "error": error_msg
                }
                
        except Exception as e:
            error_msg = f"创建视频时发生异常: {str(e)}"
            print(f"❌ {error_msg}", file=sys.stderr)
            return {
                "success": False,
                "error": error_msg
            }
    
    def get_talk_status(self, talk_id: str) -> Dict[str, Any]:
        """获取视频生成状态"""
        try:
            response = requests.get(
                f"{self.base_url}/talks/{talk_id}",
                headers=self.headers,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                status = result.get('status', 'unknown')
                
                return {
                    "success": True,
                    "status": status,
                    "result_url": result.get('result_url'),
                    "created_at": result.get('created_at'),
                    "started_at": result.get('started_at'),
                    "completed_at": result.get('completed_at')
                }
            else:
                return {
                    "success": False,
                    "error": f"查询状态失败，状态码: {response.status_code}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"查询状态时发生异常: {str(e)}"
            }
    
    def wait_for_completion(self, talk_id: str, max_wait_time: int = 300) -> Dict[str, Any]:
        """等待视频生成完成"""
        start_time = time.time()
        print(f"⏳ 等待视频生成完成，最大等待时间: {max_wait_time}秒", file=sys.stderr)
        
        while time.time() - start_time < max_wait_time:
            status_result = self.get_talk_status(talk_id)
            
            if not status_result.get("success"):
                return status_result
            
            status = status_result.get("status")
            print(f"📊 当前状态: {status}", file=sys.stderr)
            
            if status == "done":
                return {
                    "success": True,
                    "status": "completed",
                    "result_url": status_result.get("result_url"),
                    "processing_time": int(time.time() - start_time)
                }
            elif status == "error":
                return {
                    "success": False,
                    "error": "视频生成失败"
                }
            elif status in ["created", "started"]:
                time.sleep(5)  # 等待5秒后重新检查
                continue
            else:
                time.sleep(3)  # 其他状态等待3秒
        
        return {
            "success": False,
            "error": f"视频生成超时（超过{max_wait_time}秒）"
        }
    
    def download_video(self, video_url: str, output_path: str) -> bool:
        """下载生成的视频"""
        try:
            print(f"📥 正在下载视频: {video_url}", file=sys.stderr)
            
            response = requests.get(video_url, stream=True, timeout=60)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ 视频下载完成: {output_path}", file=sys.stderr)
            return True
            
        except Exception as e:
            print(f"❌ 视频下载失败: {e}", file=sys.stderr)
            return False
    
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
            
            # 默认文本
            if not text:
                text = "Hello! I am a digital human brought to life by AI technology. Nice to meet you! Through advanced artificial intelligence, I can speak and express emotions just like a real person."
            
            start_time = time.time()
            
            # 1. 创建说话视频任务
            create_result = self.create_talking_video(input_path, text, voice_id, output_path)
            if not create_result.get("success"):
                # 如果API调用失败，回退到演示模式
                print("⚠️  D-ID API调用失败，回退到演示模式", file=sys.stderr)
                demo_result = self.create_demo_video(input_path, output_path)
                if demo_result.get("success"):
                    file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                    return {
                        "success": True,
                        "output_path": output_path,
                        "processing_time": 3000,
                        "file_size": file_size,
                        "demo_mode": True,
                        "metadata": {
                            "technique": "D-ID API调用失败，回退到演示模式",
                            "text": text,
                            "voice_id": voice_id,
                            "provider": "Local Demo Fallback",
                            "api_error": create_result.get("error", "Unknown error")
                        }
                    }
                return create_result
            
            talk_id = create_result.get("talk_id")
            
            # 2. 等待处理完成
            completion_result = self.wait_for_completion(talk_id, max_wait_time=300)
            if not completion_result.get("success"):
                return completion_result
            
            video_url = completion_result.get("result_url")
            if not video_url:
                return {
                    "success": False,
                    "error": "未获取到视频下载链接"
                }
            
            # 3. 下载视频
            if not self.download_video(video_url, output_path):
                return {
                    "success": False,
                    "error": "视频下载失败"
                }
            
            total_time = time.time() - start_time
            
            # 获取文件大小
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            
            print(f"🎉 D-ID人物复活处理完成！", file=sys.stderr)
            
            return {
                "success": True,
                "output_path": output_path,
                "processing_time": int(total_time * 1000),  # 转换为毫秒
                "file_size": file_size,
                "video_url": video_url,
                "talk_id": talk_id,
                "metadata": {
                    "technique": "D-ID Talking Head Generation",
                    "text": text,
                    "voice_id": voice_id,
                    "provider": "D-ID API",
                    "processing_time_seconds": int(total_time)
                }
            }
            
        except Exception as e:
            error_msg = f"D-ID处理过程中发生异常: {str(e)}"
            print(f"❌ {error_msg}", file=sys.stderr)
            return {
                "success": False,
                "error": error_msg
            }
    
    def _fallback_to_demo(self, image_path: str, output_path: str, text: str) -> Dict[str, Any]:
        """回退到演示模式"""
        print(f"🎬 创建D-ID演示视频...", file=sys.stderr)
        
        # 创建演示模式的处理结果
        demo_result = self.create_demo_video(image_path, output_path)
        
        if demo_result.get("success"):
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            return {
                "success": True,
                "output_path": output_path,
                "processing_time": 3000,  # 演示模式固定3秒
                "file_size": file_size,
                "demo_mode": True,
                "metadata": {
                    "technique": "D-ID API调用失败，回退到演示模式",
                    "text": text,
                    "voice_id": "zh-CN-XiaoxiaoNeural",
                    "provider": "Local Demo Fallback",
                    "api_error": "云存储或API调用失败"
                }
            }
        else:
            return demo_result

def main():
    """命令行入口"""
    if len(sys.argv) < 3:
        print("使用方法: python ai_face_animation_did.py <输入图片路径> <输出视频路径> [文本内容]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    text = sys.argv[3] if len(sys.argv) > 3 else None
    
    processor = DIDFaceAnimationProcessor()
    result = processor.process_face_animation(input_path, output_path, text)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()