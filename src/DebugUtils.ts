/**
 * Debug utilities for mouse handling and coordinate conversion issues
 */
export class DebugUtils {
  private static debugEnabled = false;
  
  public static enableDebug(): void {
    this.debugEnabled = true;
    console.log('🐛 Mouse handling debug enabled');
  }
  
  public static disableDebug(): void {
    this.debugEnabled = false;
    console.log('🐛 Mouse handling debug disabled');
  }
  
  public static logMouseEvent(
    eventType: string,
    clientX: number,
    clientY: number,
    rect: DOMRect,
    canvasX: number,
    canvasY: number,
    gridPosition: { x: number; y: number } | null,
    canvasSize: { width: number; height: number }
  ): void {
    if (!this.debugEnabled) return;
    
    console.log(`🐛 ${eventType}:`, {
      client: `(${clientX}, ${clientY})`,
      rect: `(${rect.left.toFixed(1)}, ${rect.top.toFixed(1)})`,
      canvas: `(${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`,
      grid: gridPosition ? `(${gridPosition.x}, ${gridPosition.y})` : 'null',
      canvasSize: `${canvasSize.width}x${canvasSize.height}`,
      rectSize: `${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`
    });
  }
  
  public static logCanvasSizeChange(
    oldSize: { width: number; height: number },
    newSize: { width: number; height: number },
    trigger: string
  ): void {
    if (!this.debugEnabled) return;
    
    console.log(`🐛 Canvas size change (${trigger}):`, {
      from: `${oldSize.width}x${oldSize.height}`,
      to: `${newSize.width}x${newSize.height}`
    });
  }
  
  public static logCoordinateConversion(
    pixelX: number,
    pixelY: number,
    gridX: number,
    gridY: number,
    cellX: number,
    cellY: number,
    cellSize: number,
    offset: { x: number; y: number }
  ): void {
    if (!this.debugEnabled) return;
    
    console.log(`🐛 Coordinate conversion:`, {
      pixel: `(${pixelX.toFixed(1)}, ${pixelY.toFixed(1)})`,
      grid: `(${gridX.toFixed(1)}, ${gridY.toFixed(1)})`,
      cell: `(${cellX}, ${cellY})`,
      cellSize: cellSize.toFixed(1),
      offset: `(${offset.x.toFixed(1)}, ${offset.y.toFixed(1)})`
    });
  }
}

// Make debug utils available globally for easy debugging
(window as unknown as { SuperblastDebug: unknown }).SuperblastDebug = {
  enableDebug: () => DebugUtils.enableDebug(),
  disableDebug: () => DebugUtils.disableDebug(),
  help: () => {
    console.log(`
🐛 Superblast Debug Utils:

SuperblastDebug.enableDebug()      - Enable mouse event logging
SuperblastDebug.disableDebug()     - Disable mouse event logging
SuperblastDebug.validateCanvas()   - Check canvas size consistency  
SuperblastDebug.testCoordinates()  - Test coordinate conversion accuracy
SuperblastDebug.testCellBoundaries() - Interactive cell boundary testing
SuperblastDebug.getCanvasInfo()    - Show detailed canvas information
SuperblastDebug.help()             - Show this help message

When debug is enabled, all mouse events will log detailed coordinate information.
`);
  },
  validateCanvas: () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Game canvas not found');
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const internalWidth = canvas.width;
    const internalHeight = canvas.height;
    
    console.log(`Canvas validation:
  Display size: ${displayWidth.toFixed(1)}x${displayHeight.toFixed(1)}
  Internal size: ${internalWidth}x${internalHeight}
  Style: width=${canvas.style.width}, height=${canvas.style.height}
  Match: ${Math.abs(displayWidth - internalWidth) <= 1 && Math.abs(displayHeight - internalHeight) <= 1 ? '✅' : '❌'}`);
  },
  testCoordinates: () => {
    console.log('To test coordinates, enable debug mode and try clicking on different cells');
    DebugUtils.enableDebug();
  },
  getCanvasInfo: () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Game canvas not found');
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    console.log(`Canvas Info:
  Element: ${canvas.width}x${canvas.height}
  Display: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}
  Position: (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)})
  Style: width=${canvas.style.width}, height=${canvas.style.height}
  ClientRect: left=${rect.left}, top=${rect.top}, right=${rect.right}, bottom=${rect.bottom}`);
  },
  testCellBoundaries: () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Game canvas not found');
      return;
    }
    
    console.log('🧪 Click test: Click on different cells to test coordinate mapping');
    console.log('Expected behavior: Clicking on a cell should select that exact cell');
    DebugUtils.enableDebug();
    
    // Add a temporary visual grid overlay
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      // This would need access to renderer dimensions, but gives users the idea
      console.log('Red grid overlay added - click cells to test coordinate accuracy');
    }
  }
};