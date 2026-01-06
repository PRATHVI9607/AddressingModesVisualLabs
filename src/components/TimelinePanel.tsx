'use client';

import { useMachineStore } from '@/store/machineStore';
import { motion } from 'framer-motion';

const phaseColors: Record<string, string> = {
  fetch: 'bg-blue-500',
  decode: 'bg-purple-500',
  ea_compute: 'bg-violet-500',
  operand_fetch: 'bg-orange-500',
  execute: 'bg-green-500',
  writeback: 'bg-pink-500',
};

const phaseShort: Record<string, string> = {
  fetch: 'F',
  decode: 'D',
  ea_compute: 'EA',
  operand_fetch: 'OF',
  execute: 'EX',
  writeback: 'WB',
};

export function TimelinePanel() {
  const { microSteps, currentMicroStepIndex, instructions, currentInstructionIndex } =
    useMachineStore();

  const currentInstruction = instructions[currentInstructionIndex - 1];

  return (
    <div className="px-4 py-2 flex items-center gap-4">
      {/* Current Instruction */}
      {currentInstruction && (
        <span className="font-mono text-xs text-white bg-gray-700 px-2 py-1 rounded">
          {currentInstruction.rawText.trim()}
        </span>
      )}

      {/* Timeline */}
      <div className="flex items-center gap-1">
        {microSteps.map((step, idx) => {
          const isActive = idx === currentMicroStepIndex;
          const isPast = idx < currentMicroStepIndex;

          return (
            <motion.div
              key={step.id}
              className={`px-2 py-1 rounded text-xs font-medium
                ${isActive ? 'ring-1 ring-white' : ''} ${isPast ? 'opacity-40' : ''}
                ${phaseColors[step.phase] || 'bg-gray-600'}`}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            >
              {phaseShort[step.phase] || step.phase[0].toUpperCase()}
            </motion.div>
          );
        })}
        {microSteps.length === 0 && (
          <span className="text-xs text-gray-500">Step to see timeline</span>
        )}
      </div>

      {/* Legend */}
      <div className="hidden lg:flex items-center gap-2 text-xs ml-auto">
        {['fetch', 'decode', 'ea_compute', 'execute', 'writeback'].map((p) => (
          <span key={p} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded ${phaseColors[p]}`}></span>
            <span className="text-gray-500">{phaseShort[p]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
