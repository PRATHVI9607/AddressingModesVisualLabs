'use client';

import { useMachineStore } from '@/store/machineStore';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  ChevronRight,
  FastForward,
} from 'lucide-react';

export function ControlPanel() {
  const {
    isRunning,
    isHalted,
    executionSpeed,
    step,
    stepMicro,
    run,
    pause,
    reset,
    stepBack,
    setExecutionSpeed,
    history,
    instructions,
    currentInstructionIndex,
  } = useMachineStore();

  const canStepBack = history.length > 0;
  const canStep = !isHalted && currentInstructionIndex < instructions.length;

  return (
    <div className="flex items-center gap-2">
      {/* Status */}
      {isHalted ? (
        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">HALT</span>
      ) : isRunning ? (
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium animate-pulse">RUN</span>
      ) : (
        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">READY</span>
      )}
      
      <span className="text-xs text-gray-500">{currentInstructionIndex}/{instructions.length}</span>

      <div className="h-4 w-px bg-gray-600" />

      {/* Controls */}
      <div className="flex items-center gap-0.5 bg-gray-700/50 rounded p-0.5">
        <button
          className="p-1.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white disabled:opacity-30"
          onClick={reset}
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
        <button
          className="p-1.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white disabled:opacity-30"
          onClick={stepBack}
          disabled={!canStepBack}
          title="Back"
        >
          <SkipBack size={14} />
        </button>
        <button
          className="px-2 py-1 rounded hover:bg-gray-600 text-gray-300 hover:text-white disabled:opacity-30 text-xs flex items-center gap-1"
          onClick={stepMicro}
          disabled={!canStep && !isRunning}
          title="Micro step"
        >
          <ChevronRight size={12} />
          μ
        </button>
        <button
          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 text-xs font-medium flex items-center gap-1"
          onClick={step}
          disabled={!canStep}
          title="Step"
        >
          <SkipForward size={12} />
          Step
        </button>
        {isRunning ? (
          <button
            className="px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium flex items-center gap-1"
            onClick={pause}
            title="Pause"
          >
            <Pause size={12} />
          </button>
        ) : (
          <button
            className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-30 text-xs font-medium flex items-center gap-1"
            onClick={run}
            disabled={!canStep}
            title="Run"
          >
            <Play size={12} />
          </button>
        )}
        <button
          className="p-1.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white disabled:opacity-30"
          onClick={() => {
            let count = 0;
            while (count < 100 && !useMachineStore.getState().isHalted) {
              useMachineStore.getState().step();
              count++;
            }
          }}
          disabled={!canStep}
          title="Run to end"
        >
          <FastForward size={14} />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-600" />

      {/* Speed */}
      <div className="flex items-center gap-1">
        <input
          type="range"
          min="50"
          max="2000"
          step="50"
          value={2050 - executionSpeed}
          onChange={(e) => setExecutionSpeed(2050 - parseInt(e.target.value))}
          className="w-16 accent-blue-500 h-1"
        />
        <span className="text-xs text-gray-500 w-10">{executionSpeed}ms</span>
      </div>
    </div>
  );
}
