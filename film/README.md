# RepoPilot cinematic product film

Self-contained Remotion composition for the RepoPilot launch film:

> UNDERSTAND THE CODE. SEE THE CONNECTIONS.

## Setup

Requires Node.js 22 (the repository root pins this in `.nvmrc`). From this
directory:

```bash
npm ci
```

## Preview

```bash
npm run start
```

Open the Remotion Studio URL printed by the command and select `RepoPilotFilm`.

## Checks and render

```bash
npm run typecheck
npm run render
```

The render is written to `film/out/repopilot-film.mp4`. The film is 16:9,
30fps, 1,740 frames (58 seconds), and contains ten authored scenes. Motion is
calculated from `useCurrentFrame()` with purposeful easing; there are no CSS
transitions or animations.

## Reproducibility

`package-lock.json` pins the Remotion toolchain. No network services, API keys,
or external assets are required after `npm ci`. The composition uses only
RepoPilot's documented local-first capabilities: snapshot scanning, source and
file intelligence, dependency relationships, static impact/test links,
hotspots, and Git change context.
