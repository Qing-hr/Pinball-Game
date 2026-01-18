<template>
  <div class="game-over" v-if="visible">
    <div class="game-over-content">
      <div class="game-over-title">GAME OVER</div>
      <div class="game-over-subtitle">最终得分</div>
      <div class="final-score">
        <span 
          class="score-digit" 
          v-for="(digit, index) in formattedScore" 
          :key="index" 
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          {{ digit }}
        </span>
      </div>
      <button class="restart-button" @click="handleRestart">
        <span class="button-icon">🔄</span>
        重新开始游戏
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  score: number
}

interface Emits {
  (e: 'restart'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const formattedScore = computed(() => {
  return props.score.toString().padStart(6, '0').split('')
})

// 处理重新开始
const handleRestart = () => {
  emit('restart')
  emit('close')
}
</script>

<style scoped>
.game-over {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.9) 0%, rgba(20, 0, 20, 0.95) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  backdrop-filter: blur(5px);
  animation: game-over-fade 0.5s ease-out;
}

.game-over-content {
  background: linear-gradient(135deg, 
    rgba(26, 26, 46, 0.95) 0%, 
    rgba(22, 33, 62, 0.95) 50%,
    rgba(26, 26, 46, 0.95) 100%
  );
  padding: 50px 60px;
  border-radius: 25px;
  text-align: center;
  border: 3px solid;
  border-image: linear-gradient(45deg, #ff4757, #e74c3c, #c0392b) 1;
  box-shadow: 
    0 0 40px rgba(255, 71, 87, 0.5),
    inset 0 0 20px rgba(255, 71, 87, 0.1);
  min-width: 400px;
  z-index: 21;
  position: relative;
  overflow: hidden;
}

.game-over-title {
  color: #ff4757;
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(255, 71, 87, 0.7);
  font-family: 'Arial Black', sans-serif;
  text-transform: uppercase;
  letter-spacing: 3px;
  position: relative;
  animation: title-shake 0.5s ease-in-out infinite;
  line-height: 1;
}

.game-over-subtitle {
  color: #85c1e9;
  font-size: 1.2rem;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 300;
  line-height: 1;
}

.final-score {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  border: 2px solid rgba(46, 213, 115, 0.3);
  position: relative;
  overflow: hidden;
}

.score-digit {
  font-size: 4rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  color: #2ed573;
  text-shadow: 0 0 15px rgba(46, 213, 115, 0.8);
  animation: digit-drop 0.3s ease-out;
  min-width: 1.2em;
  text-align: center;
  position: relative;
  line-height: 1;
}

.restart-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 40px;
  border: none;
  border-radius: 12px;
  font-size: 1.3rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #2ed573, #1dd1a1);
  color: white;
  box-shadow: 
    0 8px 20px rgba(46, 213, 115, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  line-height: 1;
}

.restart-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 12px 25px rgba(46, 213, 115, 0.6),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, #26de81, #10ac84);
}

.button-icon {
  font-size: 1.3rem;
  animation: spin 2s linear infinite;
}

/* 动画 */
@keyframes game-over-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes title-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes digit-drop {
  from { 
    transform: translateY(-20px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 900px) {
  .game-over-content {
    min-width: 90%;
    padding: 30px;
    margin: 20px;
  }
  
  .game-over-title {
    font-size: 2.5rem;
  }
  
  .final-score .score-digit {
    font-size: 2.5rem;
  }
  
  .restart-button {
    padding: 15px 30px;
    font-size: 1.1rem;
  }
}
</style>