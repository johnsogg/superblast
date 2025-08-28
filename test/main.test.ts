import { describe, it, expect, beforeEach } from 'vitest';

describe('Main game initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '<canvas id="game-canvas"></canvas>';
  });

  it('should find the canvas element', () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('should get 2D rendering context', () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeTruthy();
  });
});