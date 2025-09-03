import { SymbolType, Cell, Position, SYMBOL_COLORS, BOARD_WIDTH, BOARD_HEIGHT, DragState, SwapAnimation, MatchAnimation, PowerUpDragState } from './types';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = context;
    this.calculateDimensions();
  }

  public calculateDimensions(): void {
    const { width, height } = this.canvas;
    
    // Calculate cell size to fit the grid with some padding
    const availableWidth = width * 0.9; // 90% of canvas width
    const availableHeight = height * 0.9; // 90% of canvas height (no space needed for score)
    
    const cellWidth = availableWidth / BOARD_WIDTH;
    const cellHeight = availableHeight / BOARD_HEIGHT;
    
    this.cellSize = Math.min(cellWidth, cellHeight);
    
    // Center the grid
    const totalGridWidth = this.cellSize * BOARD_WIDTH;
    const totalGridHeight = this.cellSize * BOARD_HEIGHT;
    
    this.offsetX = (width - totalGridWidth) / 2;
    this.offsetY = (height - totalGridHeight) / 2;
  }

  public render(board: Cell[][], selectedCell: Position | null = null, dragInfo: DragState | null = null, swapAnimation: SwapAnimation | null = null, matchAnimations: MatchAnimation[] = [], greenCell: Position | null = null, powerUpDragState: PowerUpDragState | null = null): void {
    this.clearCanvas();
    this.renderGrid();
    this.renderBoard(board, selectedCell, dragInfo, swapAnimation, matchAnimations, greenCell);
    
    // Render match animations on top
    matchAnimations.forEach(animation => {
      this.renderMatchAnimation(animation, board);
    });
    
    // Render drag preview if dragging
    if (dragInfo) {
      this.renderDragPreview(dragInfo, board);
    }
    
    // Render power-up drag preview
    if (powerUpDragState) {
      this.renderPowerUpDragPreview(powerUpDragState);
    }
  }

  public getPositionFromPixel(pixelX: number, pixelY: number): Position | null {
    const gridX = pixelX - this.offsetX;
    const gridY = pixelY - this.offsetY;
    
    if (gridX < 0 || gridY < 0) {
      return null;
    }
    
    const cellX = Math.floor(gridX / this.cellSize);
    const cellY = Math.floor(gridY / this.cellSize);
    
    if (cellX >= 0 && cellX < BOARD_WIDTH && cellY >= 0 && cellY < BOARD_HEIGHT) {
      return { x: cellX, y: cellY };
    }
    
    return null;
  }

  private clearCanvas(): void {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }


  private renderGrid(): void {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    
    // Vertical lines
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      const pixelX = this.offsetX + x * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pixelX, this.offsetY);
      this.ctx.lineTo(pixelX, this.offsetY + BOARD_HEIGHT * this.cellSize);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      const pixelY = this.offsetY + y * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX, pixelY);
      this.ctx.lineTo(this.offsetX + BOARD_WIDTH * this.cellSize, pixelY);
      this.ctx.stroke();
    }
  }

  private renderBoard(board: Cell[][], selectedCell: Position | null, dragInfo: DragState | null = null, swapAnimation: SwapAnimation | null = null, matchAnimations: MatchAnimation[] = [], greenCell: Position | null = null): void {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];
        const position = { x, y };
        const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y;
        const isDraggedCell = dragInfo && dragInfo.from.x === x && dragInfo.from.y === y;
        const isGreenCell = greenCell && greenCell.x === x && greenCell.y === y;
        
        // Check if this cell is part of a match animation
        const isAnimatingMatch = matchAnimations.some(animation => 
          animation.copies.some(copy => copy.startPosition.x === x && copy.startPosition.y === y)
        );
        
        // Skip rendering the dragged cell in its original position during drag
        if (isDraggedCell && dragInfo.mousePosition) {
          continue;
        }
        
        // Skip rendering cells that are being animated for matches
        if (isAnimatingMatch) {
          continue;
        }
        
        // Calculate animated position if this cell is part of a swap animation
        let renderPosition = position;
        if (swapAnimation) {
          if (swapAnimation.from.x === x && swapAnimation.from.y === y) {
            renderPosition = this.getAnimatedPosition(swapAnimation.from, swapAnimation.to, swapAnimation.progress);
          } else if (swapAnimation.to.x === x && swapAnimation.to.y === y) {
            renderPosition = this.getAnimatedPosition(swapAnimation.to, swapAnimation.from, swapAnimation.progress);
          }
        }
        
        this.renderCell(cell, isSelected || false, renderPosition, isGreenCell || false);
      }
    }
  }

  private getAnimatedPosition(from: Position, to: Position, progress: number): Position {
    // Use easing function for smooth animation
    const easedProgress = this.easeInOutCubic(progress);
    
    return {
      x: from.x + (to.x - from.x) * easedProgress,
      y: from.y + (to.y - from.y) * easedProgress,
    };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private renderCell(cell: Cell, isSelected: boolean, renderPosition?: Position, isGreenCell: boolean = false): void {
    // Use renderPosition if provided, otherwise use cell's position
    const pos = renderPosition || cell.position;
    const pixelX = this.offsetX + pos.x * this.cellSize;
    const pixelY = this.offsetY + pos.y * this.cellSize;
    
    // Highlight green cell (free swap target)
    if (isGreenCell) {
      this.ctx.fillStyle = 'rgba(74, 222, 128, 0.6)';
      this.ctx.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
      this.ctx.strokeStyle = '#4ade80';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(pixelX, pixelY, this.cellSize, this.cellSize);
    }
    
    // Highlight selected cell
    if (isSelected) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
    }
    
    // Render symbol
    this.renderSymbol(cell.symbol, pixelX + this.cellSize / 2, pixelY + this.cellSize / 2);
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

  private renderDragPreview(dragInfo: DragState, board: Cell[][]): void {
    // Highlight the drag start cell with a stronger border
    const fromPixelX = this.offsetX + dragInfo.from.x * this.cellSize;
    const fromPixelY = this.offsetY + dragInfo.from.y * this.cellSize;
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(fromPixelX, fromPixelY, this.cellSize, this.cellSize);
    
    // Render the dragged cell at mouse position if available
    if (dragInfo.mousePosition) {
      const draggedCell = board[dragInfo.from.y][dragInfo.from.x];
      
      // Add a semi-transparent background to the dragged cell
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(
        dragInfo.mousePosition.x - this.cellSize / 2,
        dragInfo.mousePosition.y - this.cellSize / 2,
        this.cellSize,
        this.cellSize
      );
      
      // Render the symbol at mouse position
      this.renderSymbol(draggedCell.symbol, dragInfo.mousePosition.x, dragInfo.mousePosition.y);
    }
    
    // If dragging to a specific cell, highlight the target
    if (dragInfo.to) {
      const toPixelX = this.offsetX + dragInfo.to.x * this.cellSize;
      const toPixelY = this.offsetY + dragInfo.to.y * this.cellSize;
      
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(toPixelX, toPixelY, this.cellSize, this.cellSize);
    }
  }

  private renderMatchAnimation(animation: MatchAnimation, _board: Cell[][]): void {
    // Calculate opacity (fade from 1.0 to 0.0)
    const opacity = 1 - animation.progress;
    
    // Save current context state
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    
    animation.copies.forEach(copy => {
      // Convert grid position to pixel position
      const centerX = this.offsetX + copy.currentPosition.x * this.cellSize + this.cellSize / 2;
      const centerY = this.offsetY + copy.currentPosition.y * this.cellSize + this.cellSize / 2;
      
      // Scale to half size (half the area = sqrt(0.5) ≈ 0.707 scale)
      const scale = Math.sqrt(0.5);
      
      // Apply scaling transformation
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.scale(scale, scale);
      
      // Render the symbol at the scaled size
      this.renderSymbol(copy.symbol, 0, 0);
      
      this.ctx.restore();
    });
    
    // Restore context state
    this.ctx.restore();
  }

  private renderPowerUpDragPreview(powerUpDragState: PowerUpDragState): void {
    if (powerUpDragState.targetCell) {
      const pixelX = this.offsetX + powerUpDragState.targetCell.x * this.cellSize;
      const pixelY = this.offsetY + powerUpDragState.targetCell.y * this.cellSize;
      
      // Highlight target cell based on power-up type
      switch (powerUpDragState.powerUpType) {
        case 'free_swap':
          this.ctx.strokeStyle = '#4ade80';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(pixelX, pixelY, this.cellSize, this.cellSize);
          break;
        case 'clear_cells':
          // Highlight the 3x3 area around the target
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const x = powerUpDragState.targetCell.x + dx;
              const y = powerUpDragState.targetCell.y + dy;
              
              if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
                const cellPixelX = this.offsetX + x * this.cellSize;
                const cellPixelY = this.offsetY + y * this.cellSize;
                
                this.ctx.strokeStyle = '#eab308';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(cellPixelX, cellPixelY, this.cellSize, this.cellSize);
              }
            }
          }
          break;
        case 'symbol_swap':
          this.ctx.strokeStyle = '#8b5cf6';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(pixelX, pixelY, this.cellSize, this.cellSize);
          break;
      }
    }
  }
}