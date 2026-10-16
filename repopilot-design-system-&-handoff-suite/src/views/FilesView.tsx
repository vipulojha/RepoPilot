import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SOURCE_FILES, SourceFileItem } from '../data/mockData';

export const FilesView: React.FC = () => {
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState<'path' | 'lines' | 'risk'>('path');
  const [selectedFile, setSelectedFile] = useState<string>('src/api/router.ts');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    packages: true,
    api: true,
    models: true,
    core: false,
  });

  const toggleFolder = (folder: string) => {
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const filteredFiles = SOURCE_FILES.filter(
    (f) =>
      f.path.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.language.toLowerCase().includes(filterQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'lines') return b.lines - a.lines;
    if (sortBy === 'risk') {
      const order = { High: 3, Medium: 2, Low: 1 };
      return order[b.impactRisk] - order[a.impactRisk];
    }
    return a.path.localeCompare(b.path);
  });

  return (
    <div className="flex h-full w-full bg-[#0B0E14] select-none overflow-hidden">
      {/* Left: Repository Tree Sidebar */}
      <div className="w-[320px] border-r border-[#1E2638] bg-[#0E131F] flex flex-col shrink-0">
        {/* Tree Header & Filter */}
        <div className="p-3 border-b border-[#1E2638]">
          <div className="font-headline font-semibold text-[13px] text-[#F1F5F9] mb-2">
            Repository Tree
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#475569] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter files... [Alt+F]"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full h-[28px] pl-8 pr-2 bg-[#0B0E14] border border-[#1E2638] text-[11px] font-mono text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00F2FE]"
            />
          </div>
        </div>

        {/* Nested Tree List */}
        <div className="flex-1 overflow-y-auto p-2 font-mono text-[12px] space-y-0.5">
          {/* Root packages/ */}
          <div>
            <div
              onClick={() => toggleFolder('packages')}
              className="flex items-center gap-1.5 h-[26px] px-1.5 hover:bg-[#182030] cursor-pointer text-[#DEE2F3]"
            >
              {openFolders.packages ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              )}
              <Folder className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>packages/</span>
            </div>

            {openFolders.packages && (
              <div className="pl-4 space-y-0.5 border-l border-[#1E2638] ml-2.5 mt-0.5">
                {/* api/ */}
                <div
                  onClick={() => toggleFolder('api')}
                  className="flex items-center gap-1.5 h-[26px] px-1.5 hover:bg-[#182030] cursor-pointer text-[#DEE2F3]"
                >
                  {openFolders.api ? (
                    <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                  )}
                  <Folder className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>api/</span>
                </div>

                {openFolders.api && (
                  <div className="pl-4 space-y-0.5 border-l border-[#1E2638] ml-2">
                    <div
                      onClick={() => setSelectedFile('src/api/router.ts')}
                      className={`flex items-center justify-between h-[26px] px-1.5 cursor-pointer ${
                        selectedFile === 'src/api/router.ts'
                          ? 'bg-[#182030] text-[#00F2FE] border-l-2 border-[#00F2FE]'
                          : 'hover:bg-[#161B28] text-[#94A3B8]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3.5 h-3.5 text-[#3178C6]" />
                        <span className="truncate">router.ts</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1 py-0.2 bg-[#3178C6]/20 text-[#3178C6] text-[9px]">TS</span>
                        <span className="text-[10px] text-[#475569]">120 lines</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
                      </div>
                    </div>

                    <div
                      onClick={() => setSelectedFile('src/api/server.cs')}
                      className={`flex items-center justify-between h-[26px] px-1.5 cursor-pointer ${
                        selectedFile === 'src/api/server.cs'
                          ? 'bg-[#182030] text-[#00F2FE] border-l-2 border-[#00F2FE]'
                          : 'hover:bg-[#161B28] text-[#94A3B8]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3.5 h-3.5 text-[#178600]" />
                        <span className="truncate">server.cs</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1 py-0.2 bg-[#178600]/20 text-[#178600] text-[9px]">C#</span>
                        <span className="text-[10px] text-[#475569]">340 lines</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* models/ */}
                <div
                  onClick={() => toggleFolder('models')}
                  className="flex items-center gap-1.5 h-[26px] px-1.5 hover:bg-[#182030] cursor-pointer text-[#DEE2F3]"
                >
                  {openFolders.models ? (
                    <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                  )}
                  <Folder className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>models/</span>
                </div>

                {openFolders.models && (
                  <div className="pl-4 space-y-0.5 border-l border-[#1E2638] ml-2">
                    <div className="flex items-center justify-between h-[26px] px-1.5 text-[#94A3B8] hover:bg-[#161B28] cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#CB3837]" />
                        <span>config.json</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1 py-0.2 bg-[#CB3837]/20 text-[#CB3837] text-[9px]">JSON</span>
                        <span className="text-[10px] text-[#475569]">50 lines</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between h-[26px] px-1.5 text-[#94A3B8] hover:bg-[#161B28] cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#083FA1]" />
                        <span>README.md</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1 py-0.2 bg-[#083FA1]/20 text-[#083FA1] text-[9px]">MD</span>
                        <span className="text-[10px] text-[#475569]">340 lines</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Source Files Table */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0E14]">
        {/* Table Top Toolbar */}
        <div className="h-[48px] px-4 border-b border-[#1E2638] flex items-center justify-between bg-[#0E131F] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-semibold text-[14px] text-[#F1F5F9]">
              Source files
            </h2>
            <span className="text-xs font-mono text-[#94A3B8]">
              87 files · 10,064 lines
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sort by dropdown */}
            <div className="flex items-center gap-1.5 h-[28px] px-2 bg-[#182030] border border-[#1E2638] text-[11px] font-sans-geist text-[#DEE2F3]">
              <span className="text-[#94A3B8]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#00F2FE] border-0 focus:outline-none cursor-pointer font-medium"
              >
                <option value="path" className="bg-[#111622] text-[#F1F5F9]">Path</option>
                <option value="lines" className="bg-[#111622] text-[#F1F5F9]">Lines</option>
                <option value="risk" className="bg-[#111622] text-[#F1F5F9]">Impact Risk</option>
              </select>
            </div>

            <Button variant="outline-cyan" size="sm" icon={<RefreshCw className="w-3 h-3" />}>
              Rescan
            </Button>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0E131F] border-b border-[#1E2638] text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider select-none z-10">
              <tr>
                <th className="py-2.5 px-4 font-semibold">File Name & Path</th>
                <th className="py-2.5 px-3 font-semibold">Language</th>
                <th className="py-2.5 px-3 font-semibold">File Size</th>
                <th className="py-2.5 px-3 font-semibold">Lines</th>
                <th className="py-2.5 px-3 font-semibold">Fan-In</th>
                <th className="py-2.5 px-4 font-semibold text-right">Impact Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] font-mono text-[12px]">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile === file.path;
                return (
                  <tr
                    key={file.id}
                    onClick={() => setSelectedFile(file.path)}
                    className={`hover:bg-[#182030] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#182030]/80' : ''
                    }`}
                  >
                    {/* File Name & Path */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        {isSelected && <span className="w-1.5 h-1.5 bg-[#00F2FE]" />}
                        <span className="text-[#DEE2F3] font-medium hover:text-[#00F2FE] transition-colors">
                          {file.path}
                        </span>
                      </div>
                    </td>

                    {/* Language */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: file.languageColor }}
                        />
                        <span className="text-[#94A3B8]">{file.language}</span>
                      </div>
                    </td>

                    {/* File Size */}
                    <td className="py-2.5 px-3 text-[#94A3B8]">
                      {file.fileSize}
                    </td>

                    {/* Lines */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] tabular-nums">
                      {file.lines}
                    </td>

                    {/* Fan-In */}
                    <td className="py-2.5 px-3 text-[#94A3B8]">
                      {file.fanIn !== null ? (
                        <span className="flex items-center gap-1 text-[#DEE2F3]">
                          <span className="text-[#475569]">↔</span>
                          <span>{file.fanIn}</span>
                        </span>
                      ) : (
                        <span className="text-[#475569]">--</span>
                      )}
                    </td>

                    {/* Impact Risk Pill */}
                    <td className="py-2.5 px-4 text-right">
                      {file.impactRisk === 'High' && (
                        <span className="inline-block px-2 py-0.5 bg-[#EF476F]/10 border border-[#EF476F]/40 text-[#EF476F] text-[10px] uppercase font-semibold">
                          High
                        </span>
                      )}
                      {file.impactRisk === 'Medium' && (
                        <span className="inline-block px-2 py-0.5 bg-[#FFB703]/10 border border-[#FFB703]/40 text-[#FFB703] text-[10px] uppercase font-semibold">
                          Medium
                        </span>
                      )}
                      {file.impactRisk === 'Low' && (
                        <span className="inline-block px-2 py-0.5 bg-[#06D6A0]/10 border border-[#06D6A0]/40 text-[#06D6A0] text-[10px] uppercase font-semibold">
                          Low
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
