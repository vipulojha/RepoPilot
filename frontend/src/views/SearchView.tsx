import React, { useEffect, useState } from 'react';
import {
  Search as SearchIcon,
  X,
  FileCode,
  Share2,
  Activity,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api, type SearchHit } from '../lib/api/client';

export const SearchView: React.FC<{ repositoryId?: number | null; onSelectFile?: (id:number) => void }> = ({ repositoryId, onSelectFile }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'files' | 'symbols' | 'tests'>('all');
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    if (!repositoryId || !query.trim()) { setLiveResults([]); setSearchError(''); setSearching(false); return; }
    const timer = window.setTimeout(() => {
      setSearching(true); setSearchError('');
      api.search(repositoryId, query).then(result => setLiveResults(result.items)).catch(error => { setLiveResults([]); setSearchError(error instanceof Error ? error.message : 'Search unavailable'); }).finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [repositoryId, query]);
  const [selectedResult, setSelectedResult] = useState('');
  const counts = {
    all: liveResults.length,
    files: liveResults.filter(hit => hit.type === 'file').length,
    symbols: liveResults.filter(hit => hit.type === 'symbol').length,
    tests: liveResults.filter(hit => hit.type === 'test').length,
  };
  const visibleResults = activeTab === 'all' ? liveResults : liveResults.filter(hit => hit.type === activeTab.slice(0, -1));
  const groupedResults = Array.from(visibleResults.reduce((groups, hit) => {
    const group = groups.get(hit.path) ?? { file: hit.path, line: hit.line, symbols: [] as SearchHit[] };
    group.symbols.push(hit); groups.set(hit.path, group); return groups;
  }, new Map<string, { file: string; line: number | null; symbols: SearchHit[] }>()).values());
  const selectedHit = liveResults.find(hit => hit.name === selectedResult) ?? liveResults[0] ?? null;

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] select-none overflow-hidden font-mono text-[#DEE2F3]">
      {/* Search Header */}
      <div className="p-6 pb-2 border-b border-[#1E2638] bg-[#0E131F]">
        <div className="text-[10px] text-[#00F2FE] tracking-widest uppercase mb-1">
          EXPLORE / CODE INTELLIGENCE
        </div>
        <h1 className="font-headline font-bold text-2xl text-[#F1F5F9] tracking-tight">
          Search
        </h1>
        <p className="text-[12px] font-sans-geist text-[#94A3B8] mt-1 mb-4">
          Find files, symbols, and source text across parsed ASTs.
        </p>

        {/* Search Bar with Filter Chips */}
        <div className="flex items-center gap-2 p-1.5 bg-[#0B0E14] border border-[#1E2638] focus-within:border-[#00F2FE] transition-colors">
          <SearchIcon className="w-4 h-4 text-[#475569] shrink-0 ml-1.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-[#F1F5F9] text-[13px] font-mono focus:outline-none flex-1 min-w-[120px]"
          />

          {/* Inline Filter Chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[{ key: 'scope', value: activeTab, color: '#00F2FE' }].map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border select-none"
                style={{
                  backgroundColor: `${chip.color}15`,
                  borderColor: `${chip.color}40`,
                  color: chip.color,
                }}
              >
                <span>{chip.key}:{chip.value}</span>
              </span>
            ))}

            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#475569] hover:text-[#DEE2F3] transition-colors border-0 bg-transparent cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Result Tabs */}
        <div className="flex items-center gap-6 mt-4 text-[12px]">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'files', label: 'Files', count: counts.files },
            { id: 'symbols', label: 'Symbols', count: counts.symbols },
            { id: 'tests', label: 'Tests', count: counts.tests },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1 ${
                activeTab === tab.id
                  ? 'text-[#00F2FE] border-b-2 border-[#00F2FE] font-bold'
                  : 'text-[#94A3B8] hover:text-[#DEE2F3]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] text-[#475569]">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Results List on Left, Source Code Viewer on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Result List Pane */}
        <div className="w-[320px] border-r border-[#1E2638] bg-[#0E131F] overflow-y-auto p-3 space-y-3 shrink-0">
          {searching && <div className="p-4 text-[11px] text-[#94A3B8]">Searching the current snapshot…</div>}
          {searchError && <div className="p-4 text-[11px] text-[#EF476F]">{searchError}</div>}
          {!searching && !searchError && !groupedResults.length && <div className="p-4 text-[11px] text-[#94A3B8]">{query ? 'No indexed matches.' : 'Enter a query to search the repository.'}</div>}
          {groupedResults.map((res, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] font-semibold">
                <ChevronRight className="w-3.5 h-3.5 text-[#475569]" />
                <span className="truncate">{res.file}</span>
                <span className="text-[10px] text-[#475569]">Line {res.line}</span>
              </div>

              <div className="pl-4 space-y-0.5 border-l border-[#1E2638] ml-2">
                {res.symbols.map((sym, sIdx) => {
                  const isSelected = selectedResult === sym.name;
                  return (
                    <div
                      key={sIdx}
                      onClick={() => { setSelectedResult(sym.name); onSelectFile?.(sym.file_id); }}
                      className={`px-2 py-1 text-[12px] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#182030] text-[#00F2FE] border-l-2 border-[#00F2FE]'
                          : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#111622]'
                      }`}
                    >
                      {sym.name}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Source Code Viewer & Symbol Card */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0B0E14]">
          {/* Main Selected Symbol Card */}
          <div className="bg-[#111622] border border-[#1E2638]">
            {/* Header info & action triggers */}
            <div className="p-4 border-b border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0E131F]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#94A3B8]">{'{ }'}</span>
                  <span className="font-bold text-[13px] text-[#F1F5F9]">
                    {selectedHit?.path ?? 'Select a search result'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                  <span className="text-[#475569]">Line {selectedHit?.line ?? '—'}</span>
                  <span className="px-1.5 py-0.2 bg-[#9D4EDD]/20 text-[#9D4EDD] uppercase font-semibold">
                    type:symbol
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#00F2FE]/20 text-[#00F2FE] uppercase font-semibold">
                    lang:ts
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#06D6A0]/20 text-[#06D6A0] uppercase font-semibold">
                    path:{selectedHit?.path?.split('/').slice(0, -1).join('/') || '—'}
                  </span>
                  <span className="px-2 py-0.2 bg-[#FFB703]/20 text-[#FFB703] font-semibold">
                    {selectedHit ? selectedHit.type : 'No result'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button onClick={() => selectedHit && onSelectFile?.(selectedHit.file_id)} variant="secondary" size="sm" icon={<ExternalLink className="w-3 h-3" />} disabled={!selectedHit}>
                  Jump to source
                </Button>
                <Button variant="secondary" size="sm" icon={<Activity className="w-3 h-3" />}>
                  Analyze impact
                </Button>
                <Button variant="outline-cyan" size="sm" icon={<Share2 className="w-3 h-3" />}>
                  Trace in graph
                </Button>
              </div>
            </div>

            {/* Syntax-Highlighted Code Body */}
            <div className="p-4 bg-[#090C12] text-[12px] font-mono leading-6 overflow-x-auto">
              {selectedHit ? <div className="flex items-center px-2 bg-[#FFB703]/15 text-[#FFB703] border-l-2 border-[#FFB703]"><span className="w-10 text-[#475569] select-none text-right pr-4">{selectedHit.line ?? '—'}</span><span className="whitespace-pre">{selectedHit.snippet.replace(/<mark>|<\/mark>/g, '')}</span></div> : <div className="p-4 text-[11px] text-[#94A3B8]">Select a returned result to inspect its source evidence.</div>}
            </div>
          </div>

          {groupedResults.slice(1, 3).map(result => {
            const hit = result.symbols[0];
            return <div key={result.file} className="p-3 bg-[#111622] border border-[#1E2638] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px]">
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="text-[#F1F5F9] font-medium">{result.file}</span>
                <span className="text-[10px] text-[#475569]">Line {result.line ?? '—'}</span>
              </div>
              <Button onClick={() => onSelectFile?.(hit.file_id)} variant="ghost" size="sm">Open source ↗</Button>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
};
