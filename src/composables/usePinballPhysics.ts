import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Vector2D, Ball, Flipper, ScoreBumper, GameState, SidePost, Launcher, CollisionEffect, ShockAbsorber  } from '../types/pinball'

export const usePinballPhysics = (canvasWidth: number, canvasHeight: number) => {
  // 游戏状态
  const gameState = ref<GameState>({
    isPlaying: false,
    score: 0,
    lives: 1,
    isGameOver: false,
    level: 1
  })

  // 调试模式
  const debugMode = ref(false)

  // 弹珠是否已离开发射通道
  const hasExitedLauncher = ref(false)

  // 发射器通道 - 使用贝塞尔曲线定义平滑斜坡
  const launcherChannel = {
    // 通道起点（底部右侧）
    startX: canvasWidth - 40,
    startY: canvasHeight,
    // 通道终点（中间偏左上方） - 作为开放出口
    endX: canvasWidth * 0.6,
    endY: 60,
    // 通道宽度
    width: 40,
    // 出口宽度
    exitWidth: 40,
    // 糖果条纹参数
    stripeWidth: 15,  // 单个条纹宽度
    stripeCount: 8,   // 条纹数量
    // 贝塞尔曲线控制点
    controlPoint1X: canvasWidth * 0.5,  // 稍微向内
    controlPoint1Y: canvasHeight * 0.4, // 向上但不高
    controlPoint2X: canvasWidth * 0.55,  // 继续向左
    controlPoint2Y: canvasHeight * 0.2, // 继续向上
    // 贝塞尔曲线分段数
    segments: 50
  }

  // 弹珠 - 初始位置在发射器通道的底部起点
  const ball = ref<Ball>({
    position: { 
      x: canvasWidth - 40,
      y: canvasHeight - 120
    },
    velocity: { x: 0, y: 0 },
    radius: 12,  // 适当大小
    color: '#F8F9FA',  // 雪白色
    isLaunched: false,
    angularVelocity: 0,
    rotation: 0,
    lastCollisionTime: 0
  })

  // 发射器
  const launcher = ref<Launcher>({
    position: { 
      x: canvasWidth - 40,
      y: canvasHeight - 100
    },
    radius: 15,
    dragStart: null,
    dragEnd: null,
    isDragging: false,
    maxDragDistance: 108,
    power: 0,
    color: '#3498db',
    direction: { x: 0, y: -1 }
  })

  // 挡板之间的空隙
  const gapBetweenPaddles = ref<number>(220)

  // 计算挡板参数
  const getFlipperParameters = () => {
    const flipperLength = 80
    const flipperWidth = 15
    const initialAngleDeg = 15
    const initialAngle = Math.PI * initialAngleDeg / 180
    const maxAngleDeg = 65
    const maxAngle = Math.PI * maxAngleDeg / 180
    const rotationSpeed = Math.PI * 12
    
    return { flipperLength, flipperWidth, initialAngle, maxAngle, rotationSpeed }
  }

  const { flipperLength, flipperWidth, initialAngle, maxAngle, rotationSpeed } = getFlipperParameters()

  // 左挡板
  const leftFlipper = ref<Flipper>({
    pivot: { 
      x: canvasWidth / 2 - gapBetweenPaddles.value / 2 - 20,
      y: canvasHeight - 80
    },
    angle: initialAngle,
    targetAngle: initialAngle,
    initialAngle: initialAngle,
    maxAngle: initialAngle - maxAngle,
    length: flipperLength,
    width: flipperWidth,
    color: '#2ed573',
    rotationSpeed: rotationSpeed,
    isPressed: false,
    endPoint: { x: 0, y: 0 }
  })

  // 右挡板
  const rightFlipper = ref<Flipper>({
    pivot: { 
      x: canvasWidth / 2 + gapBetweenPaddles.value / 2 + 20,
      y: canvasHeight - 80
    },
    angle: Math.PI - initialAngle,
    targetAngle: Math.PI - initialAngle,
    initialAngle: Math.PI - initialAngle,
    maxAngle: Math.PI - initialAngle + maxAngle,
    length: flipperLength,
    width: flipperWidth,
    color: '#2ed573',
    rotationSpeed: rotationSpeed,
    isPressed: false,
    endPoint: { x: 0, y: 0 }
  })

  // 左侧减震器
  const leftShockAbsorber = ref<ShockAbsorber>({
    position: { 
      x: canvasWidth * 0.17,  // 更靠近左侧
      y: canvasHeight * 0.75  // 位置提高
    },
    length: 467,  // 减震器长度
    width: 20,    // 宽度
    angle: Math.PI * 0.33,  // 45度角，指向右下方
    color: '#3498db',
    isLeft: true,
    segments: 8,
    springWidth: 15,
    springCount: 5,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },
    compression: 0,
    isCompressed: false,
    compressionTime: 0
  })

  // 右侧减震器
  const rightShockAbsorber = ref<ShockAbsorber>({
    position: { 
      x: canvasWidth * 0.8,  // 更靠近右侧
      y: canvasHeight * 0.85
    },
    length: 250,
    width: 20,
    angle: Math.PI * 0.75,  // 135度角，指向左下方
    color: '#3498db',
    isLeft: false,
    segments: 8,
    springWidth: 15,
    springCount: 5,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },
    compression: 0,
    isCompressed: false,
    compressionTime: 0
  })

  // 更新端点计算
  const calculateShockAbsorberPoints = (shock: ShockAbsorber) => {
    const cos = Math.cos(shock.angle)
    const sin = Math.sin(shock.angle)
    
    shock.startPoint = {
      x: shock.position.x - cos * shock.length * 0.5,
      y: shock.position.y - sin * shock.length * 0.5
    }
    
    shock.endPoint = {
      x: shock.position.x + cos * shock.length * 0.5,
      y: shock.position.y + sin * shock.length * 0.5
    }
  }

  // 初始化端点
  calculateShockAbsorberPoints(leftShockAbsorber.value)
  calculateShockAbsorberPoints(rightShockAbsorber.value)

  // 碰撞计数
  const collisionCount = ref(0)

  // 碰撞特效
  const collisionEffects = ref<CollisionEffect[]>([])

  // 空间网格优化
  const gridSize = 50
  const bumperGrid = new Map<string, ScoreBumper[]>()

  // 计算三次贝塞尔曲线上的点
  const calculateCubicBezierPoint = (t: number, p0: Vector2D, p1: Vector2D, p2: Vector2D, p3: Vector2D): Vector2D => {
    const u = 1 - t
    const tt = t * t
    const uu = u * u
    const uuu = uu * u
    const ttt = tt * t
    
    const x = 
      uuu * p0.x + 
      3 * uu * t * p1.x + 
      3 * u * tt * p2.x + 
      ttt * p3.x
      
    const y = 
      uuu * p0.y + 
      3 * uu * t * p1.y + 
      3 * u * tt * p2.y + 
      ttt * p3.y
      
    return { x, y }
  }

  // 计算贝塞尔曲线的一阶导数（切线）
  const calculateCubicBezierDerivative = (t: number, p0: Vector2D, p1: Vector2D, p2: Vector2D, p3: Vector2D): Vector2D => {
    const u = 1 - t
    const uu = u * u
    const tt = t * t
    
    const dx = 
      3 * (p1.x - p0.x) * uu + 
      6 * (p2.x - p1.x) * u * t + 
      3 * (p3.x - p2.x) * tt
      
    const dy = 
      3 * (p1.y - p0.y) * uu + 
      6 * (p2.y - p1.y) * u * t + 
      3 * (p3.y - p2.y) * tt
      
    return { x: dx, y: dy }
  }

  // 计算贝塞尔曲线的二阶导数（曲率相关）
  const calculateCubicBezierSecondDerivative = (t: number, p0: Vector2D, p1: Vector2D, p2: Vector2D, p3: Vector2D): Vector2D => {
    const u = 1 - t
    
    const d2x = 
      6 * (p2.x - 2 * p1.x + p0.x) * u + 
      6 * (p3.x - 2 * p2.x + p1.x) * t
      
    const d2y = 
      6 * (p2.y - 2 * p1.y + p0.y) * u + 
      6 * (p3.y - 2 * p2.y + p1.y) * t
      
    return { x: d2x, y: d2y }
  }

  // 计算曲率
  const calculateCurvature = (firstDerivative: Vector2D, secondDerivative: Vector2D): number => {
    const dx = firstDerivative.x
    const dy = firstDerivative.y
    const d2x = secondDerivative.x
    const d2y = secondDerivative.y
    
    const numerator = Math.abs(dx * d2y - dy * d2x)
    const denominator = Math.pow(dx * dx + dy * dy, 1.5)
    
    return denominator > 0.0001 ? numerator / denominator : 0
  }

  // 优化通道控制点
  const optimizeChannelControlPoints = () => {
    const startX = launcherChannel.startX
    const startY = launcherChannel.startY
    const endX = launcherChannel.endX
    const endY = launcherChannel.endY
    
    // 控制点1：在起点附近，控制起始斜率（接近垂直）
    launcherChannel.controlPoint1X = startX
    launcherChannel.controlPoint1Y = startY - 200
    
    // 控制点2：在终点附近，控制结束斜率（接近水平，向左）
    launcherChannel.controlPoint2X = endX + 100
    launcherChannel.controlPoint2Y = endY - 50
    
    // 确保曲线平滑
    const minVerticalDistance = 150
    if (launcherChannel.controlPoint1Y > launcherChannel.controlPoint2Y) {
      launcherChannel.controlPoint1Y = launcherChannel.controlPoint2Y - minVerticalDistance
    }
  }

  // 生成平滑的发射器通道点
  const generateLauncherChannelPoints = (): { point: Vector2D, tangent: Vector2D, curvature: number }[] => {
    const points: { point: Vector2D, tangent: Vector2D, curvature: number }[] = []
    
    // 定义贝塞尔曲线的控制点
    const p0: Vector2D = { 
      x: launcherChannel.startX, 
      y: launcherChannel.startY 
    }
    const p1: Vector2D = { 
      x: launcherChannel.controlPoint1X, 
      y: launcherChannel.controlPoint1Y 
    }
    const p2: Vector2D = { 
      x: launcherChannel.controlPoint2X, 
      y: launcherChannel.controlPoint2Y 
    }
    const p3: Vector2D = { 
      x: launcherChannel.endX, 
      y: launcherChannel.endY 
    }
    
    // 生成曲线上的点
    for (let i = 0; i <= launcherChannel.segments; i++) {
      const t = i / launcherChannel.segments
      
      const point = calculateCubicBezierPoint(t, p0, p1, p2, p3)
      const tangent = calculateCubicBezierDerivative(t, p0, p1, p2, p3)
      const secondDerivative = calculateCubicBezierSecondDerivative(t, p0, p1, p2, p3)
      const curvature = calculateCurvature(tangent, secondDerivative)
      
      // 标准化切线向量
      const tangentLength = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y)
      if (tangentLength > 0) {
        tangent.x /= tangentLength
        tangent.y /= tangentLength
      }
      
      points.push({ point, tangent, curvature })
    }
    
    return points
  }

  // 计算挡板末端位置
  const calculateFlipperEndPoint = (flipper: Flipper): Vector2D => {
    return {
      x: flipper.pivot.x + Math.cos(flipper.angle) * flipper.length,
      y: flipper.pivot.y + Math.sin(flipper.angle) * flipper.length
    }
  }

  // 更新挡板末端位置
  const updateFlipperEndPoints = () => {
    leftFlipper.value.endPoint = calculateFlipperEndPoint(leftFlipper.value)
    rightFlipper.value.endPoint = calculateFlipperEndPoint(rightFlipper.value)
  }

  // 得分器
  const scoreBumpers = ref<ScoreBumper[]>([
    { position: { x: canvasWidth * 0.3, y: canvasHeight * 0.3 }, radius: 20, color: '#ffa502', scoreValue: 100, id: 1, isActive: true },
    { position: { x: canvasWidth * 0.7, y: canvasHeight * 0.3 }, radius: 20, color: '#ffa502', scoreValue: 100, id: 2, isActive: true },
    { position: { x: canvasWidth * 0.5, y: canvasHeight * 0.4 }, radius: 20, color: '#ffa502', scoreValue: 150, id: 3, isActive: true },
    { position: { x: canvasWidth * 0.4, y: canvasHeight * 0.5 }, radius: 20, color: '#ffa502', scoreValue: 200, id: 4, isActive: true },
    { position: { x: canvasWidth * 0.6, y: canvasHeight * 0.5 }, radius: 20, color: '#ffa502', scoreValue: 200, id: 5, isActive: true }
  ])

  // 初始化空间网格
  const initializeSpatialGrid = () => {
    bumperGrid.clear()
    scoreBumpers.value.forEach(bumper => {
      const gridX = Math.floor(bumper.position.x / gridSize)
      const gridY = Math.floor(bumper.position.y / gridSize)
      const key = `${gridX},${gridY}`
      
      if (!bumperGrid.has(key)) {
        bumperGrid.set(key, [])
      }
      bumperGrid.get(key)?.push(bumper)
    })
  }

  // 墙壁边框
  const walls = {
    top: 0,
    bottom: canvasHeight,
    left: 0,
    right: canvasWidth
  }

  // 计算弹珠是否在通道内
  const isBallInChannel = computed(() => {
    const ballPos = ball.value.position
    
    const channelData = generateLauncherChannelPoints()
    if (!channelData || channelData.length === 0) return false
    
    for (let i = 0; i < channelData.length; i++) {
      const data = channelData[i]
      if (!data) continue
      
      const t = i / channelData.length
      const currentHalfWidth = t > 0.8 ? launcherChannel.exitWidth / 2 : launcherChannel.width / 2
      
      const dx = ballPos.x - data.point.x
      const dy = ballPos.y - data.point.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < currentHalfWidth + ball.value.radius) {
        return true
      }
    }
    return false
  })

  // 创建碰撞特效
  const createCollisionEffect = (position: Vector2D, normalX: number, normalY: number, intensity: number = 1) => {
    const particleCount = Math.floor(2 + intensity)
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 2 + 1
      
      collisionEffects.value.push({
        position: { 
          x: position.x + (Math.random() - 0.5) * 3,
          y: position.y + (Math.random() - 0.5) * 3
        },
        velocity: {
          x: Math.cos(angle) * speed - normalX * 1.5,
          y: Math.sin(angle) * speed - normalY * 1.5
        },
        radius: Math.random() * 1.5 + 0.5,
        life: 0.4 + Math.random() * 0.3,
        color: `rgba(255, 255, 255, ${0.8 + Math.random() * 0.2})`
      })
    }
  }

  // 更新碰撞特效
  const updateCollisionEffects = (deltaTime: number) => {
    const delta = deltaTime / 1000
    collisionEffects.value = collisionEffects.value.filter(effect => {
      effect.position.x += effect.velocity.x * delta * 60
      effect.position.y += effect.velocity.y * delta * 60
      effect.velocity.y += 0.2
      effect.life -= delta
      return effect.life > 0
    })
  }

  // 简化版通道物理逻辑 - 只处理未发射时的约束
  const applyLauncherChannelPhysics = (): boolean => {
    const b = ball.value
    
    // 如果弹珠已经离开过通道，就不再应用通道物理
    if (hasExitedLauncher.value) {
      return false
    }
    
    // 获取通道点
    const channelData = generateLauncherChannelPoints()
    if (channelData.length === 0) return false
    
    const channelHalfWidth = launcherChannel.width / 2
    
    // 找到弹珠在通道中的最近点
    let nearestIndex = 0
    let nearestDistance = Infinity
    let nearestChannelData: typeof channelData[0] | null = null
    
    for (let i = 0; i < channelData.length; i++) {
      const data = channelData[i]
      if (!data) continue
      
      const dx = b.position.x - data.point.x
      const dy = b.position.y - data.point.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
        nearestChannelData = data
      }
    }
    
    if (!nearestChannelData) return false
    
    // 计算法向量（垂直于切线）
    const normalX = -nearestChannelData.tangent.y
    const normalY = nearestChannelData.tangent.x
    
    // 计算弹珠到通道中心线的距离
    const distFromCenter = (b.position.x - nearestChannelData.point.x) * normalX + 
                          (b.position.y - nearestChannelData.point.y) * normalY
    
    const tParam = nearestIndex / channelData.length
    
    // 检查是否在出口附近
    if (tParam > 0.9) {
      // 检查弹珠是否正在离开通道
      const exitPoint = channelData[channelData.length - 1]
      if (exitPoint) {
        const dx = b.position.x - exitPoint.point.x
        const dy = b.position.y - exitPoint.point.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // 如果弹珠在出口外侧
        if (distance > launcherChannel.exitWidth / 2) {
          // 弹珠已离开通道
          hasExitedLauncher.value = true
          return false
        }
      }
    }
    
    const isInChannel = Math.abs(distFromCenter) < channelHalfWidth + b.radius
    
    if (!isInChannel) {
      return false
    }
    
    // 弹珠在通道内，应用约束
    if (Math.abs(distFromCenter) > channelHalfWidth - b.radius) {
      // 弹珠碰撞到通道边缘
      const penetration = Math.abs(distFromCenter) - (channelHalfWidth - b.radius)
      const sign = Math.sign(distFromCenter)
      
      // 将弹珠推回通道
      b.position.x -= normalX * sign * penetration
      b.position.y -= normalY * sign * penetration
      
      // 反弹物理
      const velocityAlongNormal = b.velocity.x * normalX + b.velocity.y * normalY
      if (velocityAlongNormal > 0) {
        b.velocity.x -= 1.5 * velocityAlongNormal * normalX
        b.velocity.y -= 1.5 * velocityAlongNormal * normalY
      }
      
      // 根据曲率添加侧向力
      const curvatureForce = nearestChannelData.curvature * 0.3
      b.velocity.x += normalX * curvatureForce * sign
      b.velocity.y += normalY * curvatureForce * sign
      
      // 添加摩擦力
      b.velocity.x *= 0.97
      b.velocity.y *= 0.97
      
      collisionCount.value++
    }
    
    // 沿着切线方向给予推动力
    const tangentX = nearestChannelData.tangent.x
    const tangentY = nearestChannelData.tangent.y
    
    // 应用沿切线方向的力
    b.velocity.x += tangentX * 0.5
    b.velocity.y += tangentY * 0.5
    
    // 添加重力分量
    const gravityAlongTangent = 0.2 * Math.abs(tangentY)
    b.velocity.y += gravityAlongTangent
    
    return true
  }

  // 检查通道边界碰撞（将通道视为普通边框）
  const checkLauncherBoundaryCollision = () => {
    if (!ball.value.isLaunched) return false
    
    const b = ball.value
    const channelData = generateLauncherChannelPoints()
    if (channelData.length < 2) return false
    
    let hasCollision = false
    
    // 将通道边界作为线段进行碰撞检测
    for (let i = 0; i < channelData.length - 1; i++) {
      const data1 = channelData[i]
      const data2 = channelData[i + 1]
      if (!data1 || !data2) continue
      
      // 左边界
      const leftStart = {
        x: data1.point.x - data1.tangent.y * launcherChannel.width / 2,
        y: data1.point.y + data1.tangent.x * launcherChannel.width / 2
      }
      const leftEnd = {
        x: data2.point.x - data2.tangent.y * launcherChannel.width / 2,
        y: data2.point.y + data2.tangent.x * launcherChannel.width / 2
      }
      
      // 右边界
      const rightStart = {
        x: data1.point.x + data1.tangent.y * launcherChannel.width / 2,
        y: data1.point.y - data1.tangent.x * launcherChannel.width / 2
      }
      const rightEnd = {
        x: data2.point.x + data2.tangent.y * launcherChannel.width / 2,
        y: data2.point.y - data2.tangent.x * launcherChannel.width / 2
      }
      
      // 检查与左边界的碰撞
      const leftCollision = checkLineCircleCollision(leftStart, leftEnd, b.position, b.radius)
      if (leftCollision.collided) {
        handleCollisionResponse(leftCollision.normalX, leftCollision.normalY, leftCollision.closestPoint, 0.9, 0.2)
        hasCollision = true
        break
      }
      
      // 检查与右边界的碰撞
      const rightCollision = checkLineCircleCollision(rightStart, rightEnd, b.position, b.radius)
      if (rightCollision.collided) {
        handleCollisionResponse(rightCollision.normalX, rightCollision.normalY, rightCollision.closestPoint, 0.9, 0.2)
        hasCollision = true
        break
      }
    }
    
    return hasCollision
  }

  // 改进的弹珠发射逻辑
  const launchBall = () => {
    if (!launcher.value.dragStart || !launcher.value.dragEnd || ball.value.isLaunched) return
    
    const dragStart = launcher.value.dragStart
    const dragEnd = launcher.value.dragEnd
    
    // 计算拖拽方向和距离
    const dx = dragEnd.x - dragStart.x
    const dy = dragEnd.y - dragStart.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 限制最大拖拽距离
    const maxDrag = launcher.value.maxDragDistance
    const clampedDistance = Math.min(distance, maxDrag)
    
    // 计算力度 (0-1)
    launcher.value.power = clampedDistance / maxDrag
    
    // 获取通道起点信息
    const channelData = generateLauncherChannelPoints()
    if (channelData.length > 0) {
      const startData = channelData[0]
      if (startData) {
        // 发射方向为通道起点的切线方向
        const launchDirX = startData.tangent.x
        const launchDirY = startData.tangent.y
        
        // 发射速度：基础速度 + 力度加成
        const baseSpeed = 12
        const speedMultiplier = 1.0 + launcher.value.power * 1.5
        const speed = baseSpeed * speedMultiplier
        
        // 发射弹珠
        ball.value.velocity = {
          x: launchDirX * speed * 0.4,
          y: launchDirY * speed
        }
        
        // 添加轻微随机旋转
        const randomSpin = (Math.random() - 0.5) * 0.5
        ball.value.velocity.x += randomSpin
        
        // 设置角速度
        ball.value.angularVelocity = randomSpin * 0.3
        
        ball.value.isLaunched = true
        ball.value.lastCollisionTime = Date.now()
        hasExitedLauncher.value = false  // 重置离开状态
        
        if (debugMode.value) {
          console.log('弹珠发射:', {
            力度: launcher.value.power.toFixed(2),
            速度: speed.toFixed(1),
            切线方向: `(${launchDirX.toFixed(3)}, ${launchDirY.toFixed(3)})`,
            发射速度: `(${ball.value.velocity.x.toFixed(2)}, ${ball.value.velocity.y.toFixed(2)})`,
            起点曲率: startData.curvature.toFixed(4)
          })
        }
      }
    }
    
    // 重置发射器状态
    launcher.value.dragStart = null
    launcher.value.dragEnd = null
    launcher.value.isDragging = false
  }

  // 重置弹珠位置
  const resetBall = () => {
    ball.value.position = { 
      x: launcherChannel.startX, 
      y: launcherChannel.startY 
    }
    ball.value.velocity = { x: 0, y: 0 }
    ball.value.isLaunched = false
    ball.value.angularVelocity = 0
    ball.value.rotation = 0
    launcher.value.power = 0
    
    // 重置通道状态
    hasExitedLauncher.value = false
    
    // 重置拖动状态
    launcher.value.dragStart = null
    launcher.value.dragEnd = null
    launcher.value.isDragging = false
  }

  // 初始化游戏
  const initializeGame = () => {
    startGame()
  }

  // 重新开始游戏
  const restartGame = () => {
    startGame()
  }

  // 开始游戏
  const startGame = () => {
  gameState.value.isPlaying = true
  gameState.value.isGameOver = false
  gameState.value.score = 0
  gameState.value.lives = 1  // 确保只有一条命
  gameState.value.level = 1
  collisionCount.value = 0
  collisionEffects.value = []
  resetBall()
  scoreBumpers.value.forEach(bumper => bumper.isActive = true)
  updateFlipperEndPoints()
  initializeSpatialGrid()
  
  // 重置挡板角度
  leftFlipper.value.angle = leftFlipper.value.initialAngle
  leftFlipper.value.targetAngle = leftFlipper.value.initialAngle
  leftFlipper.value.isPressed = false
  
  rightFlipper.value.angle = rightFlipper.value.initialAngle
  rightFlipper.value.targetAngle = rightFlipper.value.initialAngle
  rightFlipper.value.isPressed = false
  
  // 优化通道控制点
  optimizeChannelControlPoints()
  
  // 重新计算减震器端点
  calculateShockAbsorberPoints(leftShockAbsorber.value)
  calculateShockAbsorberPoints(rightShockAbsorber.value)
  
  if (debugMode.value) {
    console.log('游戏开始，一条命模式')
  }
}

  // 下一关
  const nextLevel = () => {
    gameState.value.level++
    gameState.value.score += 1000
    resetBall()
    scoreBumpers.value.forEach(bumper => bumper.isActive = true)
    initializeSpatialGrid()
  }

  // 游戏结束
  const endGame = () => {
  gameState.value.isPlaying = false
  gameState.value.isGameOver = true
  
  if (debugMode.value) {
    console.log('游戏结束，最终得分:', gameState.value.score)
  }
}

  // 开始拖动发射器
  const startDrag = (x: number, y: number) => {
    if (!ball.value.isLaunched) {
      launcher.value.dragStart = { x, y }
      launcher.value.dragEnd = { x, y }
      launcher.value.isDragging = true
    }
  }

  // 更新拖动位置
  const updateDrag = (x: number, y: number) => {
    if (launcher.value.isDragging && launcher.value.dragStart) {
      // 限制只能向下拖动
      const dragStart = launcher.value.dragStart
      const newDragEnd = { x: dragStart.x, y: Math.max(dragStart.y, y) }
      
      launcher.value.dragEnd = newDragEnd
      
      // 计算向下拖动的距离
      const dy = newDragEnd.y - dragStart.y
      const distance = Math.abs(dy)
      
      // 限制最大拖动距离
      const maxDrag = launcher.value.maxDragDistance
      if (distance > maxDrag) {
        launcher.value.dragEnd = {
          x: dragStart.x,
          y: dragStart.y + maxDrag
        }
      }
      
      // 更新发射力度
      launcher.value.power = Math.min(distance, maxDrag) / maxDrag
    }
  }

  // 结束拖动并发射
  const endDrag = () => {
    if (launcher.value.isDragging && launcher.value.power > 0.1) {
      launchBall()
    } else {
      launcher.value.dragStart = null
      launcher.value.dragEnd = null
      launcher.value.isDragging = false
      launcher.value.power = 0
    }
  }

  // 控制挡板
  const controlFlipper = (side: 'left' | 'right', action: 'down' | 'up') => {
    if (!gameState.value.isPlaying) return
    
    if (side === 'left') {
      if (action === 'down' && !leftFlipper.value.isPressed) {
        leftFlipper.value.isPressed = true
        leftFlipper.value.targetAngle = leftFlipper.value.maxAngle
      } else if (action === 'up') {
        leftFlipper.value.isPressed = false
        leftFlipper.value.targetAngle = leftFlipper.value.initialAngle
      }
    } else {
      if (action === 'down' && !rightFlipper.value.isPressed) {
        rightFlipper.value.isPressed = true
        rightFlipper.value.targetAngle = rightFlipper.value.maxAngle
      } else if (action === 'up') {
        rightFlipper.value.isPressed = false
        rightFlipper.value.targetAngle = rightFlipper.value.initialAngle
      }
    }
  }

  // 改进的碰撞响应系统
  const handleCollisionResponse = (
  normalX: number,
  normalY: number,
  position: Vector2D,
  restitution: number = 0.85,
  friction: number = 0.15
) => {
  const b = ball.value
  
  // 计算相对速度
  const velocityAlongNormal = b.velocity.x * normalX + b.velocity.y * normalY
  
  // 只处理接近的碰撞
  if (velocityAlongNormal > 0) return
  
  // 计算冲量
  const j = -(1 + restitution) * velocityAlongNormal
  
  // 应用冲量
  b.velocity.x += j * normalX
  b.velocity.y += j * normalY
  
  // 应用摩擦力
  const tangentX = -normalY
  const tangentY = normalX
  const velocityAlongTangent = b.velocity.x * tangentX + b.velocity.y * tangentY
  const jt = -velocityAlongTangent * friction
  
  b.velocity.x += jt * tangentX
  b.velocity.y += jt * tangentY
  
  // ✅ 降低最小速度限制
  const minSpeed = 3  // 从 4 降低到 3
  const currentSpeed = Math.sqrt(b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y)
  if (currentSpeed < minSpeed && currentSpeed > 0) {
    const speedMultiplier = minSpeed / currentSpeed
    b.velocity.x *= speedMultiplier
    b.velocity.y *= speedMultiplier
  }
  
  // 创建碰撞特效
  createCollisionEffect(position, normalX, normalY, Math.abs(velocityAlongNormal) * 0.1)
  
  // 更新碰撞时间
  b.lastCollisionTime = Date.now()
  collisionCount.value++
}

  // 线段-圆碰撞检测
  const checkLineCircleCollision = (
    lineStart: Vector2D,
    lineEnd: Vector2D,
    circleCenter: Vector2D,
    radius: number
  ): { 
    collided: boolean, 
    closestPoint: Vector2D, 
    normalX: number, 
    normalY: number, 
    penetration: number 
  } => {
    const lineVec = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y }
    const circleVec = { x: circleCenter.x - lineStart.x, y: circleCenter.y - lineStart.y }
    
    const lineLengthSq = lineVec.x * lineVec.x + lineVec.y * lineVec.y
    let t = 0
    if (lineLengthSq !== 0) {
      t = Math.max(0, Math.min(1, (circleVec.x * lineVec.x + circleVec.y * lineVec.y) / lineLengthSq))
    }
    
    const closestPoint = { x: lineStart.x + t * lineVec.x, y: lineStart.y + t * lineVec.y }
    const dx = circleCenter.x - closestPoint.x
    const dy = circleCenter.y - closestPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    let normalX = 0
    let normalY = 0
    if (distance > 0) {
      normalX = dx / distance
      normalY = dy / distance
    }
    
    return {
      collided: distance <= radius + flipperWidth / 2,
      closestPoint,
      normalX,
      normalY,
      penetration: Math.max(0, (radius + flipperWidth / 2) - distance)
    }
  }

  // 更新挡板角度
  const updateFlipperAngle = (flipper: Flipper, deltaTime: number) => {
  if (!gameState.value.isPlaying) return
  
  const angleDiff = flipper.targetAngle - flipper.angle
  const maxRotation = flipper.rotationSpeed * deltaTime / 1000
  
  // ✅ 增加旋转灵敏度
  if (Math.abs(angleDiff) > 0.001) {
    if (angleDiff > 0) {
      flipper.angle += Math.min(angleDiff, maxRotation * 2)  // ✅ 加快旋转速度
    } else {
      flipper.angle -= Math.min(-angleDiff, maxRotation * 2)  // ✅ 加快旋转速度
    }
  } else {
    flipper.angle = flipper.targetAngle
  }
  
  flipper.endPoint = calculateFlipperEndPoint(flipper)
}

  // 挡板碰撞检测
  const checkFlipperCollision = (flipper: Flipper): boolean => {
  const b = ball.value
  const start = flipper.pivot
  const end = flipper.endPoint
  
  const collision = checkLineCircleCollision(start, end, b.position, b.radius)
  
  if (collision.collided) {
    const velocityAlongNormal = b.velocity.x * collision.normalX + b.velocity.y * collision.normalY
    
    if (velocityAlongNormal < 0.5) {
      const restitution = flipper.isPressed ? 1.8 : 1.2  // ✅ 提高恢复系数
      
      // 使用改进的碰撞响应
      handleCollisionResponse(
        collision.normalX,
        collision.normalY,
        collision.closestPoint,
        restitution,
        0.08  // ✅ 降低摩擦力
      )
      
      // ✅ 提高挡板施加的力量
      if (flipper.isPressed) {
        b.velocity.y -= 9  // ✅ 从 6 增加到 9
        b.angularVelocity += (flipper === leftFlipper.value ? -1 : 1) * 0.3  // ✅ 从 0.2 增加到 0.3
        
        if (flipper === leftFlipper.value) {
          b.velocity.x -= 4  // ✅ 从 2.5 增加到 4
        } else {
          b.velocity.x += 4  // ✅ 从 2.5 增加到 4
        }
      } else {
        b.velocity.y -= 3  // ✅ 从 2 增加到 3
      }
      
      // 解决穿透
      if (collision.penetration > 0) {
        b.position.x += collision.normalX * collision.penetration * 2
        b.position.y += collision.normalY * collision.penetration * 2
      }
      
      return true
    }
  }
  
  return false
}

  // 优化碰撞检测 - 使用空间网格
  const getNearbyBumpers = (): ScoreBumper[] => {
    const b = ball.value
    const gridX = Math.floor(b.position.x / gridSize)
    const gridY = Math.floor(b.position.y / gridSize)
    
    const bumpersToCheck: ScoreBumper[] = []
    
    // 检查相邻网格
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`
        const cellBumpers = bumperGrid.get(key)
        if (cellBumpers) {
          bumpersToCheck.push(...cellBumpers)
        }
      }
    }
    
    return bumpersToCheck
  }

  // 检查与得分器的碰撞
  const checkScoreBumperCollision = (bumper: ScoreBumper): boolean => {
  const b = ball.value
  const dx = b.position.x - bumper.position.x
  const dy = b.position.y - bumper.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const minDistance = b.radius + bumper.radius
  
  if (distance < minDistance) {
    const normalX = dx / distance
    const normalY = dy / distance
    
    // 使用改进的碰撞响应
    handleCollisionResponse(normalX, normalY, bumper.position, 1.2, 0.05)  // ✅ 降低恢复系数
    
    // ✅ 降低额外反弹力
    b.velocity.x *= 1.1  // 从 1.3 降低到 1.1
    b.velocity.y *= 1.1  // 从 1.3 降低到 1.1
    
    if (bumper.isActive) {
      gameState.value.score += bumper.scoreValue
      bumper.isActive = false
      
      // 创建得分特效
      for (let i = 0; i < 8; i++) {
        collisionEffects.value.push({
          position: { ...bumper.position },
          velocity: {
            x: (Math.random() - 0.5) * 8,  // ✅ 降低特效速度
            y: (Math.random() - 0.5) * 8 - 4
          },
          radius: Math.random() * 3 + 2,
          life: 1.0 + Math.random() * 0.5,
          color: `hsl(${60 + Math.random() * 30}, 100%, 60%)`
        })
      }
      
      // 检查是否所有得分器都被击中
      if (scoreBumpers.value.every(b => !b.isActive)) {
        setTimeout(nextLevel, 1500)
      }
    }
    
    return true
  }
  
  return false
}

  // 更新弹珠状态
  const updateBallState = (deltaTime: number) => {
  const b = ball.value
  const delta = deltaTime / 1000
  
  if (b.isLaunched) {
    // 更新位置
    b.position.x += b.velocity.x
    b.position.y += b.velocity.y
    
    // ✅ 降低重力
    b.velocity.y += 0.3  // 从 0.5 降低到 0.3
    
    // ✅ 增加空气阻力
    b.velocity.x *= 0.99  // 从 0.996 降低到 0.99
    b.velocity.y *= 0.99  // 从 0.996 降低到 0.99
    
    // 更新旋转
    b.rotation += b.angularVelocity
    b.angularVelocity *= 0.985
    
    // ✅ 降低速度相关的旋转
    b.angularVelocity += (b.velocity.x - b.velocity.y) * 0.005  // 从 0.008 降低到 0.005
    
    // ✅ 降低角速度限制
    if (Math.abs(b.angularVelocity) > 3) {  // 从 5 降低到 3
      b.angularVelocity = Math.sign(b.angularVelocity) * 3
    }
    
    // ✅ 降低最大速度限制
    const maxSpeed = 30  // 从 50 降低到 30
    const speed = Math.sqrt(b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y)
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed
      b.velocity.x *= scale
      b.velocity.y *= scale
    }
  } else {
    // 弹珠在发射器中轻微晃动
    const time = Date.now() * 0.001
    b.position.x = launcher.value.position.x + Math.sin(time * 3) * 1.5
    b.position.y = launcher.value.position.y
    b.rotation += 0.05
  }
}

  // 检查墙壁碰撞
  const checkWallCollision = () => {
  const b = ball.value
  
  if (b.position.x - b.radius <= walls.left) {
    b.position.x = walls.left + b.radius
    handleCollisionResponse(1, 0, { x: walls.left, y: b.position.y }, 0.8, 0.2)  // ✅ 降低恢复系数
  }
  
  if (b.position.x + b.radius >= walls.right) {
    b.position.x = walls.right - b.radius
    handleCollisionResponse(-1, 0, { x: walls.right, y: b.position.y }, 0.8, 0.2)  // ✅ 降低恢复系数
  }
  
  if (b.position.y - b.radius <= walls.top) {
    b.position.y = walls.top + b.radius
    handleCollisionResponse(0, 1, { x: b.position.x, y: walls.top }, 0.8, 0.2)  // ✅ 降低恢复系数
  }
}

  // 检查弹珠掉落
  const checkBallDrop = () => {
  const b = ball.value
  
  // 如果弹珠的底部边缘已经超过画布底部
  if (b.position.y + b.radius >= walls.bottom) {
    // 让弹珠稍微反弹一下，但立即结束游戏
    b.position.y = walls.bottom - b.radius
    
    // 记录游戏结束
    setTimeout(() => {
      endGame()
      
      if (debugMode.value) {
        console.log('弹珠掉落到底部，游戏结束', {
          弹珠Y: b.position.y,
          底部Y: walls.bottom,
          半径: b.radius
        })
      }
    }, 100) // 延迟100ms结束，让玩家看到弹珠碰到底部
  }
}

  // 检查减震器碰撞
  const checkShockAbsorberCollision = (shock: ShockAbsorber): boolean => {
  const b = ball.value
  const { startPoint, endPoint, width } = shock
  
  // 线段-圆碰撞检测
  const lineVec = { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y }
  const circleVec = { x: b.position.x - startPoint.x, y: b.position.y - startPoint.y }
  
  const lineLengthSq = lineVec.x * lineVec.x + lineVec.y * lineVec.y
  let t = 0
  if (lineLengthSq !== 0) {
    t = Math.max(0, Math.min(1, (circleVec.x * lineVec.x + circleVec.y * lineVec.y) / lineLengthSq))
  }
  
  const closestPoint = { 
    x: startPoint.x + t * lineVec.x, 
    y: startPoint.y + t * lineVec.y 
  }
  
  const dx = b.position.x - closestPoint.x
  const dy = b.position.y - closestPoint.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const minDistance = b.radius + width * 0.5
  
  if (distance < minDistance) {
    const normalX = dx / distance
    const normalY = dy / distance
    
    // 使用改进的碰撞响应
    handleCollisionResponse(normalX, normalY, closestPoint, 1.0, 0.1)  // ✅ 降低恢复系数
    
    // ✅ 降低减震器施加的力量
    if (shock.isLeft) {
      // 左侧减震器向右推
      b.velocity.x += 1.5  // 降低到 3
      b.velocity.y -= 2  // 降低到 2
    } else {
      // 右侧减震器向左推
      b.velocity.x -= 1.5  // 降低到 3
      b.velocity.y -= 2  // 降低到 2
    }
    
    // ✅ 降低旋转效果
    b.angularVelocity += (shock.isLeft ? -1 : 1) * 0.1  // 从 0.2 降低到 0.1
    
    // 设置压缩效果
    shock.compression = Math.min(1, shock.compression + 0.3)
    shock.isCompressed = true
    shock.compressionTime = Date.now()
    
    // 创建碰撞特效
    createCollisionEffect(closestPoint, normalX, normalY, 1.0)  // ✅ 降低特效强度
    
    // 解决穿透
    const overlap = minDistance - distance
    if (overlap > 0) {
      b.position.x += normalX * overlap
      b.position.y += normalY * overlap
    }
    
    return true
  }
  
  return false
}

  // 更新减震器状态
  const updateShockAbsorbers = (deltaTime: number) => {
    const delta = deltaTime / 1000
    
    // 左侧减震器
    if (leftShockAbsorber.value.isCompressed) {
      leftShockAbsorber.value.compression = Math.max(0, leftShockAbsorber.value.compression - delta * 3)
      if (leftShockAbsorber.value.compression <= 0) {
        leftShockAbsorber.value.isCompressed = false
      }
    }
    
    // 右侧减震器
    if (rightShockAbsorber.value.isCompressed) {
      rightShockAbsorber.value.compression = Math.max(0, rightShockAbsorber.value.compression - delta * 3)
      if (rightShockAbsorber.value.compression <= 0) {
        rightShockAbsorber.value.isCompressed = false
      }
    }
  }

  // 碰撞检测
  const checkCollision = () => {
  if (!ball.value.isLaunched) return
  
  // 检查弹珠是否在发射器通道内（仅限未发射时）
  if (!hasExitedLauncher.value) {
    applyLauncherChannelPhysics()
  } else {
    // 弹珠已离开通道，将通道视为普通边框
    checkLauncherBoundaryCollision()
  }

  // 检查墙壁碰撞（不包括底部）
  checkWallCollision()

  // 检查与减震器的碰撞
  checkShockAbsorberCollision(leftShockAbsorber.value)
  checkShockAbsorberCollision(rightShockAbsorber.value)

  // 检查与挡板的碰撞
  checkFlipperCollision(leftFlipper.value)
  checkFlipperCollision(rightFlipper.value)

  // 使用空间网格优化得分器碰撞检测
  const nearbyBumpers = getNearbyBumpers()
  nearbyBumpers.forEach(checkScoreBumperCollision)

  // 最后检查弹珠是否掉落（这应该最后执行）
  checkBallDrop()
}

  // 更新游戏状态
  const lastUpdateTime = ref<number>(0)
  
  const update = (currentTime?: number) => {
    if (!gameState.value.isPlaying || gameState.value.isGameOver) return
    
    const now = currentTime || performance.now()
    const deltaTime = lastUpdateTime.value ? now - lastUpdateTime.value : 16
    lastUpdateTime.value = now
    
    // 更新弹珠状态
    updateBallState(deltaTime)
    
    // 更新挡板角度
    updateFlipperAngle(leftFlipper.value, deltaTime)
    updateFlipperAngle(rightFlipper.value, deltaTime)
    
    // 更新碰撞特效
    updateCollisionEffects(deltaTime)
    
    // 更新减震器状态
    updateShockAbsorbers(deltaTime)

    // 检查碰撞
    checkCollision()
  }

  // 发射弹珠（带有指定力度）
  const launchBallWithPower = (power: number) => {
  if (ball.value.isLaunched) return
  
  launcher.value.power = Math.min(Math.max(power, 0), 1)
  
  const channelData = generateLauncherChannelPoints()
  if (channelData.length > 0) {
    const startData = channelData[0]
    if (startData) {
      const launchDirX = startData.tangent.x
      const launchDirY = startData.tangent.y
      
      // ✅ 降低快速发射的速度
      const baseSpeed = 12
      const speedMultiplier = 1.0 + launcher.value.power * 1.5
      const speed = baseSpeed * speedMultiplier
      
      ball.value.velocity = {
        x: launchDirX * speed * 0.4,
        y: launchDirY * speed
      }
      
      const randomSpin = (Math.random() - 0.5) * 0.3
      ball.value.velocity.x += randomSpin
      ball.value.angularVelocity = randomSpin * 0.2
      
      ball.value.isLaunched = true
      ball.value.lastCollisionTime = Date.now()
      hasExitedLauncher.value = false
    }
  }
}

  // 绘制通道调试信息
  const drawLauncherChannelDebug = (ctx: CanvasRenderingContext2D) => {
    const channelData = generateLauncherChannelPoints()
    if (channelData.length === 0) return
    
    ctx.save()
    
    // 绘制切线
    for (let i = 0; i < channelData.length; i += 5) {
      const data = channelData[i]
      if (!data) continue
      
      ctx.strokeStyle = '#2ecc71'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(data.point.x, data.point.y)
      ctx.lineTo(data.point.x + data.tangent.x * 20, data.point.y + data.tangent.y * 20)
      ctx.stroke()
      
      // 显示曲率
      ctx.fillStyle = '#e74c3c'
      ctx.font = '10px Arial'
      ctx.fillText(
        `κ:${data.curvature.toFixed(3)}`,
        data.point.x - 15,
        data.point.y - 5
      )
    }
    
    // 绘制控制点
    ctx.fillStyle = '#f39c12'
    ctx.strokeStyle = '#f39c12'
    ctx.lineWidth = 1
    
    // 控制点1
    ctx.beginPath()
    ctx.arc(
      launcherChannel.controlPoint1X,
      launcherChannel.controlPoint1Y,
      4, 0, Math.PI * 2
    )
    ctx.fill()
    
    // 控制点2
    ctx.beginPath()
    ctx.arc(
      launcherChannel.controlPoint2X,
      launcherChannel.controlPoint2Y,
      4, 0, Math.PI * 2
    )
    ctx.fill()
    
    // 绘制控制线
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(launcherChannel.startX, launcherChannel.startY)
    ctx.lineTo(launcherChannel.controlPoint1X, launcherChannel.controlPoint1Y)
    ctx.lineTo(launcherChannel.controlPoint2X, launcherChannel.controlPoint2Y)
    ctx.lineTo(launcherChannel.endX, launcherChannel.endY)
    ctx.stroke()
    ctx.setLineDash([])
    
    ctx.restore()
  }

  // 键盘控制处理
  const keyDownHandler = (e: KeyboardEvent) => {
    if (!gameState.value.isPlaying) return
    
    switch (e.key) {
      case 'ArrowLeft':
        controlFlipper('left', 'down')
        break
      case 'ArrowRight':
        controlFlipper('right', 'down')
        break
      case ' ':
        if (!ball.value.isLaunched) {
          launchBallWithPower(0.8)
        }
        break
      case 'r':
      case 'R':
        resetBall()
        break
      case 'd':
      case 'D':
        debugMode.value = !debugMode.value
        break
    }
  }

  const keyUpHandler = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        controlFlipper('left', 'up')
        break
      case 'ArrowRight':
        controlFlipper('right', 'up')
        break
    }
  }

  onMounted(() => {
    updateFlipperEndPoints()
    initializeSpatialGrid()
    optimizeChannelControlPoints()
    
    // 添加键盘事件监听
    window.addEventListener('keydown', keyDownHandler)
    window.addEventListener('keyup', keyUpHandler)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', keyDownHandler)
    window.removeEventListener('keyup', keyUpHandler)
  })

  return {
    // 状态
    gameState,
    ball,
    launcher,
    leftFlipper,
    rightFlipper,
    leftShockAbsorber,
    rightShockAbsorber,
    scoreBumpers,
    gapBetweenPaddles,
    launcherChannel,
    collisionCount,
    collisionEffects,
    debugMode,
    hasExitedLauncher,
    
    // 计算属性
    isBallInChannel,
    
    // 工具函数
    generateLauncherChannelPoints,
    
    // 游戏控制
    initializeGame,
    restartGame,
    startGame,
    update,
    resetBall,
    endGame,
    nextLevel,
    
    // 发射器控制
    startDrag,
    updateDrag,
    endDrag,
    launchBallWithPower,
    
    // 挡板控制
    controlFlipper,
    
    // 工具函数
    updateFlipperEndPoints,
    drawLauncherChannelDebug,
    optimizeChannelControlPoints
  }
}