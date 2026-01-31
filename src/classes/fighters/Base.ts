import { Fighter } from '../Fighter'
import type { FighterConfig } from '../Fighter'

export class BaseFighter extends Fighter {
  speedMultiplier = 1.0 // Normal speed
  strengthGainRate = 1 // Normal strength gain

  constructor(config: FighterConfig) {
    super(config)

    // Base fighter stats
    this.hp = 100
    this.maxHp = 100
    this.strength = 1
    this.radius = 30
  }

  // Special ability: Quick dash towards center when far away
  useSpecialAbility(centerX: number, centerY: number): void {
    const dx = centerX - this.x
    const dy = centerY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // If far from center, get a speed boost
    if (dist > 200) {
      this.vx += (dx / dist) * 2
      this.vy += (dy / dist) * 2
    }
  }

  // Passive: Regenerate 1 HP every few seconds when HP is low
  private regenTimer = 0
  passiveAbility(_centerX: number, _centerY: number): void {
    this.regenTimer++

    // Regenerate 1 HP every 120 frames (~2 seconds at 60fps) when below 50% HP
    if (this.hp < this.maxHp * 0.5 && this.regenTimer >= 120 && this.hp !== 0) {
      this.hp = Math.min(this.maxHp, this.hp + 1)
      this.regenTimer = 0
    }
  }
}
