<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Fighter } from '../classes/Fighter'
import { BaseFighter } from '../classes/fighters/Base'
import { HeavyFighter } from '../classes/fighters/Heavy'
import { ArcherFighter } from '../classes/fighters/Archer'

defineProps<{ msg: string }>()

interface Wall {
  x: number
  y: number
  radius: number
}

type FighterType = 'base' | 'heavy' | 'archer'

interface FighterOption {
  type: FighterType
  name: string
  description: string
  color: string
}

const centerX = ref(window.innerWidth / 2)
const centerY = ref(window.innerHeight / 2)

// Fighter options for selection
const fighterOptions: FighterOption[] = [
  {
    type: 'base',
    name: 'Base Fighter',
    description: 'Balanced stats, regenerates HP',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    type: 'heavy',
    name: 'Heavy Fighter',
    description: 'High HP, rotating square attack',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    type: 'archer',
    name: 'Archer',
    description: 'Fast, shoots rotating bullets',
    color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  }
]

// Selected fighter types
const selectedFighter1Type = ref<FighterType>('heavy')
const selectedFighter2Type = ref<FighterType>('base')

// Game state
const gameStarted = ref(false)

// Create fighters using the new class system
const fighter1 = ref<Fighter | null>(null)
const fighter2 = ref<Fighter | null>(null)

// Function to create a fighter based on type
function createFighter(type: FighterType, x: number, y: number, name: string, color: string): Fighter {
  const config = { x, y, name, color }

  switch (type) {
    case 'base':
      return new BaseFighter(config)
    case 'heavy':
      return new HeavyFighter(config)
    case 'archer':
      return new ArcherFighter(config)
    default:
      return new BaseFighter(config)
  }
}

// Start the game with selected fighters
function startGame() {
  const option1 = fighterOptions.find(f => f.type === selectedFighter1Type.value)!
  const option2 = fighterOptions.find(f => f.type === selectedFighter2Type.value)!

  fighter1.value = createFighter(
    selectedFighter1Type.value,
    centerX.value - 200,
    centerY.value - 200,
    option1.name + ' 1',
    option1.color
  )

  fighter2.value = createFighter(
    selectedFighter2Type.value,
    centerX.value + 200,
    centerY.value + 200,
    option2.name + ' 2',
    option2.color
  )

  gameStarted.value = true
  updateWalls()
  updatePhysics()
  strengthInterval = setInterval(checkAndIncreaseStrength, 500)
}

// Reset the game
function resetGame() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (strengthInterval) {
    clearInterval(strengthInterval)
  }
  gameStarted.value = false
  fighter1.value = null
  fighter2.value = null
  ballsInCollision = false
}

const walls = ref<Wall[]>([])

const WALL_DISTANCE = 400
const WALL_RADIUS = 40

let animationId: number
let strengthInterval: number
let ballsInCollision = false

const GRAVITY_STRENGTH = 0.5
const DAMPING = 0.98
const BALL_COLLISION_DAMPING = 1.5
const WALL_COLLISION_DAMPING = 0.6

// Helper to check if fighter1 has shield
function hasShield(): boolean {
  return fighter1.value instanceof HeavyFighter && fighter1.value.getHasShield()
}

// Helper to get square position and rotation
function getSquareStyle(fighter: Fighter) {
  if (!(fighter instanceof HeavyFighter)) return {}

  const squarePos = fighter.getSquarePosition()
  return {
    transform: `translate(${squarePos.x}px, ${squarePos.y}px) rotate(${fighter.squareRotation}rad)`,
    width: `${fighter.squareSize}px`,
    height: `${fighter.squareSize}px`,
    marginLeft: `${-fighter.squareSize / 2}px`,
    marginTop: `${-fighter.squareSize / 2}px`
  }
}

function updateWalls() {
  walls.value = [
    { x: centerX.value, y: centerY.value - WALL_DISTANCE, radius: WALL_RADIUS }, // Top
    { x: centerX.value + WALL_DISTANCE, y: centerY.value, radius: WALL_RADIUS }, // Right
    { x: centerX.value, y: centerY.value + WALL_DISTANCE, radius: WALL_RADIUS }, // Bottom
    { x: centerX.value - WALL_DISTANCE, y: centerY.value, radius: WALL_RADIUS }, // Left
  ]
}

function checkAndIncreaseStrength() {
  if (!fighter1.value || !fighter2.value) return

  // Check if fighters are in center zone and increase strength
  if (fighter1.value.isInCenterZone(centerX.value, centerY.value)) {
    fighter1.value.gainStrength()
  }

  if (fighter2.value.isInCenterZone(centerX.value, centerY.value)) {
    fighter2.value.gainStrength()
  }
}

function checkCollisionWithWall(fighter: Fighter, wall: Wall) {
  const dx = fighter.x - wall.x
  const dy = fighter.y - wall.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const minDist = fighter.radius + wall.radius

  if (dist < minDist && dist > 0) {
    // Normalize collision vector
    const nx = dx / dist
    const ny = dy / dist

    // Push fighter away from wall
    const overlap = minDist - dist
    fighter.x += nx * overlap
    fighter.y += ny * overlap

    // Calculate velocity component along collision normal
    const dotProduct = fighter.vx * nx + fighter.vy * ny

    // Only apply force if moving towards the wall
    if (dotProduct < 0) {
      fighter.vx -= nx * dotProduct * WALL_COLLISION_DAMPING
      fighter.vy -= ny * dotProduct * WALL_COLLISION_DAMPING
    }
  }
}

function updatePhysics() {
  if (!fighter1.value || !fighter2.value) return

  // Apply gravity for both fighters
  fighter1.value.applyGravity(centerX.value, centerY.value, GRAVITY_STRENGTH)
  fighter2.value.applyGravity(centerX.value, centerY.value, GRAVITY_STRENGTH)

  // Apply damping
  fighter1.value.applyDamping(DAMPING)
  fighter2.value.applyDamping(DAMPING)

  // Update positions
  fighter1.value.updatePosition()
  fighter2.value.updatePosition()

  // Call passive abilities every frame
  fighter1.value.passiveAbility(centerX.value, centerY.value)
  fighter2.value.passiveAbility(centerX.value, centerY.value)

  // Check collision between fighters
  const dist = fighter1.value.getDistanceTo(fighter2.value)
  const minDist = fighter1.value.radius + fighter2.value.radius

  // Check if Heavy fighter's square hits the other fighter
  let squareHit = false
  if (fighter1.value instanceof HeavyFighter) {
    if (fighter1.value.checkSquareCollisionWithFighter(fighter2.value)) {
      if (!ballsInCollision) {
        fighter2.value.takeDamage(fighter1.value.strength)
        squareHit = true
      }
    }
  }
  if (fighter2.value instanceof HeavyFighter) {
    if (fighter2.value.checkSquareCollisionWithFighter(fighter1.value)) {
      if (!ballsInCollision) {
        fighter1.value.takeDamage(fighter2.value.strength)
        squareHit = true
      }
    }
  }

  // Check if Archer fighter's bullets hit the other fighter
  let bulletHit = false
  if (fighter1.value instanceof ArcherFighter) {
    if (fighter1.value.checkBulletCollision(fighter2.value)) {
      fighter2.value.takeDamage(fighter1.value.getBulletDamage())
      bulletHit = true
    }
  }
  if (fighter2.value instanceof ArcherFighter) {
    if (fighter2.value.checkBulletCollision(fighter1.value)) {
      fighter1.value.takeDamage(fighter2.value.getBulletDamage())
      bulletHit = true
    }
  }

  if (dist < minDist && dist > 0) {
    // Deal damage on first contact (only if fighters deal body damage)
    if (!ballsInCollision && !squareHit && !bulletHit) {
      if (fighter1.value.dealsBodyDamage) {
        fighter2.value.takeDamage(fighter1.value.strength)
      }
      if (fighter2.value.dealsBodyDamage) {
        fighter1.value.takeDamage(fighter2.value.strength)
      }
    }

    if (squareHit || bulletHit) {
      ballsInCollision = true
    } else {
      ballsInCollision = true
    }

    // Calculate collision normal
    const dx = fighter2.value.x - fighter1.value.x
    const dy = fighter2.value.y - fighter1.value.y
    const nx = dx / dist
    const ny = dy / dist

    // Separate fighters
    const overlap = minDist - dist
    fighter1.value.x -= nx * overlap * 0.5
    fighter1.value.y -= ny * overlap * 0.5
    fighter2.value.x += nx * overlap * 0.5
    fighter2.value.y += ny * overlap * 0.5

    // Calculate relative velocity
    const dvx = fighter2.value.vx - fighter1.value.vx
    const dvy = fighter2.value.vy - fighter1.value.vy
    const dotProduct = dvx * nx + dvy * ny

    // Apply collision response
    fighter1.value.vx += nx * dotProduct * BALL_COLLISION_DAMPING * 2 * Math.random()
    fighter1.value.vy += ny * dotProduct * BALL_COLLISION_DAMPING * 2 * Math.random()
    fighter2.value.vx -= nx * dotProduct * BALL_COLLISION_DAMPING * 2 * Math.random()
    fighter2.value.vy -= ny * dotProduct * BALL_COLLISION_DAMPING * 2 * Math.random()
  } else if (squareHit || bulletHit) {
    ballsInCollision = true
  } else {
    // Reset collision flag when fighters separate
    ballsInCollision = false
  }

  // Check collisions with walls
  walls.value.forEach(wall => {
    if (fighter1.value) checkCollisionWithWall(fighter1.value, wall)
    if (fighter2.value) checkCollisionWithWall(fighter2.value, wall)
  })

  if (gameStarted.value) {
    animationId = requestAnimationFrame(updatePhysics)
  }
}

function handleResize() {
  centerX.value = window.innerWidth / 2
  centerY.value = window.innerHeight / 2
  updateWalls()
}

onMounted(() => {
  updateWalls()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (strengthInterval) {
    clearInterval(strengthInterval)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <h1 class="title">{{ msg }}</h1>

  <!-- Fighter Selection Screen -->
  <div v-if="!gameStarted" class="selection-screen">
    <div class="selection-container">
      <h2>Select Your Fighters</h2>

      <div class="fighter-selectors">
        <!-- Fighter 1 Selection -->
        <div class="fighter-selector">
          <h3>Fighter 1</h3>
          <div class="fighter-options">
            <div
              v-for="option in fighterOptions"
              :key="option.type + '1'"
              class="fighter-option"
              :class="{ selected: selectedFighter1Type === option.type }"
              @click="selectedFighter1Type = option.type"
            >
              <div class="fighter-preview" :style="{ background: option.color }"></div>
              <div class="fighter-info">
                <h4>{{ option.name }}</h4>
                <p>{{ option.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fighter 2 Selection -->
        <div class="fighter-selector">
          <h3>Fighter 2</h3>
          <div class="fighter-options">
            <div
              v-for="option in fighterOptions"
              :key="option.type + '2'"
              class="fighter-option"
              :class="{ selected: selectedFighter2Type === option.type }"
              @click="selectedFighter2Type = option.type"
            >
              <div class="fighter-preview" :style="{ background: option.color }"></div>
              <div class="fighter-info">
                <h4>{{ option.name }}</h4>
                <p>{{ option.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="start-button" @click="startGame">Start Battle</button>
    </div>
  </div>

  <!-- Game Arena -->
  <div v-else class="playground">
    <!-- Fighter 1 -->
    <div
      v-if="fighter1"
      class="ball ball1"
      :style="{
        transform: `translate(${fighter1.x}px, ${fighter1.y}px)`,
        width: `${fighter1.radius * 2}px`,
        height: `${fighter1.radius * 2}px`,
        marginLeft: `${-fighter1.radius}px`,
        marginTop: `${-fighter1.radius}px`,
        background: fighter1.color
      }"
    >
      {{ fighter1.hp > 0 ? fighter1.hp : 'KO' }}
      <span v-if="hasShield()" class="shield-icon">🛡️</span>
    </div>

    <!-- Rotating square for fighter1 (if Heavy) -->
    <div
      v-if="fighter1 instanceof HeavyFighter"
      class="rotating-square"
      :style="getSquareStyle(fighter1)"
    />

    <!-- Bullets for fighter1 (if Archer) -->
    <template v-if="fighter1 instanceof ArcherFighter">
      <div
        v-for="(bullet, idx) in fighter1.bullets"
        :key="'bullet1-' + idx"
        class="bullet"
        :style="{
          transform: `translate(${bullet.x}px, ${bullet.y}px)`,
          width: `${fighter1.bulletRadius * 2}px`,
          height: `${fighter1.bulletRadius * 2}px`,
          marginLeft: `${-fighter1.bulletRadius}px`,
          marginTop: `${-fighter1.bulletRadius}px`
        }"
      />
    </template>

    <!-- Fighter 2 -->
    <div
      v-if="fighter2"
      class="ball ball2"
      :style="{
        width: `${fighter2.radius * 2}px`,
        height: `${fighter2.radius * 2}px`,
        marginLeft: `${-fighter2.radius}px`,
        marginTop: `${-fighter2.radius}px`,
        transform: `translate(${fighter2.x}px, ${fighter2.y}px)`,
        background: fighter2.color
      }"
    >
      {{ fighter2.hp > 0 ? fighter2.hp : 'KO' }}
    </div>

    <!-- Rotating square for fighter2 (if Heavy) -->
    <div
      v-if="fighter2 instanceof HeavyFighter"
      class="rotating-square"
      :style="getSquareStyle(fighter2)"
    />

    <!-- Bullets for fighter2 (if Archer) -->
    <template v-if="fighter2 instanceof ArcherFighter">
      <div
        v-for="(bullet, idx) in fighter2.bullets"
        :key="'bullet2-' + idx"
        class="bullet"
        :style="{
          transform: `translate(${bullet.x}px, ${bullet.y}px)`,
          width: `${fighter2.bulletRadius * 2}px`,
          height: `${fighter2.bulletRadius * 2}px`,
          marginLeft: `${-fighter2.bulletRadius}px`,
          marginTop: `${-fighter2.bulletRadius}px`
        }"
      />
    </template>

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

  <!-- Score Display (only when game started) -->
  <div v-if="gameStarted && fighter1 && fighter2">
    <div class="score bottom-right">
      {{ fighter1.name }}: {{ fighter1.strength }}💪 {{ fighter1.hp }}/{{ fighter1.maxHp }} HP
    </div>
    <div class="score bottom-left">
      {{ fighter2.name }}: {{ fighter2.strength }}💪 {{ fighter2.hp }}/{{ fighter2.maxHp }} HP
    </div>
    <button class="reset-button" @click="resetGame">Reset</button>
  </div>

  <!-- Game Over Screen -->
  <div v-if="gameStarted && fighter1 && fighter2 && (fighter1.hp <= 0 || fighter2.hp <= 0)" class="end-game">
    <div class="end-game-text">
      {{ fighter1.hp <= 0 ? fighter2.name + ' wins!' : fighter1.name + ' wins!' }}
    </div>
    <button class="restart-button" @click="resetGame">Play Again</button>
  </div>
</template>

<style scoped>
.shield-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 16px;
}

.rotating-square {
  position: absolute;
  background: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
  will-change: transform;
  pointer-events: none;
}

.end-game {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.end-game-text {
  color: white;
  font-size: 3rem;
  line-height: 100%;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
}

.score {
  position: absolute;
  color: white;
  font-size: 24px;
}
.bottom-right {
  bottom: 10px;
  right: 10px;
}
.bottom-left {
  bottom: 10px;
  left: 10px;
}
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
  border-radius: 50%;
  will-change: transform;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  font-size: 24px;
  font-family: monospace;
  font-weight: bold;
  text-shadow: 0px 0px 4px rgba(255, 255, 255, 0.5);
}

.ball1 {
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.ball2 {
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
  background: rgba(200, 255, 150, 0.5);
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

/* Selection Screen */
.selection-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.selection-container {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 20px;
  max-width: 900px;
  width: 90%;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
}

.selection-container h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2rem;
}

.fighter-selectors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.fighter-selector h3 {
  color: #555;
  margin-bottom: 15px;
  text-align: center;
}

.fighter-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fighter-option {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border: 3px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fighter-option:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.fighter-option.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.fighter-preview {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
  flex-shrink: 0;
}

.fighter-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.1rem;
}

.fighter-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.start-button {
  width: 100%;
  padding: 15px 30px;
  font-size: 1.3rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  pointer-events: auto;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.start-button:active {
  transform: translateY(0);
}

/* Bullets */
.bullet {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0%, #11998e 100%);
  /*box-shadow: 0 0 10px rgba(17, 153, 142, 0.8);*/
  will-change: transform;
  pointer-events: none;
}

/* Reset Button */
.reset-button {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
  z-index: 50;
}

.reset-button:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translateY(-2px);
}

/* Restart Button */
.restart-button {
  margin-top: 20px;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
}

.restart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
}

.end-game {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 768px) {
  .end-game {
    width: 90%;
    margin: 0 auto;
  }

  .end-game .restart-button {
    margin-top: 10px;
    padding: 10px 30px;
    font-size: 1rem;
  }

  .end-game .restart-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
  }

  .fighter-option {
    margin-top: 10px;
    padding: 10px 30px;
    font-size: 1rem;
    flex-direction: column;
  }

  .selection-screen {
    padding-top: 20px;
    overflow-y:scroll;
  }

  .bottom-right{
      left: 10px;
      right:unset;
      bottom: 2rem;
  }
}

.title {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    margin-bottom: 20px;
    padding-left: 20px;
}

@media (max-width: 480px) {
  .end-game {
    width: 95%;
    margin: 0 auto;
  }
}

</style>
