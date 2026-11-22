// game/src/config.js - Game configuration, tuning constants, and color palette

export const CONFIG = {
  LOGICAL_WIDTH: 1280,
  LOGICAL_HEIGHT: 720,
  TILE_SIZE: 40,
  
  // Player
  PLAYER_SPEED: 220, // pixels per second
  PLAYER_SPRINT_MULT: 1.5,
  PLAYER_RADIUS: 14,
  INTERACT_RANGE: 48,
  
  // Safe cracking & Terminals
  SAFE_CRACK_TIME: 3.0, // seconds
  TERMINAL_HACK_TIME: 2.0, // seconds
  
  // Alarm & Escape
  ALARM_MAX: 100,
  ALARM_GUARD_SEE_RATE: 8, // per second
  ALARM_CAM_SEE_RATE: 6, // per second
  ALARM_LASER_HIT: 15,
  ALARM_CRACK_RATE: 8, // per second
  ALARM_DECAY_RATE: 2.0, // per second
  ALARM_TERMINAL_REDUCE: 20,
  ESCAPE_COUNTDOWN: 15.0, // seconds when alarm hits 100
  
  // Camera & Guards
  CAMERA_SWEEP_SPEED: 1.2, // radians per second or angle sweep speed
  CAMERA_DARK_DURATION: 12.0, // seconds hacked dark
  GUARD_PATROL_SPEED: 90,
  GUARD_SUSPICIOUS_SPEED: 110,
  GUARD_ALERT_SPEED: 180,
  GUARD_VISION_RANGE: 260,
  GUARD_FOV: Math.PI * 0.45, // ~81 degrees
  CAMERA_VISION_RANGE: 220,
  CAMERA_FOV: Math.PI * 0.5,
  
  // Loot weights
  WEIGHT_CASH: 1,
  WEIGHT_GOLD: 2,
  WEIGHT_DIAMOND: 4,
  MIN_SPEED_MULT: 0.6,
  
  // Colors (Marble theme)
  COLORS: {
    bg: '#1a1d24',
    marbleLight: '#f4f1ea',
    marbleDark: '#e3ded3',
    gridLine: '#d5cfc1',
    wall: '#2d333b',
    wallTop: '#1f242b',
    desk: '#4a3525',
    deskTop: '#5c432f',
    felt: '#1e4d2b',
    player: '#111827',
    playerSuit: '#38bdf8',
    guard: '#b91c1c',
    guardSuspicious: '#d97706',
    guardAlert: '#991b1b',
    guardCone: 'rgba(251, 191, 36, 0.18)',
    guardConeAlert: 'rgba(239, 68, 68, 0.25)',
    camera: '#3b82f6',
    cameraCone: 'rgba(59, 130, 246, 0.18)',
    cameraDark: '#4b5563',
    laser: '#ef4444',
    laserGlow: 'rgba(239, 68, 68, 0.4)',
    safe: '#9ca3af',
    safeDoor: '#6b7280',
    terminal: '#06b6d4',
    terminalScreen: '#22d3ee',
    lootCash: '#10b981',
    lootGold: '#f59e0b',
    lootDiamond: '#38bdf8',
    exit: '#22c55e',
    exitGlow: 'rgba(34, 197, 94, 0.35)',
    van: '#15803d',
    vanGlass: '#93c5fd',
    text: '#f9fafb',
    hudBg: 'rgba(15, 23, 42, 0.85)',
  }
};
