import { Game } from './Game';
import { AppState } from './types';

export class App {
  private currentState: AppState;
  private game: Game | null = null;
  private canvas: HTMLCanvasElement;
  private gameContainer: HTMLElement;
  private homeScreen: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.currentState = AppState.HOME;
    
    // Get DOM elements
    this.gameContainer = document.getElementById('game-container')!;
    this.homeScreen = document.getElementById('home-screen')!;
    
    if (!this.gameContainer || !this.homeScreen) {
      throw new Error('Could not find required DOM elements');
    }

    this.setupHomeScreenEventListeners();
    this.showHomeScreen();  
  }

  private setupHomeScreenEventListeners(): void {
    const playButton = document.getElementById('home-play-button');
    if (playButton) {
      playButton.addEventListener('click', () => {
        this.startGame();
      });
    }

    const learnButton = document.getElementById('home-learn-button');
    if (learnButton) {
      learnButton.addEventListener('click', () => {
        // TODO: Implement tutorial/instructions screen
      });
    }
  }

  private showHomeScreen(): void {
    this.currentState = AppState.HOME;
    this.homeScreen.style.display = 'flex';
    this.gameContainer.style.display = 'none';
    
    // Update level indicator (works with or without game instance)
    this.updateLevelIndicator();
    
    // Tell the game that the game screen is no longer visible
    if (this.game) {
      this.game.setGameScreenVisible(false);
    }
    
    // Clean up game if it exists
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
  }

  private updateLevelIndicator(): void {
    const levelNumberElement = document.querySelector('.home-level-number') as HTMLElement;
    if (levelNumberElement) {
      // Always use the highest level reached from localStorage (represents highest unlocked level)
      const highestLevel = Game.getHighestLevelReached();
      levelNumberElement.textContent = highestLevel.toString();
    }
  }

  private showGame(): void {
    this.currentState = AppState.GAME;
    this.homeScreen.style.display = 'none';
    this.gameContainer.style.display = 'flex';
    
    // Tell the game that the game screen is now visible
    if (this.game) {
      this.game.setGameScreenVisible(true);
    }
  }

  public startGame(): void {
    // Get the highest level reached for starting level
    const startingLevel = Game.getHighestLevelReached();
    
    // Create new game instance FIRST
    this.game = new Game(this.canvas, startingLevel);
    
    // Set up home navigation callback
    this.game.setHomeCallback(() => {
      this.goHome();
    });
    
    // THEN show the game screen (this will trigger timer start)
    this.showGame();
  }

  public goHome(): void {
    this.showHomeScreen();
  }

  public getCurrentState(): AppState {
    return this.currentState;
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy();
    }
  }
}