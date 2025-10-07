# Tutorial (the Learn button)

When the user presses the Learn button from the initial screen, they are put
into a tutorial.

In the tutorial there is somebody "talking" in text to the player on the left
side of the screen. This is the tutorial text. There is a smaller version of the
game on the right. The small version is a 5-wide by 6-high grid for the game
board.

There are a few phases to the tutorial.

## Tutorial Phase 1 (making matches)

In this phase the player is introduced to the game. The game board must be
pre-populated with symbols where it is possible to complete at least one match
of three.

The tutorial text is this:

"Welcome to Superblast! Make a match of three by dragging a symbol to a
neighboring cell to make three in a row. No diagonals here - matches can be made
vertically or horizontally. Go ahead and make a match of three. You get 10
points for making a match of three."

The user should then make a match of three. It should play the animation as
normal, and when it is complete, make a new board with the same dimensions, and
ensure that there is a possible match of four available.

"Good Job! Now, you can also make a match of four. See if you can find a match
of four to make. You get 20 points for a match of 4. Go ahead and make a match
of four."

Like earlier, the user should make a match of 4. If it becomes impossible for
them to make a match of four, re-build the screen so that it is possible. When
the player makes a match of four, rebuild the board so that it is possible to
make a match of five.

"Great. You can also make a match of five, and you get 30 points for doing that.
See if you can do that now."

As before, the user is expected to make a match of 5 in a row. Also as before if
it is impossible to make a match of five, re-build the board so that it is
possible. When they finally make a match of five, enter tutorial phase 2.

## Tutorial Phase 2 (power-ups)

First, re-build the board so that there are no possible matches. We're going to
introduce power-ups next. To start, add 10 Free Swap power-ups.

The tutorial text continues:

"You are awarded power-ups throughout the game, and they can help you do amazing
things. There are three kinds of power-ups. The first kind is Free Swap. This
lets you swap out one symbol with any other symbol on the board. You can get
Free Swap power-ups by making a match of four. Try it now and make a match."

The user should now use a Free Swap to form a match. If it becomes impossible
for them to make a match, re-build the board as was done at the beginning of
tutorial phase 2. Once they do form a match, re-build the board one more time so
it is impossible to make a make a match. Give the player 10 Clear Cells power
ups and continue on. Take away all other power ups.

Tutorial text:

"The next power-up is called Clear Cells and it will re-roll a 3x3 grid of cells
around your selected spot. Try it now, and form a match."

Once the user has made a match, then keep going. Set up the board and ensuring
that there are no matches possible. Give the player 10 symbol swap power-ups and
take away all other power-ups.

Tutorial text:

"The last power-up is called Symbol Swap. This will exchange _all_ instances of
one symbol with some other symbol that you choose. Go ahead and try this now, to
form a match."

## Ending the tutorial

After the power-ups, it simply says:

"Good luck, and have fun!"

Then, after a 3 second pause, return to the home screen.
