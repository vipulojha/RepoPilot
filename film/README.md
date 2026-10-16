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
The `MotionPrototype` composition is the short core-motion check for code
scanning, progressive graph construction, impact cascade, and change tracing.

## Checks and render

```bash
npm run typecheck
npm run render
```

The render is written to `film/out/repopilot-film.mp4`. The film is 16:9,
30fps, 1,860 frames (62 seconds), with one persistent repository world and
overlapping semantic beats rather than isolated slide scenes. Motion is
calculated from `useCurrentFrame()` with camera movement, graph growth, signal
propagation, spring activation, and purposeful easing; there are no CSS
transitions or animations.

Reusable motion primitives live in `src/motion/`: camera viewport, signal pulse,
progressive graph edge, node activation, code scan beam, telemetry metric,
cascade stage, and semantic line path.

## Reproducibility

`package-lock.json` pins the Remotion toolchain. No network services, API keys,
or external assets are required after `npm ci`. The composition uses only
RepoPilot's documented local-first capabilities: snapshot scanning, source and
file intelligence, dependency relationships, static impact/test links,
hotspots, and Git change context.
