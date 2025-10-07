import { SymbolType, Cell, Position, SYMBOL_COLORS, TUTORIAL_BOARD_WIDTH, TUTORIAL_BOARD_HEIGHT, DragState, SwapAnimation, MatchAnimation, PowerUpDragState } from './types';

export class TutorialRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private boardWidth: number;
  private boardHeight: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.boardWidth = TUTORIAL_BOARD_WIDTH;
    this.boardHeight = TUTORIAL_BOARD_HEIGHT;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = context;
    this.calculateDimensions();
  }

  public calculateDimensions(): void {
    const { width, height } = this.canvas;
    
    // Validate canvas dimensions
    if (width <= 0 || height <= 0) {
      console.warn(`Invalid tutorial canvas dimensions: ${width}x${height}`);
      return;
    }
    
    // Calculate cell size to fit the tutorial grid with some padding
    const availableWidth = width * 0.9; // 90% of canvas width
    const availableHeight = height * 0.9; // 90% of canvas height
    
    const cellWidth = availableWidth / this.boardWidth;
    const cellHeight = availableHeight / this.boardHeight;
    
    this.cellSize = Math.min(cellWidth, cellHeight);
    
    // Center the grid
    const totalGridWidth = this.cellSize * this.boardWidth;
    const totalGridHeight = this.cellSize * this.boardHeight;
    
    this.offsetX = (width - totalGridWidth) / 2;
    this.offsetY = (height - totalGridHeight) / 2;
    
    console.log(`Tutorial Renderer dimensions: canvas=${width}x${height}, cellSize=${this.cellSize.toFixed(2)}, offset=(${this.offsetX.toFixed(2)}, ${this.offsetY.toFixed(2)})`);
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawBoard(board: Cell[][]): void {
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        if (board[y] && board[y][x]) {
          this.drawCell({ x, y }, board[y][x].symbol);
        }
      }
    }
  }

  public drawCell(position: Position, symbol: SymbolType): void {
    const screenPos = this.boardToScreen(position);
    
    // Draw cell background
    this.ctx.fillStyle = '#1f2937';
    this.ctx.fillRect(
      screenPos.x,
      screenPos.y,
      this.cellSize,
      this.cellSize
    );
    
    // Draw cell border
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      screenPos.x,
      screenPos.y,
      this.cellSize,
      this.cellSize
    );
    
    // Draw the symbol in the center of the cell
    const centerX = screenPos.x + this.cellSize / 2;
    const centerY = screenPos.y + this.cellSize / 2;
    this.renderSymbol(symbol, centerX, centerY);
  }

  public drawSelectedCell(position: Position): void {
    const screenPos = this.boardToScreen(position);
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      screenPos.x + 1.5,
      screenPos.y + 1.5,
      this.cellSize - 3,
      this.cellSize - 3
    );
  }

  public drawHighlightedCells(positions: Position[]): void {
    positions.forEach(position => {
      const screenPos = this.boardToScreen(position);
      
      // Draw pulsing highlight
      this.ctx.strokeStyle = '#60a5fa';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(
        screenPos.x + 2,
        screenPos.y + 2,
        this.cellSize - 4,
        this.cellSize - 4
      );
      
      // Add semi-transparent overlay
      this.ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
      this.ctx.fillRect(
        screenPos.x + 2,
        screenPos.y + 2,
        this.cellSize - 4,
        this.cellSize - 4
      );
    });
  }

  public drawDragState(dragState: DragState): void {
    if (!dragState.to || !dragState.mousePosition) {
      return;
    }

    const fromScreen = this.boardToScreen(dragState.from);
    const toScreen = this.boardToScreen(dragState.to);
    
    // Draw line between cells
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(
      fromScreen.x + this.cellSize / 2,
      fromScreen.y + this.cellSize / 2
    );
    this.ctx.lineTo(
      toScreen.x + this.cellSize / 2,
      toScreen.y + this.cellSize / 2
    );
    this.ctx.stroke();
    
    // Highlight target cell
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      toScreen.x + 1.5,
      toScreen.y + 1.5,
      this.cellSize - 3,
      this.cellSize - 3
    );
  }

  public drawSwapAnimation(animation: SwapAnimation, board: Cell[][]): void {
    const fromCell = board[animation.from.y][animation.from.x];
    const toCell = board[animation.to.y][animation.to.x];
    
    const fromScreen = this.boardToScreen(animation.from);
    const toScreen = this.boardToScreen(animation.to);
    
    const progress = this.easeInOut(animation.progress);
    
    // Calculate current positions for animating symbols
    const fromCurrentX = fromScreen.x + (toScreen.x - fromScreen.x) * progress;
    const fromCurrentY = fromScreen.y + (toScreen.y - fromScreen.y) * progress;
    
    const toCurrentX = toScreen.x + (fromScreen.x - toScreen.x) * progress;
    const toCurrentY = toScreen.y + (fromScreen.y - toScreen.y) * progress;
    
    // Draw cell backgrounds
    this.ctx.fillStyle = '#1f2937';
    this.ctx.fillRect(fromCurrentX, fromCurrentY, this.cellSize, this.cellSize);
    this.ctx.fillRect(toCurrentX, toCurrentY, this.cellSize, this.cellSize);
    
    // Draw cell borders
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(fromCurrentX, fromCurrentY, this.cellSize, this.cellSize);
    this.ctx.strokeRect(toCurrentX, toCurrentY, this.cellSize, this.cellSize);
    
    // Draw animating symbols
    const fromCenterX = fromCurrentX + this.cellSize / 2;
    const fromCenterY = fromCurrentY + this.cellSize / 2;
    this.renderSymbol(fromCell.symbol, fromCenterX, fromCenterY);
    
    const toCenterX = toCurrentX + this.cellSize / 2;
    const toCenterY = toCurrentY + this.cellSize / 2;
    this.renderSymbol(toCell.symbol, toCenterX, toCenterY);
  }

  public drawMatchAnimation(animation: MatchAnimation): void {
    animation.copies.forEach(copy => {
      this.ctx.globalAlpha = 1 - animation.progress;
      
      // Scale down the symbol during animation
      const symbolSize = this.cellSize * 0.6 * (1 - animation.progress * 0.5);
      const originalCellSize = this.cellSize;
      
      // Temporarily adjust cellSize for symbol rendering
      this.cellSize = symbolSize;
      
      this.renderSymbol(copy.symbol, copy.currentPosition.x, copy.currentPosition.y);
      
      // Restore original cellSize
      this.cellSize = originalCellSize;
    });
    
    this.ctx.globalAlpha = 1;
  }

  public drawPowerUpDrag(dragState: PowerUpDragState): void {
    if (!dragState.targetCell) {
      return;
    }

    const targetScreen = this.boardToScreen(dragState.targetCell);
    
    // Highlight target cell
    this.ctx.strokeStyle = '#4ade80';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      targetScreen.x + 1.5,
      targetScreen.y + 1.5,
      this.cellSize - 3,
      this.cellSize - 3
    );
  }

  public drawGreenCell(position: Position): void {
    const screenPos = this.boardToScreen(position);
    
    this.ctx.fillStyle = 'rgba(74, 222, 128, 0.6)';
    this.ctx.fillRect(
      screenPos.x + 2,
      screenPos.y + 2,
      this.cellSize - 4,
      this.cellSize - 4
    );
    
    this.ctx.strokeStyle = '#4ade80';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      screenPos.x + 1.5,
      screenPos.y + 1.5,
      this.cellSize - 3,
      this.cellSize - 3
    );
  }

  public boardToScreen(position: Position): { x: number; y: number } {
    return {
      x: this.offsetX + position.x * this.cellSize,
      y: this.offsetY + position.y * this.cellSize,
    };
  }

  public screenToBoard(screenX: number, screenY: number): Position | null {
    const boardX = Math.floor((screenX - this.offsetX) / this.cellSize);
    const boardY = Math.floor((screenY - this.offsetY) / this.cellSize);
    
    if (boardX >= 0 && boardX < this.boardWidth &&
        boardY >= 0 && boardY < this.boardHeight) {
      return { x: boardX, y: boardY };
    }
    
    return null;
  }

  public getEdgePosition(edge: 'top' | 'bottom' | 'left' | 'right'): { x: number; y: number } {
    const { width, height } = this.canvas;
    
    switch (edge) {
      case 'top':
        return { x: width / 2, y: 0 };
      case 'bottom':
        return { x: width / 2, y: height };
      case 'left':
        return { x: 0, y: height / 2 };
      case 'right':
        return { x: width, y: height / 2 };
    }
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private renderSymbol(symbol: SymbolType, centerX: number, centerY: number): void {
    const size = this.cellSize * 0.6;
    const radius = size / 2;
    
    this.ctx.fillStyle = SYMBOL_COLORS[symbol];
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    
    switch (symbol) {
      case SymbolType.LEAF:
        this.renderLeaf(centerX, centerY, radius);
        break;
      case SymbolType.SNOWFLAKE:
        this.renderSnowflake(centerX, centerY, radius);
        break;
      case SymbolType.FIRE:
        this.renderFire(centerX, centerY, radius);
        break;
      case SymbolType.RAINDROP:
        this.renderRaindrop(centerX, centerY, radius);
        break;
      case SymbolType.LIGHTNING:
        this.renderLightning(centerX, centerY, radius);
        break;
    }
  }

  private renderLeaf(x: number, y: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.ellipse(x - radius/4, y, radius * 0.8, radius * 1.2, -Math.PI/6, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Leaf vein
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#2d5016';
    this.ctx.lineWidth = 3;
    this.ctx.moveTo(x - radius/2, y + radius);
    this.ctx.lineTo(x, y - radius/2);
    this.ctx.stroke();
  }

  private renderSnowflake(x: number, y: number, radius: number): void {
    const spokes = 6;
    this.ctx.strokeStyle = SYMBOL_COLORS[SymbolType.SNOWFLAKE];
    this.ctx.lineWidth = 4;
    
    for (let i = 0; i < spokes; i++) {
      const angle = (i * Math.PI * 2) / spokes;
      const startX = x + Math.cos(angle) * radius * 0.3;
      const startY = y + Math.sin(angle) * radius * 0.3;
      const endX = x + Math.cos(angle) * radius;
      const endY = y + Math.sin(angle) * radius;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
  }

  private renderFire(x: number, y: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - radius);
    this.ctx.bezierCurveTo(x - radius/2, y - radius/2, x - radius/2, y + radius/2, x, y + radius);
    this.ctx.bezierCurveTo(x + radius/2, y + radius/2, x + radius/2, y - radius/2, x, y - radius);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private renderRaindrop(x: number, y: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y + radius/3, radius * 0.7, 0, Math.PI, false);
    this.ctx.bezierCurveTo(x - radius * 0.7, y + radius/3, x - radius/4, y - radius, x, y - radius);
    this.ctx.bezierCurveTo(x + radius/4, y - radius, x + radius * 0.7, y + radius/3, x + radius * 0.7, y + radius/3);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private renderLightning(x: number, y: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x - radius/3, y - radius);
    this.ctx.lineTo(x + radius/4, y - radius/4);
    this.ctx.lineTo(x - radius/6, y - radius/4);
    this.ctx.lineTo(x + radius/3, y + radius);
    this.ctx.lineTo(x - radius/4, y + radius/4);
    this.ctx.lineTo(x + radius/6, y + radius/4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  public validateCanvasSize(): boolean {
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const internalWidth = this.canvas.width;
    const internalHeight = this.canvas.height;
    
    // Check if display size matches internal size (allowing for small rounding differences)
    const widthMismatch = Math.abs(displayWidth - internalWidth) > 1;
    const heightMismatch = Math.abs(displayHeight - internalHeight) > 1;
    
    if (widthMismatch || heightMismatch) {
      console.warn(`Tutorial canvas size mismatch! Display: ${displayWidth.toFixed(1)}x${displayHeight.toFixed(1)}, Internal: ${internalWidth}x${internalHeight}`);
      return false;
    }
    
    return true;
  }
}