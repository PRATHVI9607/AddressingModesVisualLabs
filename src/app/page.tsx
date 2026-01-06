'use client';

import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { ProgramPanel } from '@/components/ProgramPanel';
import { RegisterPanel } from '@/components/RegisterPanel';
import { MemoryPanel } from '@/components/MemoryPanel';
import { StackPanel } from '@/components/StackPanel';
import { EAPanel } from '@/components/EAPanel';
import { ControlPanel } from '@/components/ControlPanel';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { TimelinePanel } from '@/components/TimelinePanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HelpCircle } from 'lucide-react';

export default function Home() {
  const loadProgram = useMachineStore((state) => state.loadProgram);

  useEffect(() => {
    loadProgram('sum-n-indirect');
  }, [loadProgram]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold">⚡ Addressing Modes Lab</h1>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
              title="Open documentation"
            >
              <HelpCircle size={14} />
              <span>Help</span>
            </a>
          </div>
          <ControlPanel />
        </header>

        {/* Main 3-column layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left: Programs */}
          <div className="w-64 border-r border-gray-700 flex-shrink-0 overflow-hidden">
            <ProgramPanel />
          </div>

          {/* Center: CPU State */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Top row: Registers + EA */}
            <div className="flex border-b border-gray-700 h-2/5 min-h-[200px]">
              <div className="flex-1 overflow-auto border-r border-gray-700">
                <RegisterPanel />
              </div>
              <div className="w-56 overflow-auto flex-shrink-0">
                <EAPanel />
              </div>
            </div>
            
            {/* Bottom row: Memory + Stack */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="flex-1 overflow-auto">
                <MemoryPanel />
              </div>
              <div className="w-56 border-l border-gray-700 overflow-auto flex-shrink-0">
                <StackPanel />
              </div>
            </div>
          </div>

          {/* Right: Explanation */}
          <div className="w-72 border-l border-gray-700 overflow-auto flex-shrink-0">
            <ExplanationPanel />
          </div>
        </div>

        {/* Footer: Timeline */}
        <div className="border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <TimelinePanel />
        </div>
      </div>
    </ErrorBoundary>
  );
}

