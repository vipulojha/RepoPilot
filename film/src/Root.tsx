import React, { type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Composition, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CascadeStage,
  CodeScanBeam,
  GraphNodeActivation,
  ProgressiveGraphEdge,
  SemanticLinePath,
  SignalPulse,
  TelemetryMetric,
} from "./motion";

const W = 1920;
const H = 1080;
const FPS = 30;
const DURATION = 1860;

const C = {
  ink: "#080C14",
  surface: "#0D121D",
  raised: "#131B2B",
  border: "#1A243A",
  text: "#E6EDF3",
  muted: "#71809A",
  cyan: "#00F2FE",
  violet: "#9D4EDD",
  amber: "#FFB703",
  emerald: "#06D6A0",
  crimson: "#EF476F",
};

const UI: CSSProperties = { fontFamily: "Space Grotesk, ui-sans-serif, sans-serif" };
const MONO: CSSProperties = { fontFamily: "DM Mono, ui-monospace, monospace" };
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: ease };
const between = (frame: number, from: number, to: number, start = 0, end = 1) => interpolate(frame, [from, to], [start, end], clamp);
const hold = (frame: number, from: number, to: number) => between(frame, from, to);
const line = (frame: number, from: number, to: number) => between(frame, from, to);
const visible = (frame: number, from: number, to: number, fade = 24) => between(frame, from, from + fade) * between(frame, to - fade, to, 1, 0);
const phaseStarts = [0, 150, 330, 630, 870, 1030, 1500];
const phaseIndex = (frame: number) => phaseStarts.reduce((index, start, i) => frame >= start ? i : index, 0);

type Point = { x: number; y: number };
type FileKind = "source" | "test" | "transitive" | "target";
type RepoNode = Point & { id: string; label: string; path: string; kind: FileKind; color: string; depth: number };
type RepoEdge = { from: string; to: string; color: string; kind: "direct" | "transitive" | "test"; d: string };

const files: RepoNode[] = [
  { id: "impact", x: 860, y: 520, label: "impact.py", path: "backend/app/services/impact.py", kind: "target", color: C.cyan, depth: 1 },
  { id: "graph", x: 650, y: 355, label: "graph.py", path: "backend/app/services/graph.py", kind: "source", color: C.cyan, depth: 1 },
  { id: "app", x: 1080, y: 340, label: "App.tsx", path: "frontend/src/App.tsx", kind: "source", color: C.cyan, depth: 1 },
  { id: "workspace", x: 1160, y: 650, label: "DependencyGraphWorkspace.tsx", path: "frontend/src/components/rebuild/DependencyGraphWorkspace.tsx", kind: "source", color: C.cyan, depth: 1 },
  { id: "hotspots", x: 420, y: 250, label: "hotspots.py", path: "backend/app/services/hotspots.py", kind: "transitive", color: C.violet, depth: 2 },
  { id: "git", x: 1450, y: 235, label: "git.py", path: "backend/app/services/git.py", kind: "transitive", color: C.violet, depth: 2 },
  { id: "test", x: 1180, y: 875, label: "test_impact.py", path: "backend/tests/test_impact.py", kind: "test", color: C.emerald, depth: 2 },
  { id: "search", x: 1480, y: 720, label: "search.py", path: "backend/app/services/search.py", kind: "transitive", color: C.violet, depth: 2 },
  { id: "cli", x: 390, y: 610, label: "cli.py", path: "backend/app/cli.py", kind: "transitive", color: C.violet, depth: 2 },
];

const edges: RepoEdge[] = [
  { from: "impact", to: "graph", color: C.cyan, kind: "direct", d: "M 860 520 L 650 355" },
  { from: "impact", to: "app", color: C.cyan, kind: "direct", d: "M 860 520 L 1080 340" },
  { from: "impact", to: "workspace", color: C.cyan, kind: "direct", d: "M 860 520 L 1160 650" },
  { from: "graph", to: "hotspots", color: C.violet, kind: "transitive", d: "M 650 355 L 420 250" },
  { from: "app", to: "git", color: C.violet, kind: "transitive", d: "M 1080 340 L 1450 235" },
  { from: "workspace", to: "search", color: C.violet, kind: "transitive", d: "M 1160 650 L 1480 720" },
  { from: "impact", to: "test", color: C.emerald, kind: "test", d: "M 860 520 L 1180 875" },
  { from: "graph", to: "cli", color: C.violet, kind: "transitive", d: "M 650 355 L 390 610" },
];

const codeFragments = [
  { text: "import { scanSnapshot }", x: 105, y: 240, z: 0.7, color: C.cyan, target: "impact" },
  { text: "class DependencyGraph", x: 1030, y: 178, z: 0.92, color: C.violet, target: "graph" },
  { text: "function reverseDependencies", x: 310, y: 690, z: 0.82, color: C.cyan, target: "impact" },
  { text: "export const App", x: 1370, y: 610, z: 0.74, color: C.cyan, target: "app" },
  { text: "from tests import impact", x: 1480, y: 860, z: 0.62, color: C.emerald, target: "test" },
  { text: "return relationship", x: 590, y: 860, z: 0.58, color: C.violet, target: "workspace" },
] as const;

function Grid({ intensity = 1 }: { intensity?: number }) {
  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, opacity: intensity * 0.42 }}>
    <defs><pattern id="repo-grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke={C.border} strokeWidth="1" /></pattern></defs>
    <rect width={W} height={H} fill="url(#repo-grid)" />
  </svg>;
}

function TopTelemetry({ phase, frame }: { phase: string; frame: number }) {
  const ticker = Math.floor((frame % 45) / 15);
  const states = ["UNKNOWN", "SCANNING", "PARSING", "INDEXING", "CONNECTED", "IMPACT", "CONFIDENCE"];
  return <div style={{ position: "absolute", left: 70, right: 70, top: 34, display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 14, letterSpacing: 2.4, ...MONO }}>
    <span>REP<span style={{ color: C.cyan }}>O</span>PILOT <span style={{ color: C.border }}>/</span> {phase}</span>
    <span style={{ color: ticker === 1 ? C.cyan : C.muted }}>SIGNAL {states[Math.min(states.length - 1, phaseIndex(frame))]}</span>
  </div>;
}

function PhaseRail({ frame }: { frame: number }) {
  const phases = ["UNKNOWN", "SCAN", "STRUCTURE", "CONNECTION", "IMPACT", "RISK", "UNDERSTANDING"];
  return <div style={{ position: "absolute", left: 70, right: 70, bottom: 42, display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 12, letterSpacing: 2, ...MONO }}>
    {phases.map((phase, i) => <span key={phase} style={{ color: i === phaseIndex(frame) ? C.cyan : C.muted, opacity: i <= phaseIndex(frame) ? 1 : 0.42 }}>{String(i + 1).padStart(2, "0")} / {phase}</span>)}
  </div>;
}

function CornerTelemetry({ children, color = C.muted, style = {} }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <div style={{ color, fontSize: 13, letterSpacing: 1.7, ...MONO, ...style }}>{children}</div>;
}

function TechnicalPanel({ children, style = {}, accent = C.border }: { children: ReactNode; style?: CSSProperties; accent?: string }) {
  return <div style={{ backgroundColor: `${C.surface}EE`, border: `1px solid ${accent}`, boxShadow: `inset 0 1px 0 ${C.raised}`, ...style }}>{children}</div>;
}

function MicroParticle({ x, y, color = C.cyan, depth = 1, frame, drift = 80 }: { x: number; y: number; color?: string; depth?: number; frame: number; drift?: number }) {
  return <div style={{ position: "absolute", left: x, top: y, width: depth < 0.7 ? 3 : 5, height: depth < 0.7 ? 3 : 5, backgroundColor: color, opacity: 0.2 + depth * 0.5, translate: `${Math.sin(frame / (14 + depth * 10)) * drift * 0.18}px ${Math.cos(frame / (22 + depth * 8)) * drift * 0.08}px`, scale: 0.65 + depth * 0.35 }} />;
}

function SignalTrail({ start, end, progress, color, width = 3 }: { start: Point; end: Point; progress: number; color: string; width?: number }) {
  const x = start.x + (end.x - start.x) * progress;
  const y = start.y + (end.y - start.y) * progress;
  return <><div style={{ position: "absolute", left: start.x, top: start.y, width: Math.hypot(end.x - start.x, end.y - start.y), height: width, transformOrigin: "left center", rotate: `${Math.atan2(end.y - start.y, end.x - start.x)}rad`, scale: `${progress} 1`, backgroundColor: `${color}88` }} /><SignalPulse range={{ from: 0, to: 1 }} style={{ position: "absolute", left: x - 5, top: y - 5 }}><div style={{ width: 10, height: 10, backgroundColor: color, boxShadow: `0 0 16px ${color}` }} /></SignalPulse></>;
}

function CameraRig({ frame, children }: { frame: number; children: ReactNode }) {
  const cameraX = interpolate(frame, [0, 150, 330, 630, 870, 1050, 1260, 1560, 1740, 1860], [0, 30, -60, -140, -210, -110, -20, 100, 35, 0], clamp);
  const cameraY = interpolate(frame, [0, 150, 330, 630, 870, 1050, 1260, 1560, 1740, 1860], [0, 8, -24, -34, -18, 8, 20, 18, 0, 0], clamp);
  const zoom = interpolate(frame, [0, 150, 330, 630, 870, 1050, 1260, 1560, 1740, 1860], [1.02, 1.08, 1.18, 1.35, 1.23, 1.14, 1.06, 0.98, 1.02, 1], clamp);
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><div style={{ position: "absolute", width: W, height: H, left: 0, top: 0, scale: zoom, translate: `${cameraX}px ${cameraY}px`, transformOrigin: "50% 50%" }}>{children}</div></div>;
}

function NodePosition({ id }: { id: string }) {
  const node = files.find((file) => file.id === id);
  return node ?? files[0];
}

function RepositoryFragments({ frame }: { frame: number }) {
  const scan = between(frame, 10, 150);
  const structure = between(frame, 150, 330);
  return <>{codeFragments.map((fragment, i) => {
    const node = NodePosition({ id: fragment.target });
    const move = between(frame, 150 + i * 8, 305 + i * 8);
    const x = interpolate(move, [0, 1], [fragment.x, node.x]);
    const y = interpolate(move, [0, 1], [fragment.y, node.y]);
    const scale = interpolate(move, [0, 1], [fragment.z, 0.62]);
    const blur = interpolate(fragment.z, [0.58, 0.92], [2.8, 0]);
    return <div key={fragment.text} style={{ position: "absolute", left: x, top: y, color: fragment.color, ...MONO, fontSize: 17, opacity: between(frame, 8 + i * 9, 34 + i * 9) * (1 - structure * 0.32), translate: `${Math.sin((frame + i * 13) / 23) * 8 * fragment.z}px ${Math.cos((frame + i * 7) / 31) * 5}px`, scale, filter: `blur(${blur}px)` }}>{fragment.text}<span style={{ color: C.border, fontSize: 11, display: "block", marginTop: 6 }}>evidence / {String(12 + i * 7).padStart(3, "0")}</span></div>;
  })}<CodeScanBeam range={{ from: 16, to: 142 }} color={C.cyan} width={2} style={{ position: "absolute", left: 70, top: 112, width: 1730, height: 790, opacity: scan }} /></>;
}

function FileNode({ node, frame, emphasis = 1 }: { node: RepoNode; frame: number; emphasis?: number }) {
  const structure = between(frame, 150, 330);
  const graph = between(frame, 630, 870);
  const pulse = spring({ frame: Math.max(0, frame - (630 + files.indexOf(node) * 18)), fps: FPS, config: { damping: 180, stiffness: 160, mass: 0.7 } });
  const active = node.kind === "target" ? 1 : Math.min(1, pulse);
  return <div style={{ position: "absolute", left: node.x, top: node.y, opacity: (structure * 0.78 + graph * 0.95) * emphasis, scale: 0.72 + active * 0.22, translate: `${Math.sin((frame + node.x) / 35) * 2}px ${Math.cos((frame + node.y) / 41) * 2}px` }}><div style={{ width: node.kind === "target" ? 24 : 15, height: node.kind === "target" ? 24 : 15, backgroundColor: node.color, boxShadow: `0 0 ${node.kind === "target" ? 24 : 13}px ${node.color}AA` }} /><div style={{ position: "absolute", left: 26, top: -8, whiteSpace: "nowrap", color: node.kind === "target" ? C.text : node.color, fontSize: node.kind === "target" ? 17 : 14, ...MONO }}>{node.label}</div><div style={{ position: "absolute", left: 26, top: 16, whiteSpace: "nowrap", color: C.muted, fontSize: 11, opacity: graph }}>{node.path}</div></div>;
}

function RepositoryEdges({ frame }: { frame: number }) {
  const graph = between(frame, 630, 870);
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, opacity: graph }}><g fill="none" strokeWidth="2">{edges.map((edge, i) => <ProgressiveGraphEdge key={edge.d} d={edge.d} range={{ from: 650 + i * 20, to: 705 + i * 20 }} color={edge.color} width={edge.kind === "test" ? 2.5 : 1.8} />)}</g></svg>;
}

function AmbientField({ frame }: { frame: number }) {
  const particles = [[150, 160, C.cyan, 0.55], [260, 430, C.violet, 0.72], [510, 155, C.amber, 0.45], [1450, 170, C.cyan, 0.62], [1700, 410, C.violet, 0.52], [1560, 860, C.emerald, 0.58], [310, 910, C.cyan, 0.46], [1820, 730, C.amber, 0.38]] as const;
  return <>{particles.map(([x, y, color, depth], i) => <MicroParticle key={i} x={x} y={y} color={color} depth={depth} frame={frame} drift={50 + i * 8} />)}<div style={{ position: "absolute", left: 0, right: 0, top: 495, height: 1, backgroundColor: `${C.cyan}18`, opacity: between(frame, 8, 160) }} /><div style={{ position: "absolute", left: 0, right: 0, top: 495, height: 1, backgroundColor: C.cyan, opacity: between(frame, 18, 46) * 0.82, translate: `${between(frame, 18, 152, -400, 2100)}px 0`, boxShadow: `0 0 15px ${C.cyan}` }} /></>;
}

function KineticPhase({ frame }: { frame: number }) {
  const phrase = ["UNKNOWN", "SCAN", "STRUCTURE", "CONNECTION", "IMPACT", "RISK", "UNDERSTANDING"];
  const index = Math.min(phrase.length - 1, Math.floor(frame / 260));
  const local = frame - index * 260;
  return <div style={{ position: "absolute", left: 88, top: 128, ...MONO, color: C.muted, fontSize: 15, letterSpacing: 2.3, opacity: between(frame, 0, 32) }}>{phrase.map((word, i) => <span key={word} style={{ color: i === index ? C.cyan : C.muted, opacity: i === index ? 1 : 0.26, marginRight: 22, translate: `0 ${i === index ? between(local, 0, 28, 8, 0) : 0}px` }}>{word}</span>)}</div>;
}

function CockpitTelemetry({ frame }: { frame: number }) {
  const build = visible(frame, 285, 450, 20);
  const panelScale = spring({ frame: Math.max(0, frame - 285), fps: FPS, config: { damping: 200, stiffness: 90, mass: 1.2 } });
  const metrics = [["FILES", 0, 87, C.cyan], ["LINES", 0, 10064, C.text], ["SYMBOLS", 0, 31, C.violet], ["DEPENDENCIES", 0, 0, C.cyan], ["DETECTED TEST FILES", 0, 0, C.emerald]] as const;
  return <TechnicalPanel accent={C.cyan} style={{ position: "absolute", left: 190, right: 190, top: 300, padding: 24, opacity: build, scale: interpolate(panelScale, [0, 1], [0.82, 1]), translate: `0 ${interpolate(panelScale, [0, 1], [80, 0])}px` }}><div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 14, ...MONO }}><span>REPOSITORY COCKPIT / LOCAL WORKSPACE</span><span style={{ color: C.emerald }}>READY SNAPSHOT / 0042</span></div><div style={{ display: "flex", gap: 12, marginTop: 28 }}>{metrics.map(([label, start, value, color], i) => <div key={label} style={{ flex: 1, minHeight: 158, border: `1px solid ${C.border}`, padding: 18, opacity: between(frame, 304 + i * 12, 330 + i * 12), translate: `0 ${between(frame, 304 + i * 12, 330 + i * 12, 18, 0)}px` }}><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.3, minHeight: 31, ...MONO }}>{label}</div><div style={{ color, fontSize: i === 1 ? 34 : 42, marginTop: 20, ...MONO }}><TelemetryMetric value={start} resolvedValue={value} range={{ from: 312 + i * 12, to: 340 + i * 12 }} /></div><div style={{ height: 2, backgroundColor: `${color}22`, marginTop: 24 }}><div style={{ height: 2, width: `${between(frame, 312 + i * 12, 340 + i * 12) * 100}%`, backgroundColor: color }} /></div></div>)}</div><div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 13, ...MONO }}><span>BRANCH / main</span><span>CLEAN MAIN</span><span>FTS5 INDEX / READY</span></div></TechnicalPanel>;
}

function SourceIntelligence({ frame }: { frame: number }) {
  const source = visible(frame, 430, 650, 24);
  const scanner = between(frame, 458, 600);
  const lines = ["from app.services.graph import DependencyGraph", "", "class ImpactAnalyzer:", "    def reverse_dependencies(self, file):", "        paths = graph.reverse(file)", "        return ImpactAnalysis(paths=paths)", "", "    # evidence remains inspectable"];
  const signals = [["SYMBOLS", C.violet], ["DEPENDENCIES", C.cyan], ["STATIC TESTS", C.emerald], ["HOTSPOT", C.amber], ["IMPACT", C.crimson]] as const;
  return <div style={{ position: "absolute", left: 78, right: 78, top: 150, bottom: 100, opacity: source }}><div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 14, ...MONO }}><span>backend/app/services/impact.py</span><span>PYTHON / 48 LINES / SHA 9F2C</span></div><div style={{ display: "flex", gap: 18, marginTop: 22, height: 690 }}><TechnicalPanel style={{ position: "relative", flex: 1, padding: 28, overflow: "hidden" }}><CodeScanBeam range={{ from: 458, to: 600 }} color={C.cyan} width={3} style={{ position: "absolute", inset: 0, opacity: scanner * 0.9 }} /><div style={{ ...MONO, fontSize: 20 }}>{lines.map((text, i) => <div key={`${i}-${text}`} style={{ display: "flex", lineHeight: 2.22, color: i === 0 || i === 4 ? C.cyan : i === 2 ? C.violet : C.text, opacity: between(frame, 448 + i * 8, 468 + i * 8), translate: `${between(frame, 448 + i * 8, 468 + i * 8, 18, 0)}px 0` }}><span style={{ width: 54, color: C.muted, fontSize: 14 }}>{String(i + 1).padStart(2, "0")}</span><span>{text || " "}</span><span style={{ marginLeft: 18, color: i === 2 ? C.violet : i === 4 ? C.cyan : C.border, opacity: scanner }}>{i === 2 ? "◆" : i === 4 ? "↗" : "·"}</span></div>)}</div><div style={{ position: "absolute", left: 28, right: 28, top: 480, height: 2, backgroundColor: `${C.cyan}20`, opacity: scanner }}><div style={{ width: 280, height: 2, backgroundColor: C.cyan, translate: `${between(frame, 458, 600, -280, 780)}px 0`, boxShadow: `0 0 20px ${C.cyan}` }} /></div></TechnicalPanel><TechnicalPanel accent={C.violet} style={{ width: 320, padding: 22, translate: `${between(frame, 474, 536, 90, 0)}px 0`, opacity: between(frame, 466, 520) }}><CornerTelemetry color={C.violet}>INTELLIGENCE GUTTER</CornerTelemetry><div style={{ marginTop: 22 }}>{signals.map(([label, color], i) => <div key={label} style={{ borderBottom: `1px solid ${C.border}`, padding: "18px 0", display: "flex", justifyContent: "space-between", color: i === 0 || i === 1 ? color : C.muted, opacity: between(frame, 490 + i * 16, 510 + i * 16), translate: `${between(frame, 490 + i * 16, 510 + i * 16, 20, 0)}px 0`, ...MONO, fontSize: 13 }}><span>{label}</span><span>{i < 2 ? "RESOLVED" : "PENDING"}</span></div>)}</div><div style={{ marginTop: 28, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>Static evidence, not runtime coverage. Every relationship retains its source location.</div></TechnicalPanel></div></div>;
}

function GraphInspector({ frame }: { frame: number }) {
  const graph = visible(frame, 630, 920, 24);
  const selected = between(frame, 830, 930);
  return <div style={{ position: "absolute", right: 76, top: 160, width: 318, opacity: graph }}><TechnicalPanel accent={C.cyan} style={{ padding: 22 }}><CornerTelemetry color={C.cyan}>BUILD REPOSITORY GRAPH</CornerTelemetry><div style={{ marginTop: 18, color: C.text, fontSize: 23, ...MONO }}>impact.py</div><div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>depth 03<br />direct 04 · transitive 07<br />static tests 02</div><div style={{ height: 2, backgroundColor: `${C.cyan}20`, marginTop: 20 }}><div style={{ width: `${selected * 100}%`, height: 2, backgroundColor: C.cyan }} /></div></TechnicalPanel><div style={{ marginTop: 14, display: "flex", gap: 12, color: C.muted, fontSize: 11, ...MONO }}><span style={{ color: C.cyan }}>■ DIRECT</span><span style={{ color: C.violet }}>■ TRANSITIVE</span><span style={{ color: C.emerald }}>■ TEST</span></div></div>;
}

function ImpactCascade({ frame }: { frame: number }) {
  const impact = visible(frame, 850, 1100, 24);
  const stages = [["TARGET", "impact.py / selected source file", C.cyan], ["DIRECT CONSUMERS", "graph.py · App.tsx · cli.py", C.cyan], ["TRANSITIVE EGRESS", "hotspots.py · git.py · search.py", C.violet], ["TEST VALIDATION", "test_impact.py / static relationship", C.emerald]] as const;
  return <div style={{ position: "absolute", left: 110, right: 110, top: 178, opacity: impact }}><div style={{ display: "flex", justifyContent: "space-between", ...MONO, fontSize: 14, color: C.muted }}><span>IMPACT ANALYSIS / REVERSE DEPENDENCY TRAVERSAL</span><span style={{ color: C.amber }}>IMPACT REACH / HIGH</span></div><div style={{ display: "flex", gap: 38, marginTop: 28 }}><TechnicalPanel style={{ width: 490, minHeight: 540, padding: 26 }}><CornerTelemetry color={C.amber}>TARGET FILE</CornerTelemetry><div style={{ color: C.text, fontSize: 30, marginTop: 22, ...MONO }}>impact.py</div><div style={{ color: C.muted, fontSize: 14, lineHeight: 1.5, marginTop: 14 }}>Potentially affected files<br />static analysis / bounded depth</div><div style={{ marginTop: 58, display: "flex", flexDirection: "column", gap: 16 }}>{["direct", "transitive", "test"].map((kind, i) => <div key={kind} style={{ borderLeft: `3px solid ${[C.cyan, C.violet, C.emerald][i]}`, paddingLeft: 14, color: [C.cyan, C.violet, C.emerald][i], ...MONO, fontSize: 13, opacity: between(frame, 878 + i * 20, 918 + i * 20) }}>{kind.toUpperCase()} PATH / {i + 1}</div>)}</div></TechnicalPanel><TechnicalPanel accent={C.amber} style={{ flex: 1, padding: 26 }}><CornerTelemetry color={C.amber}>AFFECTED FILES / WHY?</CornerTelemetry><div style={{ marginTop: 12 }}>{stages.map(([label, detail, color], i) => <CascadeStage key={label} index={i} startFrame={884} stagger={32} duration={26}><div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${C.border}`, padding: "22px 0" }}><div style={{ width: 10, height: 10, backgroundColor: color, boxShadow: `0 0 15px ${color}` }} /><div style={{ flex: 1 }}><div style={{ color, letterSpacing: 2, fontSize: 15, ...MONO }}>{label}</div><div style={{ color: C.muted, fontSize: 14, marginTop: 7, ...MONO }}>{detail}</div></div><div style={{ color: C.muted, fontSize: 12, ...MONO }}>LINKED</div></div></CascadeStage>)}</div><div style={{ marginTop: 25, color: C.muted, fontSize: 13, ...MONO }}>RUNTIME TEST COVERAGE / NOT CLAIMED</div></TechnicalPanel></div></div>;
}

function HotspotDetection({ frame }: { frame: number }) {
  const hotspot = visible(frame, 1030, 1220, 24);
  const rows = [["#01", "backend/app/services/impact.py", "92", "48", "07", "04", "HIGH"], ["#02", "backend/app/services/graph.py", "78", "82", "11", "05", "WATCH"], ["#03", "frontend/src/App.tsx", "64", "420", "31", "08", "RISING"], ["#04", "backend/tests/test_impact.py", "41", "31", "02", "02", "STATIC"], ["#05", "backend/app/services/git.py", "38", "226", "18", "06", "STABLE"]] as const;
  return <div style={{ position: "absolute", left: 88, right: 88, top: 150, opacity: hotspot }}><div style={{ display: "flex", justifyContent: "space-between", ...MONO, fontSize: 14, color: C.muted }}><span>STRUCTURAL HOTSPOTS / DETERMINISTIC SIGNALS</span><span style={{ color: C.amber }}>ANALYZE IMPACT →</span></div><TechnicalPanel style={{ marginTop: 26, padding: 22 }}><div style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px 90px 90px 90px 115px", color: C.muted, fontSize: 12, padding: "0 14px 16px", borderBottom: `1px solid ${C.border}`, ...MONO }}><span>RANK</span><span>PATH</span><span>SCORE</span><span>LINES</span><span>SYMBOLS</span><span>FAN-IN</span><span>IMPACT REACH</span></div>{rows.map(([rank, path, score, lines, symbols, fanIn, reach], i) => <CascadeStage key={rank} index={i} startFrame={1050} stagger={13} duration={22}><div style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px 90px 90px 90px 115px", alignItems: "center", padding: "19px 14px", borderBottom: `1px solid ${C.border}`, color: i === 0 ? C.text : C.muted, fontSize: 13, ...MONO }}><span style={{ color: i === 0 ? C.amber : C.border }}>{rank}</span><span style={{ color: i === 0 ? C.amber : C.text }}>{path}</span><span style={{ color: i === 0 ? C.amber : C.text }}>{i === 0 ? <GraphNodeActivation range={{ from: 1090, to: 1110 }}><span>{score}</span></GraphNodeActivation> : score}</span><span>{lines}</span><span>{symbols}</span><span>{fanIn}</span><span style={{ color: i === 0 ? C.amber : C.muted }}>{reach}</span></div></CascadeStage>)}</TechnicalPanel><div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 13, ...MONO }}><span>SIZE · SYMBOLS · FAN-IN · FAN-OUT · STATIC TEST LINKS</span><span style={{ color: C.amber }}>#01 / IMPACT.PY / ANALYZE IMPACT</span></div><SemanticLinePath range={{ from: 1148, to: 1215 }} style={{ position: "absolute", left: 760, top: 742, width: 540, height: 1, backgroundColor: C.amber }}><span /></SemanticLinePath></div>;
}

function ChangeIntelligence({ frame }: { frame: number }) {
  const change = visible(frame, 1170, 1405, 24);
  const signal = between(frame, 1225, 1395);
  const stages = [["CHANGED FILE", C.crimson], ["DEPENDENCIES", C.cyan], ["AFFECTED FILES", C.violet], ["HOTSPOT", C.amber], ["STATIC TEST RELATIONSHIPS", C.emerald]] as const;
  return <div style={{ position: "absolute", left: 100, right: 100, top: 154, opacity: change }}><div style={{ display: "flex", justifyContent: "space-between", ...MONO, color: C.muted, fontSize: 14 }}><span>CHANGE INTELLIGENCE / WORKING TREE</span><span>BRANCH / feature-impact</span></div><div style={{ display: "flex", gap: 26, marginTop: 28 }}><TechnicalPanel style={{ width: 570, padding: 24, minHeight: 475 }} accent={C.crimson}><CornerTelemetry color={C.crimson}>SINGLE FILE CHANGE</CornerTelemetry><div style={{ color: C.text, fontSize: 24, marginTop: 18, ...MONO }}>backend/app/services/impact.py</div><div style={{ marginTop: 26, ...MONO, fontSize: 16, lineHeight: 2.2 }}><div style={{ color: C.crimson }}>− max_depth = 2</div><div style={{ color: C.emerald }}>＋ max_depth = 3</div><div style={{ color: C.muted, marginTop: 18, fontSize: 13 }}>a13f7b2 / unstaged / 1 file modified</div></div><div style={{ marginTop: 54, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>The diff stays small.<br />The relationship signal travels farther.</div></TechnicalPanel><TechnicalPanel style={{ flex: 1, padding: 24, minHeight: 475 }} accent={C.cyan}><CornerTelemetry color={C.cyan}>CHANGE → EVIDENCE → CONFIDENCE</CornerTelemetry><div style={{ position: "relative", marginTop: 54, height: 170 }}><div style={{ position: "absolute", left: 0, right: 0, top: 50, height: 2, backgroundColor: `${C.cyan}22` }}><div style={{ width: `${signal * 100}%`, height: 2, backgroundColor: C.cyan }} /></div>{stages.map(([label, color], i) => { const x = 30 + i * 160; return <div key={label} style={{ position: "absolute", left: x, top: 0, width: 120, opacity: between(frame, 1234 + i * 23, 1268 + i * 23), translate: `0 ${between(frame, 1234 + i * 23, 1268 + i * 23, 18, 0)}px`, color, textAlign: "center", ...MONO, fontSize: 11 }}><SignalPulse range={{ from: 1234 + i * 23, to: 1300 + i * 23 }}><div style={{ margin: "0 auto", width: 14, height: 14, backgroundColor: color, boxShadow: `0 0 18px ${color}` }} /></SignalPulse><div style={{ marginTop: 28, lineHeight: 1.35 }}>{label}</div></div>; })}<div style={{ position: "absolute", left: 0, top: 49, width: 16, height: 4, backgroundColor: C.crimson, translate: `${signal * 780}px 0` }} /></div><div style={{ borderTop: `1px solid ${C.border}`, marginTop: 42, paddingTop: 18, color: C.muted, ...MONO, fontSize: 13 }}>AFFECTED / 12 FILES · DIRECT / 04 · TRANSITIVE / 07 · STATIC TEST / 02</div></TechnicalPanel></div></div>;
}

function GitTimeline({ frame }: { frame: number }) {
  const git = visible(frame, 1380, 1585, 24);
  const nodes = [[270, "f3a1c9", "scan snapshot"], [610, "c88d42", "add graph"], [950, "a13f7b2", "feature-impact"], [1290, "e93b11", "ready"]] as const;
  return <div style={{ position: "absolute", left: 94, right: 94, top: 180, opacity: git }}><div style={{ display: "flex", justifyContent: "space-between", ...MONO, color: C.muted, fontSize: 14 }}><span>GIT HISTORY / CHANGE DETAIL</span><span style={{ color: C.emerald }}>WORKING TREE / CLEAN AFTER COMMIT</span></div><TechnicalPanel style={{ marginTop: 34, height: 370, padding: 28 }} accent={C.emerald}><div style={{ position: "relative", height: 230, marginTop: 18 }}><div style={{ position: "absolute", left: 100, right: 100, top: 86, height: 2, backgroundColor: `${C.emerald}44` }}><div style={{ width: `${between(frame, 1404, 1544) * 100}%`, height: 2, backgroundColor: C.emerald }} /></div>{nodes.map(([x, sha, message], i) => <div key={sha} style={{ position: "absolute", left: x, top: 56, opacity: between(frame, 1404 + i * 28, 1436 + i * 28), scale: between(frame, 1404 + i * 28, 1436 + i * 28, 0.4, 1) }}><SignalPulse range={{ from: 1404 + i * 28, to: 1450 + i * 28 }} maxScale={1.2}><div style={{ width: 18, height: 18, backgroundColor: i === 2 ? C.cyan : C.emerald, boxShadow: `0 0 16px ${i === 2 ? C.cyan : C.emerald}` }} /></SignalPulse><div style={{ marginTop: 30, color: i === 2 ? C.cyan : C.text, fontSize: 15, ...MONO }}>{sha}</div><div style={{ marginTop: 8, color: C.muted, fontSize: 13, whiteSpace: "nowrap", ...MONO }}>{message}</div><div style={{ marginTop: 8, color: C.border, fontSize: 11, ...MONO }}>AUTHOR / REPOPILOT · +1 / −1</div></div>)}</div><div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 20, color: C.muted, fontSize: 13, ...MONO }}><span>HISTORY</span><span>COMMIT DETAIL</span><span>FILE HISTORY</span><span>COMPARE</span><span>STASH WORKFLOWS</span></div></TechnicalPanel></div>;
}

function RepositorySynthesis({ frame }: { frame: number }) {
  const synth = visible(frame, 1500, 1778, 28);
  const labels = [["SOURCE", C.cyan, 350, 240], ["FILES", C.violet, 700, 340], ["GRAPH", C.cyan, 1030, 220], ["IMPACT", C.amber, 1180, 610], ["GIT", C.emerald, 1500, 470]] as const;
  return <div style={{ position: "absolute", inset: 0, opacity: synth }}><div style={{ position: "absolute", left: 90, top: 145, width: 590 }}><CornerTelemetry color={C.cyan}>THE WHOLE REPOSITORY / RESOLVED</CornerTelemetry><div style={{ color: C.text, fontSize: 54, lineHeight: 1.04, letterSpacing: -2.4, marginTop: 20 }}>The architecture stays<br /><span style={{ color: C.cyan }}>connected.</span></div><div style={{ color: C.muted, fontSize: 17, lineHeight: 1.55, marginTop: 20, maxWidth: 480 }}>Source, files, dependencies, impact, hotspots, tests, and Git context now share one navigable model.</div></div><div style={{ position: "absolute", left: 90, right: 90, bottom: 116, display: "flex", gap: 26, color: C.muted, ...MONO, fontSize: 13 }}>{["87 FILES", "31 SYMBOLS", "142 LINKS", "02 STATIC TESTS", "CLEAN MAIN"].map((item, i) => <span key={item} style={{ color: i === 2 ? C.cyan : C.muted, opacity: between(frame, 1530 + i * 13, 1555 + i * 13) }}>{item}</span>)}</div>{labels.map(([label, color, x, y], i) => <div key={label} style={{ position: "absolute", left: x, top: y, opacity: between(frame, 1510 + i * 18, 1540 + i * 18), translate: `${between(frame, 1510 + i * 18, 1540 + i * 18, 30, 0)}px 0`, color, ...MONO, fontSize: 12, letterSpacing: 1.8 }}><span style={{ display: "inline-block", width: 8, height: 8, backgroundColor: color, marginRight: 9 }} />{label} / RESOLVED</div>)}</div>;
}

function FinalBrand({ frame }: { frame: number }) {
  const final = between(frame, 1740, 1860);
  const wordmark = between(frame, 1750, 1785);
  const firstLine = between(frame, 1780, 1815);
  const secondLine = between(frame, 1815, 1850);
  const signal = between(frame, 1808, 1855);
  return <div style={{ position: "absolute", inset: 0, backgroundColor: `${C.ink}${Math.round((1 - final) * 180).toString(16).padStart(2, "0")}`, opacity: final }}><div style={{ position: "absolute", left: 0, right: 0, top: 535, height: 1, backgroundColor: `${C.cyan}33`, opacity: signal }}><div style={{ position: "absolute", left: 0, top: 0, width: 230, height: 1, backgroundColor: C.cyan, translate: `${between(frame, 1810, 1858, -240, 2160)}px 0`, boxShadow: `0 0 16px ${C.cyan}` }} /></div><div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}><div style={{ color: C.cyan, fontSize: 21, letterSpacing: 5, ...MONO, opacity: wordmark, translate: `0 ${between(frame, 1750, 1785, 18, 0)}px` }}>REPOPILOT</div><div style={{ color: C.muted, fontSize: 14, letterSpacing: 2.4, marginTop: 13, opacity: wordmark }}>LOCAL CODEBASE INTELLIGENCE</div><div style={{ margin: "34px 0", width: 78, height: 1, backgroundColor: C.cyan, opacity: wordmark }} /><div style={{ color: C.text, fontSize: 58, lineHeight: 1.08, letterSpacing: -1.8, opacity: firstLine, translate: `0 ${between(frame, 1780, 1815, 20, 0)}px` }}>UNDERSTAND THE CODE.</div><div style={{ color: C.cyan, fontSize: 58, lineHeight: 1.08, letterSpacing: -1.8, marginTop: 8, opacity: secondLine, translate: `0 ${between(frame, 1815, 1850, 20, 0)}px` }}>SEE THE CONNECTIONS.</div></div></div>;
}

function World({ frame }: { frame: number }) {
  return <CameraRig frame={frame}><div style={{ opacity: between(frame, 1740, 1800, 1, 0.34) }}><AmbientField frame={frame} /><RepositoryFragments frame={frame} /><RepositoryEdges frame={frame} />{files.map((node) => <FileNode key={node.id} node={node} frame={frame} emphasis={node.kind === "target" ? 1 : between(frame, 820, 980, 1, 0.42)} />)}</div></CameraRig>;
}

function Film() {
  const frame = useCurrentFrame();
  const phase = frame < 150 ? "UNKNOWN REPOSITORY" : frame < 330 ? "REPOSITORY STRUCTURE" : frame < 450 ? "REPOSITORY COCKPIT" : frame < 630 ? "SOURCE INTELLIGENCE" : frame < 870 ? "DEPENDENCY GRAPH" : frame < 1050 ? "IMPACT ANALYSIS" : frame < 1200 ? "STRUCTURAL HOTSPOTS" : frame < 1380 ? "CHANGE INTELLIGENCE" : frame < 1560 ? "GIT HISTORY" : frame < 1740 ? "REPOSITORY UNDERSTOOD" : "CONFIDENCE";
  return <AbsoluteFill style={{ backgroundColor: C.ink, color: C.text, ...UI, overflow: "hidden" }}><Grid intensity={between(frame, 0, 1800, 0.55, 1)} /><World frame={frame} /><TopTelemetry phase={phase} frame={frame} /><KineticPhase frame={frame} /><CockpitTelemetry frame={frame} /><SourceIntelligence frame={frame} /><GraphInspector frame={frame} /><ImpactCascade frame={frame} /><HotspotDetection frame={frame} /><ChangeIntelligence frame={frame} /><GitTimeline frame={frame} /><RepositorySynthesis frame={frame} /><FinalBrand frame={frame} /><PhaseRail frame={frame} /></AbsoluteFill>;
}

function PrototypeGraph() {
  const frame = useCurrentFrame();
  const scan = between(frame, 0, 50);
  const graph = between(frame, 70, 150);
  const impact = between(frame, 130, 230);
  const node = (x: number, y: number, color: string, start: number) => <GraphNodeActivation range={{ from: start, to: start + 16 }} style={{ position: "absolute", left: x, top: y }}><div style={{ width: 18, height: 18, backgroundColor: color, boxShadow: `0 0 18px ${color}` }} /></GraphNodeActivation>;
  return <AbsoluteFill style={{ backgroundColor: C.ink, color: C.text, ...UI, overflow: "hidden" }}><Grid intensity={0.9} /><div style={{ position: "absolute", left: 100, top: 96, color: C.cyan, ...MONO, fontSize: 15, letterSpacing: 2 }}>MOTION PROTOTYPE / SCAN → GRAPH → IMPACT → CHANGE</div><CodeScanBeam range={{ from: 0, to: 48 }} color={C.cyan} width={3} style={{ position: "absolute", left: 160, top: 180, width: 740, height: 560 }}><TechnicalPanel style={{ padding: 26, height: 500 }}><div style={{ ...MONO, fontSize: 21, lineHeight: 2.2, color: C.muted }}>{["import { graph }", "class ImpactAnalyzer", "reverse_dependencies(file)", "return affected_paths"].map((text, i) => <div key={text} style={{ color: i === 2 ? C.cyan : C.text, opacity: between(frame, i * 8, 24 + i * 8), translate: `${between(frame, i * 8, 24 + i * 8, 20, 0)}px 0` }}>{String(i + 1).padStart(2, "0")}  {text}</div>)}</div></TechnicalPanel></CodeScanBeam><svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: graph }}><ProgressiveGraphEdge d="M 1040 460 L 1260 340" range={{ from: 78, to: 105 }} color={C.cyan} width={3} /><ProgressiveGraphEdge d="M 1040 460 L 1270 620" range={{ from: 100, to: 130 }} color={C.violet} width={3} dashArray="10 10" /><ProgressiveGraphEdge d="M 1040 460 L 1430 750" range={{ from: 120, to: 150 }} color={C.emerald} width={3} /></svg>{node(1028, 448, C.cyan, 72)}{node(1250, 330, C.cyan, 94)}{node(1260, 610, C.violet, 114)}{node(1420, 740, C.emerald, 134)}<TechnicalPanel accent={C.amber} style={{ position: "absolute", right: 130, top: 220, width: 410, padding: 24, opacity: impact, translate: `${between(frame, 140, 170, 40, 0)}px 0` }}><CornerTelemetry color={C.amber}>IMPACT CASCADE</CornerTelemetry>{["TARGET", "DIRECT CONSUMERS", "TRANSITIVE EGRESS", "STATIC TEST RELATIONSHIP"].map((text, i) => <CascadeStage key={text} index={i} startFrame={146} stagger={12} duration={16}><div style={{ borderBottom: `1px solid ${C.border}`, padding: "15px 0", color: [C.cyan, C.cyan, C.violet, C.emerald][i], ...MONO, fontSize: 13 }}>{text}</div></CascadeStage>)}<div style={{ marginTop: 20, color: C.muted, ...MONO, fontSize: 12 }}>CHANGE SIGNAL / TRACING</div></TechnicalPanel><div style={{ position: "absolute", left: 100, bottom: 90, color: C.muted, ...MONO, fontSize: 13 }}>CORE MOTION CHECK / NO SCENE CUT / SHARED SIGNAL STATE</div></AbsoluteFill>;
}

export function Root() {
  return <><Composition id="RepoPilotFilm" component={Film} durationInFrames={DURATION} fps={FPS} width={W} height={H} /><Composition id="MotionPrototype" component={PrototypeGraph} durationInFrames={240} fps={FPS} width={W} height={H} /></>;
}
