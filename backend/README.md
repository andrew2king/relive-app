# RELIVE APP - 后端服务

AI驱动的照片复活应用，支持人物复活、图生视频、图像修复等功能。

## ✨ 主要功能

- 🎭 **人物复活** - 使用D-ID API将静态人像转换为说话视频
- 🎬 **图生视频** - 基于火山引擎即梦AI生成动态视频
- 🔧 **图像修复** - 使用Replicate GFPGAN进行图像增强
- ☁️ **云存储** - 阿里云OSS统一存储管理
- 🚀 **智能回退** - API失败时自动演示模式

## 🚀 快速开始

### 1. 环境配置

```bash
# 复制环境配置模板
cp .env.example .env

# 使用配置向导 (推荐)
./setup-env.sh

# 或手动编辑 .env 文件
vim .env
```

### 2. 安装依赖

```bash
# Node.js依赖
npm install

# Python依赖
pip3 install -r requirements.txt

# 或手动安装Python包
pip3 install oss2 requests opencv-python pillow replicate
```

### 3. 验证配置

```bash
# 检查配置状态
python3 check-config.py

# 测试各项功能
python3 python/ai_face_animation_did.py test.jpg output.mp4
python3 python/cloud_storage.py test.jpg
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🔧 配置说明

### 必填配置

| 配置项 | 说明 | 获取方式 |
|--------|------|----------|
| `DID_API_KEY` | D-ID人物复活API | [D-ID官网](https://www.d-id.com/) |
| `VOLC_ACCESSKEY` | 火山引擎访问密钥 | [火山引擎控制台](https://console.volcengine.com/) |
| `VOLC_SECRETKEY` | 火山引擎密钥 | 同上 |
| `OSS_ACCESS_KEY_ID` | 阿里云OSS访问密钥 | [阿里云OSS](https://oss.console.aliyun.com/) |
| `OSS_ACCESS_KEY_SECRET` | 阿里云OSS密钥 | 同上 |

### 已配置项

| 配置项 | 当前值 | 说明 |
|--------|--------|------|
| `REPLICATE_API_TOKEN` | ✅ 已配置 | 图像修复功能 |
| `PORT` | 8000 | 服务器端口 |
| `NODE_ENV` | development | 运行环境 |

详细配置说明请查看 [CONFIG.md](CONFIG.md)

## 📁 项目结构

```
backend/
├── src/                    # TypeScript源码
│   ├── server-clean.ts     # 主服务器文件
│   └── services/           # 业务服务
├── python/                 # Python AI处理脚本
│   ├── ai_face_animation_did.py      # D-ID人物复活
│   ├── ai_image_to_video_jimeng.py   # 火山引擎图生视频
│   ├── ai_ultimate_restore_replicate.py # Replicate图像修复
│   └── cloud_storage.py             # 阿里云OSS服务
├── uploads/               # 文件上传目录
│   ├── temp/             # 临时文件
│   └── processed/        # 处理结果
├── .env                  # 环境配置 (需要创建)
├── .env.example          # 配置模板
├── CONFIG.md             # 详细配置文档
├── setup-env.sh          # 配置向导脚本
└── check-config.py       # 配置验证脚本
```

## 🔌 API 端点

### 核心功能
- `POST /api/processing/start` - 启动AI处理任务
- `GET /api/processing/:id/status` - 查询处理状态
- `POST /api/photos/upload` - 上传照片

### 管理功能
- `GET /health` - 健康检查
- `GET /api/status` - 服务状态
- `GET /admin` - 后台管理面板

## 🧪 测试

### API测试
```bash
# 健康检查
curl http://localhost:8000/health

# 人物复活
curl -X POST http://localhost:8000/api/processing/start \
  -H "Content-Type: application/json" \
  -d '{"photoId":"test.jpg","type":"face-animation"}'

# 图生视频
curl -X POST http://localhost:8000/api/processing/start \
  -H "Content-Type: application/json" \
  -d '{"photoId":"test.jpg","type":"image-to-video"}'
```

### 功能测试
```bash
# D-ID API测试
python3 python/ai_face_animation_did.py test.jpg output.mp4 "Hello World"

# 火山引擎测试
python3 python/ai_image_to_video_jimeng.py test.jpg output.mp4 "添加动态效果"

# 云存储测试
python3 python/cloud_storage.py test.jpg --folder test
```

## 🛡️ 安全注意事项

1. **环境变量保护**
   - 不要提交 `.env` 文件到版本控制
   - 生产环境使用强密钥
   - 定期轮换API密钥

2. **云存储安全**
   - OSS存储桶设置适当权限
   - 监控存储使用量
   - 定期清理临时文件

3. **API使用**
   - 监控API调用频率和费用
   - 设置合理的请求限制
   - 记录重要操作日志

## 🔧 故障排除

### 常见问题

**1. D-ID API调用失败**
```bash
# 检查API密钥
curl -H "Authorization: Basic YOUR_API_KEY" https://api.d-id.com/talks

# 查看详细错误
python3 python/ai_face_animation_did.py test.jpg output.mp4 "test"
```

**2. 火山引擎服务不可用**
- 确认已开通即梦服务
- 检查AccessKey权限
- 验证账户余额

**3. OSS上传失败**
- 检查存储桶权限（需要公共读）
- 验证AccessKey权限
- 确认区域设置正确

**4. 服务启动失败**
```bash
# 检查端口占用
lsof -i :8000

# 查看详细错误
npm run dev

# 检查配置
python3 check-config.py
```

### 日志查看
```bash
# 服务器日志
npm run dev

# Python脚本日志
python3 -u python/ai_face_animation_did.py test.jpg output.mp4 2>&1 | tee debug.log
```

## 📊 监控和维护

### 性能监控
- API响应时间
- 文件处理速度
- 云存储使用量
- 服务器资源占用

### 维护任务
- 定期清理临时文件
- 监控API使用配额
- 更新依赖包版本
- 备份重要配置

## 🤝 开发指南

### 添加新功能
1. 在 `python/` 目录创建处理脚本
2. 在 `src/services/` 添加服务集成
3. 更新API路由和文档
4. 添加相应的测试用例

### 代码规范
- TypeScript使用ESLint配置
- Python遵循PEP 8规范
- 提交前运行测试
- 更新相关文档

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙋 支持

如遇问题请：
1. 查看 [CONFIG.md](CONFIG.md) 配置文档
2. 运行 `python3 check-config.py` 检查配置
3. 查看服务器日志排查错误
4. 提交Issue描述具体问题