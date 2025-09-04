export interface LevelMapState {
  currentLevel: number;
  completedLevels: number[];
  maxUnlockedLevel: number;
}

interface LevelNode {
  level: number;
  x: number;
  y: number;
  connections?: number[];
}

export class LevelMap {
  private container: HTMLElement;
  private svg: SVGElement | null = null;
  private state: LevelMapState;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      currentLevel: 1,
      completedLevels: [],
      maxUnlockedLevel: 1,
    };
    
    this.createSVG();
    this.render();
  }

  private createSVG(): void {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', '0 0 240 250');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.classList.add('level-map-svg');
    
    this.container.innerHTML = '';
    this.container.appendChild(this.svg);
  }

  private getLevelNodes(): LevelNode[] {
    if (this.state.currentLevel <= 5) {
      // Levels 1-5: Winding vertical path based on sketch
      return [
        { level: 1, x: 120, y: 220, connections: [2] }, // Start at bottom
        { level: 2, x: 180, y: 180, connections: [1, 3] }, // Bottom right
        { level: 3, x: 60, y: 140, connections: [2, 4] }, // Middle left
        { level: 4, x: 180, y: 100, connections: [3, 5] }, // Top right
        { level: 5, x: 120, y: 60, connections: [4] } // Top center
      ];
    } else {
      // Levels 6-10: Sequential winding path based on sketch
      return [
        { level: 6, x: 120, y: 220, connections: [7] }, // Start at bottom center (connected from levels 1-5)
        { level: 7, x: 60, y: 180, connections: [6, 8] }, // Bottom left
        { level: 8, x: 180, y: 140, connections: [7, 9] }, // Middle right
        { level: 9, x: 80, y: 100, connections: [8, 10] }, // Top left
        { level: 10, x: 200, y: 60, connections: [9] } // Top right
      ];
    }
  }

  private drawPath(from: LevelNode, to: LevelNode): void {
    if (!this.svg) return;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Create a curved path between nodes
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    // Add some curve to make it more interesting
    const controlX = midX + (from.y - to.y) * 0.2;
    const controlY = midY + (to.x - from.x) * 0.2;
    
    const pathData = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
    
    path.setAttribute('d', pathData);
    path.setAttribute('class', 'level-path');
    
    // Style the path based on completion status
    const fromCompleted = this.state.completedLevels.includes(from.level);
    const toCompleted = this.state.completedLevels.includes(to.level);
    const toUnlocked = to.level <= this.state.maxUnlockedLevel;
    
    if (fromCompleted && (toCompleted || toUnlocked)) {
      path.classList.add('unlocked');
    } else {
      path.classList.add('locked');
    }
    
    this.svg.appendChild(path);
  }

  private drawContinuationPath(level6Node: LevelNode): void {
    if (!this.svg) return;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Draw a curved path going downward from level 6 to indicate continuation
    const startX = level6Node.x;
    const startY = level6Node.y + 20; // Start from bottom of level 6 circle
    const endX = startX;
    const endY = startY + 30; // Go down
    
    // Add some curve
    const controlX = startX + 10;
    const controlY = startY + 15;
    
    const pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    
    path.setAttribute('d', pathData);
    path.setAttribute('class', 'level-path unlocked');
    path.setAttribute('stroke-dasharray', '3,3'); // Dashed to indicate continuation
    
    this.svg.appendChild(path);
  }

  private drawLevelNode(node: LevelNode): void {
    if (!this.svg) return;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'level-node');

    // Draw circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x.toString());
    circle.setAttribute('cy', node.y.toString());
    circle.setAttribute('r', '20');
    
    // Style based on level status (completed levels use same styling as unlocked but with checkmark)
    if (node.level === this.state.currentLevel) {
      circle.setAttribute('class', 'level-circle current');
    } else if (node.level <= this.state.maxUnlockedLevel || this.state.completedLevels.includes(node.level)) {
      circle.setAttribute('class', 'level-circle unlocked');
    } else {
      circle.setAttribute('class', 'level-circle locked');
    }

    // Add level number text (always show the number)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x.toString());
    text.setAttribute('y', (node.y + 6).toString()); // Offset for vertical centering
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'level-text');
    text.textContent = node.level.toString();

    // Add small green checkmark at 2 o'clock position for completed levels
    if (this.state.completedLevels.includes(node.level)) {
      // Calculate 2 o'clock position (30 degrees from 12 o'clock)
      const angle = Math.PI / 6; // 30 degrees in radians
      const checkmarkRadius = 25; // Slightly outside the circle
      const checkX = node.x + Math.sin(angle) * checkmarkRadius;
      const checkY = node.y - Math.cos(angle) * checkmarkRadius;
      
      // Create small green circle background for checkmark
      const checkBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      checkBg.setAttribute('cx', checkX.toString());
      checkBg.setAttribute('cy', checkY.toString());
      checkBg.setAttribute('r', '8');
      checkBg.setAttribute('fill', '#4ade80');
      checkBg.setAttribute('stroke', '#22c55e');
      checkBg.setAttribute('stroke-width', '1');
      
      // Create checkmark path
      const checkmark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      checkmark.setAttribute('d', `M ${checkX - 4} ${checkY} l 2 2 l 4 -4`);
      checkmark.setAttribute('stroke', '#ffffff');
      checkmark.setAttribute('stroke-width', '2');
      checkmark.setAttribute('stroke-linecap', 'round');
      checkmark.setAttribute('stroke-linejoin', 'round');
      checkmark.setAttribute('fill', 'none');
      
      group.appendChild(checkBg);
      group.appendChild(checkmark);
    }

    group.appendChild(circle);
    group.appendChild(text);
    
    this.svg.appendChild(group);
  }

  private render(): void {
    if (!this.svg) return;

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

    // For levels 6-10, add a downward continuation path from level 6 to indicate connection from levels 1-5
    if (this.state.currentLevel > 5) {
      const level6Node = nodes.find(n => n.level === 6);
      if (level6Node) {
        this.drawContinuationPath(level6Node);
      }
    }

    // Draw nodes
    nodes.forEach(node => {
      this.drawLevelNode(node);
    });
  }

  public updateState(newState: Partial<LevelMapState>): void {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  public getCurrentLevel(): number {
    return this.state.currentLevel;
  }

  public getCompletedLevels(): number[] {
    return [...this.state.completedLevels];
  }
}