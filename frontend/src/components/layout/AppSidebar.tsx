import React from 'react';
import {
  LayoutGrid,
  FileText,
  Search,
  Share2,
  Activity,
  AlertTriangle,
  CheckSquare,
  History,
  Sliders,
  Terminal,
  Settings,
  HelpCircle,
  GitBranch,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Logo } from '../ui/Logo';

export type NavigationPage =
  | 'overview'
  | 'files'
  | 'search'
  | 'dependency-graph'
  | 'dependency-atlas'
  | 'impact-analysis'
  | 'hotspots'
  | 'tests'
  | 'history'
  | 'change-intelligence'
  | 'git-actions'
  | 'settings'
  | 'help'
  | 'onboarding';

export interface AppSidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  activeRepo?: string;
  activeBranch?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentPage,
  onNavigate,
  activeRepo = 'No repository',
  activeBranch = 'no branch',
  collapsed = false,
}) => {
  const navSections = [
    {
      group: 'REPOSITORY',
      items: [
        { id: 'overview' as NavigationPage, label: 'Overview', icon: LayoutGrid },
        { id: 'files' as NavigationPage, label: 'Files', icon: FileText },
        { id: 'search' as NavigationPage, label: 'Search', icon: Search },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { id: 'dependency-graph' as NavigationPage, label: 'Dependency Graph', icon: Share2 },
        { id: 'dependency-atlas' as NavigationPage, label: 'Dependency Atlas', icon: Layers },
        { id: 'impact-analysis' as NavigationPage, label: 'Impact Analysis', icon: Activity, badge: 'NEW', badgeColor: 'amber' },
        { id: 'hotspots' as NavigationPage, label: 'Hotspots', icon: AlertTriangle },
        { id: 'tests' as NavigationPage, label: 'Tests', icon: CheckSquare, badge: 'STATIC', badgeColor: 'cyan' },
      ],
    },
    {
      group: 'GIT',
      items: [
        { id: 'history' as NavigationPage, label: 'History', icon: History },
        { id: 'change-intelligence' as NavigationPage, label: 'Change Intelligence', icon: Sliders },
        { id: 'git-actions' as NavigationPage, label: 'Git Actions', icon: Terminal },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#0E131F] border-r border-[#1E2638] flex flex-col justify-between shrink-0 select-none transition-all duration-150 ${
        collapsed ? 'w-[52px]' : 'w-[230px]'
      }`}
    >
      {/* Top Brand & Repo Switcher */}
      <div>
        <div className="h-[48px] px-3.5 flex items-center border-b border-[#1E2638]">
          <Logo size={26} withText={!collapsed} />
        </div>

        {/* Active Repo Card */}
        {!collapsed && (
          <div className="p-2 border-b border-[#1E2638]">
            <div className="p-2 bg-[#161B28] border border-[#1E2638] hover:border-[#2D3A54] cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <GitBranch className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                  <span className="font-headline font-semibold text-[12px] text-[#F1F5F9] truncate">
                    {activeRepo}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span className="px-1 py-0.2 bg-[#00F2FE]/10 text-[#00F2FE] text-[10px] font-mono">
                  {activeBranch}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-230px)]">
          {navSections.map((section) => (
            <div key={section.group} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2 py-1 text-[10px] font-mono tracking-wider text-[#475569] uppercase font-semibold">
                  {section.group}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 h-[28px] px-2 text-[12px] font-sans-geist transition-colors border-0 cursor-pointer relative text-left ${
                      isActive
                        ? 'bg-[#182030] text-[#00F2FE] font-medium'
                        : 'bg-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#111622]'
                    }`}
                  >
                    {/* Active left hairline bar */}
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00F2FE]" />
                    )}
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#00F2FE]' : 'text-[#94A3B8]'}`} />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 uppercase font-semibold shrink-0 ${
                              item.badgeColor === 'amber'
                                ? 'bg-[#FFB703]/20 text-[#FFB703]'
                                : 'bg-[#00F2FE]/20 text-[#00F2FE]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Area: Analysis Ready beacon & Settings */}
      <div className="border-t border-[#1E2638] p-2 bg-[#0E131F]">
        {!collapsed && (
          <div className="p-2 mb-2 bg-[#0B0E14] border border-[#1E2638] text-[11px] font-mono select-none">
            <div className="flex items-center gap-1.5 text-[#06D6A0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]" />
              <span className="font-semibold text-[10px] uppercase">Analysis ready</span>
            </div>
            <div className="text-[10px] text-[#475569] mt-0.5">
              2m ago • Snapshot 01
            </div>
          </div>
        )}

        <div className="space-y-0.5">
          <button
            onClick={() => onNavigate('onboarding')}
            className="w-full flex items-center gap-2.5 h-[26px] px-2 text-[12px] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] transition-colors border-0 cursor-pointer bg-transparent"
          >
            <GitBranch className="w-3.5 h-3.5" />
            {!collapsed && <span>Connect / Switch Repo</span>}
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center gap-2.5 h-[26px] px-2 text-[12px] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] transition-colors border-0 cursor-pointer bg-transparent"
          >
            <Settings className="w-3.5 h-3.5" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            onClick={() => onNavigate('help')}
            className="w-full flex items-center gap-2.5 h-[26px] px-2 text-[12px] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#182030] transition-colors border-0 cursor-pointer bg-transparent"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {!collapsed && <span>Help & shortcuts</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
