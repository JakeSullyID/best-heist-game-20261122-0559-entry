// game/src/world.js - Game world state, parsing, and mechanics

import { CONFIG } from './config.js';
import { LEVELS } from './levels.js';
import { Guard } from './guards.js';
import { audio } from './audio.js';
import { isInVisionCone, hasLineOfSight } from './vision.js';

export class World {
  constructor(levelIndex = 0) {
    this.levelIndex = levelIndex;
    this.loadLevel(levelIndex);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.levelDef = LEVELS[index] || LEVELS[0];
    this.timeRemaining = this.levelDef.timeLimit;
    this.alarm = 0;
    this.isAlarmActive = false;
    this.escapeTimer = CONFIG.ESCAPE_COUNTDOWN;
    this.carriedLoot = 0;
    this.carriedWeight = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.paused = false;

    this.walls = [];
    this.obstacles = [];
    this.guards = [];
    this.cameras = [];
    this.safes = [];
    this.terminals = [];
    this.loots = [];
    this.lasers = [];
    this.exitZone = null;
    this.player = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      isSprinting: false,
      interactionTarget: null,
      interactionProgress: 0,
      interactionType: null
    };

    // Parse map
    const map = this.levelDef.map;
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        const wx = c * CONFIG.TILE_SIZE;
        const wy = r * CONFIG.TILE_SIZE;
        const box = { x: wx, y: wy, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE };

        if (char === '#') {
          this.walls.push(box);
          this.obstacles.push(box);
        } else if (char === 'P') {
          this.player.x = wx + CONFIG.TILE_SIZE / 2;
          this.player.y = wy + CONFIG.TILE_SIZE / 2;
        } else if (char === 'C') {
          this.cameras.push({
            x: wx + CONFIG.TILE_SIZE / 2,
            y: wy + CONFIG.TILE_SIZE / 2,
            angle: 0,
            baseAngle: 0,
            sweep: Math.PI / 3,
            timer: 0,
            darkTimer: 0
          });
        } else if (char === 'S') {
          this.safes.push({
            x: wx + CONFIG.TILE_SIZE / 2,
            y: wy + CONFIG.TILE_SIZE / 2,
            opened: false,
            cracking: false
          });
        } else if (char === 'T') {
          this.terminals.push({
            x: wx + CONFIG.TILE_SIZE / 2,
            y: wy + CONFIG.TILE_SIZE / 2,
            hacking: false
          });
        } else if (char === 'L') {
          this.loots.push({
            x: wx + CONFIG.TILE_SIZE / 2,
            y: wy + CONFIG.TILE_SIZE / 2,
            type: 'cash',
            value: 1000,
            collected: false
          });
        } else if (char === 'D') {
          this.loots.push({
            x: wx + CONFIG.TILE_SIZE / 2,
            y: wy + CONFIG.TILE_SIZE / 2,
            type: 'diamond',
            value: 8000,
            collected: false
          });
        } else if (char === 'E') {
          this.exitZone = { x: wx, y: wy, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE };
        }
      }
    }

    // Add extra loots defined in levelDef
    if (this.levelDef.loots) {
      for (const l of this.levelDef.loots) {
        this.loots.push({
          x: l.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
          y: l.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
          type: l.type,
          value: l.value,
          collected: false
        });
      }
    }

    // Add guards
    if (this.levelDef.guardWaypoints) {
      for (const wpList of this.levelDef.guardWaypoints) {
        this.guards.push(new Guard(wpList));
      }
    }

    // Add lasers
    if (this.levelDef.lasers) {
      for (const l of this.levelDef.lasers) {
        this.lasers.push({
          x1: l.x1 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
          y1: l.y1 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
          x2: l.x2 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
          y2: l.y2 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
          period: l.period,
          phase: l.phase,
          active: true
        });
      }
    }
  }

  update(dt, input) {
    if (this.paused || this.gameOver || this.gameWon) return;

    // Heist clock
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.gameOver = true;
      audio.lose();
      return;
    }

    // Alarm decay if unseen
    let sawPlayer = false;

    // Player Movement
    let dx = 0;
    let dy = 0;
    if (input.isDown('KeyW') || input.isDown('ArrowUp')) dy -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) dy += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) dx -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) dx += 1;

    this.player.isSprinting = input.isDown('ShiftLeft') || input.isDown('ShiftRight');

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    // Weight penalty on speed
    const weightMult = Math.max(CONFIG.MIN_SPEED_MULT, 1.0 - (this.carriedWeight * 0.05));
    const speed = CONFIG.PLAYER_SPEED * (this.player.isSprinting ? CONFIG.PLAYER_SPRINT_MULT : 1.0) * weightMult;

    const moveX = dx * speed * dt;
    const moveY = dy * speed * dt;

    // Collide X
    this.player.x += moveX;
    if (this.checkCollision(this.player.x, this.player.y, CONFIG.PLAYER_RADIUS)) {
      this.player.x -= moveX;
    }

    // Collide Y
    this.player.y += moveY;
    if (this.checkCollision(this.player.x, this.player.y, CONFIG.PLAYER_RADIUS)) {
      this.player.y -= moveY;
    }

    // Interaction (E key)
    const interactPressed = input.isPressed('KeyE');
    const interactHeld = input.isDown('KeyE');

    let nearestInteractable = null;
    let nearestDist = CONFIG.INTERACT_RANGE;

    // Check safes
    for (const safe of this.safes) {
      if (safe.opened) continue;
      const dist = Math.hypot(safe.x - this.player.x, safe.y - this.player.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestInteractable = { type: 'safe', obj: safe };
      }
    }

    // Check terminals
    for (const term of this.terminals) {
      const dist = Math.hypot(term.x - this.player.x, term.y - this.player.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestInteractable = { type: 'terminal', obj: term };
      }
    }

    if (nearestInteractable && interactHeld) {
      if (this.player.interactionType !== nearestInteractable.type || this.player.interactionTarget !== nearestInteractable.obj) {
        this.player.interactionType = nearestInteractable.type;
        this.player.interactionTarget = nearestInteractable.obj;
        this.player.interactionProgress = 0;
      }

      const reqTime = this.player.interactionType === 'safe' ? CONFIG.SAFE_CRACK_TIME : CONFIG.TERMINAL_HACK_TIME;
      this.player.interactionProgress += dt;
      if (Math.random() < 0.3) audio.crackTick();

      // Alarm rises while cracking
      if (this.player.interactionType === 'safe') {
        this.alarm = Math.min(CONFIG.ALARM_MAX, this.alarm + CONFIG.ALARM_CRACK_RATE * dt);
      }

      if (this.player.interactionProgress >= reqTime) {
        // Complete interaction
        if (this.player.interactionType === 'safe') {
          nearestInteractable.obj.opened = true;
          // Spawn loot from safe
          this.loots.push({
            x: nearestInteractable.obj.x + 20,
            y: nearestInteractable.obj.y + 20,
            type: 'gold',
            value: 3000,
            collected: false
          });
          audio.pickup();
        } else if (this.player.interactionType === 'terminal') {
          this.alarm = Math.max(0, this.alarm - CONFIG.ALARM_TERMINAL_REDUCE);
          // Darken nearest camera
          if (this.cameras.length > 0) {
            this.cameras[0].darkTimer = CONFIG.CAMERA_DARK_DURATION;
          }
          audio.pickup();
        }
        this.resetInteraction();
      }
    } else {
      this.resetInteraction();
    }

    // Loot collection (walk over)
    for (const loot of this.loots) {
      if (!loot.collected) {
        const dist = Math.hypot(loot.x - this.player.x, loot.y - this.player.y);
        if (dist < CONFIG.PLAYER_RADIUS + 15) {
          loot.collected = true;
          this.carriedLoot += loot.value;
          if (loot.type === 'cash') this.carriedWeight += CONFIG.WEIGHT_CASH;
          else if (loot.type === 'gold') this.carriedWeight += CONFIG.WEIGHT_GOLD;
          else if (loot.type === 'diamond') this.carriedWeight += CONFIG.WEIGHT_DIAMOND;
          audio.pickup();
        }
      }
    }

    // Update Cameras
    for (const cam of this.cameras) {
      if (cam.darkTimer > 0) {
        cam.darkTimer -= dt;
        continue;
      }
      cam.timer += dt * CONFIG.CAMERA_SWEEP_SPEED;
      cam.angle = cam.baseAngle + Math.sin(cam.timer) * (Math.PI / 4);

      const seen = isInVisionCone(this.player.x, this.player.y, cam.x, cam.y, cam.angle, CONFIG.CAMERA_VISION_RANGE, CONFIG.CAMERA_FOV) &&
                   hasLineOfSight(cam.x, cam.y, this.player.x, this.player.y, this.obstacles);
      if (seen) {
        sawPlayer = true;
        const rate = this.player.isSprinting ? CONFIG.ALARM_CAM_SEE_RATE * 1.5 : CONFIG.ALARM_CAM_SEE_RATE;
        this.alarm = Math.min(CONFIG.ALARM_MAX, this.alarm + rate * dt * 5);
      }
    }

    // Update Lasers
    for (const laser of this.lasers) {
      const cycle = (Date.now() / 1000 + laser.phase) % laser.period;
      laser.active = cycle < (laser.period / 2);

      if (laser.active) {
        // Check player intersection with line segment (laser)
        const dist = this.pointToSegmentDist(this.player.x, this.player.y, laser.x1, laser.y1, laser.x2, laser.y2);
        if (dist < CONFIG.PLAYER_RADIUS + 5) {
          this.alarm = Math.min(CONFIG.ALARM_MAX, this.alarm + CONFIG.ALARM_LASER_HIT);
          audio.alarm();
          // Slight stun/knockback
          this.player.x -= dx * 20;
          this.player.y -= dy * 20;
        }
      }
    }

    // Update Guards
    for (const guard of this.guards) {
      const guardSaw = guard.update(dt, this.player, this.obstacles, this.isAlarmActive);
      if (guardSaw) {
        sawPlayer = true;
        const rate = this.player.isSprinting ? CONFIG.ALARM_GUARD_SEE_RATE * 1.5 : CONFIG.ALARM_GUARD_SEE_RATE;
        this.alarm = Math.min(CONFIG.ALARM_MAX, this.alarm + rate * dt * 5);
      }

      // Check touch bust
      const touchDist = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (touchDist < CONFIG.PLAYER_RADIUS + 12) {
        this.gameOver = true;
        audio.lose();
      }
    }

    if (this.alarm >= CONFIG.ALARM_MAX) {
      if (!this.isAlarmActive) {
        this.isAlarmActive = true;
        audio.alarm();
      }
      this.escapeTimer -= dt;
      if (this.escapeTimer <= 0) {
        this.gameOver = true;
        audio.lose();
      }
    } else if (!sawPlayer && this.player.interactionType !== 'safe') {
      this.alarm = Math.max(0, this.alarm - CONFIG.ALARM_DECAY_RATE * dt);
    }

    // Check exit zone win condition
    if (this.exitZone && this.carriedLoot >= this.levelDef.targetLoot) {
      if (this.player.x >= this.exitZone.x && this.player.x <= this.exitZone.x + this.exitZone.w &&
          this.player.y >= this.exitZone.y && this.player.y <= this.exitZone.y + this.exitZone.h) {
        this.gameWon = true;
        audio.win();
      }
    }
  }

  resetInteraction() {
    this.player.interactionTarget = null;
    this.player.interactionProgress = 0;
    this.player.interactionType = null;
  }

  checkCollision(x, y, r) {
    for (const obs of this.obstacles) {
      const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
      const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
      const dist = Math.hypot(x - closestX, y - closestY);
      if (dist < r) return true;
    }
    return false;
  }

  pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }
}
