export interface Vector2D {
  x: number
  y: number
}

export interface GameState {
  isPlaying: boolean
  score: number
  lives: number
  isGameOver: boolean
  level: number
  combo?: number
}

export interface Ball {
  position: Vector2D
  velocity: Vector2D
  radius: number
  color: string
  isLaunched: boolean
  angularVelocity: number
  rotation: number
  lastCollisionTime: number
}

export interface CollisionEffect {
  position: Vector2D
  velocity: Vector2D
  radius: number
  life: number
  color: string
}

export interface Launcher {
  position: Vector2D
  radius: number
  dragStart: Vector2D | null
  dragEnd: Vector2D | null
  isDragging: boolean
  maxDragDistance: number
  power: number
  color: string
  direction: Vector2D
}

export interface Flipper {
  pivot: Vector2D
  angle: number
  targetAngle: number
  initialAngle: number
  maxAngle: number
  length: number
  width: number
  color: string
  rotationSpeed: number
  isPressed: boolean
  endPoint: Vector2D
}

export interface ScoreBumper {
  position: Vector2D
  radius: number
  color: string
  scoreValue: number
  id: number
  isActive: boolean
}

export interface SidePost {
  position: Vector2D
  radius: number
  color: string
  guideArcStart: number
  guideArcEnd: number
  isLeft: boolean
}

// 魔法糖果特效类型
export interface CandyEffect {
  position: Vector2D
  radius: number
  color: string
  life: number
  rotation: number
  type: 'sparkle' | 'sugar' | 'glow'
  velocity?: Vector2D
}

// 雪花类型
export interface Snowflake {
  x: number
  y: number
  size: number
  speed: number
  sway: number
  swaySpeed: number
  swayDirection: number
  opacity: number
  rotation: number
  rotationSpeed: number
}

// 极光类型
export interface Aurora {
  layers: Array<{
    y: number
    height: number
    speed: number
    colors: string[]
    waveAmplitude: number
    waveFrequency: number
  }>
  time: number
}

// 减震器类型
export interface ShockAbsorber {
  position: Vector2D
  length: number
  width: number
  angle: number
  color: string
  isLeft: boolean
  segments: number
  // 减震器弹簧相关
  springWidth: number
  springCount: number
  // 碰撞检测
  startPoint: Vector2D
  endPoint: Vector2D
  // 动画
  compression: number
  isCompressed: boolean
  compressionTime: number
}

export interface ChannelBoundary {
  start: Vector2D
  end: Vector2D
  normal: Vector2D
}