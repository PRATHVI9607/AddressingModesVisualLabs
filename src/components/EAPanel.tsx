'use client';

import { useMachineStore } from '@/store/machineStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function EAPanel() {
  const {
    currentEAExpression,
    currentEAValue,
    microSteps,
    currentMicroStepIndex,
  } = useMachineStore();

  const currentStep = microSteps[currentMicroStepIndex];
  const formatHex = (value: number) => '0x' + (value >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="px-3 py-2 border-b border-gray-700 text-sm font-medium text-purple-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
        EA Calculation
      </div>

      <div className="flex-1 overflow-auto p-3">
        <AnimatePresence mode="wait">
          {currentStep?.eaExpression ? (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Expression */}
              <div className="text-xs text-gray-500 mb-1">Formula</div>
              <div className="font-mono text-sm text-purple-400 bg-gray-900 rounded p-2 mb-3">
                {currentEAExpression}
              </div>

              {/* Result */}
              {currentEAValue !== null && (
                <>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <ArrowRight size={12} /> Result
                  </div>
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="font-mono text-lg text-white bg-purple-500/20 border border-purple-500/50 rounded p-2 text-center"
                  >
                    {formatHex(currentEAValue)}
                  </motion.div>
                </>
              )}

              {/* Arrow animation */}
              <div className="mt-3 flex justify-center">
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-purple-400 text-xl"
                >
                  ↓
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-xs">
              Step through code to see EA calculation
            </div>
          )}
        </AnimatePresence>

        {/* Quick Reference */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-2">Quick Reference</div>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            <div className="text-gray-400">#N</div><div className="text-purple-400">Immediate</div>
            <div className="text-gray-400">(Ri)</div><div className="text-purple-400">EA=[Ri]</div>
            <div className="text-gray-400">X(Ri)</div><div className="text-purple-400">EA=[Ri]+X</div>
            <div className="text-gray-400">(Ri)+</div><div className="text-purple-400">EA=[Ri],Ri++</div>
          </div>
        </div>
      </div>
    </div>
  );
}
