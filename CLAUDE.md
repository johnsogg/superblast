# CLAUDE.md

Important: refer to @GAME.md for all game mechanics and player flow.

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

## Runtime Considerations

- The app is usually already running - ask the user before trying to start it, or assume that it is running.