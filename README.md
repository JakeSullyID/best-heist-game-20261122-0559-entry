[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/JakeSullyID/best-heist-game-20261122-0559-entry/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/JakeSullyID/best-heist-game-20261122-0559-entry/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/reward?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# VAULT BREAK: The Midnight Job

An original, top-down 2D canvas heist game built for the make.fun bounty.

## Overview
In **VAULT BREAK**, you play as a master thief executing precision heists across 3 escalating bank levels:
1. **The Bank Lobby** (Target: $2,000)
2. **The Vault Hall** (Target: $5,000)
3. **The Diamond Vault** (Target: $12,000)

## Controls
- **WASD / Arrow Keys**: Move thief.
- **Shift**: Sprint (faster movement, but faster guard detection).
- **E (Hold)**: Interact — crack safes or hack camera terminals.
- **P**: Pause game.
- **R**: Restart level.
- **M**: Mute / unmute procedural audio.
- **Enter**: Start game / confirm level transition.

## Heist Mechanics
- **Safe Cracking**: Stand next to a safe and hold E for ~3 seconds. Alarm rises while cracking. Opening a safe spills gold/loot.
- **Laser Grids**: Red beams toggle on and off. Crossing them triggers alarm and stuns the thief.
- **Loot Weight**: Carrying heavier loot (cash +1, gold +2, diamond +4) reduces movement speed (down to 60%). Choose greed vs. speed!
- **Terminals & Cameras**: Cameras sweep back and forth with vision cones. Hacking wall terminals darkens nearby cameras for 12 seconds and reduces the alarm.
- **Alarm Meter**: Rises when seen by guards/cameras or hitting lasers. At 100, a 15-second escape countdown begins—reach the getaway van or get busted!

## Files
- `game/index.html` - Game page container
- `game/src/config.js` - Tuning parameters & colors
- `game/src/random.js` - Seeded mulberry32 PRNG
- `game/src/input.js` - Keyboard & mouse input handler
- `game/src/vision.js` - Raycasting & vision cone logic
- `game/src/levels.js` - Level ASCII maps & waypoints
- `game/src/guards.js` - Guard AI patrol, suspicion & alert states
- `game/src/audio.js` - WebAudio procedural sound synthesizer
- `game/src/world.js` - Game state, collision & mechanics
- `game/src/render.js` - Canvas drawing engine & HUD/screens
- `game/src/shots.js` - Staging deterministic screenshot scenes
- `game/src/main.js` - Main game loop & state machine
- `serve.ts` - Local HTTP static server
- `main.ts` - Build script copying game/ and writing dossier.json
