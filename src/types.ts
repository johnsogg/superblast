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
  LARGE_LEVEL_MAP = 'large_level_map',
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

export const POINTS = {
  THREE_IN_ROW: 10,
  FOUR_IN_ROW: 20,
  FIVE_IN_ROW: 30,
} as const;

export const LEVEL_DENOMINATORS = {
  1: 5,
  2: 8,
  3: 10,
  4: 12,
  5: 15,
  6: 20,
  7: 25,
  8: 30,
  9: 40,
  10: 50,
} as const;

export const MATCH_PROGRESS_NUMERATORS = {
  3: 1, // 3-match fills 1/denominator
  4: 2, // 4-match fills 2/denominator  
  5: 3, // 5+-match fills 3/denominator
} as const;

// Level-specific symbol probability configuration
export const PRIVILEGED_SYMBOL_PROBABILITY = 0.4; // 40% chance for privileged symbol
export const DOUBLE_POWERUP_PROBABILITY = 0.3; // 30% chance for double power-ups

// Mapping of levels 1-5 to their privileged symbols
export const LEVEL_PRIVILEGED_SYMBOLS = {
  1: SymbolType.LEAF,
  2: SymbolType.SNOWFLAKE,
  3: SymbolType.FIRE,
  4: SymbolType.RAINDROP,
  5: SymbolType.LIGHTNING,
} as const;

// Mapping of levels 6-8 to their promoted power-ups
export const LEVEL_PROMOTED_POWERUPS = {
  6: PowerUpType.FREE_SWAP,
  7: PowerUpType.CLEAR_CELLS,
  8: PowerUpType.SYMBOL_SWAP,
} as const;
