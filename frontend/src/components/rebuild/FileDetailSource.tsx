import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, Braces, GitBranch, Network, TestTube2, TriangleAlert } from 'lucide-react'
import { api, type Hotspot, type RepositoryFile, type TestRelationship } from '../../lib/api/client'
import { WorkspaceHeader, WorkspacePanel, WorkspaceState } from './WorkspaceStates'

type SymbolRow = { id: number; kind: string; name: string; qualified_name: string; start_line: number; end_line: number }
type DependencyRow = { target_file_id: number | null; imported_name: string; evidence: string }
type ReverseDependencyRow = { source_file_id: number; imported_name: string; evidence: string }

export interface FileDetailSourceProps { repositoryId: number | null; fileId: number | null; onBack?: () => void; backLabel?: string; onSelectFile?: (fileId: number) => void }

export function FileDetailSource({ repositoryId, fileId, onBack, backLabel = 'Back', onSelectFile }: FileDetailSourceProps) {
  const [file, setFile] = useState<RepositoryFile | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [symbols, setSymbols] = useState<SymbolRow[]>([])
  const [forward, setForward] = useState<DependencyRow[]>([])
  const [reverse, setReverse] = useState<ReverseDependencyRow[]>([])
  const [tests, setTests] = useState<TestRelationship[]>([])
  const [hotspot, setHotspot] = useState<Hotspot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFile(null); setContent(null); setSymbols([]); setForward([]); setReverse([]); setTests([]); setHotspot(null); setError('')
    if (!repositoryId || !fileId) return
    setLoading(true)
    Promise.all([
      api.file(repositoryId, fileId),
      api.fileContent(repositoryId, fileId),
      api.symbols(repositoryId, fileId),
      api.forwardDependencies(repositoryId, fileId),
      api.reverseDependencies(repositoryId, fileId),
      api.sourceTests(repositoryId, fileId),
      api.hotspots(repositoryId),
    ]).then(([meta, source, symbolPage, forwardPage, reversePage, testPage, hotspotPage]) => {
      setFile(meta)
      setContent(source.content)
      setSymbols(symbolPage.items)
      setForward(forwardPage.items)
      setReverse(reversePage.items)
      setTests(testPage.items)
      setHotspot(hotspotPage.items.find(item => item.file_id === fileId) ?? null)
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'File intelligence unavailable')).finally(() => setLoading(false))
  }, [repositoryId, fileId])

  if (!repositoryId || !fileId) return <WorkspaceState kind="empty"><Activity size={21} />Select a file to inspect its source.</WorkspaceState>
  if (loading && !file) return <WorkspaceState kind="loading">Loading source, symbols, relationships, and tests…</WorkspaceState>
  if (error) return <WorkspaceState kind="error">{error}</WorkspaceState>
  if (!file) return <WorkspaceState kind="loading">Loading file intelligence…</WorkspaceState>

  return <>
    <WorkspaceHeader eyebrow="FILE DETAIL / repository intelligence" title={file.relative_path} detail={`${file.language || 'unknown'} · ${file.line_count ?? 'unknown'} lines · ${file.size_bytes} bytes · ${file.classification}`} action={onBack ? <button className="button button-quiet" onClick={onBack}><ArrowLeft size={14} />{backLabel}</button> : undefined} />
    <div className="file-detail-rebuild-grid">
      <WorkspacePanel title="Source viewer">
        {content === null ? <WorkspaceState kind="empty">Source content is unavailable for this file.</WorkspaceState> : <div className="source-view"><div className="source-toolbar"><span>{file.relative_path}</span><span>{symbols.length} symbols</span></div>{content.split('\n').map((line, index) => <div className="source-line" key={`${index}-${line}`}><span className="line-number">{index + 1}</span><code>{line || ' '}</code></div>)}</div>}
      </WorkspacePanel>
      <aside className="file-intelligence-rail">
        <WorkspacePanel title="Signal profile"><div className="file-signal-grid"><span><Braces size={14} />Symbols<strong>{symbols.length}</strong></span><span><Network size={14} />Fan-in<strong>{reverse.length}</strong></span><span><GitBranch size={14} />Fan-out<strong>{forward.length}</strong></span><span><TestTube2 size={14} />Static tests<strong>{tests.length}</strong></span></div>{hotspot && <div className="file-hotspot"><TriangleAlert size={14} /><span>Hotspot score<strong>{hotspot.score}</strong></span></div>}</WorkspacePanel>
        <WorkspacePanel title="Symbols">{symbols.length ? symbols.map(symbol => <div className="intelligence-row" key={symbol.id}><strong>{symbol.name}</strong><small>{symbol.kind} · L{symbol.start_line}–{symbol.end_line}</small></div>) : <WorkspaceState kind="empty">No symbols detected.</WorkspaceState>}</WorkspacePanel>
         <WorkspacePanel title="Dependencies"><div className="intelligence-count"><span>Outbound imports</span><strong>{forward.length}</strong></div>{forward.slice(0, 6).map(item => <button type="button" className="intelligence-row w-full text-left" key={`${item.imported_name}-${item.evidence}`} onClick={() => item.target_file_id && onSelectFile?.(item.target_file_id)}><strong>{item.imported_name || 'Dependency'}</strong><small>{item.evidence}</small></button>)}<div className="intelligence-count"><span>Inbound consumers</span><strong>{reverse.length}</strong></div>{reverse.slice(0, 6).map(item => <button type="button" className="intelligence-row w-full text-left" key={`${item.source_file_id}-${item.imported_name}`} onClick={() => onSelectFile?.(item.source_file_id)}><strong>{item.imported_name || 'Consumer'}</strong><small>{item.evidence}</small></button>)}</WorkspacePanel>
         <WorkspacePanel title="Test intelligence">{tests.length ? tests.map(test => <button type="button" className="intelligence-row w-full text-left" key={`${test.test_file_id}-${test.source_file_id}`} onClick={() => onSelectFile?.(test.test_file_id)}><strong>{test.test_path}</strong><small>{test.kind} · {test.evidence_level}</small></button>) : <WorkspaceState kind="empty">No statically linked tests.</WorkspaceState>}</WorkspacePanel>
      </aside>
    </div>
  </>
}
