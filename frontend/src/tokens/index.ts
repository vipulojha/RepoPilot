/**
 * RepoPilot Design System Tokens
 * Theme: Obsidian Telemetry
 * Movement: Technical Minimalist Instrument
 */

export const colors = {
  // Canvas & Surface Architecture
  canvas: {
    base: '#0B0E14', // Ultra-deep matte carbon backplane
    panel: '#111622', // Instrument chassis, tool windows
    card: '#182030', // Active items, hovered rows, cards
    trough: '#161B28', // Input trough, sunken surfaces
    surfaceHigh: '#252A37', // Elevated panels
    surfaceHighest: '#303542', // High elevation overlays
  },
  // Razor structural outlines
  outline: {
    razor: '#1E2638', // 1px structural dividing lines
    contrast: '#2D3A54', // Focused states, split handles
    faint: 'rgba(30, 38, 56, 0.4)',
  },
  // Typography & Text
  text: {
    primary: '#F1F5F9', // High contrast foreground
    onSurface: '#DEE2F3',
    muted: '#94A3B8', // Subdued metadata
    dim: '#475569', // Code comments, inactive indicators
    variant: '#B9CACB',
  },
  // Semantic Intelligence Spectrum
  spectrum: {
    cyan: '#00F2FE', // Active execution focal points, direct upstream, primary telemetry
    cyanTint: '#00DCE6',
    cyanGlow: 'rgba(0, 242, 254, 0.25)',
    cyanBg: 'rgba(0, 242, 254, 0.08)',
    
    violet: '#9D4EDD', // Transitive dependencies, AST node bindings, language-server context
    violetGlow: 'rgba(157, 78, 221, 0.25)',
    violetBg: 'rgba(157, 78, 221, 0.08)',
    
    amber: '#FFB703', // High churn nodes, cyclomatic complexity spikes, blast-radius warnings
    amberGlow: 'rgba(255, 183, 3, 0.25)',
    amberBg: 'rgba(255, 183, 3, 0.08)',
    
    emerald: '#06D6A0', // Statically confirmed tests, deterministic builds, clean git trees
    emeraldGlow: 'rgba(6, 214, 160, 0.25)',
    emeraldBg: 'rgba(6, 214, 160, 0.08)',
    
    crimson: '#EF476F', // Breaking changes, syntax failures, destructive actions, deleted diffs
    crimsonGlow: 'rgba(239, 71, 111, 0.25)',
    crimsonBg: 'rgba(239, 71, 111, 0.08)',
  },
} as const;

export const typography = {
  fonts: {
    headline: "'Space Grotesk', -apple-system, sans-serif",
    body: "'Geist', -apple-system, sans-serif",
    code: "'JetBrains Mono', monospace",
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  spaceXs: '2px', // Indentation lines, badge inner padding
  spaceSm: '4px', // Badges, icons, tokens
  spaceMd: '8px', // Telemetry grid padding, gutters
  spaceLg: '12px', // Section headers, container insets
  spaceXl: '16px', // Overlays, diff dialogs, margins
  heights: {
    button: '28px',
    buttonSmall: '24px',
    input: '32px',
    inputCompact: '24px',
    chip: '18px',
    treeRow: '26px',
    tableRow: '36px',
    headerBar: '48px',
    activityBar: '48px',
  },
} as const;

export const shapes = {
  roundedness: '0px', // Strict sharp corners throughout
} as const;
