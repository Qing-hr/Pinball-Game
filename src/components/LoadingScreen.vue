<template>
  <div class="loading-screen">
    <div class="loading-content">
      <div class="pinball-machine">
        <div class="machine-top">
          <div class="machine-lights">
            <div class="light red" :class="{ 'light-on': lightsActive }"></div>
            <div class="light yellow" :class="{ 'light-on': lightsActive }"></div>
            <div class="light green" :class="{ 'light-on': lightsActive }"></div>
            <div class="light blue" :class="{ 'light-on': lightsActive }"></div>
            <div class="light purple" :class="{ 'light-on': lightsActive }"></div>
          </div>
        </div>
        <div class="machine-body">
          <div class="title">SNOWBALL PINBALL</div>
          
          <div class="loading-animation">
            <div class="ball-container">
              <div 
                v-for="i in 5" 
                :key="i" 
                class="loading-ball"
                :style="{
                  '--delay': `${(i-1)*0.1}s`,
                  '--index': i
                }"
              ></div>
            </div>
            <div class="loading-text">雪球弹珠台 加载中...</div>
          </div>
          
          <!-- 游戏模式说明 -->
          <div class="mode-info">
            <div class="mode-title">
              <span class="heart-icon">❤️</span>
              <h3>一条命挑战模式</h3>
              <span class="heart-icon">❤️</span>
            </div>
            <div class="mode-description">
              只有一次机会！弹珠掉落到底部立即结束游戏
            </div>
            <div class="life-indicator">
              <div class="single-life-display">
                <span class="life-heart">❤️</span>
                <span class="life-count">1/1</span>
              </div>
              <div class="heartbeat-animation"></div>
            </div>
          </div>
          
          <!-- 发射器操作说明面板 -->
          <div class="launcher-instructions">
            <div class="instructions-title">
              <span class="launcher-icon">🎯</span>
              <h3>发射器操作说明</h3>
              <span class="launcher-icon">🎯</span>
            </div>
            
            <div class="instructions-steps">
              <div class="step-item">
                <div class="step-number">1</div>
                <div class="step-content">
                  <div class="step-title">点击发射器区域</div>
                  <div class="step-desc">点击画布中的发射器位置（底部右侧）</div>
                  <div class="demo-highlight"></div>
                </div>
              </div>
              
              <div class="step-item">
                <div class="step-number">2</div>
                <div class="step-content">
                  <div class="step-title">向下拖动控制力度</div>
                  <div class="step-desc">向下拖动越远，发射力度越大</div>
                  <div class="drag-direction">↓ 向下拖动 ↓</div>
                </div>
              </div>
              
              <div class="step-item">
                <div class="step-number">3</div>
                <div class="step-content">
                  <div class="step-title">松开手指发射</div>
                  <div class="step-desc">松手向上发射雪球弹珠</div>
                  <div class="launch-direction">↑ 向上发射 ↑</div>
                </div>
              </div>
            </div>
            
            <div class="power-indicator">
              <div class="power-title">力度指示条</div>
              <div class="power-bar-demo">
                <div class="power-bar">
                  <div class="power-fill"></div>
                  <div class="power-markers">
                    <span class="power-marker" style="left: 20%"></span>
                    <span class="power-marker" style="left: 50%"></span>
                    <span class="power-marker" style="left: 80%"></span>
                  </div>
                </div>
                <div class="power-labels">
                  <span>轻柔</span>
                  <span>中等</span>
                  <span>强力</span>
                </div>
              </div>
            </div>
            
            <div class="quick-launch-tip">
              <div class="keyboard-key">空格</div>
              <span>按空格键快速发射（推荐力度）</span>
            </div>
          </div>
          
          <button class="start-button" @click="startGame">
            <span class="button-text">开始游戏</span>
            <span class="button-arrow">➤</span>
          </button>
          
          <!-- 综合控制说明 -->
          <div class="controls-info">
            <div class="controls-section">
              <h4>🎮 挡板控制</h4>
              <div class="control-item">
                <div class="keyboard-key">←</div>
                <span>左挡板抬起</span>
              </div>
              <div class="control-item">
                <div class="keyboard-key">→</div>
                <span>右挡板抬起</span>
              </div>
              <div class="control-item">
                <div class="keyboard-key">A</div>
                <span>左挡板（备用）</span>
              </div>
              <div class="control-item">
                <div class="keyboard-key">D</div>
                <span>右挡板（备用）</span>
              </div>
            </div>
            
            <div class="controls-section">
              <h4>⚙️ 实用工具</h4>
              <div class="control-item">
                <div class="keyboard-key">空格</div>
                <span>快速发射弹珠</span>
              </div>
              <div class="control-item">
                <div class="keyboard-key">R</div>
                <span>重置弹珠位置</span>
              </div>
              <div class="control-item">
                <div class="keyboard-key">ESC</div>
                <span>返回主菜单</span>
              </div>
            </div>
          </div>
        </div>
        <div class="machine-bottom"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  startGame: []
}>()

const lightsActive = ref(true)

// 创建灯光闪烁效果
let lightsInterval: number

onMounted(() => {
  lightsInterval = setInterval(() => {
    lightsActive.value = !lightsActive.value
  }, 500)
})

onUnmounted(() => {
  if (lightsInterval) {
    clearInterval(lightsInterval)
  }
})

const startGame = () => {
  emit('startGame')
}
</script>

<style scoped>
.loading-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%);
  overflow: hidden;
  position: relative;
}

.loading-screen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(52, 152, 219, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(46, 213, 115, 0.1) 0%, transparent 50%);
  z-index: 0;
}

.loading-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  padding: 20px;
}

.pinball-machine {
  background: linear-gradient(to bottom, #2c3e50 0%, #1a252f 100%);
  border-radius: 20px;
  padding: 4px;
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 3px solid;
  border-image: linear-gradient(45deg, #3498db, #2ecc71, #3498db) 1;
  position: relative;
  overflow: hidden;
}

.pinball-machine::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, transparent, #3498db, transparent);
  z-index: 2;
}

.machine-top {
  height: 30px;
  background: linear-gradient(to right, #34495e 0%, #2c3e50 50%, #34495e 100%);
  border-radius: 10px 10px 0 0;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.machine-lights {
  display: flex;
  gap: 10px;
  align-items: center;
}

.light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  opacity: 0.3;
  transition: all 0.5s ease;
  box-shadow: 0 0 5px currentColor;
}

.light.red { background: #ff4757; }
.light.yellow { background: #ffd32a; }
.light.green { background: #2ed573; }
.light.blue { background: #3498db; }
.light.purple { background: #9b59b6; }

.light-on {
  opacity: 1;
  animation: pulse 1s ease-in-out infinite;
}

.light-on.red { animation-delay: 0s; }
.light-on.yellow { animation-delay: 0.1s; }
.light-on.green { animation-delay: 0.2s; }
.light-on.blue { animation-delay: 0.3s; }
.light-on.purple { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.machine-bottom {
  height: 30px;
  background: linear-gradient(to right, #34495e 0%, #2c3e50 50%, #34495e 100%);
  border-radius: 0 0 10px 10px;
}

.machine-body {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
  padding: 40px 30px;
  border-radius: 16px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.machine-body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(45deg, transparent 25%, rgba(52, 152, 219, 0.05) 25%, rgba(52, 152, 219, 0.05) 50%, transparent 50%, transparent 75%, rgba(52, 152, 219, 0.05) 75%);
  background-size: 20px 20px;
  opacity: 0.5;
  z-index: 0;
}

.title {
  font-size: 3.5rem;
  font-weight: 900;
  background: linear-gradient(45deg, #3498db, #2ecc71, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 3px;
  margin-bottom: 20px;
  font-family: 'Arial Black', sans-serif;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.loading-animation {
  margin: 20px 0 30px;
  position: relative;
  z-index: 1;
}

.ball-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  height: 30px;
}

.loading-ball {
  width: 20px;
  height: 20px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #85c1e9);
  border-radius: 50%;
  animation: bounce 1s infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 10px rgba(133, 193, 233, 0.5);
  position: relative;
}

.loading-ball::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 30%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  filter: blur(1px);
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.loading-text {
  font-size: 1.2rem;
  color: #85c1e9;
  letter-spacing: 2px;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(133, 193, 233, 0.5);
  position: relative;
  z-index: 1;
}

/* 游戏模式说明 */
.mode-info {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.1));
  border: 2px solid rgba(231, 76, 60, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
}

.mode-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;
  color: #e74c3c;
}

.mode-title h3 {
  margin: 0;
  font-size: 1.5rem;
  text-shadow: 0 0 5px rgba(231, 76, 60, 0.5);
  animation: text-pulse 2s infinite;
}

@keyframes text-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.heart-icon {
  font-size: 1.8rem;
  animation: heartbeat 1.2s infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.mode-description {
  color: #aaa;
  font-size: 1rem;
  margin-bottom: 15px;
  line-height: 1.4;
}

.life-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  padding: 10px 0;
}

.single-life-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(231, 76, 60, 0.6);
  animation: life-danger-pulse 1s infinite;
  z-index: 2;
  position: relative;
}

@keyframes life-danger-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 rgba(231, 76, 60, 0.5);
  }
  50% { 
    box-shadow: 0 0 20px rgba(231, 76, 60, 0.8);
  }
}

.life-heart {
  font-size: 1.8rem;
  animation: heartbeat 1.2s infinite;
}

.life-count {
  font-size: 1.2rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

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

/* 发射器操作说明 */
.launcher-instructions {
  background: rgba(52, 152, 219, 0.1);
  border: 2px solid rgba(52, 152, 219, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 30px 0;
  text-align: left;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
}

.launcher-instructions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), transparent);
  border-radius: 10px;
  z-index: -1;
}

.instructions-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  color: #3498db;
}

.instructions-title h3 {
  margin: 0;
  font-size: 1.5rem;
  text-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
}

.launcher-icon {
  font-size: 1.8rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(5deg); }
}

.instructions-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.step-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-left-color: #3498db;
  transform: translateX(5px);
}

.step-number {
  width: 30px;
  height: 30px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
}

.step-content {
  flex: 1;
}

.step-title {
  color: #85c1e9;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.step-desc {
  color: #aaa;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 8px;
}

.demo-highlight {
  width: 100px;
  height: 20px;
  background: rgba(52, 152, 219, 0.3);
  border: 2px dashed rgba(52, 152, 219, 0.5);
  border-radius: 10px;
  margin-top: 5px;
  animation: highlight-pulse 2s infinite;
}

@keyframes highlight-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.drag-direction, .launch-direction {
  color: #2ecc71;
  font-weight: bold;
  font-size: 0.9rem;
  animation: updown 1s infinite alternate;
  margin-top: 5px;
}

@keyframes updown {
  0% { transform: translateY(0); }
  100% { transform: translateY(3px); }
}

.power-indicator {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.power-title {
  color: #f39c12;
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 1rem;
}

.power-bar-demo {
  position: relative;
}

.power-bar {
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid #7f8c8d;
  overflow: hidden;
  position: relative;
  margin-bottom: 5px;
}

.power-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(to right, 
    #2ecc71 0%,
    #2ecc71 20%,
    #f39c12 20%,
    #f39c12 50%,
    #e74c3c 50%,
    #e74c3c 100%
  );
  border-radius: 9px;
  animation: powerDemo 4s infinite;
  box-shadow: 0 0 10px currentColor;
}

@keyframes powerDemo {
  0%, 100% { width: 20%; }
  33% { width: 50%; }
  66% { width: 100%; }
}

.power-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.power-marker {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 26px;
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(-50%);
}

.power-labels {
  display: flex;
  justify-content: space-between;
  color: #7f8c8d;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0 5px;
}

.quick-launch-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: rgba(46, 204, 113, 0.1);
  border-radius: 8px;
  color: #2ecc71;
  font-size: 0.9rem;
  border: 1px solid rgba(46, 204, 113, 0.2);
  margin-top: 15px;
  justify-content: center;
}

.start-button {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 18px 50px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 30px;
  cursor: pointer;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  margin: 30px 0 40px;
  box-shadow: 0 5px 20px rgba(52, 152, 219, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  position: relative;
  z-index: 1;
  overflow: hidden;
  min-width: 250px;
  margin-left: auto;
  margin-right: auto;
}

.start-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.start-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 10px 30px rgba(52, 152, 219, 0.6);
  background: linear-gradient(135deg, #2980b9, #3498db);
}

.start-button:hover::before {
  left: 100%;
}

.start-button:active {
  transform: translateY(1px) scale(0.98);
}

.button-text {
  position: relative;
  z-index: 1;
}

.button-arrow {
  font-size: 1.8rem;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.start-button:hover .button-arrow {
  transform: translateX(5px);
}

/* 控制说明 */
.controls-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.controls-section {
  background: rgba(52, 73, 94, 0.1);
  padding: 20px;
  border-radius: 10px;
  border: 1px solid rgba(52, 73, 94, 0.2);
}

.controls-section h4 {
  color: #f39c12;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.control-item:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: translateX(3px);
}

.control-item:last-child {
  margin-bottom: 0;
}

.keyboard-key {
  background: #2c3e50;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 14px;
  min-width: 50px;
  text-align: center;
  border: 1px solid #7f8c8d;
  box-shadow: 0 2px 0 #1a252f;
  flex-shrink: 0;
}

.keyboard-key:hover {
  box-shadow: 0 1px 0 #1a252f;
  transform: translateY(1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-content {
    padding: 10px;
  }
  
  .title {
    font-size: 2.5rem;
    margin-bottom: 20px;
  }
  
  .launcher-instructions {
    padding: 15px;
  }
  
  .instructions-title h3 {
    font-size: 1.3rem;
  }
  
  .start-button {
    padding: 15px 30px;
    font-size: 1.2rem;
    min-width: 200px;
  }
  
  .controls-info {
    grid-template-columns: 1fr;
  }
  
  .control-item {
    font-size: 0.9rem;
  }
}
</style>