<template>
  <div class="pinball-game">
    <!-- 使用独立的分数面板组件 -->
    <ScoreBoard
      :score="gameState.score"
      :lives="gameState.lives"
      :level="gameState.level"
      :power="launcher.power"
      :collisions="collisionCount"
      :is-playing="gameState.isPlaying"
      :is-game-over="gameState.isGameOver"
      :ball-launched="ball.isLaunched"
      :is-in-channel="isBallInChannel"
    />
    
    <!-- 全屏游戏区域 -->
    <div class="game-container">
      <div class="game-area">
        <canvas 
          ref="canvasRef" 
          :width="canvasWidth" 
          :height="canvasHeight"
          class="game-canvas"
          @mousedown="handleCanvasMouseDown"
          @mousemove="handleCanvasMouseMove"
          @mouseup="handleCanvasMouseUp"
          @touchstart="handleCanvasTouchStart"
          @touchmove="handleCanvasTouchMove"
          @touchend="handleCanvasTouchEnd"
        ></canvas>
        
        <!-- 使用独立的游戏结束组件 -->
        <GameOver
          :visible="gameState.isGameOver"
          :score="gameState.score"
          @restart="handleRestart"
          @close="handleGameOverClose"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { usePinballPhysics } from '../composables/usePinballPhysics'
import ScoreBoard from './ScoreBoard.vue'
import GameOver from './GameOver.vue'
import type { Vector2D, Snowflake, ShockAbsorber } from '../types/pinball'

const emit = defineEmits<{
  goToMenu: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = 815
const canvasHeight = 1200

// 使用物理引擎
const physics = usePinballPhysics(canvasWidth, canvasHeight)

// 访问响应式状态
const gameState = physics.gameState
const ball = physics.ball
const launcher = physics.launcher
const collisionCount = physics.collisionCount
const isBallInChannel = physics.isBallInChannel
const debugMode = physics.debugMode

// 游戏循环变量
let animationFrameId: number
let lastTime = 0
let isPhysicsStarted = false
let resizeObserver: ResizeObserver | null = null

// 雪花数组
const snowflakes = ref<Snowflake[]>([])
const maxSnowflakes = 150
let lastSnowTime = 0
const snowInterval = 50  // 创建新雪花的时间间隔

// 重新开始游戏
const handleRestart = () => {
  physics.restartGame()
  startGameLoop()
}

// 处理游戏结束组件关闭
const handleGameOverClose = () => {
  // 可以添加一些清理逻辑
  console.log('游戏结束界面关闭')
}

// 返回主菜单
const goToMenu = () => {
  emit('goToMenu')
}

// 快速发射
const quickLaunch = () => {
  if (!ball.value.isLaunched) {
    physics.launchBallWithPower(0.6)
  }
}

// 控制挡板
const controlFlipper = (side: 'left' | 'right', action: 'down' | 'up') => {
  physics.controlFlipper(side, action)
}

// 雪花系统相关函数
// 初始化雪花
const initializeSnowflakes = () => {
  snowflakes.value = []
  
  for (let i = 0; i < maxSnowflakes; i++) {
    snowflakes.value.push(createSnowflake(true))
  }
}

// 创建雪花
const createSnowflake = (randomY: boolean = false): Snowflake => {
  return {
    x: Math.random() * canvasWidth,
    y: randomY ? Math.random() * canvasHeight : -10,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 2 + 0.5,
    sway: Math.random() * 0.5,
    swaySpeed: Math.random() * 0.05 + 0.02,
    swayDirection: Math.random() > 0.5 ? 1 : -1,
    opacity: Math.random() * 0.7 + 0.3,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: Math.random() * 0.02 - 0.01
  }
}

// 更新雪花
const updateSnowflakes = (deltaTime: number) => {
  const currentTime = Date.now()
  
  // 定期添加新雪花
  if (currentTime - lastSnowTime > snowInterval && snowflakes.value.length < maxSnowflakes) {
    snowflakes.value.push(createSnowflake())
    lastSnowTime = currentTime
  }
  
  // 更新所有雪花
  snowflakes.value.forEach(snowflake => {
    // 更新位置
    snowflake.y += snowflake.speed
    snowflake.x += Math.sin(snowflake.sway) * snowflake.swaySpeed * snowflake.swayDirection
    
    // 更新飘动
    snowflake.sway += snowflake.swaySpeed
    
    // 更新旋转
    snowflake.rotation += snowflake.rotationSpeed
    
    // 如果雪花飘出底部，重新从顶部开始
    if (snowflake.y > canvasHeight + 10) {
      snowflake.y = -10
      snowflake.x = Math.random() * canvasWidth
      snowflake.sway = Math.random() * 0.5
      snowflake.opacity = Math.random() * 0.7 + 0.3
    }
    
    // 如果雪花飘出左右边界，重新从另一侧开始
    if (snowflake.x < -10) {
      snowflake.x = canvasWidth + 10
    } else if (snowflake.x > canvasWidth + 10) {
      snowflake.x = -10
    }
  })
}

// 绘制雪花
const drawSnowflakes = (ctx: CanvasRenderingContext2D) => {
  if (snowflakes.value.length === 0) return
  
  ctx.save()
  
  snowflakes.value.forEach(snowflake => {
    ctx.save()
    ctx.translate(snowflake.x, snowflake.y)
    ctx.rotate(snowflake.rotation)
    
    // 雪花透明度
    ctx.globalAlpha = snowflake.opacity
    
    // 雪花主体
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, 0, snowflake.size, 0, Math.PI * 2)
    ctx.fill()
    
    // 雪花高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(-snowflake.size * 0.3, -snowflake.size * 0.3, snowflake.size * 0.4, 0, Math.PI * 2)
    ctx.fill()
    
    // 雪花光晕
    if (snowflake.size > 1.5) {
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, snowflake.size * 2)
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(0, 0, snowflake.size * 2, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  })
  
  ctx.restore()
}

// 绘制月亮
const drawMoon = (ctx: CanvasRenderingContext2D) => {
  const moonX = canvasWidth * 0.15
  const moonY = canvasHeight * 0.1
  const moonRadius = 40
  
  ctx.save()
  
  // 月亮光晕
  const glowGradient = ctx.createRadialGradient(
    moonX, moonY, 0,
    moonX, moonY, moonRadius * 3
  )
  glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)')
  glowGradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
  
  ctx.fillStyle = glowGradient
  ctx.beginPath()
  ctx.arc(moonX, moonY, moonRadius * 3, 0, Math.PI * 2)
  ctx.fill()
  
  // 月亮主体
  const moonGradient = ctx.createRadialGradient(
    moonX, moonY, 0,
    moonX, moonY, moonRadius
  )
  moonGradient.addColorStop(0, '#FFFACD')
  moonGradient.addColorStop(0.7, '#F0E68C')
  moonGradient.addColorStop(1, '#DAA520')
  
  ctx.fillStyle = moonGradient
  ctx.beginPath()
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 月亮表面的陨石坑
  ctx.fillStyle = 'rgba(210, 180, 140, 0.3)'
  
  const craters = [
    { x: moonX - 15, y: moonY - 10, r: 8 },
    { x: moonX + 10, y: moonY + 5, r: 6 },
    { x: moonX + 20, y: moonY - 15, r: 4 },
    { x: moonX - 5, y: moonY + 20, r: 5 }
  ]
  
  craters.forEach(crater => {
    ctx.beginPath()
    ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2)
    ctx.fill()
  })
  
  // 月亮高光
  const highlightGradient = ctx.createRadialGradient(
    moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, 0,
    moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, moonRadius * 0.5
  )
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.fillStyle = highlightGradient
  ctx.beginPath()
  ctx.arc(
    moonX - moonRadius * 0.3,
    moonY - moonRadius * 0.3,
    moonRadius * 0.5,
    0,
    Math.PI * 2
  )
  ctx.fill()
  
  ctx.restore()
}

// 修改后的发射器通道绘制函数
const drawLauncherChannel = (ctx: CanvasRenderingContext2D) => {
  const channel = physics.launcherChannel
  
  // 获取通道数据
  const channelData = physics.generateLauncherChannelPoints()
  if (!channelData || channelData.length === 0) return
  
  ctx.save()
  
  // 创建糖果拐杖样式
  const stripeCount = channel.stripeCount || 8
  
  // 创建通道路径
  const leftPoints: Vector2D[] = []
  const rightPoints: Vector2D[] = []
  
  channelData.forEach((data, index) => {
    if (!data) return
    
    const t = index / channelData.length
    const currentWidth = t > 0.8 ? channel.exitWidth : channel.width
    const halfWidth = currentWidth / 2
    
    const leftX = data.point.x - data.tangent.y * halfWidth
    const leftY = data.point.y + data.tangent.x * halfWidth
    const rightX = data.point.x + data.tangent.y * halfWidth
    const rightY = data.point.y - data.tangent.x * halfWidth
    
    leftPoints.push({ x: leftX, y: leftY })
    rightPoints.push({ x: rightX, y: rightY })
  })
  
  // 绘制红白螺旋条纹
  for (let i = 0; i < stripeCount; i++) {
    const isRed = i % 2 === 0
    const startT = i / stripeCount
    const endT = (i + 1) / stripeCount
    
    // 绘制左侧条纹
    ctx.beginPath()
    for (let j = Math.floor(startT * channelData.length); 
         j <= Math.floor(endT * channelData.length); j++) {
      const data = channelData[j]
      if (!data) continue
      
      const t = j / channelData.length
      const currentWidth = t > 0.8 ? channel.exitWidth : channel.width
      const stripeProgress = (t - startT) * stripeCount
      
      // 根据条纹进度计算位置
      const offset = Math.sin(stripeProgress * Math.PI * 2) * 2
      
      const halfWidth = (currentWidth / 2) + offset
      const pointX = data.point.x - data.tangent.y * halfWidth
      const pointY = data.point.y + data.tangent.x * halfWidth
      
      if (j === Math.floor(startT * channelData.length)) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    }
    
    // 绘制右侧对应条纹
    for (let j = Math.floor(endT * channelData.length); 
         j >= Math.floor(startT * channelData.length); j--) {
      const data = channelData[j]
      if (!data) continue
      
      const t = j / channelData.length
      const currentWidth = t > 0.8 ? channel.exitWidth : channel.width
      const stripeProgress = (t - startT) * stripeCount
      
      const offset = Math.sin(stripeProgress * Math.PI * 2) * 2
      const halfWidth = (currentWidth / 2) + offset
      const pointX = data.point.x + data.tangent.y * halfWidth
      const pointY = data.point.y - data.tangent.x * halfWidth
      
      ctx.lineTo(pointX, pointY)
    }
    
    ctx.closePath()
    
    // 设置颜色
    if (isRed) {
      // 红色条纹
      const gradient = ctx.createLinearGradient(
        leftPoints[0]?.x || 0, leftPoints[0]?.y || 0,
        rightPoints[rightPoints.length - 1]?.x || 0, 
        rightPoints[rightPoints.length - 1]?.y || 0
      )
      gradient.addColorStop(0, '#ff6b6b')
      gradient.addColorStop(0.5, '#ff4757')
      gradient.addColorStop(1, '#c44569')
      ctx.fillStyle = gradient
    } else {
      // 白色条纹
      const gradient = ctx.createLinearGradient(
        leftPoints[0]?.x || 0, leftPoints[0]?.y || 0,
        rightPoints[rightPoints.length - 1]?.x || 0, 
        rightPoints[rightPoints.length - 1]?.y || 0
      )
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(0.3, '#f1f2f6')
      gradient.addColorStop(0.7, '#dfe4ea')
      gradient.addColorStop(1, '#ced6e0')
      ctx.fillStyle = gradient
    }
    
    ctx.fill()
  }
  
  // 添加光泽效果
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.setLineDash([3, 3])
  
  // 左侧光泽线
  ctx.beginPath()
  if (leftPoints.length > 0 && leftPoints[0]) {
    const firstPoint = leftPoints[0]
    ctx.moveTo(firstPoint.x, firstPoint.y)
    for (let i = 1; i < leftPoints.length; i += 2) {
      const point = leftPoints[i]
      if (point) {
        ctx.lineTo(point.x, point.y)
      }
    }
  }
  ctx.stroke()
  
  // 右侧光泽线
  ctx.beginPath()
  if (rightPoints.length > 0 && rightPoints[0]) {
    const firstPoint = rightPoints[0]
    ctx.moveTo(firstPoint.x, firstPoint.y)
    for (let i = 1; i < rightPoints.length; i += 2) {
      const point = rightPoints[i]
      if (point) {
        ctx.lineTo(point.x, point.y)
      }
    }
  }
  ctx.stroke()
  ctx.setLineDash([])
  
  // 添加糖果光泽
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  
  // 在通道上添加多个光泽线
  for (let i = 0; i < 3; i++) {
    const offset = (channel.width / 4) * (i + 1)
    
    ctx.beginPath()
    channelData.forEach((data, index) => {
      if (!data || index % 3 !== 0) return
      
      const t = index / channelData.length
      const currentWidth = t > 0.8 ? channel.exitWidth : channel.width
      const halfWidth = (currentWidth / 2) - offset
      
      const pointX = data.point.x - data.tangent.y * halfWidth
      const pointY = data.point.y + data.tangent.x * halfWidth
      
      if (index === 0) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    })
    ctx.stroke()
  }
  
  // 绘制通道边框
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // 左边界
  ctx.beginPath()
  if (leftPoints.length > 0 && leftPoints[0]) {
    const firstPoint = leftPoints[0]
    ctx.moveTo(firstPoint.x, firstPoint.y)
    for (let i = 1; i < leftPoints.length; i++) {
      const point = leftPoints[i]
      if (point) {
        ctx.lineTo(point.x, point.y)
      }
    }
  }
  ctx.stroke()
  
  // 右边界
  ctx.beginPath()
  if (rightPoints.length > 0 && rightPoints[0]) {
    const firstPoint = rightPoints[0]
    ctx.moveTo(firstPoint.x, firstPoint.y)
    for (let i = 1; i < rightPoints.length; i++) {
      const point = rightPoints[i]
      if (point) {
        ctx.lineTo(point.x, point.y)
      }
    }
  }
  ctx.stroke()
  
  // 添加内部阴影
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  if (leftPoints.length > 0 && leftPoints[0]) {
    const firstPoint = leftPoints[0]
    ctx.moveTo(firstPoint.x, firstPoint.y)
    for (let i = 1; i < leftPoints.length; i += 3) {
      const point = leftPoints[i]
      if (point) {
        ctx.lineTo(point.x, point.y)
      }
    }
  }
  ctx.stroke()
  
  // 添加外部高光
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 2
  ctx.beginPath()
  if (rightPoints.length > 0 && rightPoints[0]) {
    const firstPoint = rightPoints[0]
    ctx.moveTo(firstPoint.x, firstPoint.y)
    for (let i = 1; i < rightPoints.length; i += 3) {
      const point = rightPoints[i]
      if (point) {
        ctx.lineTo(point.x, point.y)
      }
    }
  }
  ctx.stroke()
  
  // 绘制开放的出口
  const exitData = channelData[channelData.length - 1]
  if (exitData) {
    const exitPoint = exitData.point
    const exitHalfWidth = channel.exitWidth / 2
    
    // 绘制出口渐变
    ctx.save()
    const exitGradient = ctx.createRadialGradient(
      exitPoint.x, exitPoint.y, exitHalfWidth - 10,
      exitPoint.x, exitPoint.y, exitHalfWidth
    )
    exitGradient.addColorStop(0, 'rgba(46, 204, 113, 0.8)')
    exitGradient.addColorStop(1, 'rgba(39, 174, 96, 0.3)')
    
    ctx.fillStyle = exitGradient
    ctx.beginPath()
    ctx.arc(exitPoint.x, exitPoint.y, exitHalfWidth, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    
    // 绘制出口糖果条纹
    const exitStripeCount = 4
    const exitStripeWidth = (Math.PI * 2) / exitStripeCount
    
    for (let i = 0; i < exitStripeCount; i++) {
      const startAngle = i * exitStripeWidth
      const endAngle = (i + 1) * exitStripeWidth
      const isRed = i % 2 === 0
      
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(exitPoint.x, exitPoint.y)
      ctx.arc(exitPoint.x, exitPoint.y, exitHalfWidth, startAngle, endAngle)
      ctx.closePath()
      
      if (isRed) {
        ctx.fillStyle = '#ff4757'
      } else {
        ctx.fillStyle = '#ffffff'
      }
      ctx.fill()
      ctx.restore()
    }
    
    // 出口边框
    ctx.save()
    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(exitPoint.x, exitPoint.y, exitHalfWidth, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    
    // 出口高光
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(exitPoint.x, exitPoint.y, exitHalfWidth - 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  ctx.save()
  ctx.restore()
  
  // 如果启用调试模式，绘制调试信息
  if (debugMode.value) {
    physics.drawLauncherChannelDebug(ctx)
  }
}

// 绘制糖果效果
const drawCandyEffects = (ctx: CanvasRenderingContext2D) => {
  const channel = physics.launcherChannel
  const channelData = physics.generateLauncherChannelPoints()
  if (!channelData || channelData.length === 0) return
  
  ctx.save()
  
  // 使用更慢的时间系数
  const time = Date.now() * 0.0003  // 进一步降低速度
  
  // 创建多个不同速度的光泽层
  for (let layer = 0; layer < 2; layer++) {
    const widthMultiplier = 0.6 + layer * 0.2
    const alphaBase = 0.15 - layer * 0.05
    
    // 左侧光泽
    ctx.beginPath()
    channelData.forEach((data, index) => {
      if (!data || index % 6 !== 0) return
      const t = index / channelData.length
      const currentWidth = t > 0.8 ? channel.exitWidth : channel.width
      const halfWidth = (currentWidth / 2) * widthMultiplier
      
      const pointX = data.point.x - data.tangent.y * halfWidth
      const pointY = data.point.y + data.tangent.x * halfWidth
      
      if (index === 0) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    })
    
    const alpha = alphaBase + Math.sin(time * 0.6 + layer * Math.PI/3) * 0.08
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.05, alpha)})`
    ctx.lineWidth = 1.5
    ctx.stroke()
    
    // 右侧光泽
    ctx.beginPath()
    channelData.forEach((data, index) => {
      if (!data || index % 6 !== 0) return
      const t = index / channelData.length
      const currentWidth = t > 0.8 ? channel.exitWidth : channel.width
      const halfWidth = (currentWidth / 2) * widthMultiplier
      
      const pointX = data.point.x + data.tangent.y * halfWidth
      const pointY = data.point.y - data.tangent.x * halfWidth
      
      if (index === 0) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    })
    
    const rightAlpha = alphaBase + Math.cos(time * 0.6 + layer * Math.PI/3) * 0.08
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.05, rightAlpha)})`
    ctx.stroke()
  }
  
  // 糖果斑点效果
  const drawCandySpots = () => {
    ctx.save()
    const spotTime = Date.now() * 0.0002  // 更慢的斑点动画
    
    for (let i = 0; i < 15; i++) {  // 减少斑点数量
      const t = Math.random()
      const dataIndex = Math.floor(t * channelData.length)
      const data = channelData[dataIndex]
      if (!data) continue
      
      const angle = Math.random() * Math.PI * 2
      const distance = 0.3 + Math.random() * 0.4
      
      const tParam = dataIndex / channelData.length
      const currentWidth = tParam > 0.8 ? channel.exitWidth : channel.width
      const halfWidth = (currentWidth / 2) * distance
      
      const pointX = data.point.x + Math.cos(angle) * halfWidth
      const pointY = data.point.y + Math.sin(angle) * halfWidth
      
      const size = 1 + Math.random() * 1.5
      
      // 斑点闪烁
      const spotPulse = Math.sin(spotTime + i * Math.PI/4) * 0.3 + 0.7
      const alpha = 0.3 + Math.random() * 0.2
      
      ctx.save()
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * spotPulse})`
      ctx.beginPath()
      ctx.arc(pointX, pointY, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    ctx.restore()
  }
  
  drawCandySpots()
  
  ctx.restore()
}

// 绘制减震器
const drawShockAbsorber = (ctx: CanvasRenderingContext2D, shock: ShockAbsorber) => {
  if (!shock) return
  
  const { startPoint, endPoint, length, width, angle, isLeft, springCount, springWidth } = shock
  
  ctx.save()
  
  // 计算压缩效果
  const compressionFactor = 1 - shock.compression * 0.3
  const effectiveLength = length * compressionFactor
  
  // 重新计算端点（考虑压缩）
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const currentStart = {
    x: shock.position.x - cos * effectiveLength * 0.5,
    y: shock.position.y - sin * effectiveLength * 0.5
  }
  const currentEnd = {
    x: shock.position.x + cos * effectiveLength * 0.5,
    y: shock.position.y + sin * effectiveLength * 0.5
  }
  
  // 绘制减震器主体
  drawShockBody(ctx, currentStart, currentEnd, width, angle, shock)
  
  // 绘制弹簧
  drawShockSpring(ctx, currentStart, currentEnd, width, angle, shock)
  
  // 绘制减震器活塞杆
  drawShockPiston(ctx, currentStart, currentEnd, width, angle, shock)
  
  // 绘制连接点
  drawShockConnectors(ctx, currentStart, currentEnd, width, shock)
  
  // 如果压缩，绘制冲击效果
  if (shock.isCompressed) {
    drawCompressionEffect(ctx, shock)
  }
  
  ctx.restore()
}

// 绘制减震器主体
const drawShockBody = (ctx: CanvasRenderingContext2D, start: Vector2D, end: Vector2D, width: number, angle: number, shock: ShockAbsorber) => {
  const normalX = -Math.sin(angle)
  const normalY = Math.cos(angle)
  const halfWidth = width * 0.5
  
  // 主体渐变
  const bodyGradient = ctx.createLinearGradient(
    start.x, start.y,
    end.x, end.y
  )
  bodyGradient.addColorStop(0, '#2c3e50')
  bodyGradient.addColorStop(0.3, '#3498db')
  bodyGradient.addColorStop(0.7, '#3498db')
  bodyGradient.addColorStop(1, '#2c3e50')
  
  ctx.fillStyle = bodyGradient
  ctx.strokeStyle = '#1a252f'
  ctx.lineWidth = 2
  
  // 绘制主体
  ctx.beginPath()
  ctx.moveTo(start.x + normalX * halfWidth, start.y + normalY * halfWidth)
  ctx.lineTo(end.x + normalX * halfWidth, end.y + normalY * halfWidth)
  ctx.lineTo(end.x - normalX * halfWidth, end.y - normalY * halfWidth)
  ctx.lineTo(start.x - normalX * halfWidth, start.y - normalY * halfWidth)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  // 主体高光
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(start.x + normalX * halfWidth * 0.7, start.y + normalY * halfWidth * 0.7)
  ctx.lineTo(end.x + normalX * halfWidth * 0.7, end.y + normalY * halfWidth * 0.7)
  ctx.stroke()
}

// 绘制弹簧
const drawShockSpring = (ctx: CanvasRenderingContext2D, start: Vector2D, end: Vector2D, width: number, angle: number, shock: ShockAbsorber) => {
  const springWidth = shock.springWidth
  const springCount = shock.springCount
  
  const normalX = -Math.sin(angle)
  const normalY = Math.cos(angle)
  const springRadius = springWidth * 0.5
  
  ctx.save()
  
  // 弹簧渐变
  const springGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
  springGradient.addColorStop(0, '#7f8c8d')
  springGradient.addColorStop(0.5, '#bdc3c7')
  springGradient.addColorStop(1, '#7f8c8d')
  
  ctx.strokeStyle = springGradient
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  
  // 绘制弹簧线圈
  for (let i = 0; i <= springCount; i++) {
    const t = i / springCount
    const wave = Math.sin(t * Math.PI * springCount) * springRadius
    
    const x = start.x + (end.x - start.x) * t
    const y = start.y + (end.y - start.y) * t
    
    const waveX = x + normalX * wave
    const waveY = y + normalY * wave
    
    if (i === 0) {
      ctx.beginPath()
      ctx.moveTo(waveX, waveY)
    } else {
      ctx.lineTo(waveX, waveY)
    }
  }
  ctx.stroke()
  
  // 弹簧阴影
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i <= springCount; i++) {
    const t = i / springCount
    const wave = Math.sin(t * Math.PI * springCount) * springRadius * 0.8
    
    const x = start.x + (end.x - start.x) * t
    const y = start.y + (end.y - start.y) * t
    
    const waveX = x + normalX * wave
    const waveY = y + normalY * wave
    
    if (i === 0) {
      ctx.moveTo(waveX, waveY)
    } else {
      ctx.lineTo(waveX, waveY)
    }
  }
  ctx.stroke()
  
  ctx.restore()
}

// 绘制活塞杆
const drawShockPiston = (ctx: CanvasRenderingContext2D, start: Vector2D, end: Vector2D, width: number, angle: number, shock: ShockAbsorber) => {
  const normalX = -Math.sin(angle)
  const normalY = Math.cos(angle)
  const pistonWidth = width * 0.6
  const halfPistonWidth = pistonWidth * 0.5
  
  // 活塞杆渐变
  const pistonGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
  pistonGradient.addColorStop(0, '#e74c3c')
  pistonGradient.addColorStop(0.3, '#c0392b')
  pistonGradient.addColorStop(0.7, '#c0392b')
  pistonGradient.addColorStop(1, '#e74c3c')
  
  ctx.fillStyle = pistonGradient
  
  // 绘制活塞杆
  ctx.beginPath()
  ctx.moveTo(start.x + normalX * halfPistonWidth, start.y + normalY * halfPistonWidth)
  ctx.lineTo(end.x + normalX * halfPistonWidth, end.y + normalY * halfPistonWidth)
  ctx.lineTo(end.x - normalX * halfPistonWidth, end.y - normalY * halfPistonWidth)
  ctx.lineTo(start.x - normalX * halfPistonWidth, start.y - normalY * halfPistonWidth)
  ctx.closePath()
  ctx.fill()
  
  // 活塞杆高光
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(start.x + normalX * halfPistonWidth * 0.8, start.y + normalY * halfPistonWidth * 0.8)
  ctx.lineTo(end.x + normalX * halfPistonWidth * 0.8, end.y + normalY * halfPistonWidth * 0.8)
  ctx.stroke()
  
  // 活塞头部
  drawPistonHead(ctx, end, angle, pistonWidth, shock)
}

// 绘制活塞头部
const drawPistonHead = (ctx: CanvasRenderingContext2D, position: Vector2D, angle: number, width: number, shock: ShockAbsorber) => {
  const headRadius = width * 0.8
  
  ctx.save()
  ctx.translate(position.x, position.y)
  ctx.rotate(angle)
  
  // 活塞头渐变
  const headGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, headRadius)
  headGradient.addColorStop(0, '#e74c3c')
  headGradient.addColorStop(0.7, '#c0392b')
  headGradient.addColorStop(1, '#922b21')
  
  ctx.fillStyle = headGradient
  ctx.beginPath()
  ctx.arc(0, 0, headRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 活塞头边框
  ctx.strokeStyle = '#7f8c8d'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, headRadius, 0, Math.PI * 2)
  ctx.stroke()
  
  // 活塞头细节
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.beginPath()
  ctx.arc(-headRadius * 0.3, -headRadius * 0.3, headRadius * 0.3, 0, Math.PI * 2)
  ctx.fill()
  
  // 活塞环
  const ringCount = 3
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = headRadius * (0.6 - i * 0.15)
    ctx.strokeStyle = '#34495e'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  ctx.restore()
}

// 绘制连接点
const drawShockConnectors = (ctx: CanvasRenderingContext2D, start: Vector2D, end: Vector2D, width: number, shock: ShockAbsorber) => {
  const connectorRadius = width * 0.4
  
  // 起点连接器
  const startGradient = ctx.createRadialGradient(
    start.x, start.y, 0,
    start.x, start.y, connectorRadius
  )
  startGradient.addColorStop(0, '#f39c12')
  startGradient.addColorStop(1, '#d35400')
  
  ctx.fillStyle = startGradient
  ctx.beginPath()
  ctx.arc(start.x, start.y, connectorRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 终点连接器
  const endGradient = ctx.createRadialGradient(
    end.x, end.y, 0,
    end.x, end.y, connectorRadius
  )
  endGradient.addColorStop(0, '#2ecc71')
  endGradient.addColorStop(1, '#27ae60')
  
  ctx.fillStyle = endGradient
  ctx.beginPath()
  ctx.arc(end.x, end.y, connectorRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 连接器边框
  ctx.strokeStyle = '#1a252f'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(start.x, start.y, connectorRadius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(end.x, end.y, connectorRadius, 0, Math.PI * 2)
  ctx.stroke()
  
  // 连接器中心
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.beginPath()
  ctx.arc(start.x, start.y, connectorRadius * 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(end.x, end.y, connectorRadius * 0.4, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制压缩效果
const drawCompressionEffect = (ctx: CanvasRenderingContext2D, shock: ShockAbsorber) => {
  const intensity = Math.sin(shock.compressionTime * 0.1) * 0.5 + 0.5
  
  ctx.save()
  
  // 冲击波
  const waveGradient = ctx.createRadialGradient(
    shock.position.x, shock.position.y, 0,
    shock.position.x, shock.position.y, shock.width * 3
  )
  waveGradient.addColorStop(0, 'rgba(52, 152, 219, 0.3)')
  waveGradient.addColorStop(1, 'rgba(52, 152, 219, 0)')
  
  ctx.fillStyle = waveGradient
  ctx.beginPath()
  ctx.arc(shock.position.x, shock.position.y, shock.width * 3 * intensity, 0, Math.PI * 2)
  ctx.fill()
  
  // 火花效果
  if (intensity > 0.7) {
    drawSparkEffect(ctx, shock.position, shock.angle, intensity)
  }
  
  ctx.restore()
}

// 绘制火花效果
const drawSparkEffect = (ctx: CanvasRenderingContext2D, position: Vector2D, angle: number, intensity: number) => {
  const sparkCount = Math.floor(5 + intensity * 10)
  
  for (let i = 0; i < sparkCount; i++) {
    const sparkAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5
    const distance = Math.random() * 20
    const size = Math.random() * 2 + 1
    
    const sparkX = position.x + Math.cos(sparkAngle) * distance
    const sparkY = position.y + Math.sin(sparkAngle) * distance
    
    const sparkGradient = ctx.createRadialGradient(
      sparkX, sparkY, 0,
      sparkX, sparkY, size
    )
    
    if (Math.random() > 0.5) {
      sparkGradient.addColorStop(0, '#FFD700')
      sparkGradient.addColorStop(1, '#FFA500')
    } else {
      sparkGradient.addColorStop(0, '#3498db')
      sparkGradient.addColorStop(1, '#2980b9')
    }
    
    ctx.fillStyle = sparkGradient
    ctx.beginPath()
    ctx.arc(sparkX, sparkY, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 绘制得分器
const drawScoreBumpers = (ctx: CanvasRenderingContext2D) => {
  physics.scoreBumpers.value.forEach(bumper => {
    if (!bumper) return
    
    if (!bumper.isActive) {
      ctx.fillStyle = 'rgba(255, 165, 2, 0.3)'
      ctx.beginPath()
      ctx.arc(bumper.position.x, bumper.position.y, bumper.radius, 0, Math.PI * 2)
      ctx.fill()
    } else {
      const gradient = ctx.createRadialGradient(
        bumper.position.x, bumper.position.y, 0,
        bumper.position.x, bumper.position.y, bumper.radius
      )
      gradient.addColorStop(0, '#ffa502')
      gradient.addColorStop(1, '#e67e22')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(bumper.position.x, bumper.position.y, bumper.radius, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(bumper.scoreValue.toString(), bumper.position.x, bumper.position.y)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.arc(
        bumper.position.x - bumper.radius * 0.3,
        bumper.position.y - bumper.radius * 0.3,
        bumper.radius * 0.4,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
  })
}

// 绘制旋转挡板
const drawFlipper = (ctx: CanvasRenderingContext2D, flipper: any, side: 'left' | 'right') => {
  if (!flipper || !flipper.pivot) return
  
  const start = flipper.pivot
  const angle = flipper.angle
  const length = flipper.length
  const width = flipper.width
  
  const endX = start.x + Math.cos(angle) * length
  const endY = start.y + Math.sin(angle) * length
  
  ctx.save()
  
  // 绘制挡板主体
  ctx.beginPath()
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.strokeStyle = flipper.isPressed ? '#00ff00' : flipper.color
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  
  // 绘制转轴
  ctx.beginPath()
  ctx.fillStyle = flipper.isPressed ? '#ffff00' : '#ffd32a'
  ctx.arc(start.x, start.y, 8, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制转轴中心
  ctx.beginPath()
  ctx.fillStyle = flipper.isPressed ? '#ffaa00' : '#ffa502'
  ctx.arc(start.x, start.y, 5, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制挡板末端
  ctx.beginPath()
  ctx.fillStyle = flipper.isPressed ? '#ff0000' : '#ff4757'
  ctx.arc(endX, endY, 6, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}

// 绘制发射器
const drawLauncher = (ctx: CanvasRenderingContext2D) => {
  const l = launcher.value
  if (!l) return
  
  const baseGradient = ctx.createRadialGradient(
    l.position.x, l.position.y, 0,
    l.position.x, l.position.y, l.radius + 8
  )
  baseGradient.addColorStop(0, '#2c3e50')
  baseGradient.addColorStop(1, '#1a252f')
  
  ctx.fillStyle = baseGradient
  ctx.beginPath()
  ctx.arc(l.position.x, l.position.y, l.radius + 8, 0, Math.PI * 2)
  ctx.fill()
  
  const launcherGradient = ctx.createRadialGradient(
    l.position.x, l.position.y, 0,
    l.position.x, l.position.y, l.radius
  )
  launcherGradient.addColorStop(0, '#3498db')
  launcherGradient.addColorStop(0.6, '#2980b9')
  launcherGradient.addColorStop(1, '#1f618d')
  
  ctx.fillStyle = launcherGradient
  ctx.beginPath()
  ctx.arc(l.position.x, l.position.y, l.radius, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.strokeStyle = '#85c1e9'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(l.position.x, l.position.y, l.radius, 0, Math.PI * 2)
  ctx.stroke()
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.beginPath()
  ctx.arc(
    l.position.x - l.radius * 0.3,
    l.position.y - l.radius * 0.3,
    l.radius * 0.5,
    0,
    Math.PI * 2
  )
  ctx.fill()
  
  ctx.fillStyle = 'white'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⬆️', l.position.x, l.position.y)
  
  if (l.isDragging && l.dragStart && l.dragEnd) {
    const dragStart = l.dragStart
    const dragEnd = l.dragEnd
    
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.moveTo(dragStart.x, dragStart.y)
    ctx.lineTo(dragEnd.x, dragEnd.y)
    ctx.stroke()
    ctx.setLineDash([])
    
    ctx.fillStyle = 'rgba(52, 152, 219, 0.8)'
    ctx.beginPath()
    ctx.arc(dragStart.x, dragStart.y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(231, 76, 60, 0.8)'
    ctx.beginPath()
    ctx.arc(dragEnd.x, dragEnd.y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    const dy = dragEnd.y - dragStart.y
    const distance = Math.abs(dy)
    const maxDrag = l.maxDragDistance
    const power = Math.min(distance, maxDrag) / maxDrag
    
    const powerBarWidth = 100
    const powerBarHeight = 10
    const powerBarX = l.position.x - powerBarWidth / 2
    const powerBarY = l.position.y + 50
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(powerBarX, powerBarY, powerBarWidth, powerBarHeight)
    
    const fillWidth = powerBarWidth * power
    const powerGradient = ctx.createLinearGradient(
      powerBarX, 0,
      powerBarX + fillWidth, 0
    )
    if (power < 0.3) {
      powerGradient.addColorStop(0, '#2ecc71')
      powerGradient.addColorStop(1, '#27ae60')
    } else if (power < 0.7) {
      powerGradient.addColorStop(0, '#f39c12')
      powerGradient.addColorStop(1, '#d35400')
    } else {
      powerGradient.addColorStop(0, '#e74c3c')
      powerGradient.addColorStop(1, '#c0392b')
    }
    
    ctx.fillStyle = powerGradient
    ctx.fillRect(powerBarX, powerBarY, fillWidth, powerBarHeight)
    
    ctx.strokeStyle = '#7f8c8d'
    ctx.lineWidth = 1
    ctx.strokeRect(powerBarX, powerBarY, powerBarWidth, powerBarHeight)
  }
}

// 绘制雪球
const drawSnowball = (ctx: CanvasRenderingContext2D, ball: any) => {
  if (!ball || !launcher.value) return
  
  if (!ball.isLaunched && 
      Math.abs(ball.position.x - launcher.value.position.x) < 2 &&
      Math.abs(ball.position.y - launcher.value.position.y) < 2) {
    return
  }
  
  const b = ball
  
  ctx.save()
  
  // 雪球主体
  const snowGradient = ctx.createRadialGradient(
    b.position.x, b.position.y, 0,
    b.position.x, b.position.y, b.radius
  )
  
  // 雪球渐变：中心白，边缘淡蓝灰
  snowGradient.addColorStop(0, '#FFFFFF')
  snowGradient.addColorStop(0.7, '#F8F9FA')
  snowGradient.addColorStop(1, '#E9ECEF')
  
  ctx.fillStyle = snowGradient
  ctx.beginPath()
  ctx.arc(b.position.x, b.position.y, b.radius, 0, Math.PI * 2)
  ctx.fill()
  
  // 雪球表面纹理
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  
  // 添加几个不规则的雪块纹理
  const snowSpots = [
    { x: -0.3, y: -0.4, size: 0.3 },
    { x: 0.2, y: -0.2, size: 0.4 },
    { x: 0.3, y: 0.3, size: 0.25 },
    { x: -0.2, y: 0.4, size: 0.35 }
  ]
  
  snowSpots.forEach(spot => {
    ctx.beginPath()
    ctx.arc(
      b.position.x + spot.x * b.radius,
      b.position.y + spot.y * b.radius,
      spot.size * b.radius * 0.8,
      0,
      Math.PI * 2
    )
    ctx.fill()
  })
  
  // 雪球阴影
  const shadowGradient = ctx.createRadialGradient(
    b.position.x + b.radius * 0.2, 
    b.position.y + b.radius * 0.2, 0,
    b.position.x + b.radius * 0.2, 
    b.position.y + b.radius * 0.2, b.radius * 0.5
  )
  
  shadowGradient.addColorStop(0, 'rgba(200, 210, 220, 0.3)')
  shadowGradient.addColorStop(1, 'rgba(200, 210, 220, 0)')
  
  ctx.fillStyle = shadowGradient
  ctx.beginPath()
  ctx.arc(
    b.position.x + b.radius * 0.2,
    b.position.y + b.radius * 0.2,
    b.radius * 0.5,
    0,
    Math.PI * 2
  )
  ctx.fill()
  
  // 雪球高光
  const highlightGradient = ctx.createRadialGradient(
    b.position.x - b.radius * 0.3, 
    b.position.y - b.radius * 0.3, 0,
    b.position.x - b.radius * 0.3, 
    b.position.y - b.radius * 0.3, b.radius * 0.4
  )
  
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.fillStyle = highlightGradient
  ctx.beginPath()
  ctx.arc(
    b.position.x - b.radius * 0.3,
    b.position.y - b.radius * 0.3,
    b.radius * 0.4,
    0,
    Math.PI * 2
  )
  ctx.fill()
  
  // 雪球边缘反光
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(b.position.x, b.position.y, b.radius * 0.95, Math.PI * 0.2, Math.PI * 0.8)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(b.position.x, b.position.y, b.radius * 0.95, Math.PI * 1.2, Math.PI * 1.8)
  ctx.stroke()
  
  // 雪球上的小雪花
  if (Math.random() < 0.3) {  // 30%概率绘制雪花
    const flakeCount = 3
    for (let i = 0; i < flakeCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = b.radius * 0.6
      const flakeSize = 1 + Math.random() * 1
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.arc(
        b.position.x + Math.cos(angle) * distance,
        b.position.y + Math.sin(angle) * distance,
        flakeSize,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
  }
  
  // 旋转时的模糊效果
  if (Math.abs(b.angularVelocity) > 0.2) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(b.position.x, b.position.y, b.radius * 0.9, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  ctx.restore()
}

// 绘制装饰元素
const drawDecorations = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = 'rgba(46, 213, 115, 0.3)'
  ctx.lineWidth = 2
  
  const cornerSize = 20
  const corners = [
    { x: 10, y: 10 },
    { x: canvasWidth - 10, y: 10 },
    { x: 10, y: canvasHeight - 10 },
    { x: canvasWidth - 10, y: canvasHeight - 10 }
  ]
  
  corners.forEach(corner => {
    ctx.beginPath()
    ctx.moveTo(corner.x, corner.y - cornerSize)
    ctx.lineTo(corner.x, corner.y)
    ctx.lineTo(corner.x - cornerSize, corner.y)
    ctx.stroke()
  })
}

// 绘制碰撞特效
const drawCollisionEffects = (ctx: CanvasRenderingContext2D) => {
  physics.collisionEffects.value.forEach(effect => {
    if (!effect) return
    
    ctx.save()
    ctx.globalAlpha = effect.life
    ctx.fillStyle = effect.color
    ctx.beginPath()
    ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

// 绘制函数
const draw = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空Canvas（透明）
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制月亮
  drawMoon(ctx)
  
  // 绘制雪花
  drawSnowflakes(ctx)
  
  // 绘制发射器通道
  drawLauncherChannel(ctx)
  
  // 绘制糖果效果
  drawCandyEffects(ctx)
  
  // 绘制减震器
  drawShockAbsorber(ctx, physics.leftShockAbsorber.value)
  drawShockAbsorber(ctx, physics.rightShockAbsorber.value)
  
  // 绘制得分器
  drawScoreBumpers(ctx)
  
  // 绘制挡板
  const { leftFlipper, rightFlipper } = physics
  drawFlipper(ctx, leftFlipper.value, 'left')
  drawFlipper(ctx, rightFlipper.value, 'right')
  
  // 绘制发射器
  drawLauncher(ctx)
  
  // 绘制雪球弹珠
  drawSnowball(ctx, ball.value)
  
  // 绘制装饰元素
  drawDecorations(ctx)
  
  // 绘制碰撞特效
  drawCollisionEffects(ctx)
}

// 调整画布尺寸以适应容器
const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const container = canvas.parentElement
  if (!container) return
  
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  
  // 计算缩放比例，保持画布比例
  const scaleX = containerWidth / canvasWidth
  const scaleY = containerHeight / canvasHeight
  const scale = Math.min(scaleX, scaleY)
  
  // 计算居中位置
  const scaledWidth = canvasWidth * scale
  const scaledHeight = canvasHeight * scale
  const offsetX = (containerWidth - scaledWidth) / 2
  const offsetY = (containerHeight - scaledHeight) / 2
  
  // 设置画布样式
  canvas.style.width = `${scaledWidth}px`
  canvas.style.height = `${scaledHeight}px`
  canvas.style.left = `${offsetX}px`
  canvas.style.top = `${offsetY}px`
}

// 获取画布坐标
const getCanvasCoords = (clientX: number, clientY: number) => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  
  const rect = canvas.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(canvas)
  const scaleX = canvas.width / parseInt(computedStyle.width)
  const scaleY = canvas.height / parseInt(computedStyle.height)
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  }
}

// 游戏循环
const gameLoop = (timestamp: number) => {
  if (!lastTime) lastTime = timestamp
  const deltaTime = timestamp - lastTime
  
  if (deltaTime > 16) {
    physics.update(timestamp)
    
    // 更新雪花
    updateSnowflakes(deltaTime)
    
    draw()
    lastTime = timestamp
  }
  
  if (gameState.value.isPlaying && !gameState.value.isGameOver) {
    animationFrameId = requestAnimationFrame(gameLoop)
  }
}

// 开始游戏循环
const startGameLoop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = requestAnimationFrame(gameLoop)
}

// 停止游戏循环
const stopGameLoop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
}

// 鼠标事件处理
const handleCanvasMouseDown = (e: MouseEvent) => {
  const { x, y } = getCanvasCoords(e.clientX, e.clientY)
  physics.startDrag(x, y)
}

const handleCanvasMouseMove = (e: MouseEvent) => {
  if (launcher.value.isDragging) {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY)
    physics.updateDrag(x, y)
  }
}

const handleCanvasMouseUp = () => {
  physics.endDrag()
}

// 触摸事件处理
const handleCanvasTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  
  if (!e.touches || e.touches.length === 0) return
  
  const touch = e.touches[0]
  if (!touch) return
  
  const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
  physics.startDrag(x, y)
}

const handleCanvasTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  
  if (!e.touches || e.touches.length === 0) return
  
  if (launcher.value.isDragging) {
    const touch = e.touches[0]
    if (!touch) return
    
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY)
    physics.updateDrag(x, y)
  }
}

const handleCanvasTouchEnd = (e: TouchEvent) => {
  e.preventDefault()
  physics.endDrag()
}

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case ' ':
      if (!gameState.value.isPlaying) {
        physics.startGame()
      } else if (!ball.value.isLaunched) {
        quickLaunch()
      }
      break
    case 'r':
    case 'R':
      physics.resetBall()
      break
    case 'Escape':
      goToMenu()
      break
    case 'ArrowLeft':
      controlFlipper('left', 'down')
      break
    case 'ArrowRight':
      controlFlipper('right', 'down')
      break
    case 'd':
    case 'D':
      debugMode.value = !debugMode.value
      console.log('调试模式:', debugMode.value ? '开启' : '关闭')
      break
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
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
  if (!isPhysicsStarted) {
    physics.startGame()
    isPhysicsStarted = true
  }
  
  // 初始化雪花
  initializeSnowflakes()
  
  // 初始调整画布尺寸
  resizeCanvas()
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeCanvas)
  
  // 使用 ResizeObserver 监听容器大小变化
  const container = document.querySelector('.game-area')
  if (container) {
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(container)
  }
  
  startGameLoop()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  stopGameLoop()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', resizeCanvas)
  
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.pinball-game {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%);
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 全屏游戏容器 */
.game-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding: 0;
  margin: 0;
  width: 100%;
  height: calc(100vh - 140px);
}

.game-area {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.game-canvas {
  display: block;
  background: #0c2461;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  border: 3px solid;
  border-image: linear-gradient(45deg, #2ed573, #3498db, #9b59b6) 1;
  position: absolute;
  cursor: pointer;
  touch-action: none;
  z-index: 2;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  background-image: url('src/assets/images/3.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>