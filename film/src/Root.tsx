import React, { type CSSProperties } from "react";
import { AbsoluteFill, Composition, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const C = {
  bg: "#07090d", surface: "#0d1118", surface2: "#111722", border: "#263241",
  text: "#e6edf3", muted: "#748398", cyan: "#58dcff", violet: "#a18cff",
  amber: "#f0b454", emerald: "#43ddb0", crimson: "#ef6177",
};
const UI: CSSProperties = { fontFamily: "Space Grotesk, ui-sans-serif, sans-serif" };
const MONO: CSSProperties = { fontFamily: "DM Mono, ui-monospace, monospace" };
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: ease };
const f = (frame: number, range: [number, number], output: [number, number]) => interpolate(frame, range, output, clamp);

function Grid() {
  return <svg viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, opacity: 0.28 }}>
    <defs><pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke={C.border} strokeWidth="1" /></pattern></defs>
    <rect width="1920" height="1080" fill="url(#grid)" />
  </svg>;
}

function TopBar({ index, label }: { index: string; label: string }) {
  return <div style={{ position: "absolute", top: 34, left: 70, right: 70, display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 15, letterSpacing: 2.5, ...MONO }}>
    <span>REP<span style={{ color: C.cyan }}>O</span>PILOT <span style={{ color: C.border }}>/</span> {label}</span><span>{index} · OBSIDIAN TELEMETRY</span>
  </div>;
}

function SceneShell({ children, index, label, frame, duration }: { children: React.ReactNode; index: string; label: string; frame: number; duration: number }) {
  const opacity = f(frame, [0, 18], [0, 1]) * f(frame, [duration - 18, duration], [1, 0]);
  return <AbsoluteFill style={{ backgroundColor: C.bg, color: C.text, ...UI, opacity }}><Grid /><TopBar index={index} label={label} />{children}</AbsoluteFill>;
}

function Kicker({ children, color = C.cyan }: { children: React.ReactNode; color?: string }) {
  return <div style={{ color, fontSize: 15, letterSpacing: 2.8, ...MONO }}>{children}</div>;
}

function Panel({ children, style = {} }: { children: React.ReactNode; style?: CSSProperties }) {
  return <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}

function Pulse({ x, y, color = C.cyan, size = 12, scale = 1, opacity = 1 }: { x: number; y: number; color?: string; size?: number; scale?: number; opacity?: number }) {
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, backgroundColor: color, opacity, scale, boxShadow: `0 0 18px ${color}88` }} />;
}

function SignalRule({ left, top, width, color = C.cyan, progress = 1 }: { left: number; top: number; width: number; color?: string; progress?: number }) {
  return <div style={{ position: "absolute", left, top, width, height: 1, backgroundColor: C.border, overflow: "hidden" }}><div style={{ width: `${progress * 100}%`, height: 1, backgroundColor: color, opacity: 0.9 }} /></div>;
}

function Scene01({ frame }: { frame: number }) {
  const scan = f(frame, [14, 136], [0, 1]);
  const telemetry = ["REPOSITORY DETECTED", "87 FILES", "10,064 LINES", "31 SYMBOLS", "DEPENDENCIES: ANALYZING"];
  const fragments = [
    [90, 230, "import { scanSnapshot } from './scan'", C.cyan],
    [820, 160, "class DependencyGraph", C.violet],
    [300, 650, "src/services/impact.py", C.amber],
    [1120, 600, "return reverseDependencies(file)", C.emerald],
  ] as const;
  return <SceneShell frame={frame} duration={150} index="01" label="UNKNOWN REPOSITORY">
    <div style={{ position: "absolute", left: 86, top: 150, ...MONO, fontSize: 17, lineHeight: 2.25, color: C.muted }}>{telemetry.map((text, i) => <div key={text} style={{ opacity: f(frame, [i * 18, i * 18 + 18], [0, 1]), translate: `${f(frame, [i * 18, i * 18 + 18], [-16, 0])}px 0` }}><span style={{ color: i === 0 ? C.cyan : C.text }}>{text}</span></div>)}</div>
    {fragments.map(([x, y, text, color], i) => <Panel key={text} style={{ position: "absolute", left: x, top: y, padding: "18px 22px", color, fontSize: 20, ...MONO, opacity: f(frame, [22 + i * 12, 48 + i * 12], [0, 0.82]), translate: `${f(frame, [22 + i * 12, 48 + i * 12], [26, 0])}px 0`, scale: f(frame, [22 + i * 12, 48 + i * 12], [0.98, 1]) }}>{text}<div style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>line {String(12 + i * 17).padStart(3, "0")} · signal unresolved</div></Panel>)}
    <div style={{ position: "absolute", left: 70, right: 70, top: 495, height: 2, backgroundColor: `${C.cyan}22`, overflow: "hidden" }}><div style={{ height: 2, width: 300, backgroundColor: C.cyan, translate: `${f(frame, [20, 138], [-300, 1660])}px 0`, boxShadow: `0 0 18px ${C.cyan}` }} /></div>
    <div style={{ position: "absolute", left: 90, bottom: 120, maxWidth: 920, fontSize: 48, lineHeight: 1.08, letterSpacing: -1.5, opacity: f(frame, [86, 126], [0, 1]), translate: `${f(frame, [86, 126], [22, 0])}px 0` }}>An unfamiliar codebase<br /><span style={{ color: C.cyan }}>shouldn't feel like a maze.</span></div>
    <div style={{ position: "absolute", right: 100, bottom: 122, color: C.muted, fontSize: 14, ...MONO }}>SCAN / 0001 / LOCAL WORKSPACE</div>
    <SignalRule left={90} top={910} width={420} progress={scan} />
  </SceneShell>;
}

function Architecture({ frame }: { frame: number }) {
  const nodes = [[1060, 260, C.cyan], [1300, 370, C.violet], [1135, 540, C.cyan], [1465, 565, C.amber], [890, 600, C.emerald], [770, 380, C.cyan], [1520, 230, C.violet]] as const;
  const reveal = f(frame, [8, 125], [0, 1]);
  return <SceneShell frame={frame} duration={150} index="02" label="STRUCTURE FORMED">
    <div style={{ position: "absolute", left: 95, top: 195, width: 620 }}><Kicker>REPOSITORY → STRUCTURE</Kicker><div style={{ fontSize: 82, letterSpacing: -4, lineHeight: 0.98, marginTop: 22 }}>Fragments<br /><span style={{ color: C.cyan }}>find form.</span></div><div style={{ marginTop: 28, color: C.muted, fontSize: 22, lineHeight: 1.45, maxWidth: 510 }}>Folders become nodes. Files become evidence. Symbols become a map you can move through.</div></div>
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}><g fill="none" strokeWidth="2">{nodes.slice(1).map(([x, y], i) => <line key={i} x1={nodes[0][0]} y1={nodes[0][1]} x2={x} y2={y} stroke={i % 2 ? C.violet : C.cyan} opacity={f(frame, [22 + i * 9, 62 + i * 9], [0, 0.75])} />)}</g></svg>
    {nodes.map(([x, y, color], i) => <div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, opacity: f(frame, [i * 11, i * 11 + 30], [0, 1]), scale: f(frame, [i * 11, i * 11 + 30], [0.25, 1]) }}><Pulse x={0} y={0} size={i === 0 ? 28 : 14} color={color} /><div style={{ position: "absolute", left: 24, top: -9, whiteSpace: "nowrap", color: i === 0 ? C.text : C.muted, fontSize: 14, ...MONO }}>{["src/", "services/", "api/", "tests/", "cli/", "models/", "scan/"][i]}</div></div>)}
    <div style={{ position: "absolute", right: 98, bottom: 116, textAlign: "right", ...MONO }}><div style={{ color: C.cyan, fontSize: 30, letterSpacing: 3 }}>REPOPILOT</div><div style={{ color: C.muted, fontSize: 15, letterSpacing: 2, marginTop: 8 }}>LOCAL CODEBASE INTELLIGENCE</div></div>
    <SignalRule left={96} top={910} width={520} color={C.violet} progress={reveal} />
  </SceneShell>;
}

function Metric({ label, value, color, frame, delay }: { label: string; value: string; color: string; frame: number; delay: number }) {
  const p = f(frame, [delay, delay + 26], [0, 1]);
  return <Panel style={{ flex: 1, minHeight: 150, padding: 22, opacity: p, translate: `0 ${f(frame, [delay, delay + 26], [24, 0])}px` }}><div style={{ color: C.muted, fontSize: 13, letterSpacing: 2, ...MONO }}>{label}</div><div style={{ color, fontSize: 44, marginTop: 24, ...MONO }}>{value}</div><div style={{ height: 2, backgroundColor: `${color}30`, marginTop: 22 }}><div style={{ height: 2, width: `${p * 100}%`, backgroundColor: color }} /></div></Panel>;
}

function Scene03({ frame }: { frame: number }) {
  return <SceneShell frame={frame} duration={150} index="03" label="REPOSITORY COCKPIT">
    <div style={{ position: "absolute", left: 92, top: 150 }}><Kicker>REPOSITORY COCKPIT / READY SNAPSHOT</Kicker><div style={{ fontSize: 62, letterSpacing: -2.5, marginTop: 24 }}>One repository.<br /><span style={{ color: C.cyan }}>Visible at a glance.</span></div></div>
    <Panel style={{ position: "absolute", left: 92, right: 92, top: 390, padding: 26 }}><div style={{ display: "flex", justifyContent: "space-between", color: C.muted, ...MONO, fontSize: 14 }}><span>REPO / repopilot</span><span>BRANCH / main</span><span style={{ color: C.emerald }}>● READY / SNAPSHOT 0042</span></div><div style={{ display: "flex", gap: 12, marginTop: 28 }}><Metric label="FILES" value="87" color={C.cyan} frame={frame} delay={10} /><Metric label="LINES" value="10,064" color={C.text} frame={frame} delay={24} /><Metric label="SYMBOLS" value="31" color={C.violet} frame={frame} delay={38} /><Metric label="DEPENDENCIES" value="142" color={C.cyan} frame={frame} delay={52} /><Metric label="TESTS" value="12" color={C.emerald} frame={frame} delay={66} /></div></Panel>
    <div style={{ position: "absolute", left: 94, bottom: 112, color: C.muted, fontSize: 16, ...MONO }}>INDEXED FILES / SOURCE + TEST / STATIC RELATIONSHIPS / NO CLOUD REQUIRED</div>
  </SceneShell>;
}

function Scene04({ frame }: { frame: number }) {
  const code = ["from app.services.graph import DependencyGraph", "", "class ImpactAnalyzer:", "    def reverse_dependencies(self, file):", "        paths = graph.reverse(file)", "        return ImpactAnalysis(paths=paths)"]; const reveal = f(frame, [10, 130], [0, 1]);
  return <SceneShell frame={frame} duration={180} index="04" label="SOURCE INTELLIGENCE">
    <div style={{ position: "absolute", left: 70, top: 130, width: 250, bottom: 90 }}><Kicker>FILES</Kicker><div style={{ marginTop: 24, color: C.muted, ...MONO, fontSize: 16, lineHeight: 2.2 }}>{["▾ src", "  ▾ services", "    impact.py", "    graph.py", "  ▾ api", "    routes.py", "▾ tests", "  test_impact.py"].map((item, i) => <div key={item} style={{ color: i === 2 ? C.cyan : i === 7 ? C.emerald : C.muted, opacity: f(frame, [i * 8, i * 8 + 24], [0, 1]) }}>{item}</div>)}</div></div>
    <Panel style={{ position: "absolute", left: 350, top: 130, width: 930, height: 770, padding: 28, ...MONO }}><div style={{ color: C.muted, fontSize: 14, borderBottom: `1px solid ${C.border}`, paddingBottom: 18 }}>src/services/impact.py <span style={{ float: "right" }}>PYTHON · 48 LINES · SHA 9F2C</span></div>{code.map((line, i) => <div key={`${i}-${line}`} style={{ display: "flex", lineHeight: 2.35, fontSize: 20, opacity: f(frame, [16 + i * 10, 34 + i * 10], [0, 1]), translate: `${f(frame, [16 + i * 10, 34 + i * 10], [18, 0])}px 0` }}><span style={{ color: C.muted, width: 56 }}>{String(i + 1).padStart(2, "0")}</span><span style={{ color: i === 0 || i === 4 ? C.cyan : i === 2 ? C.violet : C.text }}>{line || " "}</span></div>)}<div style={{ position: "absolute", left: 25, right: 25, top: 436, height: 2, backgroundColor: `${C.cyan}44`, opacity: f(frame, [70, 96], [0, 1]) }}><div style={{ height: 2, width: 240, backgroundColor: C.cyan, translate: `${f(frame, [70, 122], [-240, 760])}px 0` }} /></div></Panel>
    <Panel style={{ position: "absolute", right: 70, top: 210, width: 350, padding: 24 }}><Kicker color={C.violet}>SYMBOL SIGNALS</Kicker><div style={{ ...MONO, color: C.text, lineHeight: 2.2, marginTop: 22, fontSize: 15 }}>{["ImpactAnalyzer", "reverse_dependencies", "DependencyGraph", "ImpactAnalysis"].map((name, i) => <div key={name} style={{ opacity: f(frame, [52 + i * 12, 70 + i * 12], [0, 1]) }}><span style={{ color: C.violet }}>◆</span> {name}</div>)}</div><SignalRule left={24} top={242} width={300} color={C.cyan} progress={reveal} /><div style={{ marginTop: 34, color: C.muted, fontSize: 15, lineHeight: 1.45 }}>Imports become relationship evidence. Static source and test links stay inspectable.</div></Panel>
  </SceneShell>;
}

const graphNodes = [
  { x: 780, y: 470, label: "impact.py", kind: "target", color: C.cyan },
  { x: 570, y: 300, label: "routes.py", kind: "direct", color: C.cyan },
  { x: 570, y: 650, label: "graph.py", kind: "direct", color: C.cyan },
  { x: 1010, y: 300, label: "cli.py", kind: "direct", color: C.cyan },
  { x: 1040, y: 660, label: "models.py", kind: "transitive", color: C.violet },
  { x: 1310, y: 395, label: "test_impact.py", kind: "test", color: C.emerald },
  { x: 1340, y: 680, label: "scan.py", kind: "transitive", color: C.violet },
  { x: 360, y: 480, label: "app.py", kind: "transitive", color: C.violet },
];

function GraphEdge({ a, b, color, progress, dashed = false }: { a: { x: number; y: number }; b: { x: number; y: number }; color: string; progress: number; dashed?: boolean }) {
  const x = a.x + (b.x - a.x) * progress; const y = a.y + (b.y - a.y) * progress;
  return <><line x1={a.x} y1={a.y} x2={x} y2={y} stroke={color} strokeWidth="2" strokeDasharray={dashed ? "8 8" : undefined} opacity={0.84} /><Pulse x={x} y={y} color={color} size={8} opacity={progress > 0.05 && progress < 0.99 ? 1 : 0} /></>;
}

function GraphLegend() {
  return <div style={{ position: "absolute", right: 80, bottom: 100, display: "flex", gap: 24, color: C.muted, fontSize: 13, ...MONO }}>{[[C.cyan, "DIRECT"], [C.violet, "TRANSITIVE"], [C.emerald, "STATIC TEST"]].map(([color, label]) => <span key={label}><i style={{ display: "inline-block", width: 9, height: 9, backgroundColor: color, marginRight: 8 }} />{label}</span>)}</div>;
}

function Scene05({ frame }: { frame: number }) {
  const center = graphNodes[0]; const pull = f(frame, [0, 230], [1.06, 0.92]); const selected = f(frame, [140, 205], [0.85, 1]);
  return <SceneShell frame={frame} duration={240} index="05" label="DEPENDENCY GRAPH">
    <div style={{ position: "absolute", left: 72, top: 106, color: C.muted, fontSize: 14, ...MONO }}>BUILD REPOSITORY GRAPH <span style={{ color: C.border }}>/</span> DEPTH 03 <span style={{ color: C.border }}>/</span> FOCUS FILE</div>
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, scale: pull }}>
      {graphNodes.slice(1).map((node, i) => <GraphEdge key={node.label} a={center} b={node} color={node.color} progress={f(frame, [18 + i * 22, 54 + i * 22], [0, 1])} dashed={node.kind === "transitive"} />)}
      {graphNodes.slice(1, 5).map((node, i) => <GraphEdge key={`inner-${node.label}`} a={node} b={graphNodes[i + 4] ?? center} color={node.kind === "direct" ? C.violet : node.color} progress={f(frame, [126 + i * 12, 164 + i * 12], [0, 1])} dashed={node.kind !== "direct"} />)}
    </svg>
    {graphNodes.map((node, i) => <div key={node.label} style={{ position: "absolute", left: node.x, top: node.y, opacity: f(frame, [i * 18, i * 18 + 28], [0, 1]) * (i === 0 ? 1 : selected), scale: f(frame, [i * 18, i * 18 + 28], [0.4, i === 0 ? 1.25 : 1]) }}><Pulse x={0} y={0} color={node.color} size={node.kind === "target" ? 28 : 15} /><div style={{ position: "absolute", left: 26, top: -12, whiteSpace: "nowrap", color: node.kind === "target" ? C.text : C.muted, fontSize: node.kind === "target" ? 17 : 14, ...MONO }}>{node.label}</div><div style={{ position: "absolute", left: 26, top: 12, whiteSpace: "nowrap", color: C.border, fontSize: 11, ...MONO }}>{node.kind.toUpperCase()}</div></div>)}
    <Panel style={{ position: "absolute", right: 72, top: 158, width: 310, padding: 24 }}><Kicker color={C.cyan}>SELECTED NODE</Kicker><div style={{ color: C.text, fontSize: 24, marginTop: 18, ...MONO }}>impact.py</div><div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>src/services/impact.py<br />fan-in 04 · fan-out 07<br />static tests 02</div><SignalRule left={24} top={154} width={262} color={C.cyan} progress={selected} /></Panel>
    <GraphLegend />
    <div style={{ position: "absolute", left: 72, bottom: 96, fontSize: 44, letterSpacing: -1, opacity: f(frame, [150, 190], [0, 1]), translate: `${f(frame, [150, 190], [20, 0])}px 0` }}>See how the code is <span style={{ color: C.cyan }}>connected.</span></div>
    <div style={{ position: "absolute", left: 72, top: 880, color: C.muted, ...MONO, fontSize: 13 }}>NODE → CONNECTION → NODE → CLUSTER → ARCHITECTURE</div>
  </SceneShell>;
}

function CascadeRow({ label, detail, color, frame, start }: { label: string; detail: string; color: string; frame: number; start: number }) {
  const p = f(frame, [start, start + 28], [0, 1]);
  return <div style={{ opacity: p, translate: `${f(frame, [start, start + 28], [30, 0])}px 0`, display: "flex", alignItems: "center", gap: 20, padding: "18px 0", borderBottom: `1px solid ${C.border}` }}><div style={{ width: 10, height: 10, backgroundColor: color, boxShadow: `0 0 14px ${color}88` }} /><div style={{ flex: 1 }}><div style={{ color, fontSize: 17, letterSpacing: 2, ...MONO }}>{label}</div><div style={{ color: C.muted, fontSize: 14, marginTop: 8, ...MONO }}>{detail}</div></div><div style={{ color: C.muted, fontSize: 13, ...MONO }}>LINKED</div></div>;
}

function Scene06({ frame }: { frame: number }) {
  const pathProgress = f(frame, [12, 165], [0, 1]);
  return <SceneShell frame={frame} duration={180} index="06" label="IMPACT ANALYSIS">
    <div style={{ position: "absolute", left: 92, top: 148, width: 520 }}><Kicker color={C.amber}>IMPACT ANALYSIS / STATIC STRUCTURE</Kicker><div style={{ fontSize: 62, lineHeight: 1, letterSpacing: -2, marginTop: 22 }}>Change one file.<br /><span style={{ color: C.amber }}>See the reach.</span></div><div style={{ marginTop: 24, color: C.muted, fontSize: 18, lineHeight: 1.55 }}>Reverse dependency traversal explains potentially affected files without claiming runtime coverage.</div></div>
    <Panel style={{ position: "absolute", left: 720, top: 140, width: 900, padding: 30 }}><div style={{ display: "flex", justifyContent: "space-between", ...MONO, fontSize: 14, color: C.muted }}><span>TARGET / src/services/impact.py</span><span style={{ color: C.amber }}>IMPACT REACH: HIGH</span></div><div style={{ marginTop: 28 }}><CascadeRow label="TARGET" detail="impact.py · selected source file" color={C.cyan} frame={frame} start={12} /><CascadeRow label="DIRECT CONSUMERS" detail="routes.py · cli.py · graph.py" color={C.cyan} frame={frame} start={48} /><CascadeRow label="TRANSITIVE EGRESS" detail="models.py · scan.py · app.py" color={C.violet} frame={frame} start={82} /><CascadeRow label="TEST VALIDATION" detail="test_impact.py · static relationship" color={C.emerald} frame={frame} start={116} /></div></Panel>
    <svg viewBox="0 0 580 580" style={{ position: "absolute", left: 110, top: 470, width: 470, height: 470 }}><path d="M90 30V510H510" fill="none" stroke={C.border} strokeWidth="2" /><path d="M90 30V510H510" fill="none" stroke={C.cyan} strokeWidth="2" pathLength="1" strokeDasharray={`${pathProgress} 1`} /><circle cx="90" cy="30" r="10" fill={C.cyan} /><circle cx="510" cy="510" r="10" fill={C.emerald} /></svg>
    <div style={{ position: "absolute", left: 92, bottom: 116, color: C.muted, fontSize: 14, ...MONO }}>WHY? / each path retains file and relationship evidence</div>
  </SceneShell>;
}

function Scene07({ frame }: { frame: number }) {
  const rows = [["#01", "src/services/graph.py", "92", "18", "07", "HIGH"], ["#02", "src/api/v1/changes.py", "78", "11", "05", "WATCH"], ["#03", "frontend/src/Graph.tsx", "64", "24", "04", "RISING"], ["#04", "tests/test_impact.py", "41", "31", "02", "STABLE"], ["#05", "src/scan.py", "38", "09", "06", "STABLE"]] as const;
  return <SceneShell frame={frame} duration={150} index="07" label="STRUCTURAL HOTSPOTS">
    <div style={{ position: "absolute", left: 92, top: 142 }}><Kicker color={C.amber}>STRUCTURAL HOTSPOTS / EXPLAINABLE RANKING</Kicker><div style={{ fontSize: 58, marginTop: 22, letterSpacing: -2 }}>Find the code<br /><span style={{ color: C.amber }}>that matters most.</span></div></div>
    <Panel style={{ position: "absolute", left: 92, right: 92, top: 380, padding: 22, ...MONO, fontSize: 14 }}><div style={{ display: "grid", gridTemplateColumns: "72px 1fr 100px 90px 90px 110px", color: C.muted, padding: "0 12px 16px", borderBottom: `1px solid ${C.border}` }}><span>RANK</span><span>PATH</span><span>SCORE</span><span>LINES</span><span>FAN-IN</span><span>IMPACT REACH</span></div>{rows.map(([rank, path, score, lines, fanin, reach], i) => <div key={rank} style={{ display: "grid", gridTemplateColumns: "72px 1fr 100px 90px 90px 110px", alignItems: "center", padding: "20px 12px", borderBottom: `1px solid ${C.border}`, opacity: f(frame, [8 + i * 12, 26 + i * 12], [0, 1]), translate: `${f(frame, [8 + i * 12, 26 + i * 12], [24, 0])}px 0`, color: i === 0 ? C.text : C.muted }}><span style={{ color: i === 0 ? C.amber : C.border }}>{rank}</span><span style={{ color: i === 0 ? C.amber : C.text }}>{path}</span><span style={{ color: i === 0 ? C.amber : C.text }}>{score}</span><span>{lines}</span><span>{fanin}</span><span style={{ color: i === 0 ? C.amber : C.muted }}>{reach}</span></div>)}</Panel>
    <div style={{ position: "absolute", right: 92, bottom: 92, color: C.muted, fontSize: 14, ...MONO }}>SIGNALS / SIZE · SYMBOLS · FAN-IN · FAN-OUT · STATIC TEST LINKS</div>
  </SceneShell>;
}

function Scene08({ frame }: { frame: number }) {
  const p = f(frame, [16, 115], [0, 1]); const line = f(frame, [72, 160], [0, 1]);
  return <SceneShell frame={frame} duration={210} index="08" label="GIT INTELLIGENCE">
    <div style={{ position: "absolute", left: 92, top: 144 }}><Kicker>GIT / CHANGE INTELLIGENCE</Kicker><div style={{ fontSize: 60, lineHeight: 1.02, letterSpacing: -2, marginTop: 22 }}>Understand the change<br /><span style={{ color: C.cyan }}>before you ship it.</span></div></div>
    <Panel style={{ position: "absolute", left: 92, right: 92, top: 360, height: 370, padding: 24 }}><div style={{ display: "flex", justifyContent: "space-between", ...MONO, color: C.muted, fontSize: 14 }}><span>BRANCH / feature-impact</span><span>SHA / a13f7b2</span><span style={{ color: C.amber }}>CHANGES / 01</span></div><div style={{ marginTop: 34, display: "flex", gap: 12, alignItems: "stretch" }}><div style={{ width: 220, border: `1px solid ${C.border}`, padding: 18, ...MONO }}><div style={{ color: C.crimson }}>CHANGED FILE</div><div style={{ color: C.text, marginTop: 18 }}>impact.py</div><div style={{ color: C.muted, marginTop: 8, fontSize: 13 }}>+ 1 / − 1</div></div><div style={{ flex: 1, position: "relative", minHeight: 160 }}><div style={{ position: "absolute", left: 0, right: 0, top: 90, height: 2, backgroundColor: `${C.cyan}33` }}><div style={{ width: `${line * 100}%`, height: 2, backgroundColor: C.cyan }} /></div><div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>{[[C.cyan, "AFFECTED\nDEPENDENCIES"], [C.violet, "IMPACT"], [C.amber, "HOTSPOT"], [C.emerald, "TEST\nRELATIONSHIPS"]].map(([color, label], i) => <div key={label} style={{ opacity: f(frame, [36 + i * 25, 62 + i * 25], [0, 1]), textAlign: "center", ...MONO, fontSize: 12, color }}><Pulse x={0} y={0} color={color} size={14} /><div style={{ marginTop: 28, whiteSpace: "pre-line" }}>{label}</div></div>)}</div></div></div><div style={{ marginTop: 28, color: C.muted, ...MONO, fontSize: 13 }}>WORKING TREE / MODIFIED · STAGED 0 · UNTRACKED 0 · CONFLICTS 0</div></Panel>
    <div style={{ position: "absolute", left: 92, bottom: 110, display: "flex", gap: 22, color: C.muted, ...MONO, fontSize: 14 }}><span>HISTORY</span><span>COMPARE</span><span>FILE HISTORY</span><span>STASH</span><span style={{ color: C.cyan }}>COMMIT DETAIL →</span></div>
    <div style={{ position: "absolute", right: 92, bottom: 110, color: C.muted, ...MONO, fontSize: 14 }}>CHANGE → EVIDENCE → CONFIDENCE</div>
  </SceneShell>;
}

function Scene09({ frame }: { frame: number }) {
  const reveal = f(frame, [12, 150], [0, 1]);
  const layers = [["SOURCE", 860, 240, C.cyan], ["FILES", 990, 330, C.violet], ["GRAPH", 1080, 420, C.cyan], ["IMPACT", 1160, 510, C.amber], ["GIT", 1240, 600, C.emerald]] as const;
  return <SceneShell frame={frame} duration={180} index="09" label="THE WHOLE REPOSITORY">
    <div style={{ position: "absolute", left: 92, top: 144 }}><Kicker>ONE CONNECTED SYSTEM</Kicker><div style={{ fontSize: 58, lineHeight: 1.02, letterSpacing: -2, marginTop: 22 }}>The maze becomes<br /><span style={{ color: C.cyan }}>a model you can move through.</span></div></div>
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}><g fill="none" strokeWidth="2">{layers.map(([_, x, y, color], i) => <path key={_} d={`M${x - 90} ${y} H${x + 120} V${y + 70} H${x + 260}`} stroke={color} opacity={reveal * (0.26 + i * 0.08)} />)}</g></svg>
    {layers.map(([label, x, y, color], i) => <Panel key={label} style={{ position: "absolute", left: x, top: y, width: 390, height: 148, padding: 22, opacity: f(frame, [i * 16, i * 16 + 34], [0, 1]), translate: `${f(frame, [i * 16, i * 16 + 34], [34, 0])}px 0`, scale: f(frame, [i * 16, i * 16 + 34], [0.96, 1]) }}><div style={{ color, fontSize: 15, letterSpacing: 2, ...MONO }}>{label}</div><div style={{ marginTop: 18, color: C.text, fontSize: 22 }}>{["symbols / imports / lines", "tree / paths / snapshot", "direct / transitive / test", "target / consumers / reach", "branch / history / compare"][i]}</div><div style={{ marginTop: 12, color: C.muted, fontSize: 12, ...MONO }}>SIGNAL {String(i + 1).padStart(2, "0")} / RESOLVED</div></Panel>)}
    <div style={{ position: "absolute", left: 92, bottom: 114, color: C.muted, fontSize: 15, ...MONO }}>UNKNOWN CODE → SCAN → STRUCTURE → DEPENDENCIES → IMPACT → UNDERSTANDING</div>
  </SceneShell>;
}

function Scene10({ frame }: { frame: number }) {
  const intro = f(frame, [16, 48], [0, 1]); const title = f(frame, [38, 78], [0, 1]); const signal = f(frame, [70, 145], [0, 1]); const mark = spring({ frame: Math.max(0, frame - 20), fps: 30, config: { damping: 200 } });
  const nodes = [[950, 275], [1170, 360], [1080, 530], [800, 570], [690, 390]] as const;
  return <SceneShell frame={frame} duration={150} index="10" label="CONFIDENCE">
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.46 }}><g fill="none" stroke={C.cyan} strokeWidth="1">{nodes.slice(1).map(([x, y], i) => <line key={i} x1={nodes[0][0]} y1={nodes[0][1]} x2={x} y2={y} opacity={0.32} />)}</g></svg>
    {nodes.map(([x, y], i) => <Pulse key={i} x={x} y={y} color={i === 0 ? C.cyan : i === 2 ? C.emerald : C.violet} size={i === 0 ? 18 : 9} scale={mark} opacity={f(frame, [8 + i * 8, 34 + i * 8], [0, 1])} />)}
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", opacity: intro, scale: f(frame, [0, 62], [0.94, 1]) }}><div style={{ color: C.cyan, fontSize: 20, letterSpacing: 5, ...MONO }}>REPOPILOT</div><div style={{ color: C.muted, fontSize: 15, letterSpacing: 2.5, marginTop: 14 }}>LOCAL CODEBASE INTELLIGENCE</div><div style={{ width: 90, height: 1, backgroundColor: C.cyan, margin: "32px 0" }} /><div style={{ opacity: title, fontSize: 72, lineHeight: 1.02, letterSpacing: -2.5 }}>UNDERSTAND THE CODE.<br /><span style={{ color: C.cyan }}>SEE THE CONNECTIONS.</span></div></div>
    <div style={{ position: "absolute", left: 72, bottom: 56, color: C.muted, fontSize: 13, ...MONO, opacity: title }}>LOCAL-FIRST · STATIC · EXPLORABLE</div>
    <div style={{ position: "absolute", right: 72, bottom: 56, color: C.cyan, fontSize: 13, ...MONO, opacity: signal }}>SIGNAL / CONFIDENCE / 100%</div>
    <div style={{ position: "absolute", left: 520, right: 520, top: 862, height: 1, backgroundColor: `${C.cyan}33`, overflow: "hidden" }}><div style={{ width: 240, height: 1, backgroundColor: C.cyan, translate: `${f(frame, [70, 145], [-240, 1500])}px 0`, opacity: signal }} /></div>
  </SceneShell>;
}

function Local({ render }: { render: (frame: number) => React.ReactNode }) {
  return render(useCurrentFrame());
}

function Film() {
  const { fps } = useVideoConfig();
  return <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={150} premountFor={fps}><Local render={(frame) => <Scene01 frame={frame} />} /></Sequence>
    <Sequence from={150} durationInFrames={150} premountFor={fps}><Local render={(frame) => <Architecture frame={frame} />} /></Sequence>
    <Sequence from={300} durationInFrames={150} premountFor={fps}><Local render={(frame) => <Scene03 frame={frame} />} /></Sequence>
    <Sequence from={450} durationInFrames={180} premountFor={fps}><Local render={(frame) => <Scene04 frame={frame} />} /></Sequence>
    <Sequence from={630} durationInFrames={240} premountFor={fps}><Local render={(frame) => <Scene05 frame={frame} />} /></Sequence>
    <Sequence from={870} durationInFrames={180} premountFor={fps}><Local render={(frame) => <Scene06 frame={frame} />} /></Sequence>
    <Sequence from={1050} durationInFrames={150} premountFor={fps}><Local render={(frame) => <Scene07 frame={frame} />} /></Sequence>
    <Sequence from={1200} durationInFrames={210} premountFor={fps}><Local render={(frame) => <Scene08 frame={frame} />} /></Sequence>
    <Sequence from={1410} durationInFrames={180} premountFor={fps}><Local render={(frame) => <Scene09 frame={frame} />} /></Sequence>
    <Sequence from={1590} durationInFrames={150} premountFor={fps}><Local render={(frame) => <Scene10 frame={frame} />} /></Sequence>
  </AbsoluteFill>;
}

export function Root() {
  return <Composition id="RepoPilotFilm" component={Film} durationInFrames={1740} fps={30} width={1920} height={1080} />;
}
