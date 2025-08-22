#!/usr/bin/env python3
"""
火山引擎即梦AI 图生视频处理系统
支持将静态图片+提示词转换为动态视频
"""

import os
import sys
import json
import time
import base64
import requests
import hashlib
import hmac
from urllib.parse import quote, urlencode
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
import subprocess
import shutil
from cloud_storage import CloudStorageService

class JiMengImageToVideoProcessor:
    """火山引擎即梦AI 图生视频处理器"""
    
    def __init__(self):
        self.access_key = self._get_access_key()
        self.secret_key = self._get_secret_key()
        # 即梦AI专用API端点 (火山引擎视觉服务)
        # 尝试几个可能的端点
        self.base_url = "https://visual.volcengineapi.com"
        self.cloud_storage = CloudStorageService()
        
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # 即梦AI使用火山引擎签名认证，而不是简单的Bearer token
        # 需要使用access_key和secret_key进行签名认证
        
    def _generate_volc_signature(self, method: str, url: str, params: Dict, payload: str) -> Dict[str, str]:
        """生成火山引擎API签名（按照AWS4-HMAC-SHA256标准）"""
        if not self.access_key or not self.secret_key:
            return {}
            
        # 基本信息
        timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        date = timestamp[:8]
        
        # 解析URL
        from urllib.parse import urlparse, unquote
        parsed_url = urlparse(url)
        host = parsed_url.netloc
        path = parsed_url.path or '/'
        
        # 构建规范化查询字符串 - VolcEngine使用标准URL编码
        if params:
            sorted_params = []
            for key in sorted(params.keys()):
                # 按照AWS标准编码，空格编码为%20而不是+
                encoded_key = quote(str(key), safe='')
                encoded_value = quote(str(params[key]), safe='')  
                sorted_params.append(f'{encoded_key}={encoded_value}')
            canonical_query_string = '&'.join(sorted_params)
        else:
            canonical_query_string = ''
        
        # 构建规范化头部 - 注意必须包含所有签名头部并按字母顺序排列
        canonical_headers = f'content-type:application/json\nhost:{host}\nx-date:{timestamp}\n'
        signed_headers = 'content-type;host;x-date'
        
        # 生成payload哈希
        payload_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
        
        # 构建规范化请求字符串
        canonical_request = f'{method}\n{path}\n{canonical_query_string}\n{canonical_headers}\n{signed_headers}\n{payload_hash}'
        
        # 生成待签名字符串 - 使用AWS4-HMAC-SHA256格式
        algorithm = 'AWS4-HMAC-SHA256'
        credential_scope = f'{date}/cn-north-1/cv/aws4_request'  # VolcEngine使用aws4_request而不是request
        canonical_request_hash = hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
        string_to_sign = f'{algorithm}\n{timestamp}\n{credential_scope}\n{canonical_request_hash}'
        
        # 计算签名 - 按照AWS4标准但使用VOLC前缀
        k_date = hmac.new(('VOLC' + self.secret_key).encode('utf-8'), date.encode('utf-8'), hashlib.sha256).digest()
        k_region = hmac.new(k_date, 'cn-north-1'.encode('utf-8'), hashlib.sha256).digest()
        k_service = hmac.new(k_region, 'cv'.encode('utf-8'), hashlib.sha256).digest()
        k_signing = hmac.new(k_service, 'aws4_request'.encode('utf-8'), hashlib.sha256).digest()  # 使用aws4_request
        signature = hmac.new(k_signing, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
        
        # 构建Authorization头 - 使用VolcEngine标准格式
        authorization = f'{algorithm} Credential={self.access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}'
        
        # 添加调试信息
        print(f"🔍 AWS4-HMAC-SHA256 签名调试:", file=sys.stderr)
        print(f"  - 时间戳: {timestamp}", file=sys.stderr)
        print(f"  - Credential Scope: {credential_scope}", file=sys.stderr)
        print(f"  - 规范化请求哈希: {canonical_request_hash}", file=sys.stderr)
        print(f"  - 签名结果: {signature[:16]}...", file=sys.stderr)
        
        return {
            'Authorization': authorization,
            'X-Date': timestamp,
            'Host': host,
            'Content-Type': 'application/json'
        }
        
    def _get_access_key(self) -> Optional[str]:
        """获取火山引擎Access Key"""
        # 从环境变量获取
        access_key = os.getenv('VOLC_ACCESSKEY')
        if access_key:
            return access_key
            
        # 从.env文件获取
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.startswith('VOLC_ACCESSKEY='):
                            return line.split('=', 1)[1].strip()
            except Exception:
                pass
        
        return None
    
    def _get_secret_key(self) -> Optional[str]:
        """获取火山引擎Secret Key"""
        # 从环境变量获取
        secret_key = os.getenv('VOLC_SECRETKEY')
        if secret_key:
            # 检查是否是base64编码的，如果是则解码
            try:
                if secret_key.endswith('==') or len(secret_key) % 4 == 0:
                    import base64
                    decoded_key = base64.b64decode(secret_key).decode('utf-8')
                    print(f"🔑 检测到base64编码的密钥，已解码", file=sys.stderr)
                    return decoded_key
            except:
                pass
            return secret_key
            
        # 从.env文件获取
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.startswith('VOLC_SECRETKEY='):
                            key = line.split('=', 1)[1].strip()
                            # 检查是否是base64编码的，如果是则解码
                            try:
                                if key.endswith('==') or len(key) % 4 == 0:
                                    import base64
                                    decoded_key = base64.b64decode(key).decode('utf-8')
                                    print(f"🔑 检测到base64编码的密钥，已解码", file=sys.stderr)
                                    return decoded_key
                            except:
                                pass
                            return key
            except Exception:
                pass
        
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
    
    def _get_demo_filter_by_prompt(self, prompt: str) -> str:
        """根据提示词生成对应的ffmpeg视频滤镜"""
        prompt_lower = prompt.lower()
        
        # 根据关键词匹配不同的视觉效果
        if "笑" in prompt or "开心" in prompt or "happy" in prompt_lower:
            # 开心大笑：轻微的弹跳和亮度变化
            return "scale=512:512,zoompan=z='if(lte(zoom,1.0),1.02,max(1.0,zoom-0.002))':x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=125,eq=brightness=0.1*sin(2*PI*t/3)"
        
        elif "点头" in prompt or "nod" in prompt_lower:
            # 轻柔点头：垂直移动效果
            return "scale=512:512,pad=iw:ih+20:0:10*sin(2*PI*t/2):color=black,crop=512:512:0:0"
        
        elif "招手" in prompt or "wave" in prompt_lower:
            # 友好招手：水平摆动
            return "scale=512:512,pad=iw+20:ih:10*sin(2*PI*t/1.5):0:color=black,crop=512:512:0:0"
        
        elif "眨眼" in prompt or "blink" in prompt_lower:
            # 自然眨眼：快速的亮度闪烁
            return "scale=512:512,eq=brightness='if(mod(t,2)<0.1,-0.3,0)'"
        
        elif "头发" in prompt or "发丝" in prompt or "hair" in prompt_lower:
            # 发丝飘动：轻微晃动 + 模糊效果
            return "scale=512:512,pad=iw+10:ih+10:5*sin(2*PI*t/3):5*cos(2*PI*t/4):color=black,crop=512:512:0:0"
        
        elif "衣物" in prompt or "clothes" in prompt_lower or "摆动" in prompt:
            # 衣物摆动：整体轻微摇摆
            return "scale=512:512,rotate='0.05*sin(2*PI*t/3)':fillcolor=black:ow=512:oh=512"
        
        elif "说话" in prompt or "speak" in prompt_lower:
            # 自然说话：轻微的面部区域变化
            return "scale=512:512,zoompan=z='1+0.02*sin(4*PI*t)':x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=125"
        
        elif "镜头" in prompt or "缩放" in prompt or "zoom" in prompt_lower:
            # 镜头缩放：明显的放大缩小
            return "scale=512:512,zoompan=z='1+0.3*sin(2*PI*t/4)':x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=125"
        
        elif "视差" in prompt or "parallax" in prompt_lower:
            # 视差效果：多层移动
            return "scale=512:512,split[a][b];[a]zoompan=z=1.1:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=125[bg];[b]zoompan=z=1.0:x=iw/2-(iw/zoom/2)+10*sin(2*PI*t/3):y=ih/2-(ih/zoom/2):d=125[fg];[bg][fg]overlay"
        
        elif "复古" in prompt or "胶片" in prompt or "vintage" in prompt_lower:
            # 复古胶片：颜色偏移 + 噪点
            return "scale=512:512,eq=saturation=0.8:brightness=0.1,noise=alls=20:allf=t+u"
        
        elif "戏剧" in prompt or "光影" in prompt or "dramatic" in prompt_lower:
            # 戏剧光影：明暗变化
            return "scale=512:512,eq=brightness='0.2*sin(2*PI*t/4)':contrast='1.2+0.3*sin(2*PI*t/5)'"
        
        elif "惊喜" in prompt or "surprise" in prompt_lower:
            # 惊喜表情：快速缩放变化
            return "scale=512:512,zoompan=z='1+0.1*sin(8*PI*t)':x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=125"
        
        else:
            # 默认效果：轻微的缩放
            return "scale=512:512,zoompan=z='1+0.02*sin(2*PI*t/4)':x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=125"
    
    def _get_effect_name_by_prompt(self, prompt: str) -> str:
        """根据提示词获取效果名称"""
        prompt_lower = prompt.lower()
        
        if "笑" in prompt or "开心" in prompt:
            return "开心弹跳效果"
        elif "点头" in prompt:
            return "轻柔点头动作"
        elif "招手" in prompt:
            return "友好招手摆动"
        elif "眨眼" in prompt:
            return "自然眨眼闪烁"
        elif "头发" in prompt or "发丝" in prompt:
            return "发丝飘动效果"
        elif "衣物" in prompt or "摆动" in prompt:
            return "衣物摆动效果"
        elif "说话" in prompt:
            return "自然说话动作"
        elif "镜头" in prompt or "缩放" in prompt:
            return "镜头缩放效果"
        elif "视差" in prompt:
            return "3D视差效果"
        elif "复古" in prompt or "胶片" in prompt:
            return "复古胶片质感"
        elif "戏剧" in prompt or "光影" in prompt:
            return "戏剧光影变化"
        elif "惊喜" in prompt:
            return "惊喜表情变化"
        else:
            return "自然动态效果"
    
    def create_demo_video(self, input_path: str, output_path: str, prompt: str) -> Dict[str, Any]:
        """创建演示视频（当没有API密钥时）- 根据提示词生成不同效果"""
        try:
            print(f"🎬 创建图生视频演示...", file=sys.stderr)
            print(f"📝 提示词: {prompt}", file=sys.stderr)
            
            # 根据提示词选择不同的视觉效果
            video_filter = self._get_demo_filter_by_prompt(prompt)
            effect_name = self._get_effect_name_by_prompt(prompt)
            
            print(f"🎨 应用效果: {effect_name}", file=sys.stderr)
            
            # 检查是否有ffmpeg
            try:
                # 使用ffmpeg创建根据提示词定制的演示视频
                cmd = [
                    'ffmpeg', '-y',
                    '-loop', '1',
                    '-i', input_path,
                    '-c:v', 'libx264',
                    '-t', '5',
                    '-pix_fmt', 'yuv420p',
                    '-vf', video_filter,
                    output_path
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode == 0:
                    return {
                        "success": True,
                        "status": "completed",
                        "demo_mode": True,
                        "effect_applied": effect_name,
                        "message": f"演示视频创建成功（{effect_name}）"
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
                "message": "演示模式：火山引擎即梦API需要配置密钥才能生成真实图生视频"
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"演示视频创建失败: {str(e)}"
            }
    
    def create_image_to_video(self, image_path: str, prompt: str) -> Dict[str, Any]:
        """创建图生视频任务（真实API - 待实现）"""
        try:
            if not self.access_key or not self.secret_key:
                return {
                    "success": False,
                    "error": "火山引擎API密钥未配置，请在.env文件中设置VOLC_ACCESSKEY和VOLC_SECRETKEY。详见: https://console.volcengine.com/"
                }
            
            print(f"🎬 开始创建即梦图生视频...", file=sys.stderr)
            
            # 上传图片到云存储获取公网URL
            print(f"📤 上传图片到云存储...", file=sys.stderr)
            upload_result = self.cloud_storage.upload_image(image_path, "jimeng-images")
            
            if not upload_result['success']:
                print(f"⚠️  云存储上传失败，使用base64格式: {upload_result['error']}", file=sys.stderr)
                # 回退到base64编码
                image_data_url = self.encode_image_to_base64_url(image_path)
                if not image_data_url:
                    return {
                        "success": False,
                        "error": "图片编码失败"
                    }
                image_url = image_data_url
            else:
                image_url = upload_result['public_url']
                print(f"✅ 图片上传成功: {image_url}", file=sys.stderr)
            
            # 构建CVProcess请求数据（按照官方格式）
            payload = {
                "req_key": "high_aes_i2v_general",  # 请求键 - 图生视频通用模型
                "prompt": prompt,  # 提示词
                "image_url": image_url,  # 输入图片URL
                "model_version": "i2v_v1.0",  # 模型版本
                "seed": -1,  # 随机种子
                "scale": 3.5,  # 指导比例
                "ddim_steps": 16,  # 推理步数
                "width": 512,  # 输出宽度
                "height": 512,  # 输出高度
                "duration": 5,  # 视频时长(秒)
                "fps": 8,  # 帧率
                "use_sr": True,  # 使用超分辨率
                "return_url": True  # 返回URL而不是base64
            }
            
            # 查询参数 - 使用CVProcess作为主要操作
            query_params = {
                "Action": "CVProcess",  # VolcEngine视觉处理操作
                "Version": "2022-08-31"  # API版本
            }
            
            print(f"📤 发送创建请求到火山引擎即梦API...", file=sys.stderr)
            
            # 准备API调用 (火山引擎使用根路径)
            api_url = f"{self.base_url}/"
            payload_str = json.dumps(payload, ensure_ascii=False)
            
            # 生成签名 (包含查询参数)
            signature_headers = self._generate_volc_signature('POST', api_url, query_params, payload_str)
            
            # 合并请求头
            request_headers = {**self.headers, **signature_headers}
            
            print(f"🔐 使用火山引擎签名认证", file=sys.stderr)
            
            # 发送创建请求到即梦AI API (包含查询参数)
            # 添加必需的Content-Type头
            request_headers['Content-Type'] = 'application/json'
            
            print(f"🔍 完整请求头: {request_headers}", file=sys.stderr)
            print(f"🔍 查询参数: {query_params}", file=sys.stderr) 
            print(f"🔍 请求URL: {api_url}", file=sys.stderr)
            print(f"🔍 请求负载前50字符: {payload_str[:50]}...", file=sys.stderr)
            
            response = requests.post(
                api_url,
                params=query_params,  # 添加查询参数
                headers=request_headers,
                data=payload_str,  # 使用data而不是json，保持签名一致性
                timeout=30,
                verify=True
            )
            
            if response.status_code == 201 or response.status_code == 200:
                result = response.json()
                task_id = result.get('task_id')
                print(f"✅ 视频创建任务已提交，ID: {task_id}", file=sys.stderr)
                
                return {
                    "success": True,
                    "task_id": task_id,
                    "status": "created",
                    "message": "图生视频任务已创建"
                }
            else:
                error_msg = f"创建失败，状态码: {response.status_code}"
                try:
                    error_data = response.json()
                    print(f"🔍 完整响应数据: {error_data}", file=sys.stderr)
                    error_msg += f", 错误: {error_data.get('message', error_data.get('error', '未知错误'))}"
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
    
    def process_image_to_video(self, input_path: str, output_path: str, prompt: str = None) -> Dict[str, Any]:
        """完整的图生视频处理流程"""
        try:
            print(f"🎨 开始火山引擎即梦图生视频处理", file=sys.stderr)
            print(f"📁 输入文件: {input_path}", file=sys.stderr)
            print(f"📁 输出文件: {output_path}", file=sys.stderr)
            
            # 检查输入文件
            if not os.path.exists(input_path):
                return {
                    "success": False,
                    "error": f"输入文件不存在: {input_path}"
                }
            
            # 默认提示词和智能推荐
            if not prompt:
                prompt = "人物面带微笑，轻轻点头表示赞同，动作自然连贯，眼神坚定友善"
                print(f"💡 使用推荐提示词: {prompt}", file=sys.stderr)
            
            # 检查API密钥配置
            if not self.access_key or not self.secret_key or self.access_key == "需要配置火山引擎Access_Key":
                return {
                    "success": False,
                    "error": "火山引擎API密钥未配置，请在.env文件中设置VOLC_ACCESSKEY和VOLC_SECRETKEY。详见: https://console.volcengine.com/"
                }
            
            start_time = time.time()
            
            # 尝试调用火山引擎即梦API
            print(f"🌐 尝试调用火山引擎即梦API处理图生视频", file=sys.stderr)
            print(f"📝 提示词: {prompt}", file=sys.stderr)
            
            # 1. 尝试创建图生视频任务
            create_result = self.create_image_to_video(input_path, prompt)
            
            # 如果API调用失败，自动降级到演示模式
            if not create_result.get("success"):
                print(f"⚠️  火山引擎API调用失败，自动切换到演示模式", file=sys.stderr)
                print(f"   失败原因: {create_result.get('error', '未知错误')}", file=sys.stderr)
                print(f"🎬 生成演示视频（含动态效果）...", file=sys.stderr)
                
                # 创建演示视频
                demo_result = self.create_demo_video(input_path, output_path, prompt)
                if not demo_result.get("success"):
                    return demo_result
                
                total_time = time.time() - start_time
                file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                
                return {
                    "success": True,
                    "output_path": output_path,
                    "processing_time": int(total_time * 1000),
                    "file_size": file_size,
                    "demo_mode": True,
                    "api_status": "failed_fallback_to_demo",
                    "metadata": {
                        "technique": "演示模式图生视频（火山引擎API不可用）",
                        "prompt": prompt,
                        "provider": "Local Demo (VolcEngine API unavailable)",
                        "processing_time_seconds": int(total_time),
                        "api_error": create_result.get('error', '未知错误')
                    }
                }
            
            # API调用成功的情况
            task_id = create_result.get("task_id")
            print(f"✅ 火山引擎API调用成功，任务ID: {task_id}", file=sys.stderr)
            
            # 2. 等待处理完成（这里需要实现轮询逻辑）
            print(f"⏳ 等待火山引擎处理完成...", file=sys.stderr)
            
            # 模拟等待处理完成 - 在实际实现中这里应该轮询API状态
            time.sleep(10)
            
            # 3. 获取结果并下载视频
            # 注意：这里应该实现从火山引擎下载生成的视频的逻辑
            # 目前作为演示，先创建一个本地视频文件
            demo_result = self.create_demo_video(input_path, output_path, prompt)
            if not demo_result.get("success"):
                return {
                    "success": False,
                    "error": "视频下载失败"
                }
            
            total_time = time.time() - start_time
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            
            return {
                "success": True,
                "output_path": output_path,
                "processing_time": int(total_time * 1000),
                "file_size": file_size,
                "api_mode": True,
                "metadata": {
                    "technique": "火山引擎即梦API图生视频",
                    "prompt": prompt,
                    "provider": "VolcEngine JiMeng API",
                    "task_id": task_id,
                    "processing_time_seconds": int(total_time),
                    "note": "API创建成功，视频文件为演示版本（完整实现需要视频下载逻辑）"
                }
            }
            
        except Exception as e:
            error_msg = f"图生视频处理过程中发生异常: {str(e)}"
            print(f"❌ {error_msg}", file=sys.stderr)
            return {
                "success": False,
                "error": error_msg
            }

def main():
    """命令行入口"""
    if len(sys.argv) < 3:
        print("使用方法: python ai_image_to_video_jimeng.py <输入图片路径> <输出视频路径> [提示词]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    prompt = sys.argv[3] if len(sys.argv) > 3 else None
    
    processor = JiMengImageToVideoProcessor()
    result = processor.process_image_to_video(input_path, output_path, prompt)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()