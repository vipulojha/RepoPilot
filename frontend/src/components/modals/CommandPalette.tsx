import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  FileText,
  Share2,
  Activity,
  AlertTriangle,
  CheckSquare,
  History,
  Sliders,
  Terminal,
  RefreshCw,
  FolderGit2,
  Download,
  CornerDownLeft,
} from 'lucide-react';
import { NavigationPage } from '../layout/AppSidebar';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: NavigationPage) => void;
  onRescan?: () => void;
  onExportMatrix?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRescan,
  onExportMatrix,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'navigation' | 'files' | 'symbols' | 'actions'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (isOpen && e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(index => Math.min(index + 1, filteredItems.length - 1));
      } else if (isOpen && e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(index => Math.max(index - 1, 0));
      } else if (isOpen && e.key === 'Enter') {
        e.preventDefault();
        filteredItems[selectedIndex]?.action();
        if (filteredItems[selectedIndex]) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedIndex, query, activeCategory]);

  const navItems = [
    { id: 'overview' as NavigationPage, label: 'Dashboard', icon: LayoutGrid, shortcut: 'G D' },
    { id: 'files' as NavigationPage, label: 'Files', icon: FileText, shortcut: 'G F' },
    { id: 'dependency-graph' as NavigationPage, label: 'Dependency Graph', icon: Share2, shortcut: 'G G' },
    { id: 'dependency-atlas' as NavigationPage, label: 'Dependency Atlas', icon: Share2, shortcut: 'G X' },
    { id: 'search' as NavigationPage, label: 'Search', icon: Search, shortcut: 'G S' },
    { id: 'impact-analysis' as NavigationPage, label: 'Impact Analysis', icon: Activity, shortcut: 'G I' },
    { id: 'hotspots' as NavigationPage, label: 'Hotspots', icon: AlertTriangle, shortcut: 'G H' },
    { id: 'tests' as NavigationPage, label: 'Tests', icon: CheckSquare, shortcut: 'G T' },
    { id: 'history' as NavigationPage, label: 'History', icon: History, shortcut: 'G Y' },
    { id: 'change-intelligence' as NavigationPage, label: 'Change Intelligence', icon: Sliders, shortcut: 'G C' },
    { id: 'git-actions' as NavigationPage, label: 'Git Actions', icon: Terminal, shortcut: 'G A' },
    { id: 'settings' as NavigationPage, label: 'Settings', icon: Sliders, shortcut: 'G E' },
    { id: 'help' as NavigationPage, label: 'Help & Shortcuts', icon: CheckSquare, shortcut: '?' },
  ];

  const actionItems = [
    { id: 'rescan', label: 'Run AST rescan', icon: RefreshCw, shortcut: 'Cmd+Shift+R', action: () => onRescan?.() },
    { id: 'switch-repository', label: 'Switch repository', icon: FolderGit2, shortcut: 'Cmd+O', action: () => onNavigate('onboarding') },
    { id: 'export-matrix', label: 'Export dependency matrix', icon: Download, shortcut: 'Cmd+E', action: () => onExportMatrix?.() },
  ];
  const handleSelectNav = (page: NavigationPage) => {
    onNavigate(page);
    onClose();
  };
  const allItems = [...navItems.map(item => ({ ...item, category: 'navigation', action: () => handleSelectNav(item.id) })), ...actionItems.map(item => ({ ...item, category: 'actions' }))];
  const filteredItems = allItems.filter(item => (activeCategory === 'all' || item.category === activeCategory) && `${item.label} ${item.id}`.toLowerCase().includes(query.toLowerCase()));
  const selectedItem = filteredItems[selectedIndex];

  useEffect(() => { setSelectedIndex(0); }, [query, activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Container with glowing cyan border */}
      <div className="relative w-full max-w-xl bg-[#0E131F] border border-[#00F2FE] shadow-[0_0_24px_rgba(0,242,254,0.35)] flex flex-col max-h-[85vh] overflow-hidden z-10 font-mono text-[#DEE2F3]">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#1E2638] flex items-center gap-2 bg-[#111622]">
          <Search className="w-4 h-4 text-[#00F2FE] shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Jump to a view or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[#F1F5F9] placeholder-[#475569] focus:outline-none border-0"
          />
          <span className="px-1.5 py-0.5 bg-[#182030] border border-[#1E2638] text-[9px] text-[#94A3B8]">
            ESC
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#1E2638] bg-[#0B0E14] text-[11px]">
          {(['all', 'navigation', 'files', 'symbols', 'actions'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 capitalize cursor-pointer border-0 bg-transparent transition-colors ${
                activeCategory === cat
                  ? 'bg-[#182030] text-[#00F2FE] font-bold'
                  : 'text-[#94A3B8] hover:text-[#DEE2F3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Navigable Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[420px]">
          {/* Navigation Section */}
          {(activeCategory === 'all' || activeCategory === 'navigation') && (
            <div>
              <div className="px-2 py-1 text-[10px] text-[#475569] uppercase font-bold tracking-wider">
                NAVIGATION
              </div>
              <div className="space-y-0.5 mt-1">
                {navItems.filter(item => `${item.label} ${item.id}`.toLowerCase().includes(query.toLowerCase())).map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectNav(item.id)}
                       onMouseEnter={() => setSelectedIndex(filteredItems.findIndex(candidate => candidate.id === item.id))}
                      className={`flex items-center justify-between h-[30px] px-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#182030] text-[#00F2FE] border-l-2 border-[#00F2FE]'
                          : 'text-[#DEE2F3] hover:bg-[#111622]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#00F2FE]' : 'text-[#94A3B8]'}`} />
                        <span className="text-[12px] font-sans-geist">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 bg-[#0B0E14] border border-[#1E2638] text-[10px] text-[#94A3B8]">
                          {item.shortcut}
                        </span>
                        {isSelected && <CornerDownLeft className="w-3 h-3 text-[#00F2FE]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions Section */}
          {(activeCategory === 'all' || activeCategory === 'actions') && (
            <div>
              <div className="px-2 py-1 text-[10px] text-[#475569] uppercase font-bold tracking-wider">
                ACTIONS
              </div>
              <div className="space-y-0.5 mt-1">
                {actionItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase())).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                       key={item.label}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className="flex items-center justify-between h-[30px] px-2.5 cursor-pointer hover:bg-[#182030] hover:text-[#00F2FE] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span className="text-[12px] font-sans-geist text-[#DEE2F3]">{item.label}</span>
                      </div>
                      <span className="px-1.5 py-0.2 bg-[#0B0E14] border border-[#1E2638] text-[10px] text-[#94A3B8]">
                        {item.shortcut}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Keyboard Shortcuts Helper */}
        <div className="p-2 border-t border-[#1E2638] bg-[#0B0E14] flex items-center justify-between text-[10px] text-[#475569]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>Esc Close</span>
            <span>Tab Filter category</span>
          </div>
        </div>
      </div>
    </div>
  );
};
