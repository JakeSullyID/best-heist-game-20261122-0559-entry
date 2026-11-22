// game/src/vision.js - Vision cones and line-of-sight check against walls

export function hasLineOfSight(x1, y1, x2, y2, obstacles) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return true;

  const steps = Math.ceil(dist / 15);
  const stepX = dx / steps;
  const stepY = dy / steps;

  let cx = x1;
  let cy = y1;

  for (let i = 0; i < steps; i++) {
    cx += stepX;
    cy += stepY;
    // Check collision with any obstacle box
    for (const obs of obstacles) {
      if (cx >= obs.x && cx <= obs.x + obs.w && cy >= obs.y && cy <= obs.y + obs.h) {
        return false;
      }
    }
  }
  return true;
}

export function isInVisionCone(px, py, ex, ey, facingAngle, range, fov) {
  const dx = px - ex;
  const dy = py - ey;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;

  const angleToTarget = Math.atan2(dy, dx);
  let angleDiff = angleToTarget - facingAngle;

  // Normalize angleDiff to -PI to PI
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  return Math.abs(angleDiff) <= fov / 2;
}
