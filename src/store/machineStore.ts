// Zustand store for the Addressing Modes Visual Lab

import { create } from 'zustand';
import {
  RegisterState,
  MemoryState,
  Instruction,
  MicroStep,
  ExecutionSnapshot,
  SymbolTable,
  AddressingMode,
  ViewMode,
  MemoryViewZoom,
  Program,
} from '@/types';
import {
  createInitialRegisters,
  createInitialMemory,
  executeInstruction,
  createSnapshot,
} from '@/engine/executor';
import { parseProgram } from '@/engine/parser';
import { examplePrograms } from '@/data/examplePrograms';

interface MachineState {
  // Machine state
  registers: RegisterState;
  memory: MemoryState;
  instructions: Instruction[];
  symbolTable: SymbolTable;
  
  // Execution state
  currentInstructionIndex: number;
  microSteps: MicroStep[];
  currentMicroStepIndex: number;
  isRunning: boolean;
  isHalted: boolean;
  executionSpeed: number;
  history: ExecutionSnapshot[];
  
  // UI state
  viewMode: ViewMode;
  selectedMode: AddressingMode | null;
  selectedProgram: string | null;
  memoryZoom: MemoryViewZoom;
  selectedMemoryCell: number | null;
  showEAOverlay: boolean;
  showExplanations: boolean;
  highlightedRegisters: string[];
  highlightedAddresses: number[];
  currentEAExpression: string | null;
  currentEAValue: number | null;
  
  // Source code
  sourceCode: string;
  
  // Actions
  loadProgram: (programId: string) => void;
  setSourceCode: (code: string) => void;
  compileAndLoad: () => void;
  reset: () => void;
  step: () => void;
  stepMicro: () => void;
  run: () => void;
  pause: () => void;
  stepBack: () => void;
  setExecutionSpeed: (speed: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedMode: (mode: AddressingMode | null) => void;
  setMemoryZoom: (zoom: MemoryViewZoom) => void;
  setSelectedMemoryCell: (address: number | null) => void;
  toggleEAOverlay: () => void;
  toggleExplanations: () => void;
}

export const useMachineStore = create<MachineState>((set, get) => ({
  // Initial machine state
  registers: createInitialRegisters(),
  memory: createInitialMemory(),
  instructions: [],
  symbolTable: { labels: new Map(), variables: new Map() },
  
  // Initial execution state
  currentInstructionIndex: 0,
  microSteps: [],
  currentMicroStepIndex: 0,
  isRunning: false,
  isHalted: false,
  executionSpeed: 500,
  history: [],
  
  // Initial UI state
  viewMode: 'guided',
  selectedMode: null,
  selectedProgram: null,
  memoryZoom: 'macro',
  selectedMemoryCell: null,
  showEAOverlay: true,
  showExplanations: true,
  highlightedRegisters: [],
  highlightedAddresses: [],
  currentEAExpression: null,
  currentEAValue: null,
  
  // Source code
  sourceCode: '',

  // Load a predefined program
  loadProgram: (programId: string) => {
    const program = examplePrograms.find(p => p.id === programId);
    if (!program) return;

    // Extract predefined variables from initialMemory for the parser
    const predefinedVariables = new Map<string, number>();
    const initialMemory = new Map<number, { value: number; label?: string; segment?: 'code' | 'data' | 'stack' }>();
    
    // Add program's initial memory and collect variable names
    for (const [addr, data] of Object.entries(program.initialMemory)) {
      const address = parseInt(addr);
      initialMemory.set(address, {
        value: data.value,
        label: data.label,
        segment: data.segment as 'code' | 'data' | 'stack' | undefined,
      });
      // Add labeled variables to predefined map
      if (data.label) {
        predefinedVariables.set(data.label, address);
      }
    }

    // Parse the program with predefined variables
    const { instructions, symbolTable } = parseProgram(program.source, predefinedVariables);

    // Store instructions in memory (code segment)
    for (const inst of instructions) {
      initialMemory.set(inst.address, {
        value: 0, // Placeholder for instruction encoding
        segment: 'code',
      });
    }

    const memory = createInitialMemory(initialMemory);
    const registers = createInitialRegisters(program.initialRegisters);

    set({
      instructions,
      symbolTable,
      memory,
      registers,
      sourceCode: program.source,
      selectedProgram: programId,
      selectedMode: program.addressingModes[0] ?? null,
      currentInstructionIndex: 0,
      microSteps: [],
      currentMicroStepIndex: 0,
      isRunning: false,
      isHalted: false,
      history: [],
      highlightedRegisters: [],
      highlightedAddresses: [],
      currentEAExpression: null,
      currentEAValue: null,
    });
  },

  // Set source code
  setSourceCode: (code: string) => {
    set({ sourceCode: code });
  },

  // Compile and load custom program
  compileAndLoad: () => {
    const { sourceCode } = get();
    try {
      const { instructions, symbolTable } = parseProgram(sourceCode);
      const memory = createInitialMemory();
      const registers = createInitialRegisters();

      set({
        instructions,
        symbolTable,
        memory,
        registers,
        currentInstructionIndex: 0,
        microSteps: [],
        currentMicroStepIndex: 0,
        isRunning: false,
        isHalted: false,
        history: [],
      });
    } catch (error) {
      console.error('Parse error:', error);
    }
  },

  // Reset execution
  reset: () => {
    const { selectedProgram } = get();
    if (selectedProgram) {
      get().loadProgram(selectedProgram);
    } else {
      set({
        registers: createInitialRegisters(),
        memory: createInitialMemory(),
        currentInstructionIndex: 0,
        microSteps: [],
        currentMicroStepIndex: 0,
        isRunning: false,
        isHalted: false,
        history: [],
        highlightedRegisters: [],
        highlightedAddresses: [],
        currentEAExpression: null,
        currentEAValue: null,
      });
    }
  },

  // Execute one full instruction
  step: () => {
    const { 
      instructions, 
      currentInstructionIndex, 
      registers, 
      memory, 
      symbolTable,
      isHalted,
      history,
    } = get();

    if (isHalted || currentInstructionIndex >= instructions.length) {
      set({ isHalted: true, isRunning: false });
      return;
    }

    // Save snapshot for undo
    const snapshot = createSnapshot(registers, memory, currentInstructionIndex, 0);
    
    const instruction = instructions[currentInstructionIndex];
    const result = executeInstruction(instruction, registers, memory, symbolTable);

    // Find the next instruction index based on PC
    let nextIndex = currentInstructionIndex + 1;
    const newPC = result.newRegisters.PC;
    const targetInst = instructions.findIndex(i => i.address === newPC);
    if (targetInst !== -1) {
      nextIndex = targetInst;
    }

    // Check if halted
    const halted = instruction.opcode === 'HALT' || nextIndex >= instructions.length;

    // Get highlights from last micro-step
    const lastStep = result.microSteps[result.microSteps.length - 1];

    set({
      registers: result.newRegisters,
      memory: result.newMemory,
      microSteps: result.microSteps,
      currentMicroStepIndex: result.microSteps.length - 1,
      currentInstructionIndex: nextIndex,
      isHalted: halted,
      history: [...history, snapshot],
      highlightedRegisters: lastStep?.highlightedRegisters ?? [],
      highlightedAddresses: lastStep?.highlightedAddresses ?? [],
      currentEAExpression: lastStep?.eaExpression ?? null,
      currentEAValue: lastStep?.eaValue ?? null,
    });
  },

  // Execute one micro-step
  stepMicro: () => {
    const {
      instructions,
      currentInstructionIndex,
      registers,
      memory,
      symbolTable,
      microSteps,
      currentMicroStepIndex,
      isHalted,
      history,
    } = get();

    if (isHalted) return;

    // If we have micro-steps to go through
    if (microSteps.length > 0 && currentMicroStepIndex < microSteps.length - 1) {
      const nextStep = microSteps[currentMicroStepIndex + 1];
      set({
        currentMicroStepIndex: currentMicroStepIndex + 1,
        highlightedRegisters: nextStep.highlightedRegisters,
        highlightedAddresses: nextStep.highlightedAddresses,
        currentEAExpression: nextStep.eaExpression ?? null,
        currentEAValue: nextStep.eaValue ?? null,
      });
      return;
    }

    // Start a new instruction
    if (currentInstructionIndex >= instructions.length) {
      set({ isHalted: true, isRunning: false });
      return;
    }

    const snapshot = createSnapshot(registers, memory, currentInstructionIndex, currentMicroStepIndex);
    const instruction = instructions[currentInstructionIndex];
    const result = executeInstruction(instruction, registers, memory, symbolTable);

    // Show first micro-step
    const firstStep = result.microSteps[0];

    set({
      microSteps: result.microSteps,
      currentMicroStepIndex: 0,
      history: [...history, snapshot],
      highlightedRegisters: firstStep?.highlightedRegisters ?? [],
      highlightedAddresses: firstStep?.highlightedAddresses ?? [],
      currentEAExpression: firstStep?.eaExpression ?? null,
      currentEAValue: firstStep?.eaValue ?? null,
    });
  },

  // Run continuously
  run: () => {
    set({ isRunning: true });
    
    const runLoop = () => {
      const { isRunning, isHalted, executionSpeed } = get();
      if (!isRunning || isHalted) return;
      
      get().step();
      
      setTimeout(runLoop, executionSpeed);
    };
    
    runLoop();
  },

  // Pause execution
  pause: () => {
    set({ isRunning: false });
  },

  // Step back in history
  stepBack: () => {
    const { history } = get();
    if (history.length === 0) return;

    const snapshot = history[history.length - 1];
    
    // Reconstruct memory from snapshot
    const cells = new Map(get().memory.cells);
    for (const [addr, value] of snapshot.memory) {
      const cell = cells.get(addr);
      if (cell) {
        cells.set(addr, { ...cell, value });
      }
    }

    set({
      registers: snapshot.registers,
      memory: { ...get().memory, cells },
      currentInstructionIndex: snapshot.instructionIndex,
      currentMicroStepIndex: snapshot.microStepIndex,
      history: history.slice(0, -1),
      microSteps: [],
      highlightedRegisters: [],
      highlightedAddresses: [],
    });
  },

  // Set execution speed
  setExecutionSpeed: (speed: number) => {
    set({ executionSpeed: speed });
  },

  // UI actions
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  setSelectedMode: (mode: AddressingMode | null) => {
    set({ selectedMode: mode });
  },

  setMemoryZoom: (zoom: MemoryViewZoom) => {
    set({ memoryZoom: zoom });
  },

  setSelectedMemoryCell: (address: number | null) => {
    set({ selectedMemoryCell: address });
  },

  toggleEAOverlay: () => {
    set(state => ({ showEAOverlay: !state.showEAOverlay }));
  },

  toggleExplanations: () => {
    set(state => ({ showExplanations: !state.showExplanations }));
  },
}));
