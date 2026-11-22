// game/src/main.js - Main game loop, state machine, and initialization

import { CONFIG } from './config.js';
import { World } from './world.js';
import { InputHandler } from './input.js';
import { renderGame } from './render.js';
import { audio } from './audio.js';
import { stageShot } from './shots.js';
import { RNG } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.LOGICAL_WIDTH;
canvas.height = CONFIG.LOGICAL_HEIGHT;

const input = new InputHandler(canvas);
const world = new World(0);

let screenMode = 'TITLE'; // TITLE, PLAY, LEVELCLEAR, WIN, CAUGHT, PAUSED

// Parse URL query params (?shot=...&seed=...)
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = params.get('seed');
const rng = new RNG(seedParam ? parseInt(seedParam, 10) : 1);

if (shotName) {
  stageShot(shotName, world);
  screenMode = shotName === 'win' ? 'WIN' : 'PLAY';
}

let lastTime = performance.now();
const fixedStep = 1 / 60;
let accumulator = 0;
let firstFrameRendered = false;

function gameLoop(timestamp) {
  const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  accumulator += dt;
  while (accumulator >= fixedStep) {
    update(fixedStep);
    accumulator -= fixedStep;
  }

  render();

  if (!firstFrameRendered) {
    firstFrameRendered = true;
    window.__shotReady = true;
  }

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Global hotkeys
  if (input.isPressed('KeyM')) {
    audio.toggleMute();
  }
  if (input.isPressed('KeyR')) {
    world.loadLevel(world.levelIndex);
    screenMode = 'PLAY';
  }
  if (input.isPressed('KeyP')) {
    world.paused = !world.paused;
    screenMode = world.paused ? 'PAUSE' : 'PLAY';
  }

  if (screenMode === 'TITLE') {
    if (input.isPressed('Enter') || input.consumeClick()) {
      screenMode = 'PLAY';
      audio.init();
    }
  } else if (screenMode === 'PLAY') {
    if (!shotName) {
      world.update(dt, input);
    }
    if (world.gameOver) {
      screenMode = 'CAUGHT';
    } else if (world.gameWon) {
      screenMode = 'WIN';
    }
  } else if (screenMode === 'WIN' || screenMode === 'CAUGHT') {
    if (input.isPressed('Enter')) {
      if (screenMode === 'WIN' && world.levelIndex < 2) {
        world.levelIndex++;
        world.loadLevel(world.levelIndex);
        screenMode = 'PLAY';
      } else {
        world.loadLevel(0);
        screenMode = 'TITLE';
      }
    }
  }
}

function render() {
  renderGame(ctx, world, screenMode);
}

requestAnimationFrame(gameLoop);
