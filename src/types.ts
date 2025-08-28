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
