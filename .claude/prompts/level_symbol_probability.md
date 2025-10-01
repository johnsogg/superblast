# Level Symbol Probability

Currently, when a match is made, the game will choose new symbols to reappear in
the cleared cells. They currently have equal probability.

## Levels 1 to 5

We are going to update levels 1 through 5 to use non-uniform probability. Each
level will have one 'privileged' symbol that has a higher probability of
appearing than the other symbols.

- Level 1: Leaf
- Level 2: Snowflake
- Level 3: Flame
- Level 4: Raindrop
- Level 5: Lightning Bolt

The privileged symbol has a 40% chance of appearing. Make this a tunable
parameter.

There is one exception to this rule. If a match is for cells with the privileged
symbol, then the probability is uniform (do not use the privileged probability
distribution).

# Levels 6 to 8

When you receive power-ups, there is a chance that you will receive two of the
same power-up. Each level promotes a different power-up:

- Level 6: Free Swap
- Level 7: Clear Cells
- Level 8: Symbol Swap

The probability of getting a double is 30%. Make this a tunable parameter.

# Levels 9 and 10

These levels don't have any special probability bonuses.
