# RELIVE APP 配置文档

## 快速开始

1. **复制配置文件**
   ```bash
   cp .env.example .env
   ```

2. **填写必要的API密钥**
   - 编辑 `.env` 文件
   - 按照下方说明获取并配置API密钥

## 必填配置项

### 1. D-ID API (人物复活功能)

**获取步骤：**
1. 访问 [D-ID官网](https://www.d-id.com/)
2. 注册并登录账户
3. 进入 Dashboard → API Keys
4. 创建新的API密钥
5. 复制密钥到 `.env` 文件

```env
DID_API_KEY=your_d_id_api_key_here
```

### 2. 火山引擎API (图生视频功能)

**获取步骤：**
1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 注册火山引擎账户
3. 开通 **即梦视频生成服务**
4. 访问控制 → 访问密钥 → 创建AccessKey
5. 复制密钥到 `.env` 文件

```env
VOLC_ACCESSKEY=your_volc_access_key_here
VOLC_SECRETKEY=your_volc_secret_key_here
```

### 3. 阿里云OSS (云存储功能)

**获取步骤：**
1. 访问 [阿里云OSS控制台](https://oss.console.aliyun.com/)
2. 创建OSS存储桶
   - 选择区域：杭州 (cn-hangzhou)
   - 存储桶名称：`relive-photos` (或自定义)
   - 读写权限：**公共读**
3. 访问 [RAM控制台](https://ram.console.aliyun.com/)
4. 创建子用户并授予OSS完全权限
5. 生成AccessKey
6. 复制密钥到 `.env` 文件

```env
OSS_ACCESS_KEY_ID=your_oss_access_key_id_here
OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret_here
OSS_BUCKET=relive-photos
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_REGION=cn-hangzhou
```

## 已配置项

### Replicate API (图像修复功能)
```env
REPLICATE_API_TOKEN=your_replicate_api_token_here
```
⚠️ **需要配置** - 请在[Replicate官网](https://replicate.com)获取API密钥

## 可选配置项

### 服务器配置
```env
PORT=8000                    # 服务器端口
NODE_ENV=development         # 运行环境
FRONTEND_URL=http://localhost:3001  # 前端地址
```

### 文件上传配置
```env
MAX_FILE_SIZE=10485760       # 最大文件大小 (10MB)
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,webp  # 允许的图片格式
UPLOAD_TEMP_DIR=uploads/temp              # 临时上传目录
PROCESSED_OUTPUT_DIR=uploads/processed    # 处理结果目录
```

### 数据库配置 (可选)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/relive_app
```

### 缓存配置 (可选)
```env
REDIS_URL=redis://localhost:6379
```

### 日志配置 (可选)
```env
LOG_LEVEL=info              # 日志级别
LOG_FILE=logs/relive-app.log  # 日志文件路径
```

### 安全配置 (可选)
```env
JWT_SECRET=your-super-secret-jwt-key-here  # JWT密钥
BCRYPT_SALT_ROUNDS=10       # 密码加密轮数
```

### API限流配置 (可选)
```env
API_RATE_LIMIT=100          # 每分钟API请求限制
API_RATE_WINDOW=1           # 限流窗口时间(分钟)
```

### 监控配置 (可选)
```env
ENABLE_MONITORING=false
MONITORING_ENDPOINT=https://your-monitoring-service.com/api/metrics
```

## 配置验证

启动服务后，系统会自动检查配置：

1. **✅ 配置正确** - 所有API功能正常使用
2. **⚠️ 部分配置缺失** - 自动启用演示模式
3. **❌ 关键配置错误** - 显示具体错误信息

## 安全注意事项

1. **不要提交 `.env` 文件到版本控制系统**
2. **定期轮换API密钥**
3. **生产环境使用强密码和密钥**
4. **限制OSS存储桶权限**
5. **监控API使用量和费用**

## 故障排除

### 常见问题

1. **D-ID API认证失败**
   - 检查API密钥格式是否正确
   - 确认账户余额充足
   - 验证API密钥权限

2. **火山引擎API调用失败**
   - 确认已开通即梦服务
   - 检查AccessKey权限
   - 验证服务区域设置

3. **OSS上传失败**
   - 确认存储桶权限设置为公共读
   - 检查AccessKey权限
   - 验证存储桶名称和区域

4. **文件上传大小限制**
   - 调整 `MAX_FILE_SIZE` 配置
   - 检查服务器磁盘空间
   - 优化图片大小

### 日志查看

```bash
# 查看服务器日志
npm run dev

# 查看具体功能日志
tail -f logs/relive-app.log
```

### 测试配置

```bash
# 测试云存储配置
python3 python/cloud_storage.py test-image.jpg

# 测试D-ID API
python3 python/ai_face_animation_did.py test-image.jpg output.mp4

# 测试火山引擎API
python3 python/ai_image_to_video_jimeng.py test-image.jpg output.mp4
```

## 技术支持

如遇到配置问题，请检查：
1. API密钥是否有效
2. 服务是否已开通
3. 权限配置是否正确
4. 网络连接是否正常