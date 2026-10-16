// Obsidian Telemetry primitives (React + Tailwind v4, uses tokens/obsidian.css)
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Button({ variant = "primary", className, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "icon" }) {
  const v = {
    primary: "h-7 px-3 bg-cyan text-canvas font-semibold hover:bg-cyan-hover active:bg-cyan-active",
    ghost: "h-7 px-3 bg-trough border border-outline text-ink hover:border-inset hover:text-white",
    icon: "size-6 grid place-items-center text-ink-muted hover:bg-trough hover:text-cyan",
  }[variant];
  return <button className={cx("text-xs transition-colors", v, className)} {...p} />;
}

type Tone = "cyan" | "violet" | "amber" | "emerald" | "crimson";
const tone: Record<Tone, string> = {
  cyan: "bg-cyan/10 border-cyan/35 text-cyan",
  violet: "bg-violet/10 border-violet/35 text-violet",
  amber: "bg-amber/10 border-amber/35 text-amber",
  emerald: "bg-emerald/10 border-emerald/35 text-emerald",
  crimson: "bg-crimson/10 border-crimson/35 text-crimson",
};
export function Badge({ tone: t = "cyan", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex h-[18px] items-center px-1.5 border text-label-mono", tone[t])}>{children}</span>;
}

export function Panel({ title, action, children, className }:
  { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("bg-panel border border-outline", className)}>
      <header className="h-7 px-2 flex items-center justify-between border-b border-outline">
        <h3 className="text-label-mono text-ink-muted">{title}</h3>{action}
      </header>
      <div className="p-2">{children}</div>
    </section>
  );
}

export function Metric({ label, value, tone: t }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="bg-panel border border-outline p-2 flex items-baseline justify-between">
      <span className="text-label-mono text-ink-muted">{label}</span>
      <span className={cx("text-code-md", t ? tone[t].split(" ").pop() : "text-ink")}>{value}</span>
    </div>
  );
}

export function SearchInput(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx("h-8 w-full px-2 bg-canvas border border-outline text-ink text-code-md placeholder:text-ink-faint outline-none focus:border-cyan", p.className)} />;
}

export function TreeRow({ depth = 0, selected, children, meta }:
  { depth?: number; selected?: boolean; children: ReactNode; meta?: ReactNode }) {
  return (
    <div className={cx("relative h-[26px] flex items-center pr-2 text-code-md hover:bg-trough", selected && "bg-trough")}>
      {selected && <span className="absolute left-0 inset-y-0 w-0.5 bg-cyan" />}
      {Array.from({ length: depth }).map((_, i) => <span key={i} className="w-4 self-stretch border-l border-outline ml-2" />)}
      <span className="flex-1 truncate pl-2">{children}</span>{meta}
    </div>
  );
}

export function GraphNode({ kind, title, subtitle }:
  { kind: "entry" | "module" | "hotspot"; title: string; subtitle?: string }) {
  const accent = { entry: "border-t-cyan", module: "border-t-violet", hotspot: "border-t-amber" }[kind];
  const port = "absolute size-1.5 bg-inset";
  return (
    <div className={cx("relative min-w-[180px] bg-panel border border-outline border-t-2 p-2", accent)}>
      <span className={cx(port, "-left-[3px] top-1/2 -translate-y-1/2")} />
      <span className={cx(port, "-right-[3px] top-1/2 -translate-y-1/2")} />
      <div className="text-headline-sm text-ink">{title}</div>
      {subtitle && <div className="text-code-sm text-ink-muted">{subtitle}</div>}
    </div>
  );
}
