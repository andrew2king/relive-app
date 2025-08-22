// 用户相关类型
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  credits: number;
  membershipLevel: 'free' | 'monthly' | 'quarterly' | 'yearly';
  membershipExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 照片相关类型
export interface Photo {
  id: string;
  userId: string;
  originalUrl: string;
  processedUrl?: string;
  thumbnailUrl?: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  tags: string[];
  metadata: PhotoMetadata;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoMetadata {
  detectedYear?: number;
  detectedLocation?: string;
  detectedPeople?: Person[];
  detectedEvents?: string[];
  colorType: 'color' | 'bw' | 'sepia';
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  damages: DamageType[];
}

export interface Person {
  id: string;
  name?: string;
  boundingBox: BoundingBox;
  confidence: number;
  estimatedAge?: number;
  gender?: 'male' | 'female' | 'unknown';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DamageType = 'scratches' | 'tears' | 'fading' | 'stains' | 'blur' | 'noise';

// 处理任务相关类型
export interface ProcessingTask {
  id: string;
  userId: string;
  photoId: string;
  type: ProcessingType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  parameters: ProcessingParameters;
  result?: ProcessingResult;
  creditsUsed: number;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export type ProcessingType = 
  | 'damage-repair'
  | 'blur-enhance'
  | 'colorization'
  | 'upscale'
  | 'smart-restore'
  | 'face-animation'
  | 'image-to-video'
  | 'custom-animation';

export interface ProcessingParameters {
  repairType?: DamageType[];
  colorizeStyle?: 'natural' | 'vintage' | 'vibrant';
  upscaleRatio?: 2 | 4 | 8;
  animationType?: AnimationType;
  animationDescription?: string;
  animationDuration?: number;
  animationIntensity?: 'subtle' | 'moderate' | 'strong';
}

export type AnimationType = 
  | 'smile'
  | 'blink'
  | 'nod'
  | 'wave'
  | 'walk-closer'
  | 'walk-away'
  | 'embrace'
  | 'custom';

export interface ProcessingResult {
  outputUrl: string;
  videoUrl?: string;
  beforeAfterUrl?: string;
  qualityScore: number;
  improvementMetrics: QualityMetrics;
  processingTime: number;
}

export interface QualityMetrics {
  sharpness: number;
  colorAccuracy: number;
  noiseReduction: number;
  overallQuality: number;
}

// 支付相关类型
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
  description: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  type: 'credits' | 'membership';
  packageId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: Date;
  paidAt?: Date;
}

// 相册相关类型
export interface Album {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverPhotoId?: string;
  photoIds: string[];
  isPublic: boolean;
  shareToken?: string;
  template: AlbumTemplate;
  music?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumTemplate {
  id: string;
  name: string;
  thumbnailUrl: string;
  transitionStyle: 'fade' | 'slide' | 'zoom';
  backgroundColor: string;
  fontFamily: string;
}

// 分享相关类型
export interface ShareRecord {
  id: string;
  userId: string;
  contentType: 'photo' | 'album' | 'animation';
  contentId: string;
  platform: 'wechat' | 'weibo' | 'qzone' | 'link';
  viewCount: number;
  likeCount: number;
  createdAt: Date;
}

export interface InviteRecord {
  id: string;
  inviterId: string;
  inviteeId?: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'expired';
  rewardGiven: boolean;
  createdAt: Date;
  acceptedAt?: Date;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 组件props类型
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: string;
  className?: string;
}

// 表单类型
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export interface PhotoUploadForm {
  files: File[];
  description?: string;
  tags?: string[];
}

export interface ProcessingForm {
  type: ProcessingType;
  parameters: ProcessingParameters;
}

// 状态管理类型
export interface AppState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface PhotoState {
  photos: Photo[];
  currentPhoto: Photo | null;
  uploadProgress: Record<string, number>;
  processing: Record<string, ProcessingTask>;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  createdAt: Date;
}