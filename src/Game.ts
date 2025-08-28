import { GameBoard } from './GameBoard';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';
import { GameState, Position, Match, POINTS, DragState, MatchAnimation, MatchAnimationCopy } from './types';

export class Game {
  private board: GameBoard;
  private renderer: Renderer;
  // @ts-expect-error Used for event handling but not directly referenced
  private inputHandler: InputHandler;
  private state: GameState;
  private dragState: DragState | null = null;
  private canvas: HTMLCanvasElement;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.board = new GameBoard();
    this.renderer = new Renderer(canvas);
    
    this.state = {
      board: this.board.getBoard(),
      score: 0,
      selectedCell: null,
      isSwapping: false,
      swapAnimation: null,
      matchAnimations: [],
    };

    this.inputHandler = new InputHandler(canvas, this.renderer, {
      onCellClick: this.handleCellClick.bind(this),
      onCellDrag: this.handleCellDrag.bind(this),
      onDragUpdate: this.handleDragUpdate.bind(this),
    });

    this.setupResizeHandler();
    this.gameLoop();
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.renderer.calculateDimensions();
      this.render();
    });
  }

  private gameLoop(): void {
    this.updateAnimations();
    this.render();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private updateAnimations(): void {
    const now = performance.now();
    
    // Update swap animation
    if (this.state.swapAnimation) {
      const elapsed = now - this.state.swapAnimation.startTime;
      this.state.swapAnimation.progress = Math.min(elapsed / this.state.swapAnimation.duration, 1);

      if (this.state.swapAnimation.progress >= 1) {
        this.state.swapAnimation = null;
      }
    }
    
    // Update match animations
    this.state.matchAnimations = this.state.matchAnimations.filter(animation => {
      const elapsed = now - animation.startTime;
      animation.progress = Math.min(elapsed / animation.duration, 1);
      
      // Update positions of all copies
      animation.copies.forEach(copy => {
        this.updateCopyPosition(copy, animation.progress);
      });
      
      // Keep animation if not complete
      return animation.progress < 1;
    });
  }

  private render(): void {
    this.renderer.render(
      this.state.board,
      this.state.score,
      this.state.selectedCell,
      this.dragState,
      this.state.swapAnimation,
      this.state.matchAnimations
    );
  }

  private handleCellClick(position: Position): void {
    if (this.state.isSwapping) {
      return;
    }
    
    this.state.selectedCell = position;
    this.dragState = { from: position, to: null, mousePosition: null };
  }

  private async handleCellDrag(from: Position, to: Position): Promise<void> {
    if (this.state.isSwapping) {
      return;
    }

    console.log(`Attempting to swap (${from.x},${from.y}) with (${to.x},${to.y})`);
    
    this.state.isSwapping = true;
    this.state.selectedCell = null;
    this.dragState = null;

    // Attempt the swap
    const swapSuccessful = this.board.swapCells(from, to);
    
    if (swapSuccessful) {
      console.log('Swap successful');
      
      // Start swap animation
      this.state.swapAnimation = {
        from,
        to,
        progress: 0,
        startTime: performance.now(),
        duration: 300,
      };
      
      // Wait for animation to complete
      await this.waitForSwapAnimation();
      
      // Update board state after animation
      this.state.board = this.board.getBoard();
      
      // Check for matches
      const matches = this.board.findMatches();
      
      if (matches.length > 0) {
        console.log(`Found ${matches.length} matches, processing...`);
        // Process matches and update score
        await this.processMatches(matches);
      } else {
        console.log('No matches found, will revert after 1 second');
        // No matches found, wait 1 second then swap back with animation
        await this.delayedRevert(from, to);
      }
    } else {
      console.log('Swap failed - cells not adjacent');
    }

    this.state.isSwapping = false;
  }

  private async waitForSwapAnimation(): Promise<void> {
    return new Promise((resolve) => {
      const checkAnimation = () => {
        if (this.state.swapAnimation && this.state.swapAnimation.progress < 1) {
          requestAnimationFrame(checkAnimation);
        } else {
          resolve();
        }
      };
      checkAnimation();
    });
  }

  private async delayedRevert(originalFrom: Position, originalTo: Position): Promise<void> {
    // Wait 1 second before reverting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start revert animation
    this.state.swapAnimation = {
      from: originalTo,
      to: originalFrom,
      progress: 0,
      startTime: performance.now(),
      duration: 300,
    };
    
    // Revert the swap in the board logic
    this.board.swapCells(originalTo, originalFrom);
    
    // Wait for revert animation to complete
    await this.waitForSwapAnimation();
    
    // Update board state after animation
    this.state.board = this.board.getBoard();
    console.log('Swap reverted');
  }

  private handleDragUpdate(from: Position, to: Position | null, mousePos: { x: number; y: number } | null): void {
    if (this.state.isSwapping) {
      return;
    }
    
    // Update drag state for visual feedback
    if (to || mousePos) {
      this.dragState = { from, to, mousePosition: mousePos };
    } else {
      this.dragState = null;
    }
  }

  private async processMatches(matches: Match[]): Promise<void> {
    // Calculate score
    let totalScore = 0;
    matches.forEach(match => {
      if (match.length >= 5) {
        totalScore += POINTS.FIVE_IN_ROW;
      } else if (match.length === 4) {
        totalScore += POINTS.FOUR_IN_ROW;
      } else if (match.length === 3) {
        totalScore += POINTS.THREE_IN_ROW;
      }
    });

    this.state.score += totalScore;

    // Start match animations
    this.startMatchAnimations(matches);

    // Wait for match animations to complete
    await this.waitForMatchAnimations();

    // Remove matches and replace with new symbols
    this.board.removeMatches(matches);
    this.state.board = this.board.getBoard();

    // Check for new matches created by the refill
    const newMatches = this.board.findMatches();
    if (newMatches.length > 0) {
      // Recursively process new matches (cascade effect)
      await this.processMatches(newMatches);
    }
  }

  private startMatchAnimations(matches: Match[]): void {
    const now = performance.now();
    
    matches.forEach(match => {
      const copies: MatchAnimationCopy[] = [];
      
      // Create 4 copies for each matched position
      match.positions.forEach(pos => {
        const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
        
        edges.forEach(edge => {
          copies.push({
            startPosition: pos,
            currentPosition: { x: pos.x, y: pos.y },
            targetEdge: edge,
            symbol: match.symbol,
          });
        });
      });
      
      const matchAnimation: MatchAnimation = {
        copies,
        progress: 0,
        startTime: now,
        duration: 1000, // 1 second animation
      };
      
      this.state.matchAnimations.push(matchAnimation);
    });
  }

  private updateCopyPosition(copy: MatchAnimationCopy, progress: number): void {
    const easedProgress = this.easeInOutCubic(progress);
    const startX = copy.startPosition.x;
    const startY = copy.startPosition.y;
    
    let targetX: number;
    let targetY: number;
    
    // Calculate target position based on edge
    switch (copy.targetEdge) {
      case 'top':
        targetX = startX;
        targetY = -1; // Just outside the top edge
        break;
      case 'bottom':
        targetX = startX;
        targetY = 7; // Just outside the bottom edge (board is 7 high)
        break;
      case 'left':
        targetX = -1; // Just outside the left edge
        targetY = startY;
        break;
      case 'right':
        targetX = 9; // Just outside the right edge (board is 9 wide)
        targetY = startY;
        break;
    }
    
    // Interpolate position
    copy.currentPosition = {
      x: startX + (targetX - startX) * easedProgress,
      y: startY + (targetY - startY) * easedProgress,
    };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private async waitForMatchAnimations(): Promise<void> {
    return new Promise((resolve) => {
      const checkAnimations = () => {
        if (this.state.matchAnimations.length > 0) {
          requestAnimationFrame(checkAnimations);
        } else {
          resolve();
        }
      };
      checkAnimations();
    });
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public getScore(): number {
    return this.state.score;
  }

  public getBoard(): GameBoard {
    return this.board;
  }
}