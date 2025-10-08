export enum SymbolType {
  LEAF = "leaf",
  SNOWFLAKE = "snowflake",
  FIRE = "fire",
  RAINDROP = "raindrop",
  LIGHTNING = "lightning",
}

export interface Position {
  x: number;
  y: number;
}

export interface Cell {
  symbol: SymbolType;
  position: Position;
}

export interface GameState {
  board: Cell[][];
  score: number;
  selectedCell: Position | null;
  isSwapping: boolean;
  swapAnimation: SwapAnimation | null;
  matchAnimations: MatchAnimation[];
  timer: TimerState;
  level: LevelState;
  showLevelCompletionPopup: boolean;
  showLevelFailedPopup: boolean;
  powerUps: PowerUp[];
  powerUpDragState: PowerUpDragState | null;
  activePowerUp: PowerUpType | null;
  greenCell: Position | null;
  isPaused: boolean;
  showPausePopup: boolean;
}

export interface TimerState {
  timeRemaining: number; // in milliseconds
  isActive: boolean;
  startTime: number; // performance.now() when timer started
  pausedTime: number; // total time spent paused in milliseconds
}

export interface LevelState {
  currentLevel: number;
  maxUnlockedLevel: number; // highest level the player has reached
  progress: number; // 0 to 1 (0% to 100%)
  progressDenominator: number; // the denominator for this level
  completedLevels: number[]; // levels that have been fully completed
}

export enum AppState {
  HOME = 'home',
  GAME = 'game',
  LEVEL_SELECT = 'level_select',
  MODE_SELECTOR = 'mode_selector',
  LARGE_LEVEL_MAP = 'large_level_map',
  TUTORIAL = 'tutorial',
}

export enum GameMode {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface ModeConfig {
  levels: [number, number]; // [start, end] level range
  timeLimit: number; // in milliseconds
  privilegedSymbolLevels: number[]; // levels with privileged symbols
  promotedPowerUpLevels: number[]; // levels with promoted power-ups
}

export enum PopupAction {
  HOME = 'home',
  PLAY_NEXT = 'play_next',
  LEVEL_MAP = 'level_map',
  RESUME = 'resume',
  RESTART_LEVEL = 'restart_level',
}

export enum PowerUpType {
  FREE_SWAP = 'free_swap',
  CLEAR_CELLS = 'clear_cells',
  SYMBOL_SWAP = 'symbol_swap',
}

export interface PowerUp {
  type: PowerUpType;
  count: number;
}

export interface PowerUpDragState {
  powerUpType: PowerUpType;
  mousePosition: { x: number; y: number };
  targetCell: Position | null;
}

export interface SwapAnimation {
  from: Position;
  to: Position;
  progress: number; // 0 to 1
  startTime: number;
  duration: number;
}

export interface DragState {
  from: Position;
  to: Position | null;
  mousePosition: { x: number; y: number } | null;
}

export interface MatchAnimationCopy {
  startPosition: Position;
  currentPosition: { x: number; y: number };
  targetEdge: 'top' | 'bottom' | 'left' | 'right';
  symbol: SymbolType;
}

export interface MatchAnimation {
  copies: MatchAnimationCopy[];
  progress: number; // 0 to 1
  startTime: number;
  duration: number;
}

export interface Match {
  positions: Position[];
  symbol: SymbolType;
  length: number;
}

export const SYMBOL_COLORS = {
  [SymbolType.LEAF]: "#4ade80", // green
  [SymbolType.SNOWFLAKE]: "#7dd3fc", // light blue
  [SymbolType.FIRE]: "#ef4444", // red
  [SymbolType.RAINDROP]: "#1e40af", // dark blue
  [SymbolType.LIGHTNING]: "#eab308", // yellow
} as const;

export const BOARD_WIDTH = 9;
export const BOARD_HEIGHT = 7;

// Tutorial board dimensions
export const TUTORIAL_BOARD_WIDTH = 5;
export const TUTORIAL_BOARD_HEIGHT = 6;

export const POINTS = {
  THREE_IN_ROW: 10,
  FOUR_IN_ROW: 20,
  FIVE_IN_ROW: 30,
} as const;

export const LEVEL_DENOMINATORS = {
  1: 5, 2: 8, 3: 10, 4: 12, 5: 15, 6: 20, 7: 25, 8: 30, 9: 40, 10: 50,
  11: 5, 12: 8, 13: 10, 14: 12, 15: 15, 16: 20, 17: 25, 18: 30, 19: 40, 20: 50,
  21: 5, 22: 8, 23: 10, 24: 12, 25: 15, 26: 20, 27: 25, 28: 30, 29: 40, 30: 50,
} as const;

export const MATCH_PROGRESS_NUMERATORS = {
  3: 1, // 3-match fills 1/denominator
  4: 2, // 4-match fills 2/denominator  
  5: 3, // 5+-match fills 3/denominator
} as const;

// Level-specific symbol probability configuration
export const PRIVILEGED_SYMBOL_PROBABILITY = 0.4; // 40% chance for privileged symbol
export const DOUBLE_POWERUP_PROBABILITY = 0.3; // 30% chance for double power-ups

// Mapping of levels with privileged symbols
export const LEVEL_PRIVILEGED_SYMBOLS = {
  // Easy mode (1-5)
  1: SymbolType.LEAF,
  2: SymbolType.SNOWFLAKE,
  3: SymbolType.FIRE,
  4: SymbolType.RAINDROP,
  5: SymbolType.LIGHTNING,
  // Medium mode (11-15)
  11: SymbolType.LEAF,
  12: SymbolType.SNOWFLAKE,
  13: SymbolType.FIRE,
  14: SymbolType.RAINDROP,
  15: SymbolType.LIGHTNING,
} as const;

// Mapping of levels with promoted power-ups
export const LEVEL_PROMOTED_POWERUPS = {
  // Easy mode (6-8)
  6: PowerUpType.FREE_SWAP,
  7: PowerUpType.CLEAR_CELLS,
  8: PowerUpType.SYMBOL_SWAP,
  // Hard mode (26-28)
  26: PowerUpType.FREE_SWAP,
  27: PowerUpType.CLEAR_CELLS,
  28: PowerUpType.SYMBOL_SWAP,
} as const;

// Game mode configurations
export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  [GameMode.EASY]: {
    levels: [1, 10],
    timeLimit: 2 * 60 * 1000, // 2 minutes
    privilegedSymbolLevels: [1, 2, 3, 4, 5],
    promotedPowerUpLevels: [6, 7, 8],
  },
  [GameMode.MEDIUM]: {
    levels: [11, 20],
    timeLimit: 1 * 60 * 1000, // 1 minute
    privilegedSymbolLevels: [11, 12, 13, 14, 15],
    promotedPowerUpLevels: [],
  },
  [GameMode.HARD]: {
    levels: [21, 30],
    timeLimit: 30 * 1000, // 30 seconds
    privilegedSymbolLevels: [],
    promotedPowerUpLevels: [26, 27, 28],
  },
} as const;

// Tutorial-specific types
export enum TutorialPhase {
  MATCH_THREE = 'match_three',
  MATCH_FOUR = 'match_four',
  MATCH_FIVE = 'match_five',
  POWER_UP_FREE_SWAP = 'power_up_free_swap',
  POWER_UP_CLEAR_CELLS = 'power_up_clear_cells',
  POWER_UP_SYMBOL_SWAP = 'power_up_symbol_swap',
  COMPLETE = 'complete',
}

export interface TutorialState {
  currentPhase: TutorialPhase;
  phaseProgress: number; // 0 to 1
  instructionText: string;
  highlightedCells: Position[];
  nextButtonVisible: boolean;
  completed: boolean;
}
