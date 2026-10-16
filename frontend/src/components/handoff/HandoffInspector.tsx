import React, { useState } from 'react';
import {
  Download,
  Code2,
  Palette,
  Layers,
  CheckCircle2,
  Eye,
  Sliders,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileArchive,
  BookOpen,
} from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '../ui/Button';
import { NavigationPage } from '../layout/AppSidebar';

export type DisplayStateMode = 'normal' | 'loading' | 'empty' | 'error';

export interface HandoffInspectorProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  stateMode: DisplayStateMode;
  onStateModeChange: (mode: DisplayStateMode) => void;
  onOpenCommandPalette: () => void;
}

export const SCREEN_SPECS: Record<NavigationPage, {
  title: string;
  imageRef: string;
  components: string[];
  tokens: string[];
  backendNotes: string;
}> = {
  overview: {
    title: 'Repository Cockpit (Dashboard)',
    imageRef: 'Image 6.jpeg',
    components: ['CockpitView', 'MetricCard', 'RadarTelemetry', 'GitLineageMini', 'TerrainMeshPreview'],
    tokens: ['Surface: #111622', 'Lines: Space Grotesk 24px Bold', 'Glow: #00F2FE 0.3'],
    backendNotes: 'Requires GET /api/repo/summary returning filesIndexed, linesSLOC, parsedSymbols, dependenciesResolved, testsClassified, and cleanWorkingTree status.',
  },
  files: {
    title: 'Source Files & Repository Tree',
    imageRef: 'Image 7.jpeg',
    components: ['FilesView', 'RepositoryTree', 'SourceFilesTable', 'LanguageBadge', 'RiskPill'],
    tokens: ['Tree row: 26px', 'Table row: 36px', 'Languages: TS(#3178C6), C#(#178600), JSON(#CB3837)'],
    backendNotes: 'Requires GET /api/files/tree and GET /api/files/list with sorting (path, lines, risk), and fan-in computation.',
  },
  'dependency-graph': {
    title: 'Interactive Dependency Graph',
    imageRef: 'Image 8.jpeg',
    components: ['DependencyGraphView', 'GraphCanvas', 'GraphNode', 'Minimap', 'ZoomPanToolbar'],
    tokens: ['Node min-w: 160px', 'Port sockets: 6x6px square', 'Edges: Direct(#00F2FE), Transitive(#9D4EDD)'],
    backendNotes: 'Requires GET /api/graph/dependencies?depth={depth} returning node and edge topologies with fan-in and fan-out counts.',
  },
  'dependency-atlas': {
    title: 'Signature Dependency Atlas',
    imageRef: 'Image 3.jpeg',
    components: ['DependencyAtlasView', 'AtlasNode', 'BusHighway', 'RiskGauges', 'CouplingBadges'],
    tokens: ['Background: #07090E', 'Glow filter: Cyan & Violet', 'Coupling chip: #FFB703'],
    backendNotes: 'Telemetry stream for AST signature linkages across polyglot microservices.',
  },
  'impact-analysis': {
    title: 'AST Signal Map & Propagation Pipeline',
    imageRef: 'Image 4.png, Image 5.svg, Image 9.jpeg',
    components: ['ImpactAnalysisView', 'StagePipeline', 'PropagationTracer', 'BlastRadiusBanner', 'ScopeFooter'],
    tokens: ['Target: #00F2FE', 'Transitive: #9D4EDD', 'Safety Gap: #FFB703', 'Hotspot: #EF476F'],
    backendNotes: 'Requires POST /api/analysis/blast-radius calculating 1° consumers, 2° transitive egress, and mapped test suites.',
  },
  hotspots: {
    title: 'Structural Hotspots & Scatter Plot',
    imageRef: 'Image 10.jpeg',
    components: ['HotspotsView', 'HotspotsTable', 'AffinityScatterPlot', 'ScoreBadge'],
    tokens: ['Score: #FFB703', 'Callers: #DEE2F3', 'Scatter axes: 0-100 tabular'],
    backendNotes: 'Requires GET /api/signals/hotspots ranking files by algorithmic caller density + cyclomatic churn score.',
  },
  tests: {
    title: 'Verification Surface & Affinity Matrix',
    imageRef: 'Image 11.jpeg',
    components: ['TestsView', 'DetectedTestSuites', 'AffinityMatrixTable', 'StaticInvariantBadge'],
    tokens: ['KPIs: 4-col split', 'Deterministic: #00F2FE', 'Passing: #06D6A0', 'Uncovered: #FFB703'],
    backendNotes: 'Static AST mapping between source symbols and test suite assertion call-sites.',
  },
  history: {
    title: 'Git Lineage & Commit Inspector',
    imageRef: 'Image 12.jpeg',
    components: ['HistoryView', 'CommitLineageTimeline', 'CommitDetailDrawer', 'ImpactWarningCard'],
    tokens: ['Cyan lineage beam: 2px', 'Ring ping: 16px', 'Warning: #FFB703'],
    backendNotes: 'Requires GET /api/git/commits with diff statistics and cross-module boundary flags.',
  },
  'change-intelligence': {
    title: 'Side-by-side Diff & Risk Auditor',
    imageRef: 'Image 13.jpeg',
    components: ['ChangeIntelligenceView', 'SideBySideDiffViewer', 'RiskAuditorPanel', 'DownstreamTree'],
    tokens: ['Deletions: #EF476F/15', 'Additions: #06D6A0/15', 'Split divider: 1px #1E2638'],
    backendNotes: 'Requires GET /api/git/diff?file={path} and real-time risk auditor for uncommitted mutations.',
  },
  search: {
    title: 'Code Intelligence & Symbol Search',
    imageRef: 'Image 14.jpeg',
    components: ['SearchView', 'FilterChips', 'GroupedResultTree', 'SourceViewer', 'CallersBadge'],
    tokens: ['Input: 32px mono', 'Filter chips: 18px', 'Highlight line: #FFB703/15'],
    backendNotes: 'Requires GET /api/search?q={query}&type={type}&lang={lang}&path={path}.',
  },
  'git-actions': {
    title: 'Git Mutation Console',
    imageRef: 'Image 15.jpeg',
    components: ['GitActionsView', 'StagedFilesList', 'CommitScopeCard', 'BranchCard', 'StashLedger'],
    tokens: ['Buttons: 28px #00F2FE', 'Card bg: #111622', 'Stash ledger: #0B0E14'],
    backendNotes: 'Requires POST /api/git/commit, POST /api/git/branch, POST /api/git/stash endpoints.',
  },
  settings: {
    title: 'RepoPilot Settings',
    imageRef: 'Production workspace preferences',
    components: ['SettingsView', 'PreferenceToggle', 'WorkspacePreferences'],
    tokens: ['Actionable: #06D6A0', 'Informational: #94A3B8', 'Surface: #111622'],
    backendNotes: 'Local browser preferences only; server-side settings are intentionally not represented until supported.',
  },
  help: {
    title: 'Help & Shortcuts Knowledge Center',
    imageRef: 'Production guidance workspace',
    components: ['HelpView', 'SearchableQA', 'ShortcutReference', 'GitCommandCheatSheet'],
    tokens: ['Search: #00F2FE', 'Warning: #FFB703', 'Error: #EF476F'],
    backendNotes: 'Static in-app guidance tied to implemented RepoPilot controls and supported Git workflows.',
  },
  onboarding: {
    title: 'Repository Connection & Onboarding',
    imageRef: 'Requirement: Onboarding UI',
    components: ['OnboardingView', 'DirectoryPicker', 'BranchSelector', 'RecentRepoList'],
    tokens: ['Console container: #0E131F', 'Accent border: #00F2FE', 'Reticles: 4 corners'],
    backendNotes: 'Initial repository initialization, directory path validation, and AST scan starter.',
  },
};

export const HandoffInspector: React.FC<HandoffInspectorProps> = ({
  currentPage,
  onNavigate,
  stateMode,
  onStateModeChange,
  onOpenCommandPalette,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentSpec = SCREEN_SPECS[currentPage] || SCREEN_SPECS.overview;

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Add README and Spec documentation
      zip.file(
        'README.md',
        `# RepoPilot - Frontend Design Handoff Package\n\n` +
        `This is the complete, self-contained implementation-ready frontend design package for RepoPilot.\n` +
        `Engineered for high-density local workstation AST introspection and codebase intelligence.\n\n` +
        `## Design System: Obsidian Telemetry\n` +
        `- Canvas Base: #0B0E14\n` +
        `- Surface Panel: #111622\n` +
        `- Outline Razor: #1E2638\n` +
        `- Cyan Focal: #00F2FE\n` +
        `- Violet Transitive: #9D4EDD\n` +
        `- Amber Risk: #FFB703\n` +
        `- Emerald Clean: #06D6A0\n` +
        `- Crimson Break: #EF476F\n\n` +
        `## Screen Implementations & Design References\n` +
        `1. Repository Cockpit (Dashboard) - Image 6.jpeg\n` +
        `2. Source Files & Tree - Image 7.jpeg\n` +
        `3. Interactive Dependency Graph - Image 8.jpeg\n` +
        `4. Signature Dependency Atlas - Image 3.jpeg\n` +
        `5. AST Signal Map & Blast Radius - Image 4.png, Image 5.svg, Image 9.jpeg\n` +
        `6. Structural Hotspots - Image 10.jpeg\n` +
        `7. Verification Tests Matrix - Image 11.jpeg\n` +
        `8. Git History Lineage - Image 12.jpeg\n` +
        `9. Change Intelligence Diff Viewer - Image 13.jpeg\n` +
        `10. Code Intelligence Search - Image 14.jpeg\n` +
        `11. Git Mutation Actions - Image 15.jpeg\n` +
        `12. Command Palette (Cmd+K) - Image 16.jpeg\n` +
        `13. Onboarding & Workspace Connect\n\n` +
        `Refer to HANDOFF_SPEC.md for API integration details.`
      );

      zip.file(
        'HANDOFF_SPEC.md',
        `# RepoPilot Design Handoff Specification for Implementation Agent\n\n` +
        `This document outlines the contracts, component structure, state variants, and API guidelines for implementing RepoPilot backend services.\n\n` +
        JSON.stringify(SCREEN_SPECS, null, 2)
      );

      zip.file(
        'tokens/design-tokens.json',
        JSON.stringify(
          {
            theme: 'Obsidian Telemetry',
            movement: 'Technical Minimalist Instrument',
            colors: {
              canvas: { base: '#0B0E14', panel: '#111622', card: '#182030' },
              outline: { razor: '#1E2638', contrast: '#2D3A54' },
              spectrum: {
                cyan: '#00F2FE',
                violet: '#9D4EDD',
                amber: '#FFB703',
                emerald: '#06D6A0',
                crimson: '#EF476F',
              },
            },
            typography: {
              headline: 'Space Grotesk',
              body: 'Geist',
              code: 'JetBrains Mono',
            },
          },
          null,
          2
        )
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'repopilot-frontend-design-handoff.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Top Floating Handoff Control Strip */}
      <div className="h-[36px] bg-[#090C12] border-b border-[#00F2FE]/40 px-3 flex items-center justify-between text-[11px] font-mono text-[#DEE2F3] select-none shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00F2FE]/15 border border-[#00F2FE]/50 text-[#00F2FE] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
            <span>DESIGN HANDOFF PACKAGE</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <span>Active Screen:</span>
            <select
              value={currentPage}
              onChange={(e) => onNavigate(e.target.value as NavigationPage)}
              className="bg-[#111622] text-[#00F2FE] border border-[#1E2638] px-2 py-0.5 text-[11px] font-mono focus:outline-none"
            >
              {Object.entries(SCREEN_SPECS).map(([key, spec]) => (
                <option key={key} value={key} className="bg-[#111622] text-[#DEE2F3]">
                  {spec.title} ({spec.imageRef})
                </option>
              ))}
            </select>
          </div>

          <span className="text-[#1E2638]">|</span>

          {/* Reference Image Tag */}
          <span className="text-[10px] text-[#FFB703] bg-[#FFB703]/10 px-1.5 py-0.5 border border-[#FFB703]/30">
            Source: {currentSpec.imageRef}
          </span>
        </div>

        {/* Right: State Simulator + Spec Inspector Drawer Toggle + Export ZIP */}
        <div className="flex items-center gap-2">
          {/* State Mode Simulator */}
          <div className="flex items-center gap-1 bg-[#111622] border border-[#1E2638] px-1 py-0.5">
            <span className="text-[10px] text-[#94A3B8] px-1">View State:</span>
            {(['normal', 'loading', 'empty', 'error'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onStateModeChange(mode)}
                className={`px-1.5 py-0.2 text-[10px] capitalize cursor-pointer border-0 transition-colors ${
                  stateMode === mode
                    ? 'bg-[#00F2FE] text-[#0B0E14] font-bold'
                    : 'bg-transparent text-[#94A3B8] hover:text-[#DEE2F3]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#182030] hover:bg-[#1E2638] border border-[#1E2638] text-[10px] text-[#94A3B8] hover:text-[#00F2FE] cursor-pointer"
          >
            <span>Cmd+K</span>
          </button>

          {/* Toggle Spec Inspector Drawer */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border cursor-pointer transition-colors ${
              isOpen
                ? 'bg-[#00F2FE]/20 border-[#00F2FE] text-[#00F2FE]'
                : 'bg-[#182030] border-[#1E2638] text-[#DEE2F3]'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>{isOpen ? 'Close Spec' : 'Design Spec'}</span>
          </button>

          {/* Export ZIP package button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportZip}
            disabled={isExporting}
            icon={isExporting ? <div className="w-3 h-3 border border-black border-t-transparent animate-spin" /> : <FileArchive className="w-3 h-3" />}
          >
            {isExporting ? 'Zipping...' : 'Export Package (ZIP)'}
          </Button>
        </div>
      </div>

      {/* Floating Design Spec Inspector Drawer */}
      {isOpen && (
        <div className="absolute top-[36px] right-0 bottom-0 w-80 bg-[#0E131F] border-l border-[#2D3A54] shadow-2xl z-50 flex flex-col p-4 select-none font-mono text-[#DEE2F3] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#00F2FE]" />
              <span className="font-headline font-bold text-sm text-[#F1F5F9]">
                Screen Design Spec
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#94A3B8] hover:text-white border-0 bg-transparent cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 my-4">
            {/* Screen Info */}
            <div className="p-2.5 bg-[#111622] border border-[#1E2638]">
              <div className="text-[10px] text-[#94A3B8] uppercase">Target View</div>
              <div className="font-headline font-semibold text-[13px] text-[#00F2FE] mt-0.5">
                {currentSpec.title}
              </div>
              <div className="text-[10px] text-[#FFB703] mt-1">
                Visual Reference: {currentSpec.imageRef}
              </div>
            </div>

            {/* Component Tree */}
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#00F2FE]" />
                <span>Components in View</span>
              </div>
              <div className="space-y-1">
                {currentSpec.components.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 bg-[#111622] border border-[#1E2638] text-[11px] text-[#DEE2F3]"
                  >
                    • &lt;{comp} /&gt;
                  </div>
                ))}
              </div>
            </div>

            {/* Design Tokens in View */}
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#9D4EDD]" />
                <span>Active Design Tokens</span>
              </div>
              <div className="space-y-1">
                {currentSpec.tokens.map((token, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 bg-[#0B0E14] border border-[#1E2638] text-[10px] text-[#94A3B8]"
                  >
                    {token}
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Notes for Next Agent */}
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#06D6A0]" />
                <span>Backend Implementation Contract</span>
              </div>
              <div className="p-2.5 bg-[#111622] border border-[#06D6A0]/30 text-[11px] text-[#DEE2F3] font-sans-geist leading-relaxed">
                {currentSpec.backendNotes}
              </div>
            </div>
          </div>

          {/* Quick Screen Switcher List */}
          <div className="pt-2 border-t border-[#1E2638]">
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2">
              All Handoff Screens
            </div>
            <div className="space-y-1">
              {Object.entries(SCREEN_SPECS).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => onNavigate(key as NavigationPage)}
                  className={`w-full text-left p-1.5 text-[11px] border cursor-pointer transition-colors ${
                    currentPage === key
                      ? 'bg-[#182030] border-[#00F2FE] text-[#00F2FE]'
                      : 'bg-[#111622] border-[#1E2638] text-[#94A3B8] hover:text-[#DEE2F3]'
                  }`}
                >
                  <div className="truncate font-semibold">{s.title}</div>
                  <div className="text-[9px] text-[#475569] truncate">{s.imageRef}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
