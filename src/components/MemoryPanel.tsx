'use client';

import { useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { motion } from 'framer-motion';

export function MemoryPanel() {
  const {
    memory,
    highlightedAddresses,
    selectedMemoryCell,
    setSelectedMemoryCell,
    microSteps,
    currentMicroStepIndex,
  } = useMachineStore();

  const currentStep = microSteps[currentMicroStepIndex];
  const memoryChanges = currentStep?.memoryChanges ?? {};

  const memoryCells = useMemo(() => {
    const cells = Array.from(memory.cells.values());
    return cells.sort((a, b) => a.address - b.address);
  }, [memory.cells]);

  const groupedCells = useMemo(() => {
    const groups: Record<string, typeof memoryCells> = { data: [], stack: [] };
    for (const cell of memoryCells) {
      if (groups[cell.segment]) groups[cell.segment].push(cell);
    }
    return groups;
  }, [memoryCells]);

  const formatHex = (value: number, digits = 8) =>
    '0x' + (value >>> 0).toString(16).toUpperCase().padStart(digits, '0');

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="px-3 py-2 border-b border-gray-700 text-sm font-medium text-green-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Memory
      </div>

      <div className="flex-1 overflow-auto">
        {groupedCells.data.length > 0 && (
          <div>
            <div className="px-2 py-1 text-xs text-gray-500 bg-gray-900 border-l-2 border-green-500">
              Data
            </div>
            {groupedCells.data.map((cell) => {
              const isHighlighted = highlightedAddresses.includes(cell.address);
              const isSelected = selectedMemoryCell === cell.address;
              const change = memoryChanges[cell.address];

              return (
                <motion.div
                  key={cell.address}
                  onClick={() => setSelectedMemoryCell(isSelected ? null : cell.address)}
                  className={`px-2 py-1 cursor-pointer border-b border-gray-700/50 hover:bg-gray-700/50 text-xs
                    ${isHighlighted ? 'bg-purple-500/20' : ''} ${isSelected ? 'bg-blue-500/20' : ''}`}
                  animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-green-400">{formatHex(cell.address)}</span>
                    <motion.span
                      key={cell.value}
                      initial={change ? { color: '#fbbf24' } : {}}
                      animate={{ color: '#fff' }}
                      className="text-white"
                    >
                      {formatHex(cell.value)}
                    </motion.span>
                  </div>
                  {cell.label && (
                    <div className="text-purple-400 text-xs">{cell.label}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {memoryCells.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-xs">
            No memory data
          </div>
        )}
      </div>
    </div>
  );
}
