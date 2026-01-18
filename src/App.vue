<template>
  <div class="app">
    <LoadingScreen 
      v-if="!gameStarted" 
      @start-game="startGame" 
    />
    <PinballGame 
      v-else 
      @go-to-menu="goToMenu" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoadingScreen from './components/LoadingScreen.vue'
import PinballGame from './components/PinballGame.vue'

const gameStarted = ref(false)

const startGame = () => {
  gameStarted.value = true
}

const goToMenu = () => {
  gameStarted.value = false
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: #0c2461;
  overflow-x: hidden;
}

.app {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #0c2461 0%, #1e3799 100%);
}
</style>