export interface FighterConfig {
  x: number
  y: number
  color: string
  name: string
}

export abstract class Fighter {
  x: number
  y: number
  vx: number = 0
  vy: number = 0
  hp: number
  maxHp: number
  strength: number
  radius: number
  color: string
  name: string
  dealsBodyDamage: boolean = true // Whether this fighter deals damage on body collision

  // Fighter-specific properties
  abstract speedMultiplier: number
  abstract strengthGainRate: number // How much strength gained per tick when in center

  constructor(config: FighterConfig) {
    this.x = config.x
    this.y = config.y
    this.color = config.color
    this.name = config.name

    // These will be set by subclasses
    this.hp = 100
    this.maxHp = 100
    this.strength = 1
    this.radius = 30
  }

  // Update velocity based on gravity
  applyGravity(centerX: number, centerY: number, gravityStrength: number) {
    const dx = centerX - this.x
    const dy = centerY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      this.vx += (dx / dist) * gravityStrength * this.speedMultiplier
      this.vy += (dy / dist) * gravityStrength * this.speedMultiplier
    }
  }

  // Apply damping to velocity
  applyDamping(damping: number) {
    this.vx *= damping
    this.vy *= damping
  }

  // Update position
  updatePosition() {
    this.x += this.vx
    this.y += this.vy
  }

  // Check if fighter is in center zone
  isInCenterZone(centerX: number, centerY: number): boolean {
    const dx = this.x - centerX
    const dy = this.y - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < this.radius
  }

  // Increase strength when in center
  gainStrength() {
    this.strength += this.strengthGainRate
  }

  // Take damage
  takeDamage(damage: number) {
    this.hp = Math.max(0, this.hp - damage)
  }

  // Check if fighter is alive
  isAlive(): boolean {
    return this.hp > 0
  }

  // Get distance to another fighter
  getDistanceTo(other: Fighter): number {
    const dx = this.x - other.x
    const dy = this.y - other.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Special ability that can be overridden by subclasses
  abstract useSpecialAbility(centerX: number, centerY: number): void

  // Passive ability called every frame
  abstract passiveAbility(centerX: number, centerY: number): void
}
