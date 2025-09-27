import { App } from './App';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Could not find game canvas element');
}

// Function to calculate and set canvas size based on available flexbox space
function setCanvasSize() {
  const gameContainer = document.getElementById('game-container');
  const uiColumn = document.getElementById('ui-column');
  
  if (!gameContainer || !uiColumn) {
    console.warn('Could not find game container or UI column for sizing');
    return;
  }
  
  // Get the actual available space for the canvas
  const containerRect = gameContainer.getBoundingClientRect();
  const uiColumnRect = uiColumn.getBoundingClientRect();
  
  // Calculate available canvas space considering padding, gaps, and UI column
  const containerPadding = 40; // 20px on each side
  const gap = 20; // gap between canvas and UI column
  const availableWidth = containerRect.width - uiColumnRect.width - gap - containerPadding;
  const availableHeight = containerRect.height - containerPadding;
  
  // Ensure minimum size and round to avoid sub-pixel issues
  const canvasWidth = Math.max(400, Math.floor(availableWidth));
  const canvasHeight = Math.max(300, Math.floor(availableHeight));
  
  // Set internal canvas dimensions
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // Set display size to match internal size to prevent coordinate issues
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  
  console.log(`Canvas sized: ${canvasWidth}x${canvasHeight} (available: ${availableWidth.toFixed(1)}x${availableHeight.toFixed(1)})`);
}

// Initial canvas sizing
setCanvasSize();

// Add resize observer to handle layout changes
let resizeTimeout: number | null = null;
const resizeObserver = new ResizeObserver(() => {
  // Debounce resize events to avoid excessive recalculations
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = window.setTimeout(() => {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    setCanvasSize();
    
    // Notify app if canvas size actually changed
    if (canvas.width !== oldWidth || canvas.height !== oldHeight) {
      app.handleCanvasResize();
    }
  }, 100);
});

// Observe the game container for size changes
const gameContainer = document.getElementById('game-container');
if (gameContainer) {
  resizeObserver.observe(gameContainer);
}

// Also observe window resizing
window.addEventListener('resize', () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = window.setTimeout(() => {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    setCanvasSize();
    
    if (canvas.width !== oldWidth || canvas.height !== oldHeight) {
      app.handleCanvasResize();
    }
  }, 100);
});

// Initialize the app (starts on home screen)
const app = new App(canvas);

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  resizeObserver.disconnect();
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  app.destroy();
});

export {};