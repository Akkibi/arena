import { Fighter } from '../Fighter'
import type { FighterConfig } from '../Fighter'

export class HeavyFighter extends Fighter {
  speedMultiplier = 0.7 // Slower movement
  strengthGainRate = 2 // Gains strength faster

  // Rotating square properties
  squareRotation: number = 0 // Rotation angle in radians
  squareSize: number = 30 // Size of the square
  squareDistance: number = 60 // Distance from center of fighter
  squareRotationSpeed: number = 0.05 // Rotation speed per frame

  constructor(config: FighterConfig) {
    super(config)

    // Heavy fighter stats - tankier with more HP
    this.hp = 250
    this.maxHp = 250
    this.strength = 2 // Starts with more strength
    this.radius = 50 // Slightly larger
    this.dealsBodyDamage = false // Doesn't deal damage on body collision
  }

  // Special ability: Ground slam - push away from center with force
  useSpecialAbility(centerX: number, centerY: number): void {
    const dx = this.x - centerX
    const dy = this.y - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // If near center, push away with force
    if (dist < 100 && dist > 0) {
      this.vx += (dx / dist) * 5
      this.vy += (dy / dist) * 5
    }
  }

  // Passive: Gain a shield that reduces next damage taken
  private shieldCharge = 0
  private hasShield = false

  passiveAbility(centerX: number, centerY: number): void {
    // Rotate the square continuously
    this.squareRotation += this.squareRotationSpeed

    // Build up shield charge when in center zone
    if (this.isInCenterZone(centerX, centerY)) {
      this.shieldCharge++

      // Activate shield after 180 frames (~3 seconds)
      if (this.shieldCharge >= 180 && !this.hasShield) {
        this.hasShield = true
        this.shieldCharge = 0
      }
    }
  }

  // Override takeDamage to implement shield mechanic
  takeDamage(damage: number) {
    if (this.hasShield) {
      // Shield absorbs 50% of damage
      damage = Math.floor(damage * 0.5)
      this.hasShield = false
      this.shieldCharge = 0
    }
    this.hp = Math.max(0, this.hp - damage)
  }

  // Method to check shield status (for UI display)
  getHasShield(): boolean {
    return this.hasShield
  }

  // Get the center position of the rotating square
  getSquarePosition(): { x: number; y: number } {
    return {
      x: this.x + Math.cos(this.squareRotation) * this.squareDistance,
      y: this.y + Math.sin(this.squareRotation) * this.squareDistance
    }
  }

  // Get the four corners of the rotating square
  getSquareCorners(): Array<{ x: number; y: number }> {
    const center = this.getSquarePosition()
    const halfSize = this.squareSize / 2
    const corners: Array<{ x: number; y: number }> = []

    // Calculate the four corners relative to the square's rotation
    for (let i = 0; i < 4; i++) {
      const angle = this.squareRotation + (Math.PI / 4) + (i * Math.PI / 2)
      const distance = Math.sqrt(2) * halfSize
      corners.push({
        x: center.x + Math.cos(angle) * distance,
        y: center.y + Math.sin(angle) * distance
      })
    }

    return corners
  }

  // Check if a point (like another fighter's center) is inside the square
  isPointInSquare(px: number, py: number): boolean {
    const center = this.getSquarePosition()

    // Transform point to square's local coordinate system
    const dx = px - center.x
    const dy = py - center.y

    // Rotate point back by negative square rotation
    const cos = Math.cos(-this.squareRotation)
    const sin = Math.sin(-this.squareRotation)
    const localX = dx * cos - dy * sin
    const localY = dx * sin + dy * cos

    // Check if point is within square bounds
    const halfSize = this.squareSize / 2
    return Math.abs(localX) <= halfSize && Math.abs(localY) <= halfSize
  }

  // Check collision with another fighter (circle)
  checkSquareCollisionWithFighter(other: Fighter): boolean {
    const squareCenter = this.getSquarePosition()

    // Get distance from square center to fighter center
    const dx = other.x - squareCenter.x
    const dy = other.y - squareCenter.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Simple collision: check if fighter's center is close enough to square
    // or if fighter's edge overlaps with square
    const halfSize = this.squareSize / 2
    const maxDist = Math.sqrt(2) * halfSize + other.radius

    if (dist > maxDist) return false

    // More precise check: is fighter center inside square or very close?
    return this.isPointInSquare(other.x, other.y) || dist < halfSize + other.radius
  }
}
