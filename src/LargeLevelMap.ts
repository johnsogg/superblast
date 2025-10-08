export interface LargeLevelMapState {
  currentLevel: number;
  maxUnlockedLevel: number;
  completedLevels: number[];
}

export interface LargeLevelMapMode {
  startLevel: number;
  endLevel: number;
}

interface LevelNode {
  level: number;
  x: number;
  y: number;
  connections?: number[];
}

export class LargeLevelMap {
  private svg: SVGElement;
  private state: LargeLevelMapState;
  private mode: LargeLevelMapMode;
  private onLevelSelect: ((level: number) => void) | null = null;

  constructor(svg: SVGElement, mode: LargeLevelMapMode = { startLevel: 1, endLevel: 10 }) {
    this.svg = svg;
    this.mode = mode;
    this.state = {
      currentLevel: mode.startLevel,
      maxUnlockedLevel: mode.startLevel,
      completedLevels: [],
    };
    
    this.render();
  }

  public setMode(mode: LargeLevelMapMode): void {
    this.mode = mode;
    this.render();
  }

  private getLevelNodes(): LevelNode[] {
    // Create a curvy path through all levels in the current mode's range
    // Use the same relative positions but map them to the current level range
    const basePositions = [
      { x: 120, y: 520 }, // Bottom center
      { x: 250, y: 480 }, // Bottom right
      { x: 480, y: 420 }, // Mid-right
      { x: 680, y: 320 }, // Top-right area
      { x: 620, y: 180 }, // Upper-right
      { x: 400, y: 120 }, // Top center
      { x: 180, y: 160 }, // Top left
      { x: 80, y: 280 },  // Mid-left
      { x: 280, y: 360 }, // Center
      { x: 520, y: 280 }, // Mid-right (end)
    ];

    const nodes: LevelNode[] = [];
    const { startLevel, endLevel } = this.mode;
    
    for (let i = 0; i < 10 && startLevel + i <= endLevel; i++) {
      const level = startLevel + i;
      const pos = basePositions[i];
      const connections: number[] = [];
      
      // Add connection to previous level (except for first level)
      if (i > 0) {
        connections.push(level - 1);
      }
      
      // Add connection to next level (except for last level)
      if (i < 9 && startLevel + i + 1 <= endLevel) {
        connections.push(level + 1);
      }
      
      nodes.push({
        level,
        x: pos.x,
        y: pos.y,
        connections
      });
    }
    
    return nodes;
  }

  private drawPath(from: LevelNode, to: LevelNode): void {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Create curved path between nodes
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    // Add curve for more natural path - stronger curves for more interesting layout
    const controlX = midX + (from.y - to.y) * 0.3;
    const controlY = midY + (to.x - from.x) * 0.3;
    
    const pathData = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
    
    path.setAttribute('d', pathData);
    path.setAttribute('class', 'large-level-path');
    
    // Style based on unlock status
    const fromCompleted = this.state.completedLevels.includes(from.level);
    const toUnlocked = to.level <= this.state.maxUnlockedLevel;
    const fromUnlocked = from.level <= this.state.maxUnlockedLevel;
    
    if ((fromCompleted || fromUnlocked) && toUnlocked) {
      path.classList.add('unlocked');
    } else {
      path.classList.add('locked');
    }
    
    this.svg.appendChild(path);
  }

  private drawPadlock(x: number, y: number): void {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'padlock');
    
    // Padlock shackle (the loop part)
    const shackle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shackle.setAttribute('d', `M ${x - 8} ${y - 5} Q ${x - 8} ${y - 15} ${x} ${y - 15} Q ${x + 8} ${y - 15} ${x + 8} ${y - 5}`);
    shackle.setAttribute('class', 'padlock-shackle');
    
    // Padlock body
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', (x - 10).toString());
    body.setAttribute('y', (y - 5).toString());
    body.setAttribute('width', '20');
    body.setAttribute('height', '15');
    body.setAttribute('rx', '2');
    body.setAttribute('class', 'padlock-body');
    
    // Keyhole
    const keyhole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    keyhole.setAttribute('cx', x.toString());
    keyhole.setAttribute('cy', (y + 1).toString());
    keyhole.setAttribute('r', '2');
    keyhole.setAttribute('fill', '#333');
    
    group.appendChild(shackle);
    group.appendChild(body);
    group.appendChild(keyhole);
    
    this.svg.appendChild(group);
  }

  private drawLevelNode(node: LevelNode): void {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'large-level-node');
    
    const isLocked = node.level > this.state.maxUnlockedLevel;
    const isCurrent = node.level === this.state.currentLevel;
    const isCompleted = this.state.completedLevels.includes(node.level);
    
    if (isLocked) {
      group.classList.add('locked');
    }

    // Draw circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x.toString());
    circle.setAttribute('cy', node.y.toString());
    circle.setAttribute('r', '30'); // Larger than small level map
    
    if (isCurrent) {
      circle.setAttribute('class', 'large-level-circle current');
    } else if (!isLocked) {
      circle.setAttribute('class', 'large-level-circle unlocked');
    } else {
      circle.setAttribute('class', 'large-level-circle locked');
    }

    // Add click handler for unlocked levels
    if (!isLocked) {
      group.style.cursor = 'pointer';
      group.addEventListener('click', () => {
        if (this.onLevelSelect) {
          this.onLevelSelect(node.level);
        }
      });
    }

    group.appendChild(circle);

    // Add level number text (show for all levels) - AFTER circle so it appears on top
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x.toString());
    text.setAttribute('y', (node.y + 7).toString()); // Offset for vertical centering
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'large-level-text');
    text.textContent = node.level.toString();
    group.appendChild(text);

    // Show padlock for locked levels (above the number)
    if (isLocked) {
      this.drawPadlock(node.x, node.y - 15); // Move padlock above the circle
    }

    // Add completion checkmark for completed levels
    if (isCompleted) {
      const checkmarkRadius = 38;
      const angle = Math.PI / 6; // 30 degrees
      const checkX = node.x + Math.sin(angle) * checkmarkRadius;
      const checkY = node.y - Math.cos(angle) * checkmarkRadius;
      
      const checkBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      checkBg.setAttribute('cx', checkX.toString());
      checkBg.setAttribute('cy', checkY.toString());
      checkBg.setAttribute('r', '12');
      checkBg.setAttribute('fill', '#4ade80');
      checkBg.setAttribute('stroke', '#22c55e');
      checkBg.setAttribute('stroke-width', '2');
      
      const checkmark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      checkmark.setAttribute('d', `M ${checkX - 6} ${checkY} l 3 3 l 6 -6`);
      checkmark.setAttribute('stroke', '#ffffff');
      checkmark.setAttribute('stroke-width', '3');
      checkmark.setAttribute('stroke-linecap', 'round');
      checkmark.setAttribute('stroke-linejoin', 'round');
      checkmark.setAttribute('fill', 'none');
      
      group.appendChild(checkBg);
      group.appendChild(checkmark);
    }
    this.svg.appendChild(group);
  }

  private render(): void {
    // Clear existing content
    this.svg.innerHTML = '';

    const nodes = this.getLevelNodes();

    // Draw paths first (so they appear behind nodes)
    nodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(connectionLevel => {
          const connectedNode = nodes.find(n => n.level === connectionLevel);
          if (connectedNode && connectionLevel > node.level) {
            // Only draw each path once (from lower to higher level)
            this.drawPath(node, connectedNode);
          }
        });
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      this.drawLevelNode(node);
    });
  }

  public updateState(newState: Partial<LargeLevelMapState>): void {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  public setLevelSelectCallback(callback: (level: number) => void): void {
    this.onLevelSelect = callback;
  }

  public getCurrentLevel(): number {
    return this.state.currentLevel;
  }

  public getMaxUnlockedLevel(): number {
    return this.state.maxUnlockedLevel;
  }

  public getCompletedLevels(): number[] {
    return [...this.state.completedLevels];
  }
}