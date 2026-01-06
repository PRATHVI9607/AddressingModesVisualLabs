// Core types for the Addressing Modes Visual Lab

// ============================================
// ADDRESSING MODES
// ============================================
export enum AddressingMode {
  IMMEDIATE = 'IMMEDIATE',           // #5 - operand in instruction
  REGISTER = 'REGISTER',             // R0 - operand in register
  DIRECT = 'DIRECT',                 // LOC - EA = address of LOC
  INDIRECT_REGISTER = 'INDIRECT_REGISTER', // (R2) - EA = [R2]
  INDIRECT_MEMORY = 'INDIRECT_MEMORY',     // (LOC) - EA = M[LOC]
  INDEXED = 'INDEXED',               // X(Ri) - EA = Ri + X
  BASE_INDEX = 'BASE_INDEX',         // (Ri, Rj) - EA = Ri + Rj
  BASE_INDEX_OFFSET = 'BASE_INDEX_OFFSET', // X(Ri, Rj) - EA = Ri + Rj + X
  RELATIVE = 'RELATIVE',             // X(PC) - EA = PC + X
  AUTOINCREMENT = 'AUTOINCREMENT',   // (Ri)+ - EA = Ri, then Ri += size
  AUTODECREMENT = 'AUTODECREMENT',   // -(Ri) - Ri -= size, then EA = Ri
  IMPLIED = 'IMPLIED',               // No operand specified (e.g., RTS)
}

// ============================================
// OPERAND TYPES
// ============================================
export interface Operand {
  type: AddressingMode;
  register?: string;        // Register name (R0, R1, PC, SP, etc.)
  register2?: string;       // Second register for base+index modes
  immediate?: number;       // Immediate value
  offset?: number;          // Offset/displacement value
  label?: string;           // Label reference (NUM1, LOOP, etc.)
  rawText: string;          // Original text representation
}

// ============================================
// INSTRUCTION TYPES
// ============================================
export enum Opcode {
  MOVE = 'MOVE',
  ADD = 'ADD',
  SUB = 'SUB',
  MUL = 'MUL',
  DIV = 'DIV',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  CMP = 'CMP',
  CLEAR = 'CLEAR',
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
  BRANCH = 'BRANCH',
  BRANCH_EQ = 'BRANCH_EQ',
  BRANCH_NE = 'BRANCH_NE',
  BRANCH_GT = 'BRANCH_GT',
  BRANCH_GE = 'BRANCH_GE',
  BRANCH_LT = 'BRANCH_LT',
  BRANCH_LE = 'BRANCH_LE',
  CALL = 'CALL',
  RETURN = 'RETURN',
  PUSH = 'PUSH',
  POP = 'POP',
  NOP = 'NOP',
  HALT = 'HALT',
}

export interface Instruction {
  address: number;
  opcode: Opcode;
  operands: Operand[];
  rawText: string;
  label?: string;
  comment?: string;
  size: number; // Instruction size in bytes (typically 4)
}

// ============================================
// MEMORY TYPES
// ============================================
export type MemorySegment = 'code' | 'data' | 'stack' | 'heap';

export interface MemoryCell {
  address: number;
  value: number;
  label?: string;
  segment: MemorySegment;
  isHighlighted?: boolean;
  annotation?: string;
}

export interface MemoryState {
  cells: Map<number, MemoryCell>;
  codeStart: number;
  codeEnd: number;
  dataStart: number;
  dataEnd: number;
  stackStart: number;
  stackEnd: number;
}

// ============================================
// REGISTER TYPES
// ============================================
export interface Register {
  name: string;
  value: number;
  displayName: string;
  role?: 'general' | 'pc' | 'sp' | 'fp' | 'accumulator' | 'status';
  semanticTag?: string; // "Base", "Index", "Pointer", etc.
  isHighlighted?: boolean;
}

export interface RegisterState {
  R0: number;
  R1: number;
  R2: number;
  R3: number;
  R4: number;
  R5: number;
  R6: number;
  R7: number;
  PC: number;
  SP: number;
  FP: number;
  // Status flags
  Z: boolean;  // Zero flag
  N: boolean;  // Negative flag
  C: boolean;  // Carry flag
  V: boolean;  // Overflow flag
}

// ============================================
// EXECUTION STATE
// ============================================
export interface MicroStep {
  id: string;
  phase: 'fetch' | 'decode' | 'ea_compute' | 'operand_fetch' | 'execute' | 'writeback';
  description: string;
  pseudoRTN: string;
  registerChanges: Record<string, { old: number; new: number }>;
  memoryChanges: Record<number, { old: number; new: number }>;
  highlightedRegisters: string[];
  highlightedAddresses: number[];
  eaExpression?: string;
  eaValue?: number;
  dataFlow?: DataFlowArrow[];
}

export interface DataFlowArrow {
  from: { type: 'register' | 'memory' | 'ea' | 'pc' | 'alu'; id: string | number };
  to: { type: 'register' | 'memory' | 'ea' | 'pc' | 'alu'; id: string | number };
  label?: string;
  color?: string;
}

export interface ExecutionState {
  registers: RegisterState;
  memory: MemoryState;
  currentInstruction: Instruction | null;
  currentInstructionIndex: number;
  microStepIndex: number;
  microSteps: MicroStep[];
  isRunning: boolean;
  isHalted: boolean;
  executionSpeed: number; // ms per step
  history: ExecutionSnapshot[];
}

export interface ExecutionSnapshot {
  registers: RegisterState;
  memory: Map<number, number>; // Only changed values for efficiency
  instructionIndex: number;
  microStepIndex: number;
  timestamp: number;
}

// ============================================
// EA EVALUATION RESULT
// ============================================
export interface EAResult {
  ea: number | null;          // Effective address (null for immediate/register)
  value: number;              // The operand value
  mode: AddressingMode;
  expression: string;         // Human-readable expression "EA = R2 + 4"
  substitution: string;       // With values substituted "EA = 0x10000 + 4 = 0x10004"
  steps: string[];            // Detailed micro-steps for animation
  postUpdate?: {              // For autoincrement/autodecrement
    register: string;
    oldValue: number;
    newValue: number;
  };
}

// ============================================
// PROGRAM TYPES
// ============================================
export interface Program {
  id: string;
  name: string;
  description: string;
  addressingModes: AddressingMode[];
  source: string;
  initialMemory: Record<number, { value: number; label?: string; segment: MemorySegment }>;
  initialRegisters?: Partial<RegisterState>;
}

export interface SymbolTable {
  labels: Map<string, number>;      // Label -> address
  variables: Map<string, number>;   // Variable name -> address
}

// ============================================
// UI STATE
// ============================================
export type ViewMode = 'guided' | 'custom' | 'quiz';
export type MemoryViewZoom = 'macro' | 'micro';

export interface UIState {
  viewMode: ViewMode;
  selectedMode: AddressingMode | null;
  selectedProgram: string | null;
  memoryZoom: MemoryViewZoom;
  selectedMemoryCell: number | null;
  showEAOverlay: boolean;
  showExplanations: boolean;
  compareMode: boolean;
  compareInstructions: [number, number] | null;
}

// ============================================
// TOOLTIP / EXPLANATION
// ============================================
export interface TooltipContent {
  title: string;
  description: string;
  formula?: string;
  currentValues?: Record<string, string>;
  relatedConcepts?: string[];
}

// ============================================
// QUIZ TYPES
// ============================================
export interface QuizQuestion {
  id: string;
  type: 'mode_identification' | 'ea_calculation' | 'prediction';
  question: string;
  instruction?: string;
  registerValues?: Partial<RegisterState>;
  memoryValues?: Record<number, number>;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
}

export interface QuizState {
  currentQuestion: QuizQuestion | null;
  userAnswer: string | number | null;
  isCorrect: boolean | null;
  score: number;
  totalQuestions: number;
}
