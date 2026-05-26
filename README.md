# Neon Arcade

A browser-based mini-game collection with a cyberpunk neon aesthetic. No build step — open `index.html` or serve the folder with any static server.

## Games

| Game | Description |
|------|-------------|
| **Neon Serpent** | Classic snake with glowing trails and accelerating speed |
| **Cosmic Breakout** | Brick breaker with particle explosions and multi-hit blocks |
| **Memory Matrix** | Flip-and-match card puzzle with combo scoring |
| **Pulse Reflex** | Time your hits when the ring reaches the gold zone |
| **Asteroid Drift** | Dodge asteroids, collect stars, survive as long as possible |

## Play locally

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Then open http://localhost:8080

## Controls

- **Keyboard:** Arrow keys, WASD, Space
- **Mouse:** Click, drag (Breakout paddle)
- **Touch:** On-screen D-pad for Snake and Asteroid Drift

## Tech

Vanilla HTML, CSS, and ES modules. Canvas 2D rendering with responsive scaling and animated starfield background.
