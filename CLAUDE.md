# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Superblast is a web-based match-3 style game built with TypeScript and HTML5 Canvas. It displays a 9x7 grid of squares with five different symbols (Leaf, Snowflake, Fire, Raindrop, Lightning). Players drag adjacent cells to swap symbols and create matches of 3+ in a row to score points (10/20/30 for 3/4/5+ matches).

## Technology Stack

- **Build Tool**: Vite
- **Language**: TypeScript
- **Testing**: Vitest with jsdom
- **Linting**: ESLint with AirBnB TypeScript configuration
- **Package Manager**: npm

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:run` - Run tests once
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

- `src/` - Source code
  - `types.ts` - Type definitions and constants
  - `GameBoard.ts` - Board state management and game logic
  - `Renderer.ts` - Canvas rendering and visual effects
  - `InputHandler.ts` - Mouse/touch input handling
  - `Game.ts` - Main game controller
  - `main.ts` - Entry point and game initialization
- `test/` - Test files
- `index.html` - Main HTML entry point with canvas
- `vite.config.ts` - Vite configuration
- `vitest.config.ts` - Vitest test configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration