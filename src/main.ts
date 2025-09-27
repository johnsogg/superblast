import { App } from './App';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Could not find game canvas element');
}

// Set canvas size to account for UI column (280px + 20px gap = 300px)
const uiColumnWidth = 300;
const canvasWidth = Math.max(400, window.innerWidth - uiColumnWidth);
const canvasHeight = window.innerHeight;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Ensure canvas display size matches internal size to prevent coordinate issues
canvas.style.width = `${canvasWidth}px`;
canvas.style.height = `${canvasHeight}px`;

// Initialize the app (starts on home screen)
const app = new App(canvas);

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});

export {};