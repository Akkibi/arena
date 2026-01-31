import { Fighter } from '../Fighter'
import type { FighterConfig } from '../Fighter'

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  active: boolean
}

export class ArcherFighter extends Fighter {
  speedMultiplier = 1.2 // Faster movement
  strengthGainRate = 1 // Normal strength gain

  // Bullet properties
  bullets: Bullet[] = []
  shootAngle: number = 0 // Current angle for shooting
  shootRotationSpeed: number = 0.08 // How fast the shoot angle rotates
  shootCooldown: number = 0
  shootCooldownMax: number = 30 // Shoot every 30 frames (~0.5 seconds at 60fps)
  bulletSpeed: number = 8
  bulletRadius: number = 5

  constructor(config: FighterConfig) {
    super(config)

    // Archer fighter stats - glass cannon
    this.hp = 150
    this.maxHp = 150
    this.strength = 3 // High damage bullets
    this.radius = 28 // Smaller size
    this.dealsBodyDamage = false // Doesn't deal damage on body collision
  }

  // Special ability: Shoot a burst of bullets in all directions
  useSpecialAbility(_centerX: number, _centerY: number): void {
    // Shoot 8 bullets in a circle
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      this.shootBullet(angle)
    }
  }

  // Passive: Continuously rotate shoot angle and shoot bullets
  passiveAbility(_centerX: number, _centerY: number): void {
    // Rotate the shooting angle
    this.shootAngle += this.shootRotationSpeed

    // Decrease cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--
    } else {
      // Shoot a bullet in the current angle
      this.shootBullet(this.shootAngle)
      this.shootCooldown = this.shootCooldownMax - this.strength * 1.5
    }

    // Update bullets
    this.updateBullets()
  }

  // Shoot a bullet at a specific angle
  shootBullet(angle: number): void {
    const bullet: Bullet = {
      x: this.x + Math.cos(angle) * this.radius,
      y: this.y + Math.sin(angle) * this.radius,
      vx: Math.cos(angle) * this.bulletSpeed * (1 + this.strength * 0.24) + this.vx,
      vy: Math.sin(angle) * this.bulletSpeed * (1 + this.strength * 0.25) + this.vy,
      damage: this.strength,
      active: true
    }
    this.bullets.push(bullet)
  }

  // Update all bullets
  updateBullets(): void {
    this.bullets.forEach(bullet => {
      if (bullet.active) {
        bullet.x += bullet.vx
        bullet.y += bullet.vy

        // Deactivate bullets that go too far (more than 500px from archer)
        const dx = bullet.x - this.x
        const dy = bullet.y - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 500) {
          bullet.active = false
        }
      }
    })

    // Remove inactive bullets
    this.bullets = this.bullets.filter(b => b.active)
  }

  // Check if a bullet hits another fighter
  checkBulletCollision(other: Fighter): boolean {
    let hit = false
    this.bullets.forEach(bullet => {
      if (bullet.active) {
        const dx = bullet.x - other.x
        const dy = bullet.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < this.bulletRadius + other.radius) {
          // Hit!
          bullet.active = false
          hit = true
        }
      }
    })
    return hit
  }

  // Get bullet damage for collision
  getBulletDamage(): number {
    return this.strength
  }
}
