# Agent instructions

## Project shape

- This is a static Vanilla JS/HTML/CSS game; there is no package manifest, bundler, test runner, linter, or build step.
- The runnable entrypoint is `src/index.html`. The browser loads scripts in this required order: `maze.js` → `game.js` → `render.js` → `main.js`; the files communicate through globals, so preserve that order unless the architecture is deliberately changed.
- Keep responsibilities separated: `maze.js` defines immutable maze/start data, `game.js` owns state and rules, `render.js` draws the canvas, and `main.js` owns input, lifecycle, and the animation loop.

## Development and verification

- Run locally by serving `src/` as the web root (for example, `python -m http.server 8000 --directory src`) and opening `http://localhost:8000/`; there is no repository-provided dev server.
- Verify changes manually in the browser: start/restart the game, move with arrow keys, eat dots, use the row-14 tunnel, confirm ghost collisions reduce lives, and confirm both win and loss overlays.
- There are no automated checks in this repository; do not claim tests passed unless you performed the browser checks above.

## Game-specific constraints

- The maze is a 28×31 grid. `MAZE` is the pristine source; each `createGame()` copies it into `game.grid` because dots are consumed during play.
- Tile values are part of the rules: `1` wall, `2` dot, `3` ghost-house door, and `0` traversable space. Pac-Man cannot cross the door; ghosts can.
- Movement is fractional cells per animation frame and is snapped at aligned cells. Changes to movement, collision, or tunnel behavior must preserve this alignment logic.

## Spec workflow

- The repository includes local skills in `.agents/skills/` and locks them in `skills-lock.json`. For spec-driven work, read the relevant skill before editing; `spec-impl` only implements specs whose state is explicitly Approved/Aprobado.
