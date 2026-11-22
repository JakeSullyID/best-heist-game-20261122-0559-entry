// game/src/render.js - Canvas rendering for environment, entities, and UI

import { CONFIG } from './config.js';

export function renderGame(ctx, world, screenMode) {
  ctx.clearRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

  if (screenMode === 'TITLE') {
    renderTitleScreen(ctx);
    return;
  }

  // Draw Floor (Marble tile grid)
  ctx.fillStyle = CONFIG.COLORS.marbleLight;
  ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

  ctx.strokeStyle = CONFIG.COLORS.gridLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CONFIG.LOGICAL_WIDTH; x += CONFIG.TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CONFIG.LOGICAL_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CONFIG.LOGICAL_HEIGHT; y += CONFIG.TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.LOGICAL_WIDTH, y);
    ctx.stroke();
  }

  // Draw Exit Zone / Van
  if (world.exitZone) {
    ctx.fillStyle = CONFIG.COLORS.exitGlow;
    ctx.fillRect(world.exitZone.x, world.exitZone.y, world.exitZone.w, world.exitZone.h);
    
    ctx.fillStyle = CONFIG.COLORS.van;
    ctx.fillRect(world.exitZone.x + 4, world.exitZone.y + 8, world.exitZone.w - 8, world.exitZone.h - 16);
    ctx.fillStyle = CONFIG.COLORS.vanGlass;
    ctx.fillRect(world.exitZone.x + 8, world.exitZone.y + 12, 10, 16);
  }

  // Draw Obstacles / Walls
  for (const wall of world.walls) {
    ctx.fillStyle = CONFIG.COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = CONFIG.COLORS.wallTop;
    ctx.fillRect(wall.x + 2, wall.y + 2, wall.w - 4, wall.h - 4);
  }

  // Draw Safes
  for (const safe of world.safes) {
    ctx.fillStyle = CONFIG.COLORS.safe;
    ctx.fillRect(safe.x - 16, safe.y - 16, 32, 32);
    ctx.fillStyle = CONFIG.COLORS.safeDoor;
    ctx.fillRect(safe.x - 12, safe.y - 12, 24, 24);
    ctx.fillStyle = CONFIG.COLORS.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(safe.opened ? 'OPEN' : 'SAFE', safe.x, safe.y + 4);
  }

  // Draw Terminals
  for (const term of world.terminals) {
    ctx.fillStyle = CONFIG.COLORS.terminal;
    ctx.fillRect(term.x - 14, term.y - 14, 28, 28);
    ctx.fillStyle = CONFIG.COLORS.terminalScreen;
    ctx.fillRect(term.x - 10, term.y - 10, 20, 20);
  }

  // Draw Loot
  for (const loot of world.loots) {
    if (loot.collected) continue;
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, loot.type === 'diamond' ? 10 : 8, 0, Math.PI * 2);
    ctx.fillStyle = loot.type === 'diamond' ? CONFIG.COLORS.lootDiamond : (loot.type === 'gold' ? CONFIG.COLORS.lootGold : CONFIG.COLORS.lootCash);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  // Draw Lasers
  for (const laser of world.lasers) {
    if (!laser.active) continue;
    ctx.strokeStyle = CONFIG.COLORS.laser;
    ctx.lineWidth = 4;
    ctx.shadowColor = CONFIG.COLORS.laserGlow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y1);
    ctx.lineTo(laser.x2, laser.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw Cameras & Cones
  for (const cam of world.cameras) {
    ctx.fillStyle = cam.darkTimer > 0 ? CONFIG.COLORS.cameraDark : CONFIG.COLORS.camera;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
    ctx.fill();

    if (cam.darkTimer <= 0) {
      // Draw cone
      ctx.fillStyle = CONFIG.COLORS.cameraCone;
      ctx.beginPath();
      ctx.moveTo(cam.x, cam.y);
      const leftAngle = cam.angle - CONFIG.CAMERA_FOV / 2;
      const rightAngle = cam.angle + CONFIG.CAMERA_FOV / 2;
      ctx.arc(cam.x, cam.y, CONFIG.CAMERA_VISION_RANGE, leftAngle, rightAngle);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw Guards & Cones
  for (const guard of world.guards) {
    const coneColor = guard.state === 'ALERT' ? CONFIG.COLORS.guardConeAlert : CONFIG.COLORS.guardCone;
    ctx.fillStyle = coneColor;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    const leftAngle = guard.angle - CONFIG.GUARD_FOV / 2;
    const rightAngle = guard.angle + CONFIG.GUARD_FOV / 2;
    ctx.arc(guard.x, guard.y, CONFIG.GUARD_VISION_RANGE, leftAngle, rightAngle);
    ctx.closePath();
    ctx.fill();

    // Guard body
    ctx.fillStyle = guard.state === 'ALERT' ? CONFIG.COLORS.guardAlert : (guard.state === 'SUSPICIOUS' ? CONFIG.COLORS.guardSuspicious : CONFIG.COLORS.guard);
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Suspicion meter above guard
    if (guard.suspicion > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(guard.x - 20, guard.y - 28, 40, 6);
      ctx.fillStyle = guard.state === 'ALERT' ? '#ef4444' : '#f59e0b';
      ctx.fillRect(guard.x - 20, guard.y - 28, 40 * (guard.suspicion / 100), 6);
    }
  }

  // Draw Player (Thief)
  ctx.fillStyle = CONFIG.COLORS.playerSuit;
  ctx.beginPath();
  ctx.arc(world.player.x, world.player.y, CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Visible money bag if carriedLoot > 0
  if (world.carriedLoot > 0) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(world.player.x + 12, world.player.y + 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', world.player.x + 12, world.player.y + 13);
  }

  // Interaction progress ring
  if (world.player.interactionTarget) {
    const reqTime = world.player.interactionType === 'safe' ? CONFIG.SAFE_CRACK_TIME : CONFIG.TERMINAL_HACK_TIME;
    const prog = Math.min(1.0, world.player.interactionProgress / reqTime);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(world.player.x, world.player.y, CONFIG.PLAYER_RADIUS + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
    ctx.stroke();
  }

  // Draw HUD Top Bar
  renderHUD(ctx, world);

  if (screenMode === 'PAUSE' || world.paused) {
    renderOverlay(ctx, 'GAME PAUSED', 'Press P to resume, R to restart');
  } else if (screenMode === 'CAUGHT' || world.gameOver) {
    renderOverlay(ctx, 'BUSTED / TIME OUT', 'The heist failed. Press R to restart.');
  } else if (screenMode === 'WIN' || world.gameWon) {
    if (world.levelIndex >= 2) {
      renderOverlay(ctx, 'HEIST COMPLETE', `Total Loot: $${world.carriedLoot} — Press Enter to Restart`);
    } else {
      renderOverlay(ctx, 'LEVEL CLEAR!', 'Target reached! Press Enter for next level.');
    }
  }
}

function renderTitleScreen(ctx) {
  ctx.fillStyle = CONFIG.COLORS.bg;
  ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULT BREAK: The Midnight Job', CONFIG.LOGICAL_WIDTH / 2, CONFIG.LOGICAL_HEIGHT / 2 - 80);

  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('Crack safes, grab loot, dodge laser grids and guards, and reach the getaway van.', CONFIG.LOGICAL_WIDTH / 2, CONFIG.LOGICAL_HEIGHT / 2 - 20);

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press ENTER to Start Heist', CONFIG.LOGICAL_WIDTH / 2, CONFIG.LOGICAL_HEIGHT / 2 + 60);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px sans-serif';
  ctx.fillText('Controls: WASD / Arrows to Move | Shift to Sprint | E to Interact | P Pause | R Restart | M Mute', CONFIG.LOGICAL_WIDTH / 2, CONFIG.LOGICAL_HEIGHT / 2 + 130);
}

function renderHUD(ctx, world) {
  ctx.fillStyle = CONFIG.COLORS.hudBg;
  ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, 50);

  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Level: ${world.levelDef.name}`, 20, 31);

  ctx.fillText(`Loot: $${world.carriedLoot} / Target: $${world.levelDef.targetLoot}`, 260, 31);

  const mins = Math.floor(world.timeRemaining / 60);
  const secs = Math.floor(world.timeRemaining % 60);
  const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  ctx.fillText(`Time: ${timeStr}`, 580, 31);

  // Alarm meter
  ctx.fillText('Alarm:', 740, 31);
  ctx.fillStyle = '#374151';
  ctx.fillRect(800, 16, 200, 18);
  const alarmRatio = world.alarm / CONFIG.ALARM_MAX;
  ctx.fillStyle = alarmRatio > 0.7 ? '#ef4444' : (alarmRatio > 0.3 ? '#f59e0b' : '#22c55e');
  ctx.fillRect(800, 16, 200 * alarmRatio, 18);

  if (world.isAlarmActive) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`ESCAPE: ${Math.ceil(world.escapeTimer)}s`, 1020, 31);
  }
}

function renderOverlay(ctx, title, subtitle) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CONFIG.LOGICAL_WIDTH / 2, CONFIG.LOGICAL_HEIGHT / 2 - 30);

  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(subtitle, CONFIG.LOGICAL_WIDTH / 2, CONFIG.LOGICAL_HEIGHT / 2 + 20);
}
