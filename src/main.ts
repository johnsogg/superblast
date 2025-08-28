import { Game } from './Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Could not find game canvas element');
}

// Set canvas size to fill the viewport
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize and start the game
const game = new Game(canvas);

console.log('Superblast game initialized!');

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.destroy();
});

export {};