'use client';

import { useState } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { examplePrograms, getProgramsByMode } from '@/data/examplePrograms';
import { AddressingMode } from '@/types';
import { getAddressingModeDescription } from '@/engine/addressingModes';
import { ChevronDown, Play } from 'lucide-react';

const addressingModes = [
  AddressingMode.IMMEDIATE,
  AddressingMode.REGISTER,
  AddressingMode.DIRECT,
  AddressingMode.INDIRECT_REGISTER,
  AddressingMode.INDEXED,
  AddressingMode.BASE_INDEX,
  AddressingMode.BASE_INDEX_OFFSET,
  AddressingMode.RELATIVE,
  AddressingMode.AUTOINCREMENT,
  AddressingMode.AUTODECREMENT,
];

export function ProgramPanel() {
  const {
    viewMode,
    setViewMode,
    selectedMode,
    setSelectedMode,
    selectedProgram,
    loadProgram,
    sourceCode,
    setSourceCode,
  } = useMachineStore();

  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const filteredPrograms = selectedMode
    ? getProgramsByMode(selectedMode)
    : examplePrograms;

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        <button
          className={`flex-1 px-2 py-2 text-xs font-medium ${viewMode === 'guided' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setViewMode('guided')}
        >
          Examples
        </button>
        <button
          className={`flex-1 px-2 py-2 text-xs font-medium ${viewMode === 'custom' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setViewMode('custom')}
        >
          Custom
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {viewMode === 'guided' && (
          <>
            {/* Mode Selector */}
            <div className="mb-2 relative">
              <button
                className="w-full bg-gray-700 rounded px-3 py-1.5 text-sm text-left flex items-center justify-between"
                onClick={() => setShowModeDropdown(!showModeDropdown)}
              >
                <span className="truncate">
                  {selectedMode ? getAddressingModeDescription(selectedMode).name : 'All Modes'}
                </span>
                <ChevronDown size={14} />
              </button>
              {showModeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded shadow-xl max-h-48 overflow-auto">
                  <button
                    className="w-full px-3 py-1.5 text-left hover:bg-gray-600 text-xs"
                    onClick={() => { setSelectedMode(null); setShowModeDropdown(false); }}
                  >
                    All Modes
                  </button>
                  {addressingModes.map((mode) => (
                    <button
                      key={mode}
                      className="w-full px-3 py-1.5 text-left hover:bg-gray-600 text-xs"
                      onClick={() => { setSelectedMode(mode); setShowModeDropdown(false); }}
                    >
                      {getAddressingModeDescription(mode).name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Program List */}
            <div className="space-y-1">
              {filteredPrograms.map((program) => (
                <button
                  key={program.id}
                  className={`w-full p-2 rounded text-left text-xs transition-colors ${
                    selectedProgram === program.id
                      ? 'bg-blue-600/30 border border-blue-500'
                      : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                  }`}
                  onClick={() => loadProgram(program.id)}
                >
                  <div className="font-medium">{program.name}</div>
                  <div className="text-gray-400 mt-0.5 truncate">{program.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {viewMode === 'custom' && (
          <div className="h-full flex flex-col">
            <textarea
              className="flex-1 w-full bg-gray-900 rounded p-2 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="Enter assembly code..."
              spellCheck={false}
            />
            <button
              className="mt-2 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-xs flex items-center justify-center gap-1"
              onClick={() => useMachineStore.getState().compileAndLoad()}
            >
              <Play size={12} /> Compile
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
