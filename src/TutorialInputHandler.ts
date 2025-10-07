import { Position, PowerUpType } from './types';
import { TutorialRenderer } from './TutorialRenderer';

export interface TutorialInputEvents {
  onCellClick: (position: Position) => void;
  onCellDrag: (from: Position, to: Position) => void;
  onDragUpdate?: (from: Position, to: Position | null, mousePos: { x: number; y: number } | null) => void;
  onPowerUpDrag: (powerUpType: PowerUpType, targetPosition: Position) => void;
  onPowerUpDragUpdate?: (powerUpType: PowerUpType, targetPosition: Position | null, mousePos: { x: number; y: number } | null) => void;
}

export class TutorialInputHandler {
  private canvas: HTMLCanvasElement;
  private renderer: TutorialRenderer;
  private events: TutorialInputEvents;
  private isDragging: boolean = false;
  private dragStart: Position | null = null;
  private mousePosition: { x: number; y: number } | null = null;
  private isPowerUpDragging: boolean = false;
  private powerUpDragType: PowerUpType | null = null;

  constructor(canvas: HTMLCanvasElement, renderer: TutorialRenderer, events: TutorialInputEvents) {
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
    
    // Power-up drag event listeners
    this.setupPowerUpListeners();
  }

  private setupPowerUpListeners(): void {
    const powerUpItems = document.querySelectorAll('.power-up-item');
    
    powerUpItems.forEach(item => {
      const powerUpType = item.getAttribute('data-type') as PowerUpType;
      if (!powerUpType) return;

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.startPowerUpDrag(powerUpType, e as MouseEvent);
      });

      item.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = (e as TouchEvent).touches[0];
        this.startPowerUpDrag(powerUpType, touch);
      }, { passive: false });
    });

    // Global mouse/touch move and up for power-up dragging
    document.addEventListener('mousemove', this.handlePowerUpMouseMove.bind(this));
    document.addEventListener('mouseup', this.handlePowerUpMouseUp.bind(this));
    document.addEventListener('touchmove', this.handlePowerUpTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handlePowerUpTouchEnd.bind(this));
  }

  private startPowerUpDrag(powerUpType: PowerUpType, event: MouseEvent | Touch): void {
    this.isPowerUpDragging = true;
    this.powerUpDragType = powerUpType;
    this.mousePosition = { x: event.clientX, y: event.clientY };
  }

  private handlePowerUpMouseMove(e: MouseEvent): void {
    if (!this.isPowerUpDragging || !this.powerUpDragType) return;

    this.mousePosition = { x: e.clientX, y: e.clientY };
    const canvasPos = this.getCanvasPosition(e.clientX, e.clientY);
    const boardPos = canvasPos ? this.renderer.screenToBoard(canvasPos.x, canvasPos.y) : null;

    if (this.events.onPowerUpDragUpdate) {
      this.events.onPowerUpDragUpdate(this.powerUpDragType, boardPos, this.mousePosition);
    }
  }

  private handlePowerUpMouseUp(e: MouseEvent): void {
    if (!this.isPowerUpDragging || !this.powerUpDragType) return;

    const canvasPos = this.getCanvasPosition(e.clientX, e.clientY);
    const boardPos = canvasPos ? this.renderer.screenToBoard(canvasPos.x, canvasPos.y) : null;

    if (boardPos) {
      this.events.onPowerUpDrag(this.powerUpDragType, boardPos);
    }

    const powerUpType = this.powerUpDragType;
    this.isPowerUpDragging = false;
    this.powerUpDragType = null;
    this.mousePosition = null;

    if (this.events.onPowerUpDragUpdate) {
      this.events.onPowerUpDragUpdate(powerUpType, null, null);
    }
  }

  private handlePowerUpTouchMove(e: TouchEvent): void {
    if (!this.isPowerUpDragging || !this.powerUpDragType) return;

    e.preventDefault();
    const touch = e.touches[0];
    this.mousePosition = { x: touch.clientX, y: touch.clientY };
    const canvasPos = this.getCanvasPosition(touch.clientX, touch.clientY);
    const boardPos = canvasPos ? this.renderer.screenToBoard(canvasPos.x, canvasPos.y) : null;

    if (this.events.onPowerUpDragUpdate) {
      this.events.onPowerUpDragUpdate(this.powerUpDragType, boardPos, this.mousePosition);
    }
  }

  private handlePowerUpTouchEnd(e: TouchEvent): void {
    if (!this.isPowerUpDragging || !this.powerUpDragType) return;

    const touch = e.changedTouches[0];
    const canvasPos = this.getCanvasPosition(touch.clientX, touch.clientY);
    const boardPos = canvasPos ? this.renderer.screenToBoard(canvasPos.x, canvasPos.y) : null;

    if (boardPos) {
      this.events.onPowerUpDrag(this.powerUpDragType, boardPos);
    }

    const powerUpType = this.powerUpDragType;
    this.isPowerUpDragging = false;
    this.powerUpDragType = null;
    this.mousePosition = null;

    if (this.events.onPowerUpDragUpdate) {
      this.events.onPowerUpDragUpdate(powerUpType, null, null);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const position = this.getPositionFromEvent(e);
    if (!position) return;

    this.isDragging = true;
    this.dragStart = position;
    this.mousePosition = { x: e.clientX, y: e.clientY };
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.dragStart) return;

    this.mousePosition = { x: e.clientX, y: e.clientY };
    const currentPosition = this.getPositionFromEvent(e);

    if (this.events.onDragUpdate) {
      this.events.onDragUpdate(this.dragStart, currentPosition, this.mousePosition);
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.isDragging || !this.dragStart) return;

    const endPosition = this.getPositionFromEvent(e);
    const dragStart = this.dragStart;
    
    if (endPosition) {
      if (endPosition.x === this.dragStart.x && endPosition.y === this.dragStart.y) {
        this.events.onCellClick(this.dragStart);
      } else {
        this.events.onCellDrag(this.dragStart, endPosition);
      }
    }

    this.isDragging = false;
    this.dragStart = null;
    this.mousePosition = null;

    if (this.events.onDragUpdate) {
      this.events.onDragUpdate(dragStart, null, null);
    }
  }

  private handleMouseLeave(): void {
    const dragStart = this.dragStart;
    this.isDragging = false;
    this.dragStart = null;
    this.mousePosition = null;

    if (this.events.onDragUpdate && dragStart) {
      this.events.onDragUpdate(dragStart, null, null);
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const position = this.getPositionFromTouch(touch);
    if (!position) return;

    this.isDragging = true;
    this.dragStart = position;
    this.mousePosition = { x: touch.clientX, y: touch.clientY };
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging || !this.dragStart) return;

    e.preventDefault();
    const touch = e.touches[0];
    this.mousePosition = { x: touch.clientX, y: touch.clientY };
    const currentPosition = this.getPositionFromTouch(touch);

    if (this.events.onDragUpdate) {
      this.events.onDragUpdate(this.dragStart, currentPosition, this.mousePosition);
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.isDragging || !this.dragStart) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    const endPosition = this.getPositionFromTouch(touch);
    const dragStart = this.dragStart;
    
    if (endPosition) {
      if (endPosition.x === this.dragStart.x && endPosition.y === this.dragStart.y) {
        this.events.onCellClick(this.dragStart);
      } else {
        this.events.onCellDrag(this.dragStart, endPosition);
      }
    }

    this.isDragging = false;
    this.dragStart = null;
    this.mousePosition = null;

    if (this.events.onDragUpdate) {
      this.events.onDragUpdate(dragStart, null, null);
    }
  }

  private getPositionFromEvent(e: MouseEvent): Position | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return this.renderer.screenToBoard(x, y);
  }

  private getPositionFromTouch(touch: Touch): Position | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    return this.renderer.screenToBoard(x, y);
  }

  private getCanvasPosition(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    if (canvasX >= 0 && canvasX <= rect.width && canvasY >= 0 && canvasY <= rect.height) {
      return { x: canvasX, y: canvasY };
    }
    
    return null;
  }

  public refreshPowerUpListeners(): void {
    // Re-setup power-up listeners for tutorial sidebar power-ups
    this.setupPowerUpListeners();
  }
}