import { TutorialGameBoard } from './TutorialGameBoard';
import { TutorialRenderer } from './TutorialRenderer';
import { TutorialInputHandler } from './TutorialInputHandler';
import { 
  GameState, 
  Position, 
  POINTS, 
  DragState, 
  MatchAnimationCopy, 
  PowerUpType,
  TutorialPhase,
  TutorialState,
  TUTORIAL_BOARD_WIDTH,
  TUTORIAL_BOARD_HEIGHT,
  SymbolType
} from './types';

export class TutorialGame {
  private board: TutorialGameBoard;
  private renderer: TutorialRenderer;
  private inputHandler: TutorialInputHandler;
  private state: GameState;
  private tutorialState: TutorialState;
  private dragState: DragState | null = null;
  private animationId: number | null = null;
  private phaseInstructions: Record<TutorialPhase, { title: string; text: string; counter: string }>;
  private onPhaseComplete: ((phase: TutorialPhase) => void) | null = null;
  private onTutorialComplete: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize with tutorial board dimensions
    this.board = new TutorialGameBoard();
    this.renderer = new TutorialRenderer(canvas);
    
    // Initialize tutorial state
    this.tutorialState = {
      currentPhase: TutorialPhase.MATCH_THREE,
      phaseProgress: 0,
      instructionText: '',
      highlightedCells: [],
      nextButtonVisible: false, // Only visible at end
      completed: false,
    };

    // Initialize game state adapted for tutorial
    this.state = {
      board: this.board.getBoard(),
      score: 0,
      selectedCell: null,
      isSwapping: false,
      swapAnimation: null,
      matchAnimations: [],
      timer: {
        timeRemaining: 0, // No timer in tutorial
        isActive: false,
        startTime: 0,
        pausedTime: 0,
      },
      level: {
        currentLevel: 1,
        maxUnlockedLevel: 1,
        progress: 0,
        progressDenominator: 1,
        completedLevels: [],
      },
      showLevelCompletionPopup: false,
      showLevelFailedPopup: false,
      powerUps: [
        { type: PowerUpType.FREE_SWAP, count: 0 },
        { type: PowerUpType.CLEAR_CELLS, count: 0 },
        { type: PowerUpType.SYMBOL_SWAP, count: 0 },
      ],
      powerUpDragState: null,
      activePowerUp: null,
      greenCell: null,
      isPaused: false,
      showPausePopup: false,
    };

    // Define phase instructions matching the specification
    this.phaseInstructions = {
      [TutorialPhase.MATCH_THREE]: {
        title: 'Welcome to Superblast!',
        text: 'Make a match of three by dragging a symbol to a neighboring cell to make three in a row. No diagonals here - matches can be made vertically or horizontally. Go ahead and make a match of three. You get 10 points for making a match of three.',
        counter: 'Match 3'
      },
      [TutorialPhase.MATCH_FOUR]: {
        title: 'Match of Four',
        text: 'Good Job! Now, you can also make a match of four. See if you can find a match of four to make. You get 20 points for a match of 4. Go ahead and make a match of four.',
        counter: 'Match 4'
      },
      [TutorialPhase.MATCH_FIVE]: {
        title: 'Match of Five',
        text: 'Great. You can also make a match of five, and you get 30 points for doing that. See if you can do that now.',
        counter: 'Match 5'
      },
      [TutorialPhase.POWER_UP_FREE_SWAP]: {
        title: 'Free Swap Power-up',
        text: 'You are awarded power-ups throughout the game, and they can help you do amazing things. There are three kinds of power-ups. The first kind is Free Swap. This lets you swap out one symbol with any other symbol on the board. You can get Free Swap power-ups by making a match of four. Try it now and make a match.',
        counter: 'Free Swap'
      },
      [TutorialPhase.POWER_UP_CLEAR_CELLS]: {
        title: 'Clear Cells Power-up',
        text: 'The next power-up is called Clear Cells and it will re-roll a 3x3 grid of cells around your selected spot. Try it now, and form a match.',
        counter: 'Clear Cells'
      },
      [TutorialPhase.POWER_UP_SYMBOL_SWAP]: {
        title: 'Symbol Swap Power-up',
        text: 'The last power-up is called Symbol Swap. This will exchange _all_ instances of one symbol with some other symbol that you choose. Go ahead and try this now, to form a match.',
        counter: 'Symbol Swap'
      },
      [TutorialPhase.COMPLETE]: {
        title: 'Good luck, and have fun!',
        text: '',
        counter: 'Complete'
      }
    };

    // Set up input handling
    this.inputHandler = new TutorialInputHandler(canvas, this.renderer, {
      onCellClick: this.handleCellClick.bind(this),
      onCellDrag: this.handleCellDrag.bind(this),
      onDragUpdate: this.handleDragUpdate.bind(this),
      onPowerUpDrag: this.handlePowerUpDrag.bind(this),
      onPowerUpDragUpdate: this.handlePowerUpDragUpdate.bind(this),
    });

    // Initialize the board for the first phase
    this.setupPhase(this.tutorialState.currentPhase);
    this.updateInstructionUI();
    this.startGameLoop();
  }

  private handleCellClick(position: Position): void {
    // Handle Free Swap power-up usage
    if (this.state.activePowerUp === PowerUpType.FREE_SWAP) {
      // Get a random symbol different from the current one
      const currentCell = this.board.getCell(position);
      if (currentCell) {
        const newSymbol = this.board.getRandomSymbolExcluding([currentCell.symbol]);
        this.board.setCell(position, newSymbol);
        
        // Set green cell to show what was changed
        this.state.greenCell = position;
        
        // Clear the active power-up state
        this.state.activePowerUp = null;
        
        // Check for matches after the symbol change
        this.checkForMatches();
      }
      return;
    }
    
    // Handle normal cell clicks for swapping
    if (this.state.selectedCell) {
      this.attemptSwap(this.state.selectedCell, position);
      this.state.selectedCell = null;
    } else {
      this.state.selectedCell = position;
    }
  }

  private handleCellDrag(from: Position, to: Position): void {
    // Similar to handleCellClick but for drag operations
    this.attemptSwap(from, to);
  }

  private handleDragUpdate(from: Position, to: Position | null, mousePos: { x: number; y: number } | null): void {
    this.dragState = to && mousePos ? { from, to, mousePosition: mousePos } : null;
  }

  private handlePowerUpDrag(powerUpType: PowerUpType, targetPosition: Position): void {
    // Only allow power-up usage during power-up phases
    if (this.tutorialState.currentPhase === TutorialPhase.POWER_UP_FREE_SWAP ||
        this.tutorialState.currentPhase === TutorialPhase.POWER_UP_CLEAR_CELLS ||
        this.tutorialState.currentPhase === TutorialPhase.POWER_UP_SYMBOL_SWAP) {
      this.usePowerUp(powerUpType, targetPosition);
    }
  }

  private handlePowerUpDragUpdate(powerUpType: PowerUpType, targetPosition: Position | null, mousePos: { x: number; y: number } | null): void {
    this.state.powerUpDragState = targetPosition && mousePos ? 
      { powerUpType, mousePosition: mousePos, targetCell: targetPosition } : null;
  }

  private attemptSwap(from: Position, to: Position): boolean {
    if (this.state.isSwapping || !this.board.areAdjacent(from, to)) {
      return false;
    }

    // Perform the swap
    const success = this.board.swapCells(from, to);
    if (!success) {
      return false;
    }

    this.state.isSwapping = true;
    this.state.swapAnimation = {
      from,
      to,
      progress: 0,
      startTime: performance.now(),
      duration: 300,
    };

    // Check for matches after animation
    setTimeout(() => {
      this.checkForMatches();
      this.state.isSwapping = false;
      this.state.swapAnimation = null;
      
      // Check if this completes the current phase
      this.checkPhaseCompletion();
    }, 300);

    return true;
  }

  private usePowerUp(type: PowerUpType, position: Position): void {
    const powerUp = this.state.powerUps.find(p => p.type === type);
    if (!powerUp || powerUp.count <= 0) {
      return;
    }

    // Check if this power-up is allowed in current phase
    const isValidPowerUp = 
      (type === PowerUpType.FREE_SWAP && this.tutorialState.currentPhase === TutorialPhase.POWER_UP_FREE_SWAP) ||
      (type === PowerUpType.CLEAR_CELLS && this.tutorialState.currentPhase === TutorialPhase.POWER_UP_CLEAR_CELLS) ||
      (type === PowerUpType.SYMBOL_SWAP && this.tutorialState.currentPhase === TutorialPhase.POWER_UP_SYMBOL_SWAP);
    
    if (!isValidPowerUp) {
      return;
    }

    powerUp.count--;

    switch (type) {
      case PowerUpType.FREE_SWAP:
        // For Free Swap, just set the active state - user will click on cell to swap
        this.state.activePowerUp = type;
        this.state.greenCell = null; // Will be set when user clicks
        break;
      case PowerUpType.CLEAR_CELLS:
        this.clearCellsAroundPosition(position);
        break;
      case PowerUpType.SYMBOL_SWAP:
        this.swapAllSymbolsOfType(position);
        break;
    }

    // Update power-up counts in UI
    this.updatePowerUpCounts();
    
    this.checkPhaseCompletion();
  }

  private clearCellsAroundPosition(center: Position): void {
    const cellsToClear: Position[] = [];
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const pos = { x: center.x + dx, y: center.y + dy };
        if (this.board.isValidPosition(pos)) {
          cellsToClear.push(pos);
        }
      }
    }

    // Create match animation for cleared cells
    this.createMatchAnimation(cellsToClear, this.board.getCell(center)?.symbol || SymbolType.LEAF);
    
    // Replace cleared cells with new symbols
    setTimeout(() => {
      cellsToClear.forEach(pos => {
        this.board.setCell(pos, this.board.getRandomSymbol());
      });
      this.checkForMatches();
    }, 1000);
  }

  private swapAllSymbolsOfType(position: Position): void {
    const targetCell = this.board.getCell(position);
    if (!targetCell) return;

    const targetSymbol = targetCell.symbol;
    const newSymbol = this.board.getRandomSymbolExcluding([targetSymbol]);

    // Find all cells with the target symbol and replace them
    for (let y = 0; y < TUTORIAL_BOARD_HEIGHT; y++) {
      for (let x = 0; x < TUTORIAL_BOARD_WIDTH; x++) {
        const cell = this.board.getCell({ x, y });
        if (cell && cell.symbol === targetSymbol) {
          this.board.setCell({ x, y }, newSymbol);
        }
      }
    }

    this.checkForMatches();
  }

  private checkForMatches(): void {
    const matches = this.board.findMatches();
    if (matches.length === 0) {
      // Check if board needs rebuilding for current phase
      this.checkBoardRebuild();
      return;
    }

    // Calculate score
    matches.forEach(match => {
      let points = 0;
      if (match.length >= 5) {
        points = POINTS.FIVE_IN_ROW;
      } else if (match.length === 4) {
        points = POINTS.FOUR_IN_ROW;
      } else {
        points = POINTS.THREE_IN_ROW;
      }
      this.state.score += points;
    });

    // Create match animations
    matches.forEach(match => {
      this.createMatchAnimation(match.positions, match.symbol);
    });

    // Remove matched symbols and replace with new ones
    setTimeout(() => {
      matches.forEach(match => {
        match.positions.forEach(pos => {
          this.board.setCell(pos, this.board.getRandomSymbol());
        });
      });
      
      // Check phase completion after matches
      this.checkPhaseCompletion();
      
      // Check for cascade matches
      setTimeout(() => {
        this.checkForMatches();
      }, 100);
    }, 1000);
  }

  private checkBoardRebuild(): void {
    let targetLength = 3;
    
    switch (this.tutorialState.currentPhase) {
      case TutorialPhase.MATCH_THREE:
        targetLength = 3;
        break;
      case TutorialPhase.MATCH_FOUR:
        targetLength = 4;
        break;
      case TutorialPhase.MATCH_FIVE:
        targetLength = 5;
        break;
      default:
        return; // No rebuilding needed for power-up phases
    }
    
    // Check if the target match is still possible
    if (!this.board.hasPossibleMatch(targetLength)) {
      // Rebuild the board with the required match
      this.setupPhase(this.tutorialState.currentPhase);
    }
  }

  private createMatchAnimation(positions: Position[], symbol: SymbolType): void {
    const copies: MatchAnimationCopy[] = positions.map(pos => {
      const screenPos = this.renderer.boardToScreen(pos);
      return {
        startPosition: pos,
        currentPosition: { x: screenPos.x, y: screenPos.y },
        targetEdge: this.getTargetEdge(pos),
        symbol,
      };
    });

    this.state.matchAnimations.push({
      copies,
      progress: 0,
      startTime: performance.now(),
      duration: 1000,
    });
  }

  private getTargetEdge(pos: Position): 'top' | 'bottom' | 'left' | 'right' {
    const centerX = TUTORIAL_BOARD_WIDTH / 2;
    const centerY = TUTORIAL_BOARD_HEIGHT / 2;
    
    const dx = pos.x - centerX;
    const dy = pos.y - centerY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'bottom' : 'top';
    }
  }

  private checkPhaseCompletion(): void {
    const matches = this.board.findMatches();
    
    switch (this.tutorialState.currentPhase) {
      case TutorialPhase.MATCH_THREE:
        // Complete after making a match of 3
        if (matches.some(match => match.length === 3)) {
          this.advancePhase();
        }
        break;
      case TutorialPhase.MATCH_FOUR:
        // Complete after making a match of 4
        if (matches.some(match => match.length === 4)) {
          this.advancePhase();
        }
        break;
      case TutorialPhase.MATCH_FIVE:
        // Complete after making a match of 5+
        if (matches.some(match => match.length >= 5)) {
          this.advancePhase();
        }
        break;
      case TutorialPhase.POWER_UP_FREE_SWAP:
        // Complete after using Free Swap and making a match
        if (matches.length > 0 && this.state.powerUps[0].count < 10) {
          this.advancePhase();
        }
        break;
      case TutorialPhase.POWER_UP_CLEAR_CELLS:
        // Complete after using Clear Cells and making a match
        if (matches.length > 0 && this.state.powerUps[1].count < 10) {
          this.advancePhase();
        }
        break;
      case TutorialPhase.POWER_UP_SYMBOL_SWAP:
        // Complete after using Symbol Swap and making a match
        if (matches.length > 0 && this.state.powerUps[2].count < 10) {
          this.advancePhase();
        }
        break;
    }
  }

  private setupPhase(phase: TutorialPhase): void {
    switch (phase) {
      case TutorialPhase.MATCH_THREE:
        this.board.generateBoardWithMatch(3);
        this.state.board = this.board.getBoard();
        break;
      case TutorialPhase.MATCH_FOUR:
        this.board.generateBoardWithMatch(4);
        this.state.board = this.board.getBoard();
        break;
      case TutorialPhase.MATCH_FIVE:
        this.board.generateBoardWithMatch(5);
        this.state.board = this.board.getBoard();
        break;
      case TutorialPhase.POWER_UP_FREE_SWAP:
        this.board.generateBoardWithNoMatches();
        this.state.board = this.board.getBoard();
        this.state.powerUps[0].count = 10; // Give 10 Free Swap power-ups
        this.state.powerUps[1].count = 0;
        this.state.powerUps[2].count = 0;
        break;
      case TutorialPhase.POWER_UP_CLEAR_CELLS:
        this.board.generateBoardWithNoMatches();
        this.state.board = this.board.getBoard();
        this.state.powerUps[0].count = 0;
        this.state.powerUps[1].count = 10; // Give 10 Clear Cells power-ups
        this.state.powerUps[2].count = 0;
        break;
      case TutorialPhase.POWER_UP_SYMBOL_SWAP:
        this.board.generateBoardWithNoMatches();
        this.state.board = this.board.getBoard();
        this.state.powerUps[0].count = 0;
        this.state.powerUps[1].count = 0;
        this.state.powerUps[2].count = 10; // Give 10 Symbol Swap power-ups
        break;
      case TutorialPhase.COMPLETE:
        // Final phase, show completion message
        this.tutorialState.completed = true;
        this.tutorialState.nextButtonVisible = true;
        break;
    }
  }

  public advancePhase(): void {
    const phases = Object.values(TutorialPhase);
    const currentIndex = phases.indexOf(this.tutorialState.currentPhase);
    
    if (currentIndex < phases.length - 1) {
      this.tutorialState.currentPhase = phases[currentIndex + 1];
      this.setupPhase(this.tutorialState.currentPhase);
      this.updateInstructionUI();
      
      if (this.onPhaseComplete) {
        this.onPhaseComplete(this.tutorialState.currentPhase);
      }
    } else {
      // Tutorial complete - start 3 second countdown to return home
      this.tutorialState.completed = true;
      setTimeout(() => {
        if (this.onTutorialComplete) {
          this.onTutorialComplete();
        }
      }, 3000);
    }
  }

  private updateInstructionUI(): void {
    const instruction = this.phaseInstructions[this.tutorialState.currentPhase];
    
    const phaseTextElement = document.getElementById('tutorial-phase-text');
    const phaseCounterElement = document.getElementById('tutorial-phase-counter');
    const titleElement = document.getElementById('tutorial-instruction-title');
    const textElement = document.getElementById('tutorial-instruction-text');
    
    if (phaseTextElement) phaseTextElement.textContent = this.tutorialState.currentPhase;
    if (phaseCounterElement) phaseCounterElement.textContent = instruction.counter;
    if (titleElement) titleElement.textContent = instruction.title;
    if (textElement) textElement.textContent = instruction.text;
    
    // Manage sidebar visibility and layout
    this.updateSidebarVisibility();
    this.updatePowerUpCounts();
  }

  private updateSidebarVisibility(): void {
    const sidebar = document.getElementById('tutorial-sidebar');
    const container = document.querySelector('.tutorial-container');
    
    // Show sidebar only during power-up phases
    const isPowerUpPhase = this.tutorialState.currentPhase === TutorialPhase.POWER_UP_FREE_SWAP ||
                          this.tutorialState.currentPhase === TutorialPhase.POWER_UP_CLEAR_CELLS ||
                          this.tutorialState.currentPhase === TutorialPhase.POWER_UP_SYMBOL_SWAP;
    
    if (sidebar) {
      sidebar.style.display = isPowerUpPhase ? 'flex' : 'none';
    }
    
    if (container) {
      if (isPowerUpPhase) {
        container.classList.add('with-sidebar');
        // Refresh power-up listeners when sidebar becomes visible
        setTimeout(() => {
          this.inputHandler.refreshPowerUpListeners();
        }, 100); // Small delay to ensure DOM is updated
      } else {
        container.classList.remove('with-sidebar');
      }
    }
  }

  private updatePowerUpCounts(): void {
    // Update tutorial power-up count displays
    const freeSwapCount = document.getElementById('tutorial-free-swap-count');
    const clearCellsCount = document.getElementById('tutorial-clear-cells-count');
    const symbolSwapCount = document.getElementById('tutorial-symbol-swap-count');
    
    if (freeSwapCount) freeSwapCount.textContent = this.state.powerUps[0].count.toString();
    if (clearCellsCount) clearCellsCount.textContent = this.state.powerUps[1].count.toString();
    if (symbolSwapCount) symbolSwapCount.textContent = this.state.powerUps[2].count.toString();
  }

  private startGameLoop(): void {
    const gameLoop = (timestamp: number) => {
      this.update(timestamp);
      this.render();
      this.animationId = requestAnimationFrame(gameLoop);
    };
    gameLoop(performance.now());
  }

  private update(timestamp: number): void {
    // Update swap animation
    if (this.state.swapAnimation) {
      const elapsed = timestamp - this.state.swapAnimation.startTime;
      this.state.swapAnimation.progress = Math.min(elapsed / this.state.swapAnimation.duration, 1);
    }

    // Update match animations
    this.state.matchAnimations = this.state.matchAnimations.filter(animation => {
      const elapsed = timestamp - animation.startTime;
      animation.progress = Math.min(elapsed / animation.duration, 1);
      
      // Update copy positions
      animation.copies.forEach(copy => {
        const targetPos = this.renderer.getEdgePosition(copy.targetEdge);
        copy.currentPosition.x += (targetPos.x - copy.currentPosition.x) * 0.02;
        copy.currentPosition.y += (targetPos.y - copy.currentPosition.y) * 0.02;
      });
      
      return animation.progress < 1;
    });
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawBoard(this.state.board);
    
    if (this.state.selectedCell) {
      this.renderer.drawSelectedCell(this.state.selectedCell);
    }
    
    if (this.dragState) {
      this.renderer.drawDragState(this.dragState);
    }
    
    if (this.state.swapAnimation) {
      this.renderer.drawSwapAnimation(this.state.swapAnimation, this.state.board);
    }
    
    this.state.matchAnimations.forEach(animation => {
      this.renderer.drawMatchAnimation(animation);
    });
    
    if (this.state.powerUpDragState) {
      this.renderer.drawPowerUpDrag(this.state.powerUpDragState);
    }
    
    if (this.state.greenCell) {
      this.renderer.drawGreenCell(this.state.greenCell);
    }
  }

  public setPhaseCompleteCallback(callback: (phase: TutorialPhase) => void): void {
    this.onPhaseComplete = callback;
  }

  public setTutorialCompleteCallback(callback: () => void): void {
    this.onTutorialComplete = callback;
  }

  public reset(): void {
    // Reset tutorial state to beginning
    this.tutorialState = {
      currentPhase: TutorialPhase.MATCH_THREE,
      phaseProgress: 0,
      instructionText: '',
      highlightedCells: [],
      nextButtonVisible: false,
      completed: false,
    };

    // Reset game state
    this.state.score = 0;
    this.state.selectedCell = null;
    this.state.isSwapping = false;
    this.state.swapAnimation = null;
    this.state.matchAnimations = [];
    this.state.powerUps = [
      { type: PowerUpType.FREE_SWAP, count: 0 },
      { type: PowerUpType.CLEAR_CELLS, count: 0 },
      { type: PowerUpType.SYMBOL_SWAP, count: 0 },
    ];
    this.state.powerUpDragState = null;
    this.state.activePowerUp = null;
    this.state.greenCell = null;

    // Clear any drag state
    this.dragState = null;

    // Setup the first phase
    this.setupPhase(this.tutorialState.currentPhase);
    this.updateInstructionUI();
  }

  public getCurrentPhase(): TutorialPhase {
    return this.tutorialState.currentPhase;
  }

  public isCompleted(): boolean {
    return this.tutorialState.completed;
  }

  public handleCanvasResize(): void {
    this.renderer.calculateDimensions();
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}