import { SymbolType, Cell, Position, Match, BOARD_WIDTH, BOARD_HEIGHT } from './types';

export class GameBoard {
  private board: Cell[][];

  constructor() {
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

  public forceSwapCells(pos1: Position, pos2: Position): boolean {
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

  public removeCells(positions: Position[]): void {
    positions.forEach(pos => {
      if (this.isValidPosition(pos)) {
        this.board[pos.y][pos.x].symbol = this.getRandomSymbol();
      }
    });
  }

  public swapAllSymbols(targetSymbol: SymbolType): void {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.board[y][x].symbol === targetSymbol) {
          this.board[y][x].symbol = this.getRandomSymbol();
        }
      }
    }
  }

  public findMatches(): Match[] {
    const matches: Match[] = [];
    
    // Check horizontal matches
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      let currentSymbol = this.board[y][0].symbol;
      let matchStart = 0;
      let matchLength = 1;

      for (let x = 1; x < BOARD_WIDTH; x++) {
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
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let currentSymbol = this.board[0][x].symbol;
      let matchStart = 0;
      let matchLength = 1;

      for (let y = 1; y < BOARD_HEIGHT; y++) {
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

  public removeMatches(matches: Match[]): void {
    const toRemove = new Set<string>();
    
    matches.forEach(match => {
      match.positions.forEach(pos => {
        toRemove.add(`${pos.x},${pos.y}`);
      });
    });

    // Generate new random symbols for removed positions
    toRemove.forEach(posStr => {
      const [x, y] = posStr.split(',').map(Number);
      this.board[y][x].symbol = this.getRandomSymbol();
    });
  }

  private generateBoard(): Cell[][] {
    const board: Cell[][] = [];
    
    // Initialize empty board structure
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      board.push([]);
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y].push({ symbol: SymbolType.FIRE, position: { x, y } }); // temporary
      }
    }
    
    // Fill board following your algorithm exactly
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const leftSymbol = (x > 0) ? board[y][x - 1].symbol : null;
        const upSymbol = (y > 0) ? board[y - 1][x].symbol : null;
        
        const symbol = this.getSymbolThatIsnt(leftSymbol, upSymbol);
        board[y][x].symbol = symbol;
      }
    }
    
    return board;
  }



  private areAdjacent(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  private isValidPosition(position: Position): boolean {
    return position.x >= 0 && position.x < BOARD_WIDTH &&
           position.y >= 0 && position.y < BOARD_HEIGHT;
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

  private getRandomSymbol(): SymbolType {
    const symbols = Object.values(SymbolType);
    return symbols[Math.floor(Math.random() * symbols.length)];
  }
}