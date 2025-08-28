import { Position } from './types';
import { Renderer } from './Renderer';

export interface InputEvents {
  onCellClick: (position: Position) => void;
  onCellDrag: (from: Position, to: Position) => void;
  onDragUpdate?: (from: Position, to: Position | null, mousePos: { x: number; y: number } | null) => void;
}

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private events: InputEvents;
  private isDragging: boolean = false;
  private dragStart: Position | null = null;
  private mousePosition: { x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement, renderer: Renderer, events: InputEvents) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.events = events;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const position = this.renderer.getPositionFromPixel(x, y);
    if (position) {
      this.isDragging = true;
      this.dragStart = position;
      this.mousePosition = { x, y };
      this.events.onCellClick(position);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.dragStart) {
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.mousePosition = { x, y };
    
    // Update drag target for visual feedback
    const currentPosition = this.renderer.getPositionFromPixel(x, y);
    if (this.events.onDragUpdate) {
      this.events.onDragUpdate(this.dragStart, currentPosition, { x, y });
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDragging || !this.dragStart) {
      this.isDragging = false;
      this.dragStart = null;
      this.mousePosition = null;
      return;
    }

    // Check where the mouse was released
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const endPosition = this.renderer.getPositionFromPixel(x, y);
    
    // If we ended in a different cell that's adjacent to where we started, trigger swap
    if (endPosition && 
        !this.positionsEqual(endPosition, this.dragStart) && 
        this.areAdjacent(this.dragStart, endPosition)) {
      this.events.onCellDrag(this.dragStart, endPosition);
    }

    // Reset drag state and notify
    if (this.events.onDragUpdate) {
      this.events.onDragUpdate(this.dragStart, null, null);
    }
    this.isDragging = false;
    this.dragStart = null;
    this.mousePosition = null;
  }

  private handleMouseLeave(_event: MouseEvent): void {
    this.isDragging = false;
    this.dragStart = null;
    this.mousePosition = null;
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const position = this.renderer.getPositionFromPixel(x, y);
      if (position) {
        this.isDragging = true;
        this.dragStart = position;
        this.mousePosition = { x, y };
        this.events.onCellClick(position);
      }
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDragging || !this.dragStart || event.touches.length === 0) {
      return;
    }
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.mousePosition = { x, y };
    
    // Update drag target for visual feedback
    const currentPosition = this.renderer.getPositionFromPixel(x, y);
    if (this.events.onDragUpdate) {
      this.events.onDragUpdate(this.dragStart, currentPosition, { x, y });
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    if (!this.isDragging || !this.dragStart) {
      this.isDragging = false;
      this.dragStart = null;
      this.mousePosition = null;
      return;
    }

    // For touch end, we use the last known mouse position since changedTouches
    // might not give us the exact final position
    if (this.mousePosition) {
      const endPosition = this.renderer.getPositionFromPixel(this.mousePosition.x, this.mousePosition.y);
      
      // If we ended in a different cell that's adjacent to where we started, trigger swap
      if (endPosition && 
          !this.positionsEqual(endPosition, this.dragStart) && 
          this.areAdjacent(this.dragStart, endPosition)) {
        this.events.onCellDrag(this.dragStart, endPosition);
      }
    }

    // Reset drag state
    this.isDragging = false;
    this.dragStart = null;
    this.mousePosition = null;
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  private areAdjacent(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
}