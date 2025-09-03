# Superblast Game Rules

## Overview

Superblast is a match-3 puzzle game where players swap adjacent symbols to create lines of three or more matching symbols to score points.

## Game Setup

### Board

- **Size**: 9×7 grid (9 columns, 7 rows)
- **Symbols**: 5 types with distinct colors
  - Leaf (green)
  - Snowflake (light blue)
  - Fire (red)
  - Raindrop (dark blue)
  - Lightning (yellow)

### Initial Board Generation

- Symbols are placed to prevent initial matches
- Each position excludes symbols that would create 3+ consecutive matches with adjacent cells

## Core Mechanics

### Swapping

- **Action**: Drag any cell to an adjacent cell (horizontal/vertical, not diagonal)
- **Validation**: All adjacent swaps are allowed
- **Animation**: 300ms smooth swap animation with easing

### Matching

- **Requirement**: 3 or more identical symbols in a straight line (horizontal or vertical)
- **Detection**: Automatic after each swap
- **Processing**: Simultaneous processing of all matches found

### Match Animation

- **Effect**: Each matched symbol creates 4 smaller copies (half area)
- **Movement**: Copies move to nearest board edges (top/bottom/left/right)
- **Duration**: 1 second fade-out while moving
- **Timing**: Animation completes before symbol removal

### Failed Swaps

- **Condition**: Swap that creates no matches
- **Behavior**:
  - Swap remains visible for 1 second
  - Automatic reversion with 300ms animation
  - Returns to original configuration

## Scoring System

- **3 in a row**: 10 points
- **4 in a row**: 20 points
- **5+ in a row**: 30 points
- **Cascades**: Chain reactions score additional points

## Game Flow

### Turn Sequence

1. Player drags symbol to adjacent cell
2. Swap animation plays (300ms)
3. Check for matches
4. **If matches found**:
   - Calculate and add score
   - Play match animation (1000ms)
   - Remove matched symbols
   - Replace with new random symbols
   - Check for new matches (cascade)
   - Repeat until no matches
5. **If no matches**:
   - Wait 1 second
   - Revert swap with animation (300ms)

### Cascading

- New symbols may create additional matches
- Each cascade scores points normally
- Process continues until no matches remain

## Input Controls

- **Mouse**: Click and drag to swap
- **Touch**: Touch and drag for mobile support
- **Visual Feedback**:
  - Selected cell highlighted with white border
  - Drag target highlighted with yellow border
  - Dragged symbol follows cursor

## Technical Constraints

- **Adjacency**: Only orthogonal moves (no diagonal)
- **Single Action**: One swap at a time
- **Animation Blocking**: Input disabled during animations
- **Symbol Generation**: Random selection excluding patterns that create immediate matches
