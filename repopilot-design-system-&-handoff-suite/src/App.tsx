/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar, NavigationPage } from './components/layout/AppSidebar';
import { HandoffInspector, DisplayStateMode } from './components/handoff/HandoffInspector';
import { CommandPalette } from './components/modals/CommandPalette';
import { LoadingState, EmptyState, ErrorState } from './components/ui/StateView';

// Screen Views
import { CockpitView } from './views/CockpitView';
import { FilesView } from './views/FilesView';
import { SearchView } from './views/SearchView';
import { DependencyGraphView } from './views/DependencyGraphView';
import { DependencyAtlasView } from './views/DependencyAtlasView';
import { ImpactAnalysisView } from './views/ImpactAnalysisView';
import { HotspotsView } from './views/HotspotsView';
import { TestsView } from './views/TestsView';
import { HistoryView } from './views/HistoryView';
import { ChangeIntelligenceView } from './views/ChangeIntelligenceView';
import { GitActionsView } from './views/GitActionsView';
import { OnboardingView } from './views/OnboardingView';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [stateMode, setStateMode] = useState<DisplayStateMode>('normal');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const viewTitles: Record<NavigationPage, string> = {
    overview: 'Repository Cockpit',
    files: 'Files Explorer',
    search: 'Code Intelligence Search',
    'dependency-graph': 'Dependency Graph',
    'dependency-atlas': 'Dependency Atlas',
    'impact-analysis': 'Impact Analysis',
    hotspots: 'Structural Hotspots',
    tests: 'Verification Surface',
    history: 'Git Lineage History',
    'change-intelligence': 'Change Intelligence & Diff',
    'git-actions': 'Git Actions Console',
    onboarding: 'Connect Codebase',
  };

  const renderActiveView = () => {
    // If in simulation mode (loading/empty/error), render state representations
    if (stateMode === 'loading') {
      return <LoadingState />;
    }
    if (stateMode === 'empty') {
      return (
        <div className="p-8 h-full flex items-center justify-center">
          <EmptyState onAction={() => setStateMode('normal')} />
        </div>
      );
    }
    if (stateMode === 'error') {
      return (
        <div className="p-8 h-full flex items-center justify-center">
          <ErrorState onRetry={() => setStateMode('normal')} />
        </div>
      );
    }

    // Normal full UI screen render
    switch (currentPage) {
      case 'overview':
        return <CockpitView onNavigate={setCurrentPage} />;
      case 'files':
        return <FilesView />;
      case 'search':
        return <SearchView />;
      case 'dependency-graph':
        return <DependencyGraphView />;
      case 'dependency-atlas':
        return <DependencyAtlasView />;
      case 'impact-analysis':
        return <ImpactAnalysisView />;
      case 'hotspots':
        return <HotspotsView onAnalyzeImpact={() => setCurrentPage('impact-analysis')} />;
      case 'tests':
        return <TestsView />;
      case 'history':
        return <HistoryView />;
      case 'change-intelligence':
        return <ChangeIntelligenceView />;
      case 'git-actions':
        return <GitActionsView />;
      case 'onboarding':
        return <OnboardingView onComplete={() => setCurrentPage('overview')} />;
      default:
        return <CockpitView onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0E14] text-[#DEE2F3] overflow-hidden select-none">
      {/* Top Design Handoff Spec & Export Bar */}
      <HandoffInspector
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        stateMode={stateMode}
        onStateModeChange={setStateMode}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workstation Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Docked Left Sidebar */}
        <AppSidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            setStateMode('normal');
          }}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center / Main Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0E14]">
          {/* Main App Header */}
          <AppHeader
            currentViewTitle={viewTitles[currentPage]}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onRescan={() => setStateMode('normal')}
            onSwitchRepo={() => setCurrentPage('onboarding')}
          />

          {/* Active View Viewport */}
          <main className="flex-1 overflow-hidden relative">
            {renderActiveView()}
          </main>
        </div>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(page) => {
          setCurrentPage(page);
          setStateMode('normal');
        }}
        onRescan={() => {
          setStateMode('loading');
          setTimeout(() => setStateMode('normal'), 800);
        }}
        onExportMatrix={() => {
          // Trigger matrix export alert or notification
          alert('Dependency Matrix JSON exported to clipboard.');
        }}
      />
    </div>
  );
}
