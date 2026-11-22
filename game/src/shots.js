// game/src/shots.js - Staging deterministic scenes for screenshots

export function stageShot(name, world) {
  if (name === 'cover') {
    world.loadLevel(0);
    world.player.x = 280;
    world.player.y = 120;
    world.carriedLoot = 2500;
    world.alarm = 35;
    if (world.guards.length > 0) {
      world.guards[0].x = 440;
      world.guards[0].y = 120;
      world.guards[0].angle = Math.PI;
      world.guards[0].state = 'SUSPICIOUS';
      world.guards[0].suspicion = 35;
    }
    if (world.cameras.length > 0) {
      world.cameras[0].angle = -Math.PI / 4;
    }
    world.loots.push({
      x: 360,
      y: 120,
      type: 'diamond',
      value: 8000,
      collected: false
    });
  } else if (name === 'nearmiss') {
    world.loadLevel(0);
    world.player.x = 200;
    world.player.y = 220;
    if (world.guards.length > 0) {
      world.guards[0].x = 320;
      world.guards[0].y = 220;
      world.guards[0].angle = Math.PI;
      world.guards[0].suspicion = 45;
      world.guards[0].state = 'SUSPICIOUS';
    }
  } else if (name === 'alert') {
    world.loadLevel(1);
    world.player.x = 300;
    world.player.y = 300;
    world.alarm = 92;
    world.isAlarmActive = true;
    if (world.guards.length > 0) {
      world.guards[0].x = 380;
      world.guards[0].y = 300;
      world.guards[0].state = 'ALERT';
    }
  } else if (name === 'win') {
    world.loadLevel(2);
    world.carriedLoot = 15000;
    world.player.x = 1220;
    world.player.y = 60;
    world.gameWon = true;
  }
}
