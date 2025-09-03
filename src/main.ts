import { Game } from './Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Could not find game canvas element');
}

// Set canvas size to account for UI column (280px + 20px gap = 300px)
const uiColumnWidth = 300;
canvas.width = Math.max(400, window.innerWidth - uiColumnWidth);
canvas.height = window.innerHeight;

// Initialize and start the game
const game = new Game(canvas);

console.log('Superblast game initialized!');

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.destroy();
});

export {};