import { GameBoard } from './GameBoard';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';
import { AudioUtils } from './AudioUtils';
import { GameState, Position, Match, POINTS, DragState, MatchAnimation, MatchAnimationCopy, LEVEL_DENOMINATORS, MATCH_PROGRESS_NUMERATORS, PopupAction, PowerUpType } from './types';

export class Game {
  private board: GameBoard;
  private renderer: Renderer;
  // @ts-expect-error Used for event handling but not directly referenced
  private inputHandler: InputHandler;
  private audioUtils: AudioUtils;
  private state: GameState;
  private dragState: DragState | null = null;
  private canvas: HTMLCanvasElement;
  private animationId: number | null = null;
  private scoreElement: HTMLElement;
  private timerElement: HTMLElement;
  private progressBarElement: HTMLElement;
  private levelCompletionModalElement: HTMLElement;
  private powerUpElements: {
    freeSwap: HTMLElement;
    clearCells: HTMLElement;
    symbolSwap: HTMLElement;
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.board = new GameBoard();
    this.renderer = new Renderer(canvas);
    this.audioUtils = new AudioUtils();
    
    this.state = {
      board: this.board.getBoard(),
      score: 0,
      selectedCell: null,
      isSwapping: false,
      swapAnimation: null,
      matchAnimations: [],
      timer: {
        timeRemaining: 120000, // 2 minutes in milliseconds
        isActive: true,
        startTime: performance.now(),
      },
      level: {
        currentLevel: 1,
        progress: 0,
        progressDenominator: LEVEL_DENOMINATORS[1],
      },
      showLevelCompletionPopup: false,
      powerUps: [
        { type: PowerUpType.FREE_SWAP, count: 0 },
        { type: PowerUpType.CLEAR_CELLS, count: 0 },
        { type: PowerUpType.SYMBOL_SWAP, count: 0 },
      ],
      powerUpDragState: null,
      activePowerUp: null,
      greenCell: null,
    };

    // Get UI elements
    this.scoreElement = document.getElementById('score-display')!;
    this.timerElement = document.getElementById('timer-display')!;
    this.progressBarElement = document.getElementById('progress-bar')!;
    this.levelCompletionModalElement = document.getElementById('level-completion-modal')!;
    
    this.powerUpElements = {
      freeSwap: document.getElementById('free-swap-count')!,
      clearCells: document.getElementById('clear-cells-count')!,
      symbolSwap: document.getElementById('symbol-swap-count')!,
    };
    
    if (!this.scoreElement || !this.timerElement || !this.progressBarElement || !this.levelCompletionModalElement) {
      throw new Error('Could not find required UI elements');
    }
    
    if (!this.powerUpElements.freeSwap || !this.powerUpElements.clearCells || !this.powerUpElements.symbolSwap) {
      throw new Error('Could not find required power-up UI elements');
    }

    // Set up modal button event listeners
    this.setupModalEventListeners();

    this.inputHandler = new InputHandler(canvas, this.renderer, {
      onCellClick: this.handleCellClick.bind(this),
      onCellDrag: this.handleCellDrag.bind(this),
      onDragUpdate: this.handleDragUpdate.bind(this),
      onPowerUpDrag: this.handlePowerUpDrag.bind(this),
      onPowerUpDragUpdate: this.handlePowerUpDragUpdate.bind(this),
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
    this.updateTimer();
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
      this.state.selectedCell,
      this.dragState,
      this.state.swapAnimation,
      this.state.matchAnimations,
      this.state.greenCell,
      this.state.powerUpDragState
    );
    this.updateUI();
  }

  private async handleCellClick(position: Position): Promise<void> {
    if (this.state.isSwapping) {
      return;
    }
    
    // Handle free swap power-up click
    if (this.state.activePowerUp === PowerUpType.FREE_SWAP && this.state.greenCell) {
      console.log(`Free swap: swapping green cell (${this.state.greenCell.x},${this.state.greenCell.y}) with clicked cell (${position.x},${position.y})`);
      
      this.state.isSwapping = true;
      this.state.selectedCell = null;
      this.dragState = null;

      // Force swap regardless of adjacency or match potential
      this.board.forceSwapCells(this.state.greenCell, position);
      
      // Clear free swap state
      this.state.activePowerUp = null;
      this.state.greenCell = null;
      
      this.state.board = this.board.getBoard();
      
      // Check for matches after free swap
      const matches = this.board.findMatches();
      if (matches.length > 0) {
        await this.processMatches(matches, true, true);
      }
      
      this.state.isSwapping = false;
      return;
    }
    
    this.state.selectedCell = position;
    this.dragState = { from: position, to: null, mousePosition: null };
  }

  private async handleCellDrag(from: Position, to: Position): Promise<void> {
    if (this.state.isSwapping) {
      return;
    }

    // Handle free swap power-up
    if (this.state.activePowerUp === PowerUpType.FREE_SWAP && this.state.greenCell) {
      console.log(`Free swap: swapping green cell (${this.state.greenCell.x},${this.state.greenCell.y}) with (${to.x},${to.y})`);
      
      this.state.isSwapping = true;
      this.state.selectedCell = null;
      this.dragState = null;

      // Force swap regardless of adjacency or match potential
      this.board.forceSwapCells(this.state.greenCell, to);
      
      // Clear free swap state
      this.state.activePowerUp = null;
      this.state.greenCell = null;
      
      this.state.board = this.board.getBoard();
      
      // Check for matches after free swap
      const matches = this.board.findMatches();
      if (matches.length > 0) {
        await this.processMatches(matches, true, true);
      }
      
      this.state.isSwapping = false;
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
      this.audioUtils.playSwapSound();
      
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
        // Process matches and update score - track if chain reaction occurs
        await this.processMatches(matches, true, true);
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
    
    // Play failed swap sound
    this.audioUtils.playFailedSwapSound();
    
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

  private async processMatches(matches: Match[], isDirectMatch: boolean = true, isFirstInChain: boolean = false): Promise<void> {
    // Calculate score and award power-ups
    let totalScore = 0;
    let hasFourMatch = false;
    let hasFiveMatch = false;
    
    matches.forEach(match => {
      if (match.length >= 5) {
        totalScore += POINTS.FIVE_IN_ROW;
        hasFiveMatch = true;
        this.audioUtils.playMatchSound(match.length, isDirectMatch);
      } else if (match.length === 4) {
        totalScore += POINTS.FOUR_IN_ROW;
        hasFourMatch = true;
        this.audioUtils.playMatchSound(match.length, isDirectMatch);
      } else if (match.length === 3) {
        totalScore += POINTS.THREE_IN_ROW;
        this.audioUtils.playMatchSound(match.length, isDirectMatch);
      }
    });

    this.state.score += totalScore;
    
    // Award power-ups based on matches
    if (hasFourMatch) {
      this.awardPowerUp(PowerUpType.FREE_SWAP);
    }
    
    if (hasFiveMatch) {
      this.awardPowerUp(PowerUpType.SYMBOL_SWAP);
    }
    
    // Check for chain reaction (multiple direct matches award Symbol Swap)
    if (isDirectMatch && matches.length > 1) {
      this.awardPowerUp(PowerUpType.SYMBOL_SWAP);
    }

    // Update progress bar based on matches (both direct and cascade matches contribute)
    matches.forEach(match => {
      const progressIncrease = this.calculateProgressIncrease(match.length);
      this.state.level.progress += progressIncrease;
    });

    // Clamp progress to maximum of 1.0
    this.state.level.progress = Math.min(this.state.level.progress, 1.0);
    
    // Check for level completion
    this.checkLevelCompletion();

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
      // If this is a cascade after the first direct match, it's a chain reaction
      if (isFirstInChain && !isDirectMatch) {
        this.awardPowerUp(PowerUpType.SYMBOL_SWAP);
        console.log('Chain reaction detected! Awarded Symbol Swap power-up.');
      }
      await this.processMatches(newMatches, false, false);
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

  private updateTimer(): void {
    if (!this.state.timer.isActive) {
      return;
    }

    const now = performance.now();
    const elapsed = now - this.state.timer.startTime;
    this.state.timer.timeRemaining = Math.max(0, 120000 - elapsed);

    if (this.state.timer.timeRemaining === 0) {
      this.state.timer.isActive = false;
      // Timer expired - we'll implement timer expiry logic later
      console.log('Timer expired!');
    }
  }

  private updateUI(): void {
    // Update score display
    this.scoreElement.textContent = this.state.score.toString();

    // Update timer display
    const seconds = Math.ceil(this.state.timer.timeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    this.timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

    // Update progress bar
    const progressPercentage = Math.min(this.state.level.progress * 100, 100);
    this.progressBarElement.style.width = `${progressPercentage}%`;

    // Show/hide level completion modal
    if (this.state.showLevelCompletionPopup) {
      this.levelCompletionModalElement.classList.add('show');
    } else {
      this.levelCompletionModalElement.classList.remove('show');
    }

    // Update power-up counts
    this.powerUpElements.freeSwap.textContent = this.getPowerUpCount(PowerUpType.FREE_SWAP).toString();
    this.powerUpElements.clearCells.textContent = this.getPowerUpCount(PowerUpType.CLEAR_CELLS).toString();
    this.powerUpElements.symbolSwap.textContent = this.getPowerUpCount(PowerUpType.SYMBOL_SWAP).toString();
  }

  private setupModalEventListeners(): void {
    const buttons = this.levelCompletionModalElement.querySelectorAll('.modal-button');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).getAttribute('data-action') as PopupAction;
        this.handleModalAction(action);
      });
    });
  }

  private handleModalAction(action: PopupAction): void {
    switch (action) {
      case PopupAction.HOME:
        // TODO: Navigate to home screen
        console.log('Home button clicked - not implemented yet');
        break;
      case PopupAction.PLAY_NEXT:
        this.startNextLevel();
        break;
      case PopupAction.LEVEL_MAP:
        // TODO: Show level map
        console.log('Level map button clicked - not implemented yet');
        break;
    }
  }

  private startNextLevel(): void {
    // Hide the completion popup
    this.state.showLevelCompletionPopup = false;

    // Advance to next level
    this.state.level.currentLevel++;
    if (this.state.level.currentLevel <= 10) {
      this.state.level.progressDenominator = LEVEL_DENOMINATORS[this.state.level.currentLevel as keyof typeof LEVEL_DENOMINATORS];
    } else {
      // For levels beyond 10, keep using level 10's denominator
      this.state.level.progressDenominator = LEVEL_DENOMINATORS[10];
    }

    // Reset progress
    this.state.level.progress = 0;

    // Reset timer
    this.state.timer.timeRemaining = 120000;
    this.state.timer.isActive = true;
    this.state.timer.startTime = performance.now();

    console.log(`Started level ${this.state.level.currentLevel}`);
  }

  private awardPowerUp(type: PowerUpType): void {
    const powerUp = this.state.powerUps.find(p => p.type === type);
    if (powerUp) {
      powerUp.count++;
      console.log(`Awarded ${type} power-up! New count: ${powerUp.count}`);
    }
  }

  private usePowerUp(type: PowerUpType): boolean {
    const powerUp = this.state.powerUps.find(p => p.type === type);
    if (powerUp && powerUp.count > 0) {
      powerUp.count--;
      return true;
    }
    return false;
  }

  private getPowerUpCount(type: PowerUpType): number {
    const powerUp = this.state.powerUps.find(p => p.type === type);
    return powerUp ? powerUp.count : 0;
  }

  private handlePowerUpDrag(powerUpType: PowerUpType, targetPosition: Position): void {
    if (this.state.isSwapping) {
      return;
    }

    console.log(`Power-up ${powerUpType} used on cell (${targetPosition.x},${targetPosition.y})`);
    
    if (!this.usePowerUp(powerUpType)) {
      console.log(`No ${powerUpType} power-ups available`);
      return;
    }

    switch (powerUpType) {
      case PowerUpType.FREE_SWAP:
        this.state.greenCell = targetPosition;
        this.state.activePowerUp = PowerUpType.FREE_SWAP;
        console.log('Free swap activated - click any cell to swap with the green cell');
        break;
      case PowerUpType.CLEAR_CELLS:
        this.useClearCellsPowerUp(targetPosition);
        break;
      case PowerUpType.SYMBOL_SWAP:
        this.useSymbolSwapPowerUp(targetPosition);
        break;
    }
  }

  private handlePowerUpDragUpdate(powerUpType: PowerUpType, targetPosition: Position | null, mousePos: { x: number; y: number } | null): void {
    this.state.powerUpDragState = targetPosition ? {
      powerUpType,
      mousePosition: mousePos || { x: 0, y: 0 },
      targetCell: targetPosition,
    } : null;
  }

  private async useClearCellsPowerUp(centerPosition: Position): Promise<void> {
    const cellsToRemove: Position[] = [];
    
    // Add center cell and all 8 neighbors (including diagonals)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const x = centerPosition.x + dx;
        const y = centerPosition.y + dy;
        
        if (x >= 0 && x < 9 && y >= 0 && y < 7) { // Within board bounds
          cellsToRemove.push({ x, y });
        }
      }
    }

    // Remove the cells from the board
    this.board.removeCells(cellsToRemove);
    this.state.board = this.board.getBoard();
    
    console.log(`Cleared ${cellsToRemove.length} cells with Clear Cells power-up`);
    
    // Check for new matches after the clearing
    const newMatches = this.board.findMatches();
    if (newMatches.length > 0) {
      await this.processMatches(newMatches, false, false);
    }
  }

  private async useSymbolSwapPowerUp(targetPosition: Position): Promise<void> {
    const targetSymbol = this.state.board[targetPosition.y][targetPosition.x].symbol;
    
    // Replace all instances of the target symbol with random symbols
    this.board.swapAllSymbols(targetSymbol);
    this.state.board = this.board.getBoard();
    
    console.log(`Symbol swap used - replaced all ${targetSymbol} symbols`);
    
    // Check for new matches after the symbol swap
    const newMatches = this.board.findMatches();
    if (newMatches.length > 0) {
      await this.processMatches(newMatches, false, false);
    }
  }

  private calculateProgressIncrease(matchLength: number): number {
    const numerator = matchLength >= 5 ? 
      MATCH_PROGRESS_NUMERATORS[5] : 
      MATCH_PROGRESS_NUMERATORS[matchLength as keyof typeof MATCH_PROGRESS_NUMERATORS];
    
    return numerator / this.state.level.progressDenominator;
  }

  private checkLevelCompletion(): void {
    if (this.state.level.progress >= 1 && this.state.timer.timeRemaining > 0) {
      this.state.timer.isActive = false;
      
      // Award Clear Cells power-ups based on remaining time
      const remainingTimeInSeconds = this.state.timer.timeRemaining / 1000;
      const clearCellsToAward = remainingTimeInSeconds > 60 ? 2 : 1;
      
      for (let i = 0; i < clearCellsToAward; i++) {
        this.awardPowerUp(PowerUpType.CLEAR_CELLS);
      }
      
      this.state.showLevelCompletionPopup = true;
      console.log(`Level ${this.state.level.currentLevel} completed! Awarded ${clearCellsToAward} Clear Cells power-ups.`);
    }
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