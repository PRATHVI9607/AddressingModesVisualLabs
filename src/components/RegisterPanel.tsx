'use client';

import { useMachineStore } from '@/store/machineStore';
import { motion, AnimatePresence } from 'framer-motion';

const generalRegisters = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
const specialRegisters = ['PC', 'SP', 'FP'];

export function RegisterPanel() {
  const { registers, highlightedRegisters, microSteps, currentMicroStepIndex } = useMachineStore();

  const currentStep = microSteps[currentMicroStepIndex];
  const registerChanges = currentStep?.registerChanges ?? {};

  const formatHex = (value: number) => '0x' + (value >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="px-3 py-2 border-b border-gray-700 text-sm font-medium text-green-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Registers
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {/* General Registers - 4 columns */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          {generalRegisters.map((name) => {
            const value = registers[name as keyof typeof registers] as number;
            const isHighlighted = highlightedRegisters.includes(name);
            const change = registerChanges[name];

            return (
              <motion.div
                key={name}
                className={`p-1.5 rounded text-center ${
                  isHighlighted ? 'bg-green-500/20 ring-1 ring-green-500' : 'bg-gray-700/50'
                } ${change ? 'bg-yellow-500/20' : ''}`}
                animate={isHighlighted ? { scale: [1, 1.05, 1] } : {}}
              >
                <div className="text-xs text-gray-400 font-mono">{name}</div>
                <div className="text-xs font-mono text-white truncate" title={formatHex(value)}>
                  {(value >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(-4)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Special Registers */}
        <div className="space-y-1 mb-2">
          {specialRegisters.map((name) => {
            const value = registers[name as keyof typeof registers] as number;
            const isHighlighted = highlightedRegisters.includes(name);
            const change = registerChanges[name];
            const color = name === 'PC' ? 'text-blue-400' : name === 'SP' ? 'text-pink-400' : 'text-green-400';

            return (
              <div
                key={name}
                className={`flex items-center justify-between px-2 py-1 rounded ${
                  isHighlighted ? 'bg-green-500/20 ring-1 ring-green-500' : 'bg-gray-700/50'
                } ${change ? 'bg-yellow-500/20' : ''}`}
              >
                <span className={`font-mono text-xs font-bold ${color}`}>{name}</span>
                <span className="font-mono text-xs text-white">{formatHex(value)}</span>
              </div>
            );
          })}
        </div>

        {/* Flags */}
        <div className="flex gap-1">
          {(['Z', 'N', 'C', 'V'] as const).map((flag) => (
            <div
              key={flag}
              className={`flex-1 text-center py-1 rounded text-xs font-mono font-bold ${
                registers[flag] ? 'bg-green-500/30 text-green-400' : 'bg-gray-700/50 text-gray-500'
              }`}
              title={flag === 'Z' ? 'Zero' : flag === 'N' ? 'Negative' : flag === 'C' ? 'Carry' : 'Overflow'}
            >
              {flag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
