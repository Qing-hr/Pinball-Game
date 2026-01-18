<template>
  <div class="score-board">
    <div class="score-board-inner">
      <!-- 左侧：分数 -->
      <div class="score-section left">
        <div class="score-item score">
          <div class="score-header">
            <div class="score-label">SCORE</div>
            <div class="score-icon">🏆</div>
          </div>
          <div class="score-value">
            <span class="score-number">{{ formattedScore }}</span>
            <div class="score-glare"></div>
          </div>
        </div>
      </div>
      
      <!-- 中间：游戏标题和状态 -->
      <div class="center-section">
        <div class="game-title">PINBALL</div>
        <div class="game-status">
          <div class="status-indicator" :class="getGameStatusClass">
            <span class="status-icon">{{ getGameStatusIcon }}</span>
            <span class="status-text">{{ getGameStatusText }}</span>
          </div>
        </div>
      </div>
      
      <!-- 右侧：生命值 -->
      <div class="score-section right">
        <div class="score-item lives">
          <div class="score-header">
            <div class="score-label">LIVES</div>
            <div class="score-icon">💀</div>
          </div>
          <div class="score-value">
            <div class="lives-container">
              <!-- 单条命显示 -->
              <div class="single-life-display">
                <div class="single-life-indicator">
                  <span class="life-symbol">❤️</span>
                  <span class="life-count">1/1</span>
                </div>
                <!-- 心跳动画（唯一保留的新功能） -->
                <div v-if="lives === 1" class="heartbeat-animation"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score: number
  lives: number
  level: number
  isPlaying: boolean
  isGameOver: boolean
  ballLaunched: boolean
  isInChannel: boolean
  collisions?: number
  power?: number
}

const props = withDefaults(defineProps<Props>(), {
  collisions: 0,
  power: 0
})

// 计算属性
const formattedScore = computed(() => {
  return props.score.toString().padStart(6, '0')
})

const getGameStatusClass = computed(() => {
  if (props.isGameOver) return 'status-game-over'
  if (!props.ballLaunched) return 'status-ready'
  if (props.isInChannel) return 'status-channel'
  return 'status-active'
})

const getGameStatusIcon = computed(() => {
  if (props.isGameOver) return '💀'
  if (!props.ballLaunched) return '🎯'
  if (props.isInChannel) return '🚀'
  return '⚡'
})

const getGameStatusText = computed(() => {
  if (props.isGameOver) return '游戏结束'
  if (!props.ballLaunched) return '准备发射'
  if (props.isInChannel) return '通道中'
  return '游戏中'
})
</script>

<style scoped>
/* 保持原有的所有样式不变，只添加心跳动画相关样式 */
.score-board {
  background: linear-gradient(to bottom, rgba(12, 12, 29, 0.95), rgba(26, 26, 62, 0.9));
  border-bottom: 3px solid;
  border-image: linear-gradient(to right, 
    transparent, 
    #2ed573, 
    #3498db, 
    #2ed573, 
    transparent
  ) 1;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 10;
  min-height: 140px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.score-board-inner {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  padding: 20px 40px;
  position: relative;
  z-index: 2;
  gap: 30px;
  height: 100%;
}

.score-section {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}

.score-section.left {
  align-items: flex-start;
}

.score-section.right {
  align-items: flex-end;
}

.center-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 220px;
  padding: 0 20px;
}

.game-title {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(45deg, #2ed573, #3498db, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 3px;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-family: 'Arial Black', sans-serif;
  margin-bottom: 12px;
  animation: title-glow 3s ease-in-out infinite;
  line-height: 1;
}

.game-status {
  display: flex;
  justify-content: center;
  width: 100%;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 0.95rem;
  font-weight: bold;
  font-family: 'Arial', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  backdrop-filter: blur(5px);
  border: 1px solid;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 140px;
  justify-content: center;
}

/* 分数项样式 */
.score-item {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  flex-shrink: 0;
}

.score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  width: 100%;
}

.score-label {
  color: #85c1e9;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: 'Arial', sans-serif;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.score-icon {
  font-size: 1.2rem;
  margin-left: 10px;
  opacity: 0.9;
  line-height: 1;
}

/* 分数显示 */
.score-item.score .score-icon {
  color: #ffd32a;
  text-shadow: 0 0 8px rgba(255, 211, 42, 0.5);
}

.score-item.score .score-value {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 20, 40, 0.6));
  border: 2px solid rgba(255, 211, 42, 0.3);
  border-radius: 10px;
  padding: 12px 20px;
  box-shadow: 
    inset 0 0 20px rgba(255, 211, 42, 0.1),
    0 5px 15px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.score-number {
  font-size: 2.2rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  color: #ffd32a;
  text-shadow: 0 0 10px rgba(255, 211, 42, 0.7);
  letter-spacing: 2px;
  position: relative;
  z-index: 2;
  line-height: 1;
}

/* 生命值显示 */
.score-item.lives .score-icon {
  color: #2ecc71;
  text-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
}

.score-item.lives .score-value {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 12px 20px;
  border: 2px solid rgba(52, 152, 219, 0.3);
  min-width: 160px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lives-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  position: relative;
  width: 100%;
}

/* 单条命显示样式（简化版） */
.single-life-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  width: 100%;
}

.single-life-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(46, 204, 113, 0.4);
  min-width: 100px;
}

.life-symbol {
  font-size: 1.5rem;
  /* 心跳动画效果 */
  animation: heartbeat 1.2s infinite;
}

.life-count {
  font-size: 1.1rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

/* 心跳动画 */
.heartbeat-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(231, 76, 60, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: heartbeat-expand 1.2s infinite;
  pointer-events: none;
  z-index: 1;
}

/* 动画定义 */
@keyframes title-glow {
  0%, 100% { 
    filter: drop-shadow(0 0 5px rgba(46, 213, 115, 0.3)); 
  }
  50% { 
    filter: drop-shadow(0 0 15px rgba(52, 152, 219, 0.5)); 
  }
}

/* 心跳相关动画 */
@keyframes heartbeat {
  0%, 100% { 
    transform: scale(1);
  }
  50% { 
    transform: scale(1.2);
  }
}

@keyframes heartbeat-expand {
  0% { 
    opacity: 0.8;
    transform: scale(0.8);
  }
  100% { 
    opacity: 0;
    transform: scale(1.5);
  }
}

/* 状态指示器 */
.status-indicator.status-ready {
  background: linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(211, 84, 0, 0.2));
  color: #f39c12;
  border-color: rgba(243, 156, 18, 0.4);
  text-shadow: 0 0 8px rgba(243, 156, 18, 0.5);
}

.status-indicator.status-active {
  background: linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(29, 209, 161, 0.2));
  color: #2ed573;
  border-color: rgba(46, 213, 115, 0.4);
  text-shadow: 0 0 8px rgba(46, 213, 115, 0.5);
  animation: pulse-green 2s infinite;
}

.status-indicator.status-channel {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(41, 128, 185, 0.2));
  color: #3498db;
  border-color: rgba(52, 152, 219, 0.4);
  text-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
  animation: spin 2s linear infinite;
}

.status-indicator.status-game-over {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.2));
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.4);
  text-shadow: 0 0 8px rgba(231, 76, 60, 0.5);
  animation: pulse-red 1.5s infinite;
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .score-board-inner {
    padding: 20px 30px;
  }
  
  .game-title {
    font-size: 2rem;
  }
  
  .score-item {
    min-width: 160px;
  }
  
  .score-number {
    font-size: 1.8rem;
  }
}

@media (max-width: 900px) {
  .score-board {
    min-height: 180px;
  }
  
  .score-board-inner {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  
  .score-section {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    gap: 20px;
  }
  
  .center-section {
    order: -1;
    width: 100%;
    min-width: auto;
    padding: 0;
  }
  
  .game-title {
    font-size: 1.8rem;
    margin-bottom: 8px;
  }
  
  .score-item {
    min-width: auto;
    flex: 1;
  }
  
  .score-item.score .score-value {
    min-width: 160px;
  }
  
  .score-item.lives .score-value {
    min-width: 160px;
  }
}

@media (max-width: 600px) {
  .score-board {
    min-height: 240px;
  }
  
  .score-section {
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .score-item {
    min-width: 140px;
  }
  
  .score-item.score .score-value {
    min-width: 140px;
  }
  
  .score-item.lives .score-value {
    min-width: 140px;
  }
  
  .score-number {
    font-size: 1.6rem;
  }
  
  .life-symbol {
    font-size: 1.2rem;
  }
  
  .life-count {
    font-size: 0.9rem;
  }
}
</style>