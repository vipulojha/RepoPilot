import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileCode,
  Link2,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const TestsView: React.FC = () => {
  const [selectedSuite, setSelectedSuite] = useState('tokenValidator.test.ts');
  const [expandedSuites, setExpandedSuites] = useState<Record<string, boolean>>({
    'tokenValidator.test.ts': true,
  });

  const toggleSuite = (id: string) => {
    setExpandedSuites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] select-none overflow-y-auto p-6 space-y-6 font-mono text-[#DEE2F3]">
      {/* Header */}
      <div>
        <div className="text-[10px] text-[#00F2FE] tracking-widest uppercase mb-1">
          ANALYZE / VERIFICATION SURFACE
        </div>
        <h1 className="font-headline font-bold text-2xl text-[#F1F5F9] tracking-tight">
          Tests
        </h1>
        <p className="text-[12px] font-sans-geist text-[#94A3B8] mt-1">
          Static associations only; tests are not executed.
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Classified Test Files */}
        <div className="p-4 bg-[#111622] border border-[#1E2638]">
          <div className="flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl text-[#F1F5F9] tabular-nums">
              12
            </span>
            <span className="text-[12px] font-sans-geist text-[#94A3B8]">
              Classified Test Files
            </span>
          </div>
        </div>

        {/* Statically Linked Invariants */}
        <div className="p-4 bg-[#111622] border border-[#1E2638]">
          <div className="flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl text-[#F1F5F9] tabular-nums">
              342
            </span>
            <span className="text-[12px] font-sans-geist text-[#94A3B8]">
              Statically Linked Invariants
            </span>
          </div>
        </div>

        {/* Uncovered Source Files */}
        <div className="p-4 bg-[#111622] border border-[#1E2638]">
          <div className="flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl text-[#FFB703] tabular-nums">
              68
            </span>
            <span className="text-[12px] font-sans-geist text-[#94A3B8]">
              Uncovered Source Files
            </span>
          </div>
        </div>

        {/* Static Affinity */}
        <div className="p-4 bg-[#111622] border border-[#1E2638]">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-[#00F2FE] tabular-nums">
                84.2%
              </span>
              <span className="text-[12px] font-sans-geist text-[#94A3B8]">
                Static Affinity
              </span>
            </div>
            {/* Status dots */}
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#06D6A0]" />
              <span className="w-2 h-2 rounded-full bg-[#06D6A0]" />
              <span className="w-2 h-2 rounded-full bg-[#FFB703]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Detected Test Suites & Source-to-Test Affinity Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Detected Test Suites (5 cols) */}
        <div className="lg:col-span-5 bg-[#111622] border border-[#1E2638]">
          <div className="px-4 py-2.5 border-b border-[#1E2638] flex items-center justify-between bg-[#0E131F]">
            <span className="font-headline font-semibold text-[13px] text-[#F1F5F9] uppercase">
              Detected Test Suites
            </span>
            <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
              <span>List View</span>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {/* Test Suite 1: tokenValidator.test.ts */}
            <div
              onClick={() => {
                setSelectedSuite('tokenValidator.test.ts');
                toggleSuite('tokenValidator.test.ts');
              }}
              className={`p-3 border transition-colors cursor-pointer ${
                selectedSuite === 'tokenValidator.test.ts'
                  ? 'bg-[#182030] border-[#00F2FE]'
                  : 'bg-[#111622] border-[#1E2638] hover:border-[#2D3A54]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <FileCode className="w-4 h-4 text-[#00F2FE] shrink-0" />
                  <span className="font-bold text-[12px] text-[#F1F5F9] truncate">
                    tokenValidator.test.ts
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.2 bg-[#00F2FE]/10 text-[#00F2FE] text-[9px] uppercase font-semibold">
                    Deterministic
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#06D6A0]/10 text-[#06D6A0] text-[9px] uppercase font-semibold flex items-center gap-0.5">
                    Passing •••
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#161B28] text-[#94A3B8] text-[9px] uppercase font-semibold">
                    STATIC INVARIANT
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-[#475569] mt-1.5 pl-6">
                auth/tokenValidator.ts/tokenValidator.test.ts
              </div>
            </div>

            {/* Test Suite 2: authRouter.test.ts */}
            <div
              onClick={() => setSelectedSuite('authRouter.test.ts')}
              className={`p-3 border transition-colors cursor-pointer ${
                selectedSuite === 'authRouter.test.ts'
                  ? 'bg-[#182030] border-[#00F2FE]'
                  : 'bg-[#111622] border-[#1E2638] hover:border-[#2D3A54]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <FileCode className="w-4 h-4 text-[#94A3B8] shrink-0" />
                  <span className="font-semibold text-[12px] text-[#F1F5F9] truncate">
                    authRouter.test.ts
                  </span>
                </div>
                <span className="px-1.5 py-0.2 bg-[#161B28] text-[#94A3B8] text-[9px] uppercase font-semibold">
                  STATIC INVARIANT
                </span>
              </div>
              <div className="text-[10px] text-[#475569] mt-1.5 pl-6">
                authRouter.test.ts/authRouter.test.ts
              </div>
            </div>

            {/* Test Suite 3: inventoryService.test.ts */}
            <div
              onClick={() => setSelectedSuite('inventoryService.test.ts')}
              className={`p-3 border transition-colors cursor-pointer ${
                selectedSuite === 'inventoryService.test.ts'
                  ? 'bg-[#182030] border-[#00F2FE]'
                  : 'bg-[#111622] border-[#1E2638] hover:border-[#2D3A54]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <FileCode className="w-4 h-4 text-[#94A3B8] shrink-0" />
                  <span className="font-semibold text-[12px] text-[#F1F5F9] truncate">
                    inventoryService.test.ts
                  </span>
                </div>
                <span className="px-1.5 py-0.2 bg-[#161B28] text-[#94A3B8] text-[9px] uppercase font-semibold">
                  STATIC INVARIANT
                </span>
              </div>
              <div className="text-[10px] text-[#475569] mt-1.5 pl-6">
                inventoryService.s/inventoryService.test.ts
              </div>
            </div>
          </div>
        </div>

        {/* Right: Source-to-Test Affinity Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-[#111622] border border-[#1E2638]">
          <div className="px-4 py-2.5 border-b border-[#1E2638] flex items-center justify-between bg-[#0E131F]">
            <span className="font-headline font-semibold text-[13px] text-[#F1F5F9] uppercase">
              Source-to-Test Affinity Matrix
            </span>
          </div>

          <div className="p-4">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="border-b border-[#1E2638] text-[10px] text-[#94A3B8] uppercase">
                <tr>
                  <th className="py-2 px-3">Source File</th>
                  <th className="py-2 px-3">Target Entity</th>
                  <th className="py-2 px-3">Test File</th>
                  <th className="py-2 px-3 text-right">Connection Strength</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]">
                {/* Linked Row */}
                <tr className="hover:bg-[#182030] transition-colors">
                  <td className="py-3 px-3 text-[#DEE2F3] font-medium">
                    auth/tokenValidator.ts
                  </td>
                  <td className="py-3 px-3 text-[#00F2FE]">
                    → validateSession()
                  </td>
                  <td className="py-3 px-3 text-[#94A3B8] flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-[#06D6A0]" />
                    <span>tokenValidator.test.ts</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2 py-0.5 bg-[#06D6A0]/10 border border-[#06D6A0]/50 text-[#06D6A0] text-[10px] font-semibold">
                      Linked
                    </span>
                  </td>
                </tr>

                {/* Uncovered Warning Row */}
                <tr className="hover:bg-[#182030] transition-colors bg-[#FFB703]/5">
                  <td className="py-3 px-3 text-[#DEE2F3] font-medium">
                    api/server.cs
                  </td>
                  <td className="py-3 px-3 text-[#94A3B8]">
                    0 tests mapped
                  </td>
                  <td className="py-3 px-3 col-span-2 text-right" colSpan={2}>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFB703]/10 border border-[#FFB703]/50 text-[#FFB703] text-[10px] font-semibold">
                      <AlertTriangle className="w-3 h-3 text-[#FFB703]" />
                      <span>High caller surface uncovered</span>
                      <AlertTriangle className="w-3 h-3 text-[#FFB703]" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
