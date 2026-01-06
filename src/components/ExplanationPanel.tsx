'use client';

import { useMachineStore } from '@/store/machineStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getAddressingModeDescription } from '@/engine/addressingModes';

export function ExplanationPanel() {
  const {
    microSteps,
    currentMicroStepIndex,
    instructions,
    currentInstructionIndex,
  } = useMachineStore();

  const currentStep = microSteps[currentMicroStepIndex];
  const currentInstruction = instructions[currentInstructionIndex - 1] ?? instructions[currentInstructionIndex];

  const formatHex = (value: number, digits = 8) =>
    '0x' + (value >>> 0).toString(16).toUpperCase().padStart(digits, '0');

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="px-3 py-2 border-b border-gray-700 text-sm font-medium text-blue-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        Explanation
      </div>

      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {currentStep ? (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3"
            >
              {/* Phase Badge */}
              <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2
                ${currentStep.phase === 'fetch' ? 'bg-blue-500/30 text-blue-400' : ''}
                ${currentStep.phase === 'decode' ? 'bg-purple-500/30 text-purple-400' : ''}
                ${currentStep.phase === 'ea_compute' ? 'bg-violet-500/30 text-violet-400' : ''}
                ${currentStep.phase === 'operand_fetch' ? 'bg-orange-500/30 text-orange-400' : ''}
                ${currentStep.phase === 'execute' ? 'bg-green-500/30 text-green-400' : ''}
                ${currentStep.phase === 'writeback' ? 'bg-pink-500/30 text-pink-400' : ''}`}>
                {currentStep.phase.replace('_', ' ').toUpperCase()}
              </div>

              {/* Description */}
              <p className="text-white text-sm mb-2">{currentStep.description}</p>

              {/* RTN */}
              <div className="bg-gray-900 rounded p-2 font-mono text-xs mb-2">
                <span className="text-gray-500">RTN:</span>{' '}
                <span className="text-purple-400">{currentStep.pseudoRTN}</span>
              </div>

              {/* Changes */}
              {Object.keys(currentStep.registerChanges).length > 0 && (
                <div className="text-xs space-y-1 mb-2">
                  {Object.entries(currentStep.registerChanges).map(([reg, change]) => (
                    <div key={reg} className="font-mono flex gap-1">
                      <span className="text-cyan-400">{reg}</span>
                      <span className="text-gray-500">{formatHex(change.old)}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-green-400">{formatHex(change.new)}</span>
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(currentStep.memoryChanges).length > 0 && (
                <div className="text-xs space-y-1">
                  {Object.entries(currentStep.memoryChanges).map(([addr, change]) => (
                    <div key={addr} className="font-mono flex gap-1">
                      <span className="text-green-400">M[{formatHex(parseInt(addr))}]</span>
                      <span className="text-gray-500">{formatHex(change.old)}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-green-400">{formatHex(change.new)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-xs">
              Step through code to see explanation
            </div>
          )}
        </AnimatePresence>

        {/* Current Instruction */}
        {currentInstruction && (
          <div className="p-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Current Instruction</div>
            <div className="font-mono text-xs bg-gray-900 rounded p-2">
              <span className="text-blue-400">@{formatHex(currentInstruction.address, 4)}</span>
              <span className="text-gray-600"> | </span>
              <span className="text-white">{currentInstruction.rawText.trim()}</span>
            </div>
            
            {/* Operands */}
            {currentInstruction.operands.length > 0 && (
              <div className="mt-2 space-y-1">
                {currentInstruction.operands.map((operand, idx) => {
                  const modeDesc = getAddressingModeDescription(operand.type);
                  return (
                    <div key={idx} className="text-xs bg-gray-700/50 rounded p-1.5 flex justify-between">
                      <span className="text-white font-mono">{operand.rawText}</span>
                      <span className="text-purple-400">{modeDesc.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
