import { Game } from './Game';
import { LargeLevelMap, LargeLevelMapMode } from './LargeLevelMap';
import { TutorialGame } from './TutorialGame';
import { AppState, GameMode, MODE_CONFIGS } from './types';

export class App {
  private currentState: AppState;
  private game: Game | null = null;
  private largeLevelMap: LargeLevelMap | null = null;
  private tutorialGame: TutorialGame | null = null;
  private canvas: HTMLCanvasElement;
  private tutorialCanvas: HTMLCanvasElement;
  private gameContainer: HTMLElement;
  private homeScreen: HTMLElement;
  private modeSelectorScreen: HTMLElement;
  private largeLevelMapScreen: HTMLElement;
  private tutorialScreen: HTMLElement;
  private currentGameMode: GameMode | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.currentState = AppState.HOME;
    
    // Get DOM elements
    this.gameContainer = document.getElementById('game-container')!;
    this.homeScreen = document.getElementById('home-screen')!;
    this.modeSelectorScreen = document.getElementById('mode-selector-screen')!;
    this.largeLevelMapScreen = document.getElementById('large-level-map-screen')!;
    this.tutorialScreen = document.getElementById('tutorial-screen')!;
    this.tutorialCanvas = document.getElementById('tutorial-canvas') as HTMLCanvasElement;
    
    if (!this.gameContainer || !this.homeScreen || !this.modeSelectorScreen || !this.largeLevelMapScreen || !this.tutorialScreen || !this.tutorialCanvas) {
      throw new Error('Could not find required DOM elements');
    }

    this.setupHomeScreenEventListeners();
    this.setupModeSelectorEventListeners();
    this.setupLargeLevelMapEventListeners();
    this.setupTutorialEventListeners();
    this.showHomeScreen();  
  }

  private setupHomeScreenEventListeners(): void {
    const playButton = document.getElementById('home-play-button');
    if (playButton) {
      playButton.addEventListener('click', () => {
        this.showModeSelector();
      });
    }

    const learnButton = document.getElementById('home-learn-button');
    if (learnButton) {
      learnButton.addEventListener('click', () => {
        this.showTutorial();
      });
    }
  }

  private setupModeSelectorEventListeners(): void {
    const backButton = document.getElementById('mode-selector-back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.showHomeScreen();
      });
    }

    // Easy mode button
    const easyButton = document.getElementById('easy-mode-button');
    if (easyButton) {
      easyButton.addEventListener('click', () => {
        this.selectMode(GameMode.EASY);
      });
    }

    // Medium mode button
    const mediumButton = document.getElementById('medium-mode-button');
    if (mediumButton) {
      mediumButton.addEventListener('click', () => {
        if (!mediumButton.classList.contains('locked')) {
          this.selectMode(GameMode.MEDIUM);
        }
      });
    }

    // Hard mode button
    const hardButton = document.getElementById('hard-mode-button');
    if (hardButton) {
      hardButton.addEventListener('click', () => {
        if (!hardButton.classList.contains('locked')) {
          this.selectMode(GameMode.HARD);
        }
      });
    }
  }

  private setupLargeLevelMapEventListeners(): void {
    const backButton = document.getElementById('back-to-game-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.goBackToModeSelector();
      });
    }
  }

  private showHomeScreen(): void {
    this.currentState = AppState.HOME;
    this.homeScreen.style.display = 'flex';
    this.gameContainer.style.display = 'none';
    this.modeSelectorScreen.style.display = 'none';
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

  private showModeSelector(): void {
    this.currentState = AppState.MODE_SELECTOR;
    this.homeScreen.style.display = 'none';
    this.gameContainer.style.display = 'none';
    this.modeSelectorScreen.style.display = 'flex';
    this.largeLevelMapScreen.style.display = 'none';
    this.tutorialScreen.style.display = 'none';
    
    // Update mode button states based on unlocked levels
    this.updateModeButtonStates();
    
    // Tell the game that the game screen is no longer visible
    if (this.game) {
      this.game.setGameScreenVisible(false);
    }
  }

  private showGame(): void {
    this.currentState = AppState.GAME;
    this.homeScreen.style.display = 'none';
    this.gameContainer.style.display = 'flex';
    this.modeSelectorScreen.style.display = 'none';
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
    this.modeSelectorScreen.style.display = 'none';
    this.largeLevelMapScreen.style.display = 'flex';
    this.tutorialScreen.style.display = 'none';
    
    // Update title based on current mode
    const titleElement = document.querySelector('.large-level-map-title') as HTMLElement;
    if (titleElement && this.currentGameMode) {
      const modeNames = {
        [GameMode.EASY]: 'Easy Mode',
        [GameMode.MEDIUM]: 'Medium Mode',
        [GameMode.HARD]: 'Hard Mode'
      };
      titleElement.textContent = modeNames[this.currentGameMode];
    }
    
    // Initialize large level map if not already done, or update mode if mode changed
    const svg = document.getElementById('large-level-map-svg');
    if (svg && svg instanceof SVGElement) {
      if (!this.largeLevelMap) {
        const modeConfig = this.currentGameMode ? MODE_CONFIGS[this.currentGameMode] : MODE_CONFIGS[GameMode.EASY];
        const mapMode: LargeLevelMapMode = {
          startLevel: modeConfig.levels[0],
          endLevel: modeConfig.levels[1]
        };
        this.largeLevelMap = new LargeLevelMap(svg, mapMode);
        this.largeLevelMap.setLevelSelectCallback((level: number) => {
          this.startGameAtLevel(level);
        });
      } else {
        // Update mode if it exists
        const modeConfig = this.currentGameMode ? MODE_CONFIGS[this.currentGameMode] : MODE_CONFIGS[GameMode.EASY];
        const mapMode: LargeLevelMapMode = {
          startLevel: modeConfig.levels[0],
          endLevel: modeConfig.levels[1]
        };
        this.largeLevelMap.setMode(mapMode);
      }
    }
    
    // Update large level map state based on current mode
    if (this.largeLevelMap) {
      const modeConfig = this.currentGameMode ? MODE_CONFIGS[this.currentGameMode] : MODE_CONFIGS[GameMode.EASY];
      const [startLevel, endLevel] = modeConfig.levels;
      const maxUnlocked = Game.getHighestLevelReached();
      const completed = Game.getCompletedLevels();
      
      // Filter completed levels to only include those in current mode range
      const modeCompletedLevels = completed.filter(level => level >= startLevel && level <= endLevel);
      
      // Determine current level within the mode range
      let currentLevel = startLevel;
      if (this.game) {
        currentLevel = this.game.getCurrentLevel();
      } else {
        // Find the highest unlocked level within this mode's range
        if (maxUnlocked >= startLevel) {
          currentLevel = Math.min(maxUnlocked, endLevel);
        }
      }
      
      // Determine max unlocked level within the mode range
      const maxUnlockedInMode = Math.min(Math.max(maxUnlocked, startLevel), endLevel);
      
      this.largeLevelMap.updateState({
        currentLevel,
        maxUnlockedLevel: maxUnlockedInMode,
        completedLevels: modeCompletedLevels,
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
    this.modeSelectorScreen.style.display = 'none';
    this.largeLevelMapScreen.style.display = 'none';
    this.tutorialScreen.style.display = 'flex';

    // Initialize tutorial game if not already done
    if (!this.tutorialGame) {
      this.tutorialGame = new TutorialGame(this.tutorialCanvas);
      this.tutorialGame.setTutorialCompleteCallback(() => {
        this.goHome();
      });
    } else {
      // Reset tutorial to beginning when returning to it
      this.tutorialGame.reset();
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

  private updateModeButtonStates(): void {
    const highestLevel = Game.getHighestLevelReached();
    
    // Medium mode unlocked at level 10+
    const mediumButton = document.getElementById('medium-mode-button') as HTMLButtonElement;
    const mediumLock = mediumButton?.querySelector('.lock-indicator') as HTMLElement;
    if (mediumButton && mediumLock) {
      if (highestLevel >= 10) {
        mediumButton.classList.remove('locked');
        mediumLock.style.display = 'none';
      } else {
        mediumButton.classList.add('locked');
        mediumLock.style.display = 'block';
      }
    }
    
    // Hard mode unlocked at level 20+
    const hardButton = document.getElementById('hard-mode-button') as HTMLButtonElement;
    const hardLock = hardButton?.querySelector('.lock-indicator') as HTMLElement;
    if (hardButton && hardLock) {
      if (highestLevel >= 20) {
        hardButton.classList.remove('locked');
        hardLock.style.display = 'none';
      } else {
        hardButton.classList.add('locked');
        hardLock.style.display = 'block';
      }
    }
  }

  private selectMode(mode: GameMode): void {
    this.currentGameMode = mode;
    this.showLargeLevelMap();
  }

  // Tutorial completion is now handled automatically by TutorialGame

  public startGame(): void {
    // Get the highest level reached for starting level
    const startingLevel = Game.getHighestLevelReached();
    this.startGameAtLevel(startingLevel);
  }

  public startGameAtLevel(level: number): void {
    // Determine game mode based on level
    let gameMode = GameMode.EASY;
    if (level >= 21) gameMode = GameMode.HARD;
    else if (level >= 11) gameMode = GameMode.MEDIUM;
    
    // Create new game instance FIRST
    this.game = new Game(this.canvas, level, gameMode);
    
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
      // If no game exists, go to mode selector
      this.showModeSelector();
    }
  }

  public goBackToModeSelector(): void {
    this.showModeSelector();
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