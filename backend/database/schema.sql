-- ===================================
-- RELIVE APP - 数据库架构设计
-- ===================================
-- 数据库：PostgreSQL 14+
-- 创建时间：2025-08-22

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    
    -- 会员信息
    membership_type VARCHAR(20) DEFAULT 'free' CHECK (membership_type IN ('free', 'monthly', 'annual', 'enterprise')),
    membership_expires_at TIMESTAMP,
    credits INTEGER DEFAULT 200,
    total_credits_used INTEGER DEFAULT 0,
    
    -- 账户状态
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    
    -- OAuth信息
    oauth_provider VARCHAR(20), -- 'wechat', 'qq', 'weibo', null
    oauth_id VARCHAR(100),
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- 用户会话表
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 照片表
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 文件信息
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    
    -- 元数据
    metadata JSONB,
    tags TEXT[],
    
    -- 状态
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed', 'deleted')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 处理任务表
CREATE TABLE processing_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    
    -- 任务信息
    processing_type VARCHAR(50) NOT NULL CHECK (processing_type IN ('smart-restore', 'face-animation', 'image-to-video')),
    parameters JSONB,
    prompt TEXT,
    
    -- 结果信息
    result_file_path TEXT,
    result_metadata JSONB,
    
    -- 状态跟踪
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- 性能指标
    processing_time_ms INTEGER,
    credits_used INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 支付订单表
CREATE TABLE payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 订单信息
    order_number VARCHAR(50) UNIQUE NOT NULL,
    product_type VARCHAR(50) NOT NULL, -- 'credits', 'membership'
    product_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    
    -- 支付信息
    payment_provider VARCHAR(20), -- 'wechat', 'alipay', 'unionpay'
    payment_method VARCHAR(20), -- 'qr_code', 'h5', 'app'
    provider_order_id VARCHAR(100),
    provider_transaction_id VARCHAR(100),
    
    -- 订单状态
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP
);

-- 积分交易记录表
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 交易信息
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend', 'refund', 'expire')),
    amount INTEGER NOT NULL, -- 正数为获得，负数为消费
    balance_after INTEGER NOT NULL,
    
    -- 关联信息
    related_order_id UUID REFERENCES payment_orders(id),
    related_task_id UUID REFERENCES processing_tasks(id),
    
    -- 描述
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户反馈表
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- 反馈内容
    type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'suggestion', 'complaint', 'praise')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    contact_email VARCHAR(255),
    
    -- 处理状态
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
    admin_response TEXT,
    
    -- 元数据
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- 索引创建
-- ===================================

-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 会话表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 照片表索引
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);

-- 处理任务表索引
CREATE INDEX idx_processing_tasks_user_id ON processing_tasks(user_id);
CREATE INDEX idx_processing_tasks_photo_id ON processing_tasks(photo_id);
CREATE INDEX idx_processing_tasks_status ON processing_tasks(status);
CREATE INDEX idx_processing_tasks_created_at ON processing_tasks(created_at DESC);

-- 支付订单表索引
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_number ON payment_orders(order_number);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_created_at ON payment_orders(created_at DESC);

-- 积分交易记录表索引
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ===================================
-- 触发器和函数
-- ===================================

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表创建 updated_at 触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_tasks_updated_at BEFORE UPDATE ON processing_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feedback_updated_at BEFORE UPDATE ON user_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 初始数据插入
-- ===================================

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('pricing.free_credits', '200', '新用户免费积分数量'),
('pricing.monthly_credits', '2000', '月度会员积分数量'),
('pricing.annual_credits', '15000', '年度会员积分数量'),
('pricing.monthly_price', '29.90', '月度会员价格'),
('pricing.annual_price', '199.00', '年度会员价格'),
('credits.smart_restore', '10', '智能修复消耗积分'),
('credits.face_animation', '20', '人物复活消耗积分'),
('credits.image_to_video', '30', '图生视频消耗积分'),
('upload.max_file_size', '10485760', '最大文件上传大小（字节）'),
('upload.allowed_types', '["image/jpeg", "image/png", "image/webp"]', '允许的文件类型');

-- 创建演示用户（仅开发环境）
INSERT INTO users (email, username, display_name, password_hash, is_verified, credits) VALUES
('demo@relive.app', 'demo_user', '演示用户', '$2b$10$demo_hash_for_development', true, 500);

COMMENT ON DATABASE relive_app IS 'RELIVE AI照片处理应用数据库';