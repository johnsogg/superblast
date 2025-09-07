import { Game } from './Game';
import { AppState } from './types';

export class App {
  private currentState: AppState;
  private game: Game | null = null;
  private canvas: HTMLCanvasElement;
  private gameContainer: HTMLElement;
  private homeScreen: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    console.log('🏠 APP CONSTRUCTOR: Starting...');
    this.canvas = canvas;
    this.currentState = AppState.HOME;
    
    // Get DOM elements
    this.gameContainer = document.getElementById('game-container')!;
    this.homeScreen = document.getElementById('home-screen')!;
    
    if (!this.gameContainer || !this.homeScreen) {
      throw new Error('Could not find required DOM elements');
    }

    this.setupHomeScreenEventListeners();
    console.log('🏠 APP CONSTRUCTOR: About to call showHomeScreen()...');
    this.showHomeScreen();
    console.log('🏠 APP CONSTRUCTOR: Constructor complete');  
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
        console.log('Learn button clicked - tutorial/instructions not implemented yet');
        // TODO: Implement tutorial/instructions screen
      });
    }
  }

  private showHomeScreen(): void {
    console.log('Showing home screen...');
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
      console.log('Destroying game instance');
      this.game.destroy();
      this.game = null;
    }
    console.log('Home screen is now visible');
  }

  private updateLevelIndicator(): void {
    const levelNumberElement = document.querySelector('.home-level-number') as HTMLElement;
    if (levelNumberElement) {
      // Always use the highest level reached from localStorage (represents highest unlocked level)
      const highestLevel = Game.getHighestLevelReached();
      levelNumberElement.textContent = highestLevel.toString();
      console.log(`Updated home screen level indicator to: ${highestLevel}`);
    }
  }

  private showGame(): void {
    console.log(`🏠 APP: showGame() called - switching to game screen`);
    this.currentState = AppState.GAME;
    this.homeScreen.style.display = 'none';
    this.gameContainer.style.display = 'flex';
    
    // Tell the game that the game screen is now visible
    if (this.game) {
      console.log(`🏠 APP: Calling setGameScreenVisible(true) on game instance`);
      this.game.setGameScreenVisible(true);
    } else {
      console.log(`🏠 APP: ERROR - No game instance when trying to set screen visible!`);
    }
  }

  public startGame(): void {
    console.log('🏠 APP: Starting game...');
    
    // Get the highest level reached for starting level
    const startingLevel = Game.getHighestLevelReached();
    console.log(`🏠 APP: Starting game at level: ${startingLevel}`);
    
    // Create new game instance FIRST
    console.log(`🏠 APP: Creating new Game instance...`);
    this.game = new Game(this.canvas, startingLevel);
    console.log(`🏠 APP: Game instance created`);
    
    // Set up home navigation callback
    this.game.setHomeCallback(() => {
      this.goHome();
    });
    
    // THEN show the game screen (this will trigger timer start)
    console.log(`🏠 APP: About to call showGame()...`);
    this.showGame();
    console.log(`🏠 APP: showGame() completed`);
  }

  public goHome(): void {
    console.log('Returning to home screen...');
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