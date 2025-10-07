import { Game } from './Game';
import { LargeLevelMap } from './LargeLevelMap';
import { TutorialGame } from './TutorialGame';
import { AppState } from './types';

export class App {
  private currentState: AppState;
  private game: Game | null = null;
  private largeLevelMap: LargeLevelMap | null = null;
  private tutorialGame: TutorialGame | null = null;
  private canvas: HTMLCanvasElement;
  private tutorialCanvas: HTMLCanvasElement;
  private gameContainer: HTMLElement;
  private homeScreen: HTMLElement;
  private largeLevelMapScreen: HTMLElement;
  private tutorialScreen: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.currentState = AppState.HOME;
    
    // Get DOM elements
    this.gameContainer = document.getElementById('game-container')!;
    this.homeScreen = document.getElementById('home-screen')!;
    this.largeLevelMapScreen = document.getElementById('large-level-map-screen')!;
    this.tutorialScreen = document.getElementById('tutorial-screen')!;
    this.tutorialCanvas = document.getElementById('tutorial-canvas') as HTMLCanvasElement;
    
    if (!this.gameContainer || !this.homeScreen || !this.largeLevelMapScreen || !this.tutorialScreen || !this.tutorialCanvas) {
      throw new Error('Could not find required DOM elements');
    }

    this.setupHomeScreenEventListeners();
    this.setupLargeLevelMapEventListeners();
    this.setupTutorialEventListeners();
    this.showHomeScreen();  
  }

  private setupHomeScreenEventListeners(): void {
    const playButton = document.getElementById('home-play-button');
    if (playButton) {
      playButton.addEventListener('click', () => {
        this.showLargeLevelMap();
      });
    }

    const learnButton = document.getElementById('home-learn-button');
    if (learnButton) {
      learnButton.addEventListener('click', () => {
        this.showTutorial();
      });
    }
  }

  private setupLargeLevelMapEventListeners(): void {
    const backButton = document.getElementById('back-to-game-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.goBackToGame();
      });
    }
  }

  private showHomeScreen(): void {
    this.currentState = AppState.HOME;
    this.homeScreen.style.display = 'flex';
    this.gameContainer.style.display = 'none';
    this.largeLevelMapScreen.style.display = 'none';
    this.tutorialScreen.style.display = 'none';
    
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
    
    // Clean up tutorial game if it exists
    if (this.tutorialGame) {
      this.tutorialGame.destroy();
      this.tutorialGame = null;
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
    this.largeLevelMapScreen.style.display = 'none';
    this.tutorialScreen.style.display = 'none';
    
    // Tell the game that the game screen is now visible
    if (this.game) {
      this.game.setGameScreenVisible(true);
    }
  }

  private showLargeLevelMap(): void {
    this.currentState = AppState.LARGE_LEVEL_MAP;
    this.homeScreen.style.display = 'none';
    this.gameContainer.style.display = 'none';
    this.largeLevelMapScreen.style.display = 'flex';
    this.tutorialScreen.style.display = 'none';
    
    // Initialize large level map if not already done
    if (!this.largeLevelMap) {
      const svg = document.getElementById('large-level-map-svg');
      if (svg && svg instanceof SVGElement) {
        this.largeLevelMap = new LargeLevelMap(svg);
        this.largeLevelMap.setLevelSelectCallback((level: number) => {
          this.startGameAtLevel(level);
        });
      }
    }
    
    // Update large level map state if we have a game instance
    if (this.largeLevelMap && this.game) {
      this.largeLevelMap.updateState({
        currentLevel: this.game.getCurrentLevel(),
        maxUnlockedLevel: this.game.getMaxUnlockedLevel(),
        completedLevels: this.game.getCompletedLevels(),
      });
    } else if (this.largeLevelMap) {
      // Update from localStorage if no game instance
      const maxUnlocked = Game.getHighestLevelReached();
      const completed = Game.getCompletedLevels();
      this.largeLevelMap.updateState({
        currentLevel: maxUnlocked,
        maxUnlockedLevel: maxUnlocked,
        completedLevels: completed,
      });
    }
    
    // Tell the game that the game screen is no longer visible
    if (this.game) {
      this.game.setGameScreenVisible(false);
    }
  }

  private setupTutorialEventListeners(): void {
    const backButton = document.getElementById('tutorial-back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.goHome();
      });
    }

    // Next button is not needed - tutorial advances automatically

    const skipButton = document.getElementById('tutorial-skip-button');
    if (skipButton) {
      skipButton.addEventListener('click', () => {
        this.goHome();
      });
    }
  }

  private showTutorial(): void {
    this.currentState = AppState.TUTORIAL;
    this.homeScreen.style.display = 'none';
    this.gameContainer.style.display = 'none';
    this.largeLevelMapScreen.style.display = 'none';
    this.tutorialScreen.style.display = 'flex';

    // Initialize tutorial game if not already done
    if (!this.tutorialGame) {
      this.tutorialGame = new TutorialGame(this.tutorialCanvas);
      this.tutorialGame.setTutorialCompleteCallback(() => {
        this.goHome();
      });
    }

    // Size the tutorial canvas
    this.sizeTutorialCanvas();
  }

  private sizeTutorialCanvas(): void {
    const gameArea = document.querySelector('.tutorial-game-area') as HTMLElement;
    if (!gameArea) return;

    const rect = gameArea.getBoundingClientRect();
    const padding = 40; // Account for padding in the game area
    const availableWidth = rect.width - padding;
    const availableHeight = rect.height - padding;

    // Set canvas size to fit the available space
    const canvasWidth = Math.max(300, Math.floor(availableWidth * 0.9));
    const canvasHeight = Math.max(300, Math.floor(availableHeight * 0.9));

    this.tutorialCanvas.width = canvasWidth;
    this.tutorialCanvas.height = canvasHeight;
    this.tutorialCanvas.style.width = `${canvasWidth}px`;
    this.tutorialCanvas.style.height = `${canvasHeight}px`;

    if (this.tutorialGame) {
      this.tutorialGame.handleCanvasResize();
    }
  }

  // Tutorial completion is now handled automatically by TutorialGame

  public startGame(): void {
    // Get the highest level reached for starting level
    const startingLevel = Game.getHighestLevelReached();
    this.startGameAtLevel(startingLevel);
  }

  public startGameAtLevel(level: number): void {
    // Create new game instance FIRST
    this.game = new Game(this.canvas, level);
    
    // Set up home navigation callback
    this.game.setHomeCallback(() => {
      this.goHome();
    });
    
    // Set up large level map navigation callback
    this.game.setLargeLevelMapCallback(() => {
      this.showLargeLevelMap();
    });
    
    // THEN show the game screen (this will trigger timer start)
    this.showGame();
  }

  public goBackToGame(): void {
    if (this.game) {
      this.showGame();
    } else {
      // If no game exists, go home
      this.showHomeScreen();
    }
  }

  public goHome(): void {
    this.showHomeScreen();
  }

  public getCurrentState(): AppState {
    return this.currentState;
  }

  public handleCanvasResize(): void {
    // Notify the current game instance about canvas resize
    if (this.game && this.currentState === AppState.GAME) {
      this.game.handleCanvasResize();
    }
    
    // Notify the tutorial game instance about canvas resize
    if (this.tutorialGame && this.currentState === AppState.TUTORIAL) {
      this.sizeTutorialCanvas();
    }
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy();
    }
    if (this.tutorialGame) {
      this.tutorialGame.destroy();
    }
  }
}