// game/src/audio.js - Procedural Web Audio sound effects

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context error guard
    }
  }

  beep() {
    this.playTone(880, 0.1, 'sine', 0.15);
  }

  pickup() {
    this.playTone(1200, 0.12, 'triangle', 0.2);
    setTimeout(() => this.playTone(1600, 0.15, 'triangle', 0.2), 80);
  }

  crackTick() {
    this.playTone(400, 0.04, 'square', 0.08);
  }

  alarm() {
    this.playTone(440, 0.3, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(330, 0.3, 'sawtooth', 0.25), 300);
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.25, 'triangle', 0.25), i * 150);
    });
  }

  lose() {
    const notes = [300, 270, 240, 200];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, 'sawtooth', 0.25), i * 180);
    });
  }
}

export const audio = new AudioManager();
