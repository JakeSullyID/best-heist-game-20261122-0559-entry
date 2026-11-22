// game/src/guards.js - Guard patrol, suspicious, and alert AI

import { CONFIG } from './config.js';
import { hasLineOfSight, isInVisionCone } from './vision.js';

export class Guard {
  constructor(waypoints) {
    this.waypoints = waypoints;
    this.wpIndex = 0;
    const start = waypoints[0] || { x: 5, y: 5 };
    this.x = start.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = start.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.lastX = this.x;
    this.lastY = this.y;
    this.stuckTimer = 0;
    this.angle = 0;
    this.state = 'PATROL'; // PATROL, SUSPICIOUS, ALERT
    this.suspicion = 0; // 0 to 100
    this.investigateTarget = null;
    this.alertTimer = 0;
  }

  checkCollision(x, y, r, obstacles) {
    for (const obs of obstacles) {
      const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
      const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
      const dist = Math.hypot(x - closestX, y - closestY);
      if (dist < r) return true;
    }
    return false;
  }

  moveTowards(targetX, targetY, speed, dt, obstacles) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return 0;
    this.angle = Math.atan2(dy, dx);
    const moveDist = speed * dt;
    const actualDist = Math.min(dist, moveDist);
    const vx = Math.cos(this.angle) * actualDist;
    const vy = Math.sin(this.angle) * actualDist;

    // Try X step
    this.x += vx;
    if (this.checkCollision(this.x, this.y, 14, obstacles)) {
      this.x -= vx;
    }

    // Try Y step
    this.y += vy;
    if (this.checkCollision(this.x, this.y, 14, obstacles)) {
      this.y -= vy;
    }

    return dist;
  }

  update(dt, player, obstacles, isAlarmActive) {
    let speed = CONFIG.GUARD_PATROL_SPEED;

    if (isAlarmActive) {
      this.state = 'ALERT';
    }

    // State machine
    if (this.state === 'ALERT') {
      speed = CONFIG.GUARD_ALERT_SPEED;
      this.moveTowards(player.x, player.y, speed, dt, obstacles);
    } else if (this.state === 'SUSPICIOUS') {
      speed = CONFIG.GUARD_SUSPICIOUS_SPEED;
      if (this.investigateTarget) {
        const dist = this.moveTowards(this.investigateTarget.x, this.investigateTarget.y, speed, dt, obstacles);
        if (dist < 15) {
          // Reached target, look around then return to patrol
          this.alertTimer += dt;
          if (this.alertTimer > 3.0) {
            this.state = 'PATROL';
            this.alertTimer = 0;
            this.investigateTarget = null;
          }
        }
      }
    } else {
      // PATROL
      speed = CONFIG.GUARD_PATROL_SPEED;
      const targetWp = this.waypoints[this.wpIndex];
      const targetX = targetWp.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      const targetY = targetWp.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      const dist = this.moveTowards(targetX, targetY, speed, dt, obstacles);

      if (dist < 10) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        this.stuckTimer = 0;
      } else {
        const movedDist = Math.hypot(this.x - this.lastX, this.y - this.lastY);
        if (movedDist < 2 * dt) {
          this.stuckTimer += dt;
        } else {
          this.stuckTimer = 0;
        }
        if (this.stuckTimer >= 2.0) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.stuckTimer = 0;
        }
      }
    }

    this.lastX = this.x;
    this.lastY = this.y;

    // Vision check against player
    const canSee = isInVisionCone(player.x, player.y, this.x, this.y, this.angle, CONFIG.GUARD_VISION_RANGE, CONFIG.GUARD_FOV) &&
                   hasLineOfSight(this.x, this.y, player.x, player.y, obstacles);

    if (canSee) {
      const rate = player.isSprinting ? CONFIG.ALARM_GUARD_SEE_RATE * 1.5 : CONFIG.ALARM_GUARD_SEE_RATE;
      this.suspicion = Math.min(100, this.suspicion + rate * dt * 5); // scales up quickly
      if (this.suspicion >= 50 && this.state === 'PATROL') {
        this.state = 'SUSPICIOUS';
        this.investigateTarget = { x: player.x, y: player.y };
      }
      if (this.suspicion >= 95) {
        this.state = 'ALERT';
      }
      return true; // spotting player
    } else {
      if (this.suspicion > 0) {
        this.suspicion = Math.max(0, this.suspicion - 15 * dt);
      }
      return false;
    }
  }
}
