'use client';

import { useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { motion, AnimatePresence } from 'framer-motion';

export function StackPanel() {
  const { memory, registers } = useMachineStore();
  const sp = registers.SP;
  const fp = registers.FP;

  const stackCells = useMemo(() => {
    return Array.from(memory.cells.values())
      .filter((cell) => cell.segment === 'stack')
      .sort((a, b) => b.address - a.address);
  }, [memory.cells]);

  const formatHex = (value: number) =>
    '0x' + (value >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="px-3 py-2 border-b border-gray-700 text-sm font-medium text-orange-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
        Stack
      </div>

      {/* SP/FP */}
      <div className="px-3 py-2 bg-gray-900 text-xs border-b border-gray-700 flex gap-4">
        <span><span className="text-gray-500">SP:</span> <span className="font-mono text-orange-400">{formatHex(sp)}</span></span>
        <span><span className="text-gray-500">FP:</span> <span className="font-mono text-purple-400">{formatHex(fp)}</span></span>
      </div>

      <div className="flex-1 overflow-auto">
        <AnimatePresence>
          {stackCells.map((cell) => {
            const isSP = cell.address === sp;
            const isFP = cell.address === fp;

            return (
              <motion.div
                key={cell.address}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`px-2 py-1 text-xs border-b border-gray-700/50 font-mono flex justify-between
                  ${isSP ? 'bg-orange-500/20 border-l-2 border-l-orange-500' : ''}
                  ${isFP && !isSP ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : ''}`}
              >
                <span className="text-gray-500">{formatHex(cell.address)}</span>
                <span className="text-white">{formatHex(cell.value)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {stackCells.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-xs">Stack empty</div>
        )}
      </div>
    </div>
  );
}
