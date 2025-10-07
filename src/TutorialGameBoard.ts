import { SymbolType, Cell, Position, Match, TUTORIAL_BOARD_WIDTH, TUTORIAL_BOARD_HEIGHT } from './types';

export class TutorialGameBoard {
  private board: Cell[][];
  private width: number;
  private height: number;

  constructor() {
    this.width = TUTORIAL_BOARD_WIDTH;
    this.height = TUTORIAL_BOARD_HEIGHT;
    this.board = this.generateBoard();
  }

  public getBoard(): Cell[][] {
    return this.board;
  }

  public getCell(position: Position): Cell | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this.board[position.y][position.x];
  }

  public setCell(position: Position, symbol: SymbolType): void {
    if (!this.isValidPosition(position)) {
      return;
    }
    this.board[position.y][position.x].symbol = symbol;
  }

  public swapCells(pos1: Position, pos2: Position): boolean {
    if (!this.areAdjacent(pos1, pos2)) {
      return false;
    }

    const cell1 = this.getCell(pos1);
    const cell2 = this.getCell(pos2);

    if (!cell1 || !cell2) {
      return false;
    }

    const temp = cell1.symbol;
    cell1.symbol = cell2.symbol;
    cell2.symbol = temp;

    return true;
  }

  public areAdjacent(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  public isValidPosition(position: Position): boolean {
    return position.x >= 0 && position.x < this.width &&
           position.y >= 0 && position.y < this.height;
  }

  public findMatches(): Match[] {
    const matches: Match[] = [];
    
    // Check horizontal matches
    for (let y = 0; y < this.height; y++) {
      let currentSymbol = this.board[y][0].symbol;
      let matchStart = 0;
      let matchLength = 1;

      for (let x = 1; x < this.width; x++) {
        if (this.board[y][x].symbol === currentSymbol) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            matches.push(this.createMatch(matchStart, y, matchLength, true, currentSymbol));
          }
          currentSymbol = this.board[y][x].symbol;
          matchStart = x;
          matchLength = 1;
        }
      }

      if (matchLength >= 3) {
        matches.push(this.createMatch(matchStart, y, matchLength, true, currentSymbol));
      }
    }

    // Check vertical matches
    for (let x = 0; x < this.width; x++) {
      let currentSymbol = this.board[0][x].symbol;
      let matchStart = 0;
      let matchLength = 1;

      for (let y = 1; y < this.height; y++) {
        if (this.board[y][x].symbol === currentSymbol) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            matches.push(this.createMatch(x, matchStart, matchLength, false, currentSymbol));
          }
          currentSymbol = this.board[y][x].symbol;
          matchStart = y;
          matchLength = 1;
        }
      }

      if (matchLength >= 3) {
        matches.push(this.createMatch(x, matchStart, matchLength, false, currentSymbol));
      }
    }

    return matches;
  }

  public getRandomSymbol(): SymbolType {
    const symbols = Object.values(SymbolType);
    return symbols[Math.floor(Math.random() * symbols.length)];
  }

  public getRandomSymbolExcluding(excludeSymbols: SymbolType[]): SymbolType {
    const symbols = Object.values(SymbolType);
    const availableSymbols = symbols.filter(symbol => !excludeSymbols.includes(symbol));
    
    if (availableSymbols.length === 0) {
      return symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    return availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
  }

  private generateBoard(): Cell[][] {
    const board: Cell[][] = [];
    
    // Initialize empty board structure
    for (let y = 0; y < this.height; y++) {
      board.push([]);
      for (let x = 0; x < this.width; x++) {
        board[y].push({ symbol: SymbolType.FIRE, position: { x, y } }); // temporary
      }
    }
    
    // Fill board ensuring no initial matches
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const leftSymbol = (x > 0) ? board[y][x - 1].symbol : null;
        const upSymbol = (y > 0) ? board[y - 1][x].symbol : null;
        
        const symbol = this.getSymbolThatIsnt(leftSymbol, upSymbol);
        board[y][x].symbol = symbol;
      }
    }
    
    return board;
  }

  private createMatch(x: number, y: number, length: number, horizontal: boolean, symbol: SymbolType): Match {
    const positions: Position[] = [];
    
    for (let i = 0; i < length; i++) {
      positions.push({
        x: horizontal ? x + i : x,
        y: horizontal ? y : y + i,
      });
    }
    
    return { positions, symbol, length };
  }

  private getSymbolThatIsnt(leftSymbol: SymbolType | null, upSymbol: SymbolType | null): SymbolType {
    const symbols = Object.values(SymbolType);
    const excludeSymbols = new Set<SymbolType>();
    
    if (leftSymbol) excludeSymbols.add(leftSymbol);
    if (upSymbol) excludeSymbols.add(upSymbol);
    
    const availableSymbols = symbols.filter(symbol => !excludeSymbols.has(symbol));
    
    // With 5 symbols and at most 2 excluded, we always have options
    return availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
  }

  // Tutorial-specific board generation methods
  public generateBoardWithMatch(targetMatchLength: number): void {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      this.board = this.generateBoard();
      
      if (this.hasPossibleMatch(targetMatchLength)) {
        return;
      }
      
      attempts++;
    }
    
    // If we can't find a random board with the desired match, force create one
    this.forceCreateMatch(targetMatchLength);
  }

  public generateBoardWithNoMatches(): void {
    this.board = this.generateBoard();
    
    // Make sure no matches are possible by checking all possible swaps
    while (this.hasAnyPossibleMatch()) {
      this.scrambleBoard();
    }
  }

  public hasPossibleMatch(targetLength: number): boolean {
    // Check all possible swaps to see if we can create a match of targetLength
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const adjacents = this.getAdjacentPositions({ x, y });
        
        for (const adjacent of adjacents) {
          // Temporarily swap
          const original1 = this.board[y][x].symbol;
          const original2 = this.board[adjacent.y][adjacent.x].symbol;
          
          this.board[y][x].symbol = original2;
          this.board[adjacent.y][adjacent.x].symbol = original1;
          
          // Check for matches
          const matches = this.findMatches();
          const hasTargetMatch = matches.some(match => match.length >= targetLength);
          
          // Restore
          this.board[y][x].symbol = original1;
          this.board[adjacent.y][adjacent.x].symbol = original2;
          
          if (hasTargetMatch) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private hasAnyPossibleMatch(): boolean {
    return this.hasPossibleMatch(3);
  }

  private forceCreateMatch(targetLength: number): void {
    // Find a good position to create a horizontal match
    const row = Math.floor(this.height / 2);
    const startCol = Math.floor((this.width - targetLength) / 2);
    
    // Choose a symbol for the match
    const targetSymbol = this.getRandomSymbol();
    
    // Create the exact match we need by placing symbols
    for (let i = 0; i < targetLength; i++) {
      this.board[row][startCol + i].symbol = targetSymbol;
    }
    
    // Now shuffle one symbol to make it require a swap
    if (targetLength >= 3) {
      const shuffleIndex = Math.floor(Math.random() * targetLength);
      const newSymbol = this.getRandomSymbolExcluding([targetSymbol]);
      this.board[row][startCol + shuffleIndex].symbol = newSymbol;
    }
  }

  private scrambleBoard(): void {
    // Randomly swap some cells to break potential matches
    const swapCount = 5;
    
    for (let i = 0; i < swapCount; i++) {
      const pos1 = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
      
      const pos2 = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
      
      const temp = this.board[pos1.y][pos1.x].symbol;
      this.board[pos1.y][pos1.x].symbol = this.board[pos2.y][pos2.x].symbol;
      this.board[pos2.y][pos2.x].symbol = temp;
    }
  }

  private getAdjacentPositions(pos: Position): Position[] {
    const adjacents: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ];
    
    for (const dir of directions) {
      const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (this.isValidPosition(newPos)) {
        adjacents.push(newPos);
      }
    }
    
    return adjacents;
  }

  public rebuildBoard(): void {
    this.board = this.generateBoard();
  }
}