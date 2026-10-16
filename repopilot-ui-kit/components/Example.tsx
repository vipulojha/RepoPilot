import { Badge, Button, GraphNode, Metric, Panel, SearchInput, TreeRow } from "./ui";

export default function Example() {
  return (
    <div className="min-h-screen bg-canvas p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <h1 className="text-headline-xl text-ink">Repository Cockpit</h1>
        <Badge tone="emerald">Clean</Badge>
        <div className="ml-auto w-80"><SearchInput placeholder="Quick open…  ⌘K" /></div>
        <Button>Run analysis</Button><Button variant="ghost">Fetch</Button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        <Metric label="Files" value="87" /><Metric label="SLOC" value="10,064" />
        <Metric label="Symbols" value="31" tone="violet" /><Metric label="Deps" value="14" />
        <Metric label="Tests" value="12" tone="emerald" />
      </div>
      <div className="grid grid-cols-[320px_1fr] gap-2">
        <Panel title="Files">
          <TreeRow>src</TreeRow>
          <TreeRow depth={1}>core/auth</TreeRow>
          <TreeRow depth={2} selected meta={<Badge tone="crimson">High</Badge>}>tokenValidator.ts</TreeRow>
          <TreeRow depth={2} meta={<Badge tone="amber">Medium</Badge>}>sessionManager.ts</TreeRow>
        </Panel>
        <Panel title="Graph · Depth 2">
          <div className="flex gap-6 flex-wrap">
            <GraphNode kind="entry" title="api" subtitle="src/api" />
            <GraphNode kind="module" title="core/auth" subtitle="src/core/auth" />
            <GraphNode kind="hotspot" title="server" subtitle="src/server" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
