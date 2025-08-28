# Superblast!

## Development Process

I want to focus on showing interactive graphics at all points.

## Overview

This is a web browser based game. It is single player.

It shows one screen at a time. There is no scrolling.

The main game board shows a 9x7 (9 wide, 7 high) grid of squares. The board
should take the full height and width of the screen.

Each square can hold one of five symbols:

- Leaf (green)
- Snowflake (light blue)
- Fire (red)
- Raindrop (dark blue)
- Lightning (yellow)

The initial configuration for the game is to randomly assign a symbol to each
cell on the board, subject to the constraint that a symbol can not be a neighbor
to the same symbol.

The player is able to pick a cell and a neighboring cell and swap their symbols.
This is done by sliding the mouse from one cell into an adjacent cell. If by
doing this the board now has three or more of the same symbol in a row, the
symbols in those cells disappear and the player is awarded points:

- 10 points for 3 in a row
- 20 points for 4 in a row
- 30 points for 5 in a row
