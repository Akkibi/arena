<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{ msg: string }>()

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface Wall {
  x: number
  y: number
  radius: number
}

const ball1 = ref<Ball>({
  x: 100,
  y: 100,
  vx: 0,
  vy: 0,
  radius: 30
})

const ball2 = ref<Ball>({
  x: 300,
  y: 200,
  vx: 0,
  vy: 0,
  radius: 30
})

const centerX = ref(window.innerWidth / 2)
const centerY = ref(window.innerHeight / 2)

const walls = ref<Wall[]>([])

const WALL_DISTANCE = 200
const WALL_RADIUS = 40

let animationId: number

const GRAVITY_STRENGTH = 0.5
const DAMPING = 0.98
const BALL_COLLISION_DAMPING = 1.5 // Stronger repulsion between balls
const WALL_COLLISION_DAMPING = 0.6 // Weaker bounce off walls

function updateWalls() {
  walls.value = [
    { x: centerX.value, y: centerY.value - WALL_DISTANCE, radius: WALL_RADIUS }, // Top
    { x: centerX.value + WALL_DISTANCE, y: centerY.value, radius: WALL_RADIUS }, // Right
    { x: centerX.value, y: centerY.value + WALL_DISTANCE, radius: WALL_RADIUS }, // Bottom
    { x: centerX.value - WALL_DISTANCE, y: centerY.value, radius: WALL_RADIUS }, // Left
  ]
}

function checkCollisionWithWall(ball: Ball, wall: Wall) {
  const dx = ball.x - wall.x
  const dy = ball.y - wall.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const minDist = ball.radius + wall.radius

  if (dist < minDist && dist > 0) {
    // Normalize collision vector
    const nx = dx / dist
    const ny = dy / dist

    // Push ball away from wall
    const overlap = minDist - dist
    ball.x += nx * overlap
    ball.y += ny * overlap

    // Calculate velocity component along collision normal
    const dotProduct = ball.vx * nx + ball.vy * ny

    // Only apply force if moving towards the wall
    if (dotProduct < 0) {
      ball.vx -= nx * dotProduct * WALL_COLLISION_DAMPING
      ball.vy -= ny * dotProduct * WALL_COLLISION_DAMPING
    }
  }
}

function updatePhysics() {
  // Apply gravity towards center for ball1
  const dx1 = centerX.value - ball1.value.x
  const dy1 = centerY.value - ball1.value.y
  const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)

  if (dist1 > 0) {
    ball1.value.vx += (dx1 / dist1) * GRAVITY_STRENGTH
    ball1.value.vy += (dy1 / dist1) * GRAVITY_STRENGTH
  }

  // Apply gravity towards center for ball2
  const dx2 = centerX.value - ball2.value.x
  const dy2 = centerY.value - ball2.value.y
  const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

  if (dist2 > 0) {
    ball2.value.vx += (dx2 / dist2) * GRAVITY_STRENGTH
    ball2.value.vy += (dy2 / dist2) * GRAVITY_STRENGTH
  }

  // Apply damping
  ball1.value.vx *= DAMPING
  ball1.value.vy *= DAMPING
  ball2.value.vx *= DAMPING
  ball2.value.vy *= DAMPING

  // Update positions
  ball1.value.x += ball1.value.vx
  ball1.value.y += ball1.value.vy
  ball2.value.x += ball2.value.vx
  ball2.value.y += ball2.value.vy

  // Check collision between balls
  const ballDx = ball2.value.x - ball1.value.x
  const ballDy = ball2.value.y - ball1.value.y
  const ballDist = Math.sqrt(ballDx * ballDx + ballDy * ballDy)
  const minDist = ball1.value.radius + ball2.value.radius

  if (ballDist < minDist && ballDist > 0) {
    // Normalize collision vector
    const nx = ballDx / ballDist
    const ny = ballDy / ballDist

    // Separate balls
    const overlap = minDist - ballDist
    ball1.value.x -= nx * overlap * 0.5
    ball1.value.y -= ny * overlap * 0.5
    ball2.value.x += nx * overlap * 0.5
    ball2.value.y += ny * overlap * 0.5

    // Calculate relative velocity
    const dvx = ball2.value.vx - ball1.value.vx
    const dvy = ball2.value.vy - ball1.value.vy
    const dotProduct = dvx * nx + dvy * ny

    // Apply strong collision response
    ball1.value.vx += nx * dotProduct * BALL_COLLISION_DAMPING + 10 * Math.random()
    ball1.value.vy += ny * dotProduct * BALL_COLLISION_DAMPING + 10 * Math.random()
    ball2.value.vx -= nx * dotProduct * BALL_COLLISION_DAMPING + 10 * Math.random()
    ball2.value.vy -= ny * dotProduct * BALL_COLLISION_DAMPING + 10 * Math.random()
  }

  // Check collisions with walls
  walls.value.forEach(wall => {
    checkCollisionWithWall(ball1.value, wall)
    checkCollisionWithWall(ball2.value, wall)
  })

  animationId = requestAnimationFrame(updatePhysics)
}

function handleResize() {
  centerX.value = window.innerWidth / 2
  centerY.value = window.innerHeight / 2
  updateWalls()
}

onMounted(() => {
  updateWalls()
  updatePhysics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="playground">
    <div
      class="ball ball1"
      :style="{
        transform: `translate(${ball1.x}px, ${ball1.y}px)`
      }"
    />
    <div
      class="ball ball2"
      :style="{
        transform: `translate(${ball2.x}px, ${ball2.y}px)`
      }"
    />

    <!-- Wall circles -->
    <div
      v-for="(wall, index) in walls"
      :key="index"
      class="wall"
      :style="{
        transform: `translate(${wall.x}px, ${wall.y}px)`,
        width: `${wall.radius * 2}px`,
        height: `${wall.radius * 2}px`,
        marginLeft: `${-wall.radius}px`,
        marginTop: `${-wall.radius}px`
      }"
    />

    <div
      class="center-point"
      :style="{
        transform: `translate(${centerX}px, ${centerY}px)`
      }"
    />
  </div>
</template>

<style scoped>
.playground {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  pointer-events: none;
  background: url("/bg.svg") no-repeat center center / cover;
}

.ball {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-left: -30px;
  margin-top: -30px;
  will-change: transform;
}

.ball1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.ball2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
}

.wall {
  position: absolute;
  border-radius: 50%;
  background: rgba(150, 150, 150, 0.3);
  border: 2px solid rgba(150, 150, 150, 0.5);
  will-change: transform;
}

.center-point {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  margin-left: -5px;
  margin-top: -5px;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
}

h1 {
  position: absolute;
  top: 0%;
  left: 0%;
  z-index: 10;
  pointer-events: auto;
}
</style>
