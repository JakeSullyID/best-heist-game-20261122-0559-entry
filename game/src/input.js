// game/src/input.js - Keyboard and mouse input manager

export class InputHandler {
  constructor(canvas) {
    this.keys = {};
    this.keysPressed = {};
    this.mouse = { x: 0, y: 0, clickX: 0, clickY: 0, clicked: false, down: false };
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }
      if (!this.keys[code]) {
        this.keysPressed[code] = true;
      }
      this.keys[code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.clickX = (e.clientX - rect.left) * scaleX;
      this.mouse.clickY = (e.clientY - rect.top) * scaleY;
      this.mouse.clicked = true;
      this.mouse.down = true;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isPressed(code) {
    const val = !!this.keysPressed[code];
    this.keysPressed[code] = false;
    return val;
  }

  consumeClick() {
    const clicked = this.mouse.clicked;
    this.mouse.clicked = false;
    return clicked ? { x: this.mouse.clickX, y: this.mouse.clickY } : null;
  }
}
