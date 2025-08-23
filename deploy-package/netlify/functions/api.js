const { createClient } = require('@supabase/supabase-js');

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const { httpMethod, path, body, headers, queryStringParameters } = event;
    
    // 从路径中提取API路由
    const apiPath = path.replace('/.netlify/functions/api', '') || '/';
    
    // CORS头部配置
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // 处理预检请求
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    console.log(`API请求: ${httpMethod} ${apiPath}`);
    
    try {
        let response;
        
        // 路由分发
        switch (true) {
            case apiPath === '/health':
                response = await handleHealth();
                break;
                
            case apiPath === '/auth/register' && httpMethod === 'POST':
                response = await handleRegister(JSON.parse(body || '{}'));
                break;
                
            case apiPath === '/auth/login' && httpMethod === 'POST':
                response = await handleLogin(JSON.parse(body || '{}'));
                break;
                
            case apiPath === '/auth/profile' && httpMethod === 'GET':
                response = await handleGetProfile(headers);
                break;
                
            case apiPath === '/photos' && httpMethod === 'GET':
                response = await handleGetPhotos(headers, queryStringParameters);
                break;
                
            case apiPath === '/photos/upload' && httpMethod === 'POST':
                response = await handleUploadPhoto(JSON.parse(body || '{}'), headers);
                break;
                
            case apiPath.startsWith('/photos/') && apiPath.includes('/process') && httpMethod === 'POST':
                const photoId = apiPath.split('/')[2];
                response = await handleProcessPhoto(photoId, JSON.parse(body || '{}'), headers);
                break;
                
            case apiPath === '/credits' && httpMethod === 'GET':
                response = await handleGetCredits(headers);
                break;
                
            default:
                response = {
                    statusCode: 404,
                    body: JSON.stringify({ 
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: `API路径不存在: ${apiPath}`
                        }
                    })
                };
        }
        
        return {
            ...response,
            headers: corsHeaders
        };
        
    } catch (error) {
        console.error('API错误:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: '服务器内部错误',
                    details: error.message
                }
            })
        };
    }
};

// 健康检查
async function handleHealth() {
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'RELIVE API',
                version: '1.0.0'
            }
        })
    };
}

// 用户注册
async function handleRegister(data) {
    const { email, password, username } = data;
    
    if (!email || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '邮箱和密码不能为空'
                }
            })
        };
    }
    
    try {
        // 使用Supabase认证注册用户
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username: username || email.split('@')[0] }
            }
        });
        
        if (authError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false,
                    error: {
                        code: 'REGISTRATION_FAILED',
                        message: authError.message
                    }
                })
            };
        }
        
        // 在用户表中创建记录
        if (authData.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    { 
                        id: authData.user.id,
                        email,
                        username: username || email.split('@')[0],
                        credits: 200 // 注册赠送200积分
                    }
                ]);
            
            if (dbError) {
                console.error('创建用户记录失败:', dbError);
            }
        }
        
        return {
            statusCode: 201,
            body: JSON.stringify({ 
                success: true,
                message: '注册成功！请查看邮箱确认账户。',
                data: {
                    user: {
                        id: authData.user?.id,
                        email: authData.user?.email
                    }
                }
            })
        };
        
    } catch (error) {
        console.error('注册错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'REGISTRATION_ERROR',
                    message: '注册失败，请稍后重试'
                }
            })
        };
    }
}

// 用户登录
async function handleLogin(data) {
    const { email, password } = data;
    
    if (!email || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '邮箱和密码不能为空'
                }
            })
        };
    }
    
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (authError) {
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    success: false,
                    error: {
                        code: 'LOGIN_FAILED',
                        message: '邮箱或密码错误'
                    }
                })
            };
        }
        
        // 获取用户详细信息
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: '登录成功',
                data: {
                    token: authData.session.access_token,
                    user: userProfile || {
                        id: authData.user.id,
                        email: authData.user.email,
                        credits: 200
                    }
                }
            })
        };
        
    } catch (error) {
        console.error('登录错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'LOGIN_ERROR',
                    message: '登录失败，请稍后重试'
                }
            })
        };
    }
}

// 获取用户资料
async function handleGetProfile(headers) {
    const user = await getUserFromToken(headers);
    if (!user) {
        return unauthorizedResponse();
    }
    
    const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'PROFILE_ERROR',
                    message: '获取用户资料失败'
                }
            })
        };
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true,
            data: { user: userProfile }
        })
    };
}

// 获取照片列表
async function handleGetPhotos(headers, queryParams) {
    const user = await getUserFromToken(headers);
    if (!user) {
        return unauthorizedResponse();
    }
    
    const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'PHOTOS_ERROR',
                    message: '获取照片列表失败'
                }
            })
        };
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true,
            data: { photos: photos || [] }
        })
    };
}

// 上传照片
async function handleUploadPhoto(data, headers) {
    const user = await getUserFromToken(headers);
    if (!user) {
        return unauthorizedResponse();
    }
    
    const { filename, fileSize, imageData } = data;
    
    try {
        // 这里简化处理，实际应该上传到Cloudinary等服务
        // 现在先直接存储base64数据作为演示
        const { data: photo, error } = await supabase
            .from('photos')
            .insert([
                {
                    user_id: user.id,
                    filename: filename || 'untitled.jpg',
                    file_size: fileSize || 0,
                    original_url: imageData, // 实际应该是上传后的URL
                    status: 'uploaded'
                }
            ])
            .select()
            .single();
        
        if (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    success: false,
                    error: {
                        code: 'UPLOAD_ERROR',
                        message: '照片上传失败'
                    }
                })
            };
        }
        
        return {
            statusCode: 201,
            body: JSON.stringify({ 
                success: true,
                message: '照片上传成功',
                data: { photo }
            })
        };
        
    } catch (error) {
        console.error('上传错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'UPLOAD_ERROR',
                    message: '照片上传失败'
                }
            })
        };
    }
}

// 处理照片
async function handleProcessPhoto(photoId, data, headers) {
    const user = await getUserFromToken(headers);
    if (!user) {
        return unauthorizedResponse();
    }
    
    const { processingType } = data;
    
    // 检查积分余额
    const { data: userProfile } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();
    
    const requiredCredits = getRequiredCredits(processingType);
    if (userProfile && userProfile.credits < requiredCredits) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'INSUFFICIENT_CREDITS',
                    message: '积分不足，无法处理照片'
                }
            })
        };
    }
    
    // 扣除积分
    await supabase
        .from('users')
        .update({ credits: userProfile.credits - requiredCredits })
        .eq('id', user.id);
    
    // 更新照片状态为处理中
    await supabase
        .from('photos')
        .update({ 
            status: 'processing',
            processing_type: processingType
        })
        .eq('id', photoId)
        .eq('user_id', user.id);
    
    // 这里应该调用实际的AI处理服务
    // 目前返回模拟结果
    setTimeout(async () => {
        await supabase
            .from('photos')
            .update({ 
                status: 'completed',
                processed_url: 'mock-processed-url' 
            })
            .eq('id', photoId);
    }, 5000);
    
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true,
            message: '照片处理已开始',
            data: {
                photoId,
                processingType,
                status: 'processing',
                estimatedTime: '30-60秒'
            }
        })
    };
}

// 获取积分余额
async function handleGetCredits(headers) {
    const user = await getUserFromToken(headers);
    if (!user) {
        return unauthorizedResponse();
    }
    
    const { data: userProfile, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();
    
    if (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: {
                    code: 'CREDITS_ERROR',
                    message: '获取积分信息失败'
                }
            })
        };
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true,
            data: { credits: userProfile?.credits || 0 }
        })
    };
}

// 辅助函数：从请求头获取用户信息
async function getUserFromToken(headers) {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader) {
        return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    return error ? null : user;
}

// 辅助函数：返回未授权响应
function unauthorizedResponse() {
    return {
        statusCode: 401,
        body: JSON.stringify({ 
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: '请先登录'
            }
        })
    };
}

// 辅助函数：获取处理类型需要的积分
function getRequiredCredits(processingType) {
    const credits = {
        'smart-restore': 50,
        'colorization': 40,
        'face-animation': 80,
        'upscale': 20,
        'damage-repair': 30,
        'blur-enhance': 25
    };
    return credits[processingType] || 30;
}