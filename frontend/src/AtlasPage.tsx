import { useState } from 'react'
import type { AtlasModule, AtlasRegion } from './lib/api/client'
import type { HandoffData } from './lib/handoffData'
import { KitButton, KitEmpty, KitMetric, KitPageHeader, KitPanel, KitSearchInput } from './kit/KitPrimitives'

type AtlasRoute = 'files' | 'graph' | 'impact'
type RegionRow = { region: AtlasRegion; modules: AtlasModule[]; top: number; height: number }

type AtlasPageProps = {
  data: HandoffData
  atlasError: string | null
  onOpenFile: (id: number) => void
  onNavigate: (route: AtlasRoute, fileId?: number | null) => void
}

export default function AtlasPage({ data, atlasError, onOpenFile, onNavigate }: AtlasPageProps) {
  const atlas = data.atlas
  const [level, setLevel] = useState<'repository' | 'region' | 'module'>('repository')
  const [filter, setFilter] = useState<'all' | 'dependencies' | 'hotspots' | 'tests'>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<{ type: 'region' | 'module'; id: string } | null>(null)

  if (!atlas) {
    const needsScan = !atlasError || atlasError.includes('No ready scan found')
    return <><KitPageHeader eyebrow="Graph / atlas" title="Dependency Atlas" detail="Architectural map of the repository and its internal dependency flow." /><KitEmpty title={needsScan ? 'Atlas scan needed' : 'Dependency Atlas unavailable'} detail={needsScan ? 'Complete a repository scan to build the Dependency Atlas.' : atlasError ?? 'The Atlas API did not return data.'} /></>
  }

  const focus = (type: 'region' | 'module', id: string) => {
    setSelected({ type, id })
    setLevel(type)
  }
  const selectedModule = selected?.type === 'module' ? atlas.modules.find(item => item.id === selected.id) ?? null : null
  const selectedRegion = selected?.type === 'region' ? atlas.regions.find(item => item.id === selected.id) ?? null : null
  const representative = selectedModule?.files[0]?.file_id ?? (selectedRegion ? atlas.modules.find(item => item.region_id === selectedRegion.id)?.files[0]?.file_id : undefined)
  const inspectorModules = selectedRegion ? atlas.modules.filter(item => item.region_id === selectedRegion.id) : selectedModule ? [selectedModule] : []
  const inspectorModuleIds = new Set(inspectorModules.map(item => item.id))
  const connectedIds = selected ? new Set(atlas.edges.filter(edge => inspectorModuleIds.has(edge.source) || inspectorModuleIds.has(edge.target)).flatMap(edge => [edge.source, edge.target])) : null
  const connectedModules = selected ? Array.from(new Set(atlas.edges.filter(edge => inspectorModuleIds.has(edge.source) || inspectorModuleIds.has(edge.target)).flatMap(edge => inspectorModuleIds.has(edge.source) ? [edge.target] : [edge.source]))).map(id => atlas.modules.find(item => item.id === id)).filter((item): item is AtlasModule => Boolean(item)).sort((a, b) => (b.inbound_dependencies + b.outbound_dependencies) - (a.inbound_dependencies + a.outbound_dependencies)).slice(0, 6) : []
  const hotspotFiles = inspectorModules.flatMap(item => item.files).filter(item => item.hotspot_score > 0).sort((a, b) => b.hotspot_score - a.hotspot_score).slice(0, 6)
  const needle = query.trim().toLowerCase()
  const moduleMatches = (module: AtlasModule) => {
    const region = atlas.regions.find(item => item.id === module.region_id)
    const inScope = level === 'repository' || (level === 'region' && (!selected || region?.id === selected.id)) || (level === 'module' && (!selected || module.id === selected.id))
    const matchesFilter = filter === 'all' || (filter === 'dependencies' && module.inbound_dependencies + module.outbound_dependencies > 0) || (filter === 'hotspots' && module.hotspots > 0) || (filter === 'tests' && module.test_files > 0)
    const matchesSearch = !needle || `${module.label} ${module.path} ${region?.label ?? ''} ${region?.path ?? ''}`.toLowerCase().includes(needle)
    return inScope && matchesFilter && matchesSearch
  }
  const visibleModules = atlas.modules.filter(moduleMatches)
  const regionRows: RegionRow[] = []
  let cursorY = 18
  for (const region of atlas.regions) {
    const modules = visibleModules.filter(item => item.region_id === region.id)
    if (!modules.length) continue
    const top = cursorY
    const height = Math.max(108, Math.ceil(modules.length / 3) * 98 + 26)
    regionRows.push({ region, modules, top, height })
    cursorY += height
  }
  const mapHeight = Math.max(420, cursorY + 18)
  const positions = new Map<string, { x: number; y: number }>()
  for (const row of regionRows) row.modules.forEach((module, index) => positions.set(module.id, { x: 220 + (index % 3) * 220, y: row.top + 22 + Math.floor(index / 3) * 98 }))
  const visibleIds = new Set(visibleModules.map(item => item.id))
  const visibleEdges = atlas.edges.filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target))
  const edgeTone = (edge: typeof atlas.edges[number]) => edge.test_count > 0 ? '#06D6A0' : edge.hotspot > 0 ? '#FFB703' : edge.dependency_count > 0 ? '#00F2FE' : '#9D4EDD'
  const openFiles = () => onNavigate('files', representative ?? null)
  const search = (value: string) => {
    setQuery(value)
    const valueNeedle = value.trim().toLowerCase()
    if (!valueNeedle) return
    const region = atlas.regions.find(item => `${item.label} ${item.path}`.toLowerCase().includes(valueNeedle))
    const module = atlas.modules.find(item => `${item.label} ${item.path}`.toLowerCase().includes(valueNeedle))
    if (region) focus('region', region.id)
    else if (module) focus('module', module.id)
  }
  const inspectorActions = <div className="kit-action-row"><KitButton variant="ghost" onClick={openFiles}>Open Files</KitButton>{representative && <><KitButton onClick={() => onNavigate('graph', representative)}>Open in Dependency Graph</KitButton><KitButton variant="ghost" onClick={() => onNavigate('impact', representative)}>Analyze Impact</KitButton></>}</div>
  const connectedPanel = connectedModules.length ? <KitPanel title="Top connected modules"><div className="kit-rows">{connectedModules.map(module => <button className="kit-evidence-row" key={module.id} onClick={() => focus('module', module.id)}><strong>{module.path}</strong><small>{module.inbound_dependencies} in / {module.outbound_dependencies} out</small></button>)}</div></KitPanel> : null
  const hotspotPanel = hotspotFiles.length ? <KitPanel title="Top hotspot files"><div className="kit-rows">{hotspotFiles.map(file => <button className="kit-evidence-row" key={file.file_id} onClick={() => onOpenFile(file.file_id)}><strong>{file.name}</strong><small>{file.path} · score {file.hotspot_score}</small></button>)}</div></KitPanel> : null

  return <><KitPageHeader eyebrow="Graph / architecture" title="Dependency Atlas" detail="Architectural map of the repository and its internal dependency flow." actions={<><KitButton variant="ghost" onClick={() => { setLevel('repository'); setSelected(null); setQuery('') }}>Reset layout</KitButton><KitButton onClick={() => document.querySelector('.kit-atlas-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Fit Atlas</KitButton></>} />
    <div className="kit-atlas-metrics">{[['REGIONS', atlas.metrics.regions], ['MODULES', atlas.metrics.modules], ['FILES', atlas.metrics.files], ['DEPENDENCIES', atlas.metrics.dependencies], ['HOTSPOTS', atlas.metrics.hotspots], ['TEST RELATIONSHIPS', atlas.metrics.test_relationships]].map(([label, value]) => <KitMetric key={String(label)} label={String(label)} value={value as number} />)}</div>
    {data.endpointErrors.atlas && <div className="kit-warning">Partial intelligence: Atlas endpoint error — {data.endpointErrors.atlas}</div>}
    <div className="kit-atlas-toolbar"><select className="kit-select" value={level} onChange={event => setLevel(event.target.value as typeof level)}><option value="repository">Repository</option><option value="region">Region</option><option value="module">Module</option></select><select className="kit-select" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="all">All</option><option value="dependencies">Dependencies</option><option value="hotspots">Hotspots</option><option value="tests">Tests</option></select><KitSearchInput value={query} onChange={event => search(event.target.value)} placeholder="Find a module/region" /></div>
    <div className="kit-atlas-layout"><div className="kit-atlas-map"><div className="kit-atlas-canvas" style={{ minHeight: mapHeight }}><svg className="kit-atlas-edges" viewBox={`0 0 900 ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true"><defs><marker id="kit-atlas-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="currentColor" /></marker></defs>{visibleEdges.map(edge => { const source = positions.get(edge.source); const target = positions.get(edge.target); if (!source || !target) return null; const active = !selected || (connectedIds?.has(edge.source) && connectedIds.has(edge.target)); return <g key={edge.id} className={active ? '' : 'is-dim'} style={{ color: edgeTone(edge) }}><line x1={source.x + 90} y1={source.y + 34} x2={target.x + 90} y2={target.y + 34} markerEnd="url(#kit-atlas-arrow)" /><text x={(source.x + target.x) / 2 + 90} y={(source.y + target.y) / 2 + 28}>{edge.dependency_count} dep</text></g> })}</svg>{regionRows.map(row => <section className={`kit-atlas-region-band ${selected?.id === row.region.id ? 'is-selected' : ''}`} key={row.region.id} style={{ top: row.top, height: row.height }}><button className="kit-atlas-region-label" onClick={() => focus('region', row.region.id)}><strong>{row.region.label}</strong><small>{row.region.path} · {row.region.file_count} files</small></button>{row.modules.map(module => { const position = positions.get(module.id)!; const active = !selected || connectedIds?.has(module.id); return <button key={module.id} className={`kit-atlas-module ${selected?.id === module.id ? 'is-selected' : ''} ${active ? '' : 'is-dim'}`} style={{ left: position.x, top: position.y - row.top }} onClick={() => focus('module', module.id)}><strong>{module.label}</strong><small>{module.file_count} files · {module.outbound_dependencies} out / {module.inbound_dependencies} in</small></button> })}</section>)}{!regionRows.length && <KitEmpty title="No matching atlas nodes" detail="Adjust the level, filter, or search." />}</div></div>
      <aside className="kit-atlas-inspector">{selectedModule ? <><div className="kit-eyebrow">Module inspector</div><h3>{selectedModule.label}</h3><p>{selectedModule.path}</p><div className="kit-atlas-stats"><span>Files<b>{selectedModule.file_count}</b></span><span>Symbols<b>{selectedModule.symbol_count}</b></span><span>Inbound<b>{selectedModule.inbound_dependencies}</b></span><span>Outbound<b>{selectedModule.outbound_dependencies}</b></span><span>Hotspots<b>{selectedModule.hotspots}</b></span><span>Tests<b>{selectedModule.test_files}</b></span></div><p>Languages: {selectedModule.languages.join(', ') || '—'}</p>{inspectorActions}{connectedPanel}{hotspotPanel}<KitPanel title="Module files"><div className="kit-rows">{selectedModule.files.slice(0, 8).map(file => <button className="kit-evidence-row" key={file.file_id} onClick={() => onOpenFile(file.file_id)}><strong>{file.name}</strong><small>{file.path} · {file.symbol_count} symbols · {file.inbound_dependencies} in / {file.outbound_dependencies} out</small></button>)}</div></KitPanel></> : selectedRegion ? <><div className="kit-eyebrow">Region inspector</div><h3>{selectedRegion.label}</h3><p>{selectedRegion.path}</p><div className="kit-atlas-stats"><span>Files<b>{selectedRegion.file_count}</b></span><span>Symbols<b>{selectedRegion.symbol_count}</b></span><span>Inbound<b>{selectedRegion.inbound_dependencies}</b></span><span>Outbound<b>{selectedRegion.outbound_dependencies}</b></span><span>Hotspots<b>{selectedRegion.hotspots}</b></span><span>Tests<b>{selectedRegion.test_files}</b></span></div><p>Languages: {selectedRegion.languages.join(', ') || '—'}</p>{inspectorActions}{connectedPanel}<KitPanel title="Top modules"><div className="kit-rows">{inspectorModules.slice().sort((a, b) => b.hotspot_score - a.hotspot_score).slice(0, 8).map(module => <button className="kit-evidence-row" key={module.id} onClick={() => focus('module', module.id)}><strong>{module.path}</strong><small>{module.file_count} files · score {module.hotspot_score}</small></button>)}</div></KitPanel>{hotspotPanel}</> : <KitEmpty title="Select an atlas node" detail="Choose a region or module to inspect its real counts and navigation actions." />}</aside></div></>
}
