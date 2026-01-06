// Execution Engine - Executes instructions and produces micro-steps for visualization

import {
  Instruction,
  Opcode,
  RegisterState,
  MemoryState,
  MemoryCell,
  MicroStep,
  ExecutionState,
  ExecutionSnapshot,
  DataFlowArrow,
  SymbolTable,
  AddressingMode,
} from '@/types';
import { evaluateAddress } from './addressingModes';

const WORD_SIZE = 4;

/**
 * Create initial register state
 */
export function createInitialRegisters(overrides?: Partial<RegisterState>): RegisterState {
  return {
    R0: 0,
    R1: 0,
    R2: 0,
    R3: 0,
    R4: 0,
    R5: 0,
    R6: 0,
    R7: 0,
    PC: 0,
    SP: 0xFFFF0000, // Stack grows downward from high memory
    FP: 0xFFFF0000,
    Z: false,
    N: false,
    C: false,
    V: false,
    ...overrides,
  };
}

/**
 * Create initial memory state
 */
export function createInitialMemory(
  initialData?: Map<number, { value: number; label?: string; segment?: 'code' | 'data' | 'stack' }>
): MemoryState {
  const cells = new Map<number, MemoryCell>();

  if (initialData) {
    for (const [address, data] of initialData) {
      cells.set(address, {
        address,
        value: data.value,
        label: data.label,
        segment: data.segment ?? 'data',
      });
    }
  }

  return {
    cells,
    codeStart: 0,
    codeEnd: 0x1000,
    dataStart: 0x10000,
    dataEnd: 0x20000,
    stackStart: 0xFFFF0000,
    stackEnd: 0xFFFFF000,
  };
}

/**
 * Read a value from memory
 */
export function readMemory(memory: MemoryState, address: number): number {
  const cell = memory.cells.get(address);
  return cell?.value ?? 0;
}

/**
 * Write a value to memory
 */
export function writeMemory(memory: MemoryState, address: number, value: number, label?: string): MemoryState {
  const newCells = new Map(memory.cells);
  const existingCell = newCells.get(address);
  
  newCells.set(address, {
    address,
    value: value >>> 0, // Ensure unsigned 32-bit
    label: label ?? existingCell?.label,
    segment: existingCell?.segment ?? determineSegment(address, memory),
  });

  return {
    ...memory,
    cells: newCells,
  };
}

/**
 * Determine which segment an address belongs to
 */
function determineSegment(address: number, memory: MemoryState): 'code' | 'data' | 'stack' | 'heap' {
  if (address >= memory.stackStart && address <= memory.stackEnd) return 'stack';
  if (address >= memory.dataStart && address <= memory.dataEnd) return 'data';
  if (address >= memory.codeStart && address <= memory.codeEnd) return 'code';
  return 'heap';
}

/**
 * Get a register value by name
 */
export function getRegister(registers: RegisterState, name: string): number {
  const regName = name.toUpperCase();
  if (regName in registers) {
    const value = registers[regName as keyof RegisterState];
    if (typeof value === 'number') return value;
  }
  throw new Error(`Unknown register: ${name}`);
}

/**
 * Set a register value by name
 */
export function setRegister(registers: RegisterState, name: string, value: number): RegisterState {
  const regName = name.toUpperCase() as keyof RegisterState;
  if (regName in registers && typeof registers[regName] === 'number') {
    return {
      ...registers,
      [regName]: value >>> 0, // Ensure unsigned 32-bit
    };
  }
  throw new Error(`Unknown register: ${name}`);
}

/**
 * Update status flags based on a result with full carry/overflow detection
 */
function updateFlags(
  registers: RegisterState, 
  result: number, 
  operand1?: number, 
  operand2?: number, 
  isSubtraction?: boolean
): RegisterState {
  const unsigned = result >>> 0;
  const signed = result | 0;
  
  let carry = false;
  let overflow = false;
  
  if (operand1 !== undefined && operand2 !== undefined) {
    if (isSubtraction) {
      // For subtraction: carry if no borrow needed (operand1 >= operand2 unsigned)
      carry = (operand1 >>> 0) >= (operand2 >>> 0);
      // Overflow if signs differ and result sign differs from operand1
      const sign1 = (operand1 | 0) < 0;
      const sign2 = (operand2 | 0) < 0;
      const signR = signed < 0;
      overflow = (sign1 !== sign2) && (signR !== sign1);
    } else {
      // For addition: carry if result < either operand (unsigned)
      carry = unsigned < (operand1 >>> 0);
      // Overflow if same signs produce different sign
      const sign1 = (operand1 | 0) < 0;
      const sign2 = (operand2 | 0) < 0;
      const signR = signed < 0;
      overflow = (sign1 === sign2) && (signR !== sign1);
    }
  }
  
  return {
    ...registers,
    Z: unsigned === 0,
    N: signed < 0,
    C: carry,
    V: overflow,
  };
}

/**
 * Format number as hex
 */
function toHex(value: number): string {
  return '0x' + (value >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Generate a unique ID for micro-steps
 */
function generateStepId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Execute a single instruction and return micro-steps
 */
export function executeInstruction(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolTable: SymbolTable
): {
  newRegisters: RegisterState;
  newMemory: MemoryState;
  microSteps: MicroStep[];
} {
  const microSteps: MicroStep[] = [];
  let currentRegisters = { ...registers };
  let currentMemory = memory;

  // === FETCH PHASE ===
  microSteps.push({
    id: generateStepId(),
    phase: 'fetch',
    description: `Fetch instruction at PC = ${toHex(currentRegisters.PC)}`,
    pseudoRTN: `IR ← M[PC], PC ← PC + ${WORD_SIZE}`,
    registerChanges: {
      PC: { old: currentRegisters.PC, new: currentRegisters.PC + WORD_SIZE },
    },
    memoryChanges: {},
    highlightedRegisters: ['PC'],
    highlightedAddresses: [currentRegisters.PC],
    dataFlow: [
      { from: { type: 'pc', id: 'PC' }, to: { type: 'memory', id: currentRegisters.PC } },
    ],
  });

  // Advance PC
  currentRegisters = setRegister(currentRegisters, 'PC', currentRegisters.PC + WORD_SIZE);

  // === DECODE PHASE ===
  microSteps.push({
    id: generateStepId(),
    phase: 'decode',
    description: `Decode: ${instruction.opcode} with ${instruction.operands.length} operand(s)`,
    pseudoRTN: `Opcode = ${instruction.opcode}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [],
    highlightedAddresses: [],
  });

  // Create symbol table map for EA evaluation
  const symbolMap = new Map<string, number>();
  for (const [k, v] of symbolTable.labels) symbolMap.set(k, v);
  for (const [k, v] of symbolTable.variables) symbolMap.set(k, v);

  // Execute based on opcode
  switch (instruction.opcode) {
    case Opcode.MOVE:
      return executeMOVE(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.ADD:
      return executeADD(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.SUB:
      return executeSUB(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.MUL:
      return executeMUL(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.DIV:
      return executeDIV(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.CMP:
      return executeCMP(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.AND:
      return executeAND(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.OR:
      return executeOR(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.NOT:
      return executeNOT(instruction, currentRegisters, currentMemory, microSteps);

    case Opcode.PUSH:
      return executePUSH(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.POP:
      return executePOP(instruction, currentRegisters, currentMemory, microSteps);

    case Opcode.CALL:
      return executeCALL(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.RETURN:
      return executeRETURN(currentRegisters, currentMemory, microSteps);

    case Opcode.CLEAR:
      return executeCLEAR(instruction, currentRegisters, currentMemory, microSteps);

    case Opcode.INCREMENT:
      return executeINCREMENT(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.DECREMENT:
      return executeDECREMENT(instruction, currentRegisters, currentMemory, symbolMap, microSteps);

    case Opcode.BRANCH:
      return executeBRANCH(instruction, currentRegisters, currentMemory, symbolMap, microSteps, () => true);

    case Opcode.BRANCH_GT:
      return executeBRANCH(instruction, currentRegisters, currentMemory, symbolMap, microSteps, 
        (r) => !r.Z && !r.N);

    case Opcode.BRANCH_EQ:
      return executeBRANCH(instruction, currentRegisters, currentMemory, symbolMap, microSteps,
        (r) => r.Z);

    case Opcode.BRANCH_NE:
      return executeBRANCH(instruction, currentRegisters, currentMemory, symbolMap, microSteps,
        (r) => !r.Z);

    case Opcode.BRANCH_GE:
      return executeBRANCH(instruction, currentRegisters, currentMemory, symbolMap, microSteps,
        (r) => !r.N || r.Z);

    case Opcode.BRANCH_LT:
      return executeBRANCH(instruction, currentRegisters, currentMemory, symbolMap, microSteps,
        (r) => r.N && !r.Z);

    case Opcode.BRANCH_LE:
      return executeBRANCH(instruction, currentRegisters, currentMemory, symbolMap, microSteps,
        (r) => r.N || r.Z);

    case Opcode.HALT:
      microSteps.push({
        id: generateStepId(),
        phase: 'execute',
        description: 'HALT - Execution stopped',
        pseudoRTN: 'Halt execution',
        registerChanges: {},
        memoryChanges: {},
        highlightedRegisters: [],
        highlightedAddresses: [],
      });
      return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };

    case Opcode.NOP:
      microSteps.push({
        id: generateStepId(),
        phase: 'execute',
        description: 'NOP - No operation',
        pseudoRTN: 'No operation',
        registerChanges: {},
        memoryChanges: {},
        highlightedRegisters: [],
        highlightedAddresses: [],
      });
      return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };

    default:
      throw new Error(`Unimplemented opcode: ${instruction.opcode}`);
  }
}

/**
 * Execute MOVE instruction
 */
function executeMOVE(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  let currentMemory = memory;

  // Evaluate source
  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  
  // EA computation step
  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Compute source EA: ${srcResult.expression}`,
    pseudoRTN: srcResult.substitution,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: src.register ? [src.register] : [],
    highlightedAddresses: srcResult.ea !== null ? [srcResult.ea] : [],
    eaExpression: srcResult.expression,
    eaValue: srcResult.ea ?? undefined,
  });

  // Handle autoincrement/autodecrement for source
  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  // Operand fetch step
  microSteps.push({
    id: generateStepId(),
    phase: 'operand_fetch',
    description: `Fetch source operand: ${srcResult.value} (${toHex(srcResult.value)})`,
    pseudoRTN: srcResult.ea !== null 
      ? `Source = M[${toHex(srcResult.ea)}] = ${srcResult.value}`
      : `Source = ${srcResult.value}`,
    registerChanges: srcResult.postUpdate ? {
      [srcResult.postUpdate.register]: {
        old: srcResult.postUpdate.oldValue,
        new: srcResult.postUpdate.newValue,
      },
    } : {},
    memoryChanges: {},
    highlightedRegisters: src.register ? [src.register] : [],
    highlightedAddresses: srcResult.ea !== null ? [srcResult.ea] : [],
  });

  // Write to destination
  if (dst.type === AddressingMode.REGISTER) {
    const oldValue = getRegister(currentRegisters, dst.register!);
    currentRegisters = setRegister(currentRegisters, dst.register!, srcResult.value);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write ${srcResult.value} to ${dst.register}`,
      pseudoRTN: `${dst.register} ← ${srcResult.value} (was ${oldValue})`,
      registerChanges: {
        [dst.register!]: { old: oldValue, new: srcResult.value },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
      dataFlow: [
        { from: { type: srcResult.ea !== null ? 'memory' : 'register', id: srcResult.ea ?? src.register! }, 
          to: { type: 'register', id: dst.register! } },
      ],
    });
  } else {
    // Destination is memory
    const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
    if (dstResult.ea === null) throw new Error('Destination must be memory or register');
    
    const oldValue = readMemory(currentMemory, dstResult.ea);
    currentMemory = writeMemory(currentMemory, dstResult.ea, srcResult.value);
    
    // Handle autoincrement/autodecrement for destination
    if (dstResult.postUpdate) {
      currentRegisters = setRegister(currentRegisters, dstResult.postUpdate.register, dstResult.postUpdate.newValue);
    }

    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write ${srcResult.value} to M[${toHex(dstResult.ea)}]`,
      pseudoRTN: `M[${toHex(dstResult.ea)}] ← ${srcResult.value} (was ${oldValue})`,
      registerChanges: dstResult.postUpdate ? {
        [dstResult.postUpdate.register]: {
          old: dstResult.postUpdate.oldValue,
          new: dstResult.postUpdate.newValue,
        },
      } : {},
      memoryChanges: {
        [dstResult.ea]: { old: oldValue, new: srcResult.value },
      },
      highlightedRegisters: dst.register ? [dst.register] : [],
      highlightedAddresses: [dstResult.ea],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute ADD instruction
 */
function executeADD(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  let currentMemory = memory;

  // Evaluate source
  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  
  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Compute source EA: ${srcResult.expression}`,
    pseudoRTN: srcResult.substitution,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: src.register ? [src.register] : [],
    highlightedAddresses: srcResult.ea !== null ? [srcResult.ea] : [],
    eaExpression: srcResult.expression,
    eaValue: srcResult.ea ?? undefined,
  });

  // Handle autoincrement/autodecrement
  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'operand_fetch',
      description: `Auto-update: ${srcResult.postUpdate.register} = ${toHex(srcResult.postUpdate.newValue)}`,
      pseudoRTN: `${srcResult.postUpdate.register} ← ${toHex(srcResult.postUpdate.newValue)}`,
      registerChanges: {
        [srcResult.postUpdate.register]: {
          old: srcResult.postUpdate.oldValue,
          new: srcResult.postUpdate.newValue,
        },
      },
      memoryChanges: {},
      highlightedRegisters: [srcResult.postUpdate.register],
      highlightedAddresses: [],
    });
  }

  // Get destination value
  const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
  const dstValue = dstResult.value;

  // Execute addition
  const result = (dstValue + srcResult.value) >>> 0;

  microSteps.push({
    id: generateStepId(),
    phase: 'execute',
    description: `ALU: ${dstValue} + ${srcResult.value} = ${result}`,
    pseudoRTN: `${toHex(dstValue)} + ${toHex(srcResult.value)} = ${toHex(result)}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [],
    highlightedAddresses: [],
    dataFlow: [
      { from: { type: 'register', id: dst.register! }, to: { type: 'alu', id: 'ALU' } },
      { from: { type: srcResult.ea !== null ? 'memory' : 'register', id: srcResult.ea ?? src.register! }, to: { type: 'alu', id: 'ALU' } },
    ],
  });

  // Writeback
  if (dst.type === AddressingMode.REGISTER) {
    currentRegisters = setRegister(currentRegisters, dst.register!, result);
    currentRegisters = updateFlags(currentRegisters, result, dstValue, srcResult.value, false);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write result ${result} to ${dst.register}`,
      pseudoRTN: `${dst.register} ← ${result} (${toHex(result)})`,
      registerChanges: {
        [dst.register!]: { old: dstValue, new: result },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute SUB instruction
 */
function executeSUB(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  const currentMemory = memory;

  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
  
  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Compute source: ${srcResult.expression}`,
    pseudoRTN: srcResult.substitution,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: src.register ? [src.register] : [],
    highlightedAddresses: srcResult.ea !== null ? [srcResult.ea] : [],
    eaExpression: srcResult.expression,
    eaValue: srcResult.ea ?? undefined,
  });

  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  const result = (dstResult.value - srcResult.value) >>> 0;

  microSteps.push({
    id: generateStepId(),
    phase: 'execute',
    description: `ALU: ${dstResult.value} - ${srcResult.value} = ${result}`,
    pseudoRTN: `${toHex(dstResult.value)} - ${toHex(srcResult.value)} = ${toHex(result)}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [],
    highlightedAddresses: [],
  });

  if (dst.type === AddressingMode.REGISTER) {
    currentRegisters = setRegister(currentRegisters, dst.register!, result);
    currentRegisters = updateFlags(currentRegisters, result, dstResult.value, srcResult.value, true);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write result ${result} to ${dst.register}`,
      pseudoRTN: `${dst.register} ← ${result}`,
      registerChanges: {
        [dst.register!]: { old: dstResult.value, new: result },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute MUL instruction
 */
function executeMUL(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  const currentMemory = memory;

  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
  
  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Compute source: ${srcResult.expression}`,
    pseudoRTN: srcResult.substitution,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: src.register ? [src.register] : [],
    highlightedAddresses: srcResult.ea !== null ? [srcResult.ea] : [],
    eaExpression: srcResult.expression,
    eaValue: srcResult.ea ?? undefined,
  });

  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  // Use BigInt for proper 32-bit multiplication then truncate
  const result = (Math.imul(dstResult.value, srcResult.value)) >>> 0;

  microSteps.push({
    id: generateStepId(),
    phase: 'execute',
    description: `ALU: ${dstResult.value} × ${srcResult.value} = ${result}`,
    pseudoRTN: `${toHex(dstResult.value)} × ${toHex(srcResult.value)} = ${toHex(result)}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [],
    highlightedAddresses: [],
  });

  if (dst.type === AddressingMode.REGISTER) {
    currentRegisters = setRegister(currentRegisters, dst.register!, result);
    currentRegisters = updateFlags(currentRegisters, result);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write result ${result} to ${dst.register}`,
      pseudoRTN: `${dst.register} ← ${result}`,
      registerChanges: {
        [dst.register!]: { old: dstResult.value, new: result },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute DIV instruction
 */
function executeDIV(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  const currentMemory = memory;

  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
  
  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Compute source: ${srcResult.expression}`,
    pseudoRTN: srcResult.substitution,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: src.register ? [src.register] : [],
    highlightedAddresses: srcResult.ea !== null ? [srcResult.ea] : [],
    eaExpression: srcResult.expression,
    eaValue: srcResult.ea ?? undefined,
  });

  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  // Handle division by zero
  let result: number;
  if (srcResult.value === 0) {
    result = 0xFFFFFFFF; // Return max value on divide by zero
    microSteps.push({
      id: generateStepId(),
      phase: 'execute',
      description: `Division by zero! Result set to max value`,
      pseudoRTN: `${toHex(dstResult.value)} ÷ 0 = ERROR (0xFFFFFFFF)`,
      registerChanges: {},
      memoryChanges: {},
      highlightedRegisters: [],
      highlightedAddresses: [],
    });
  } else {
    // Signed division
    result = ((dstResult.value | 0) / (srcResult.value | 0)) | 0;
    result = result >>> 0; // Convert back to unsigned
    
    microSteps.push({
      id: generateStepId(),
      phase: 'execute',
      description: `ALU: ${dstResult.value} ÷ ${srcResult.value} = ${result}`,
      pseudoRTN: `${toHex(dstResult.value)} ÷ ${toHex(srcResult.value)} = ${toHex(result)}`,
      registerChanges: {},
      memoryChanges: {},
      highlightedRegisters: [],
      highlightedAddresses: [],
    });
  }

  if (dst.type === AddressingMode.REGISTER) {
    currentRegisters = setRegister(currentRegisters, dst.register!, result);
    currentRegisters = updateFlags(currentRegisters, result);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write result ${result} to ${dst.register}`,
      pseudoRTN: `${dst.register} ← ${result}`,
      registerChanges: {
        [dst.register!]: { old: dstResult.value, new: result },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute CMP instruction - Compare without storing result
 */
function executeCMP(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  const currentMemory = memory;

  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
  
  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Compute operands for comparison`,
    pseudoRTN: `Compare ${dstResult.value} with ${srcResult.value}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [src.register, dst.register].filter(Boolean) as string[],
    highlightedAddresses: [],
  });

  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  // Compute dst - src for flag setting (don't store result)
  const result = (dstResult.value - srcResult.value) >>> 0;
  currentRegisters = updateFlags(currentRegisters, result, dstResult.value, srcResult.value, true);

  microSteps.push({
    id: generateStepId(),
    phase: 'execute',
    description: `Compare: ${dstResult.value} - ${srcResult.value} → Flags: Z=${currentRegisters.Z ? 1 : 0}, N=${currentRegisters.N ? 1 : 0}`,
    pseudoRTN: `Flags set: Z=${currentRegisters.Z ? 1 : 0} (equal), N=${currentRegisters.N ? 1 : 0} (less than)`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [],
    highlightedAddresses: [],
  });

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute AND instruction
 */
function executeAND(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  const currentMemory = memory;

  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
  
  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  const result = (dstResult.value & srcResult.value) >>> 0;

  microSteps.push({
    id: generateStepId(),
    phase: 'execute',
    description: `ALU: ${toHex(dstResult.value)} AND ${toHex(srcResult.value)} = ${toHex(result)}`,
    pseudoRTN: `${toHex(dstResult.value)} & ${toHex(srcResult.value)} = ${toHex(result)}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [],
    highlightedAddresses: [],
  });

  if (dst.type === AddressingMode.REGISTER) {
    currentRegisters = setRegister(currentRegisters, dst.register!, result);
    currentRegisters = updateFlags(currentRegisters, result);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write result to ${dst.register}`,
      pseudoRTN: `${dst.register} ← ${toHex(result)}`,
      registerChanges: {
        [dst.register!]: { old: dstResult.value, new: result },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute OR instruction
 */
function executeOR(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src, dst] = instruction.operands;
  let currentRegisters = registers;
  const currentMemory = memory;

  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  const dstResult = evaluateAddress(dst, currentRegisters, currentMemory, symbolMap);
  
  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  const result = (dstResult.value | srcResult.value) >>> 0;

  microSteps.push({
    id: generateStepId(),
    phase: 'execute',
    description: `ALU: ${toHex(dstResult.value)} OR ${toHex(srcResult.value)} = ${toHex(result)}`,
    pseudoRTN: `${toHex(dstResult.value)} | ${toHex(srcResult.value)} = ${toHex(result)}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: [],
    highlightedAddresses: [],
  });

  if (dst.type === AddressingMode.REGISTER) {
    currentRegisters = setRegister(currentRegisters, dst.register!, result);
    currentRegisters = updateFlags(currentRegisters, result);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Write result to ${dst.register}`,
      pseudoRTN: `${dst.register} ← ${toHex(result)}`,
      registerChanges: {
        [dst.register!]: { old: dstResult.value, new: result },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute NOT instruction
 */
function executeNOT(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [dst] = instruction.operands;
  let currentRegisters = registers;

  if (dst.type === AddressingMode.REGISTER) {
    const oldValue = getRegister(currentRegisters, dst.register!);
    const result = (~oldValue) >>> 0;
    
    currentRegisters = setRegister(currentRegisters, dst.register!, result);
    currentRegisters = updateFlags(currentRegisters, result);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'execute',
      description: `NOT ${dst.register}: ${toHex(oldValue)} → ${toHex(result)}`,
      pseudoRTN: `${dst.register} ← NOT ${toHex(oldValue)} = ${toHex(result)}`,
      registerChanges: {
        [dst.register!]: { old: oldValue, new: result },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: memory, microSteps };
}

/**
 * Execute PUSH instruction - Push value onto stack
 */
function executePUSH(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [src] = instruction.operands;
  let currentRegisters = registers;
  let currentMemory = memory;

  // Get source value
  const srcResult = evaluateAddress(src, currentRegisters, currentMemory, symbolMap);
  
  if (srcResult.postUpdate) {
    currentRegisters = setRegister(currentRegisters, srcResult.postUpdate.register, srcResult.postUpdate.newValue);
  }

  // Decrement SP first (stack grows downward)
  const oldSP = currentRegisters.SP;
  const newSP = (oldSP - WORD_SIZE) >>> 0;
  currentRegisters = setRegister(currentRegisters, 'SP', newSP);

  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Decrement SP: ${toHex(oldSP)} → ${toHex(newSP)}`,
    pseudoRTN: `SP ← SP - ${WORD_SIZE} = ${toHex(newSP)}`,
    registerChanges: {
      SP: { old: oldSP, new: newSP },
    },
    memoryChanges: {},
    highlightedRegisters: ['SP'],
    highlightedAddresses: [],
  });

  // Write value to stack
  const oldMemValue = readMemory(currentMemory, newSP);
  currentMemory = writeMemory(currentMemory, newSP, srcResult.value);
  // Mark as stack segment
  const cell = currentMemory.cells.get(newSP);
  if (cell) {
    currentMemory.cells.set(newSP, { ...cell, segment: 'stack' });
  }

  microSteps.push({
    id: generateStepId(),
    phase: 'writeback',
    description: `Push ${srcResult.value} onto stack at ${toHex(newSP)}`,
    pseudoRTN: `M[SP] ← ${srcResult.value}`,
    registerChanges: {},
    memoryChanges: {
      [newSP]: { old: oldMemValue, new: srcResult.value },
    },
    highlightedRegisters: ['SP'],
    highlightedAddresses: [newSP],
  });

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute POP instruction - Pop value from stack
 */
function executePOP(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [dst] = instruction.operands;
  let currentRegisters = registers;
  const currentMemory = memory;

  // Read value from stack
  const sp = currentRegisters.SP;
  const value = readMemory(currentMemory, sp);

  microSteps.push({
    id: generateStepId(),
    phase: 'operand_fetch',
    description: `Read ${value} from stack at ${toHex(sp)}`,
    pseudoRTN: `Value = M[SP] = ${value}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: ['SP'],
    highlightedAddresses: [sp],
  });

  // Increment SP (stack grows downward, so pop = increment)
  const newSP = (sp + WORD_SIZE) >>> 0;
  currentRegisters = setRegister(currentRegisters, 'SP', newSP);

  // Write to destination
  if (dst.type === AddressingMode.REGISTER) {
    const oldValue = getRegister(currentRegisters, dst.register!);
    currentRegisters = setRegister(currentRegisters, dst.register!, value);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Pop ${value} to ${dst.register}, SP → ${toHex(newSP)}`,
      pseudoRTN: `${dst.register} ← ${value}, SP ← SP + ${WORD_SIZE}`,
      registerChanges: {
        [dst.register!]: { old: oldValue, new: value },
        SP: { old: sp, new: newSP },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!, 'SP'],
      highlightedAddresses: [sp],
    });
  }

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute CALL instruction - Call subroutine
 */
function executeCALL(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [target] = instruction.operands;
  let currentRegisters = registers;
  let currentMemory = memory;

  // Determine target address
  let targetAddress: number;
  if (target.type === AddressingMode.DIRECT && target.label) {
    targetAddress = symbolMap.get(target.label) ?? 0;
  } else if (target.immediate !== undefined) {
    targetAddress = target.immediate;
  } else {
    const result = evaluateAddress(target, currentRegisters, currentMemory, symbolMap);
    targetAddress = result.ea ?? result.value;
  }

  // Push return address (current PC) onto stack
  const returnAddress = currentRegisters.PC;
  const oldSP = currentRegisters.SP;
  const newSP = (oldSP - WORD_SIZE) >>> 0;
  currentRegisters = setRegister(currentRegisters, 'SP', newSP);

  microSteps.push({
    id: generateStepId(),
    phase: 'ea_compute',
    description: `Save return address ${toHex(returnAddress)} to stack`,
    pseudoRTN: `SP ← SP - ${WORD_SIZE}, M[SP] ← PC`,
    registerChanges: {
      SP: { old: oldSP, new: newSP },
    },
    memoryChanges: {},
    highlightedRegisters: ['SP', 'PC'],
    highlightedAddresses: [],
  });

  // Write return address to stack
  const oldMemValue = readMemory(currentMemory, newSP);
  currentMemory = writeMemory(currentMemory, newSP, returnAddress);
  const cell = currentMemory.cells.get(newSP);
  if (cell) {
    currentMemory.cells.set(newSP, { ...cell, segment: 'stack', label: 'return addr' });
  }

  // Jump to target
  const oldPC = currentRegisters.PC;
  currentRegisters = setRegister(currentRegisters, 'PC', targetAddress);

  microSteps.push({
    id: generateStepId(),
    phase: 'writeback',
    description: `Call subroutine at ${toHex(targetAddress)}`,
    pseudoRTN: `PC ← ${toHex(targetAddress)}`,
    registerChanges: {
      PC: { old: oldPC, new: targetAddress },
    },
    memoryChanges: {
      [newSP]: { old: oldMemValue, new: returnAddress },
    },
    highlightedRegisters: ['PC'],
    highlightedAddresses: [targetAddress, newSP],
  });

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute RETURN instruction - Return from subroutine
 */
function executeRETURN(
  registers: RegisterState,
  memory: MemoryState,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  let currentRegisters = registers;
  const currentMemory = memory;

  // Pop return address from stack
  const sp = currentRegisters.SP;
  const returnAddress = readMemory(currentMemory, sp);

  microSteps.push({
    id: generateStepId(),
    phase: 'operand_fetch',
    description: `Read return address ${toHex(returnAddress)} from stack`,
    pseudoRTN: `Return address = M[SP] = ${toHex(returnAddress)}`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: ['SP'],
    highlightedAddresses: [sp],
  });

  // Increment SP
  const newSP = (sp + WORD_SIZE) >>> 0;
  currentRegisters = setRegister(currentRegisters, 'SP', newSP);

  // Jump to return address
  const oldPC = currentRegisters.PC;
  currentRegisters = setRegister(currentRegisters, 'PC', returnAddress);

  microSteps.push({
    id: generateStepId(),
    phase: 'writeback',
    description: `Return to ${toHex(returnAddress)}`,
    pseudoRTN: `PC ← ${toHex(returnAddress)}, SP ← SP + ${WORD_SIZE}`,
    registerChanges: {
      PC: { old: oldPC, new: returnAddress },
      SP: { old: sp, new: newSP },
    },
    memoryChanges: {},
    highlightedRegisters: ['PC', 'SP'],
    highlightedAddresses: [returnAddress],
  });

  return { newRegisters: currentRegisters, newMemory: currentMemory, microSteps };
}

/**
 * Execute CLEAR instruction
 */
function executeCLEAR(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [dst] = instruction.operands;
  let currentRegisters = registers;

  if (dst.type === AddressingMode.REGISTER) {
    const oldValue = getRegister(currentRegisters, dst.register!);
    currentRegisters = setRegister(currentRegisters, dst.register!, 0);
    currentRegisters = updateFlags(currentRegisters, 0);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'execute',
      description: `Clear ${dst.register} to 0`,
      pseudoRTN: `${dst.register} ← 0 (was ${oldValue})`,
      registerChanges: {
        [dst.register!]: { old: oldValue, new: 0 },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: memory, microSteps };
}

/**
 * Execute INCREMENT instruction
 */
function executeINCREMENT(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [dst] = instruction.operands;
  let currentRegisters = registers;

  if (dst.type === AddressingMode.REGISTER) {
    const oldValue = getRegister(currentRegisters, dst.register!);
    const newValue = (oldValue + 1) >>> 0;
    currentRegisters = setRegister(currentRegisters, dst.register!, newValue);
    currentRegisters = updateFlags(currentRegisters, newValue);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'execute',
      description: `Increment ${dst.register}: ${oldValue} → ${newValue}`,
      pseudoRTN: `${dst.register} ← ${dst.register} + 1 = ${newValue}`,
      registerChanges: {
        [dst.register!]: { old: oldValue, new: newValue },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: memory, microSteps };
}

/**
 * Execute DECREMENT instruction
 */
function executeDECREMENT(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[]
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [dst] = instruction.operands;
  let currentRegisters = registers;

  if (dst.type === AddressingMode.REGISTER) {
    const oldValue = getRegister(currentRegisters, dst.register!);
    const newValue = (oldValue - 1) >>> 0;
    currentRegisters = setRegister(currentRegisters, dst.register!, newValue);
    currentRegisters = updateFlags(currentRegisters, newValue);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'execute',
      description: `Decrement ${dst.register}: ${oldValue} → ${newValue}`,
      pseudoRTN: `${dst.register} ← ${dst.register} - 1 = ${newValue}`,
      registerChanges: {
        [dst.register!]: { old: oldValue, new: newValue },
      },
      memoryChanges: {},
      highlightedRegisters: [dst.register!],
      highlightedAddresses: [],
    });
  }

  return { newRegisters: currentRegisters, newMemory: memory, microSteps };
}

/**
 * Execute BRANCH instruction
 */
function executeBRANCH(
  instruction: Instruction,
  registers: RegisterState,
  memory: MemoryState,
  symbolMap: Map<string, number>,
  microSteps: MicroStep[],
  condition: (r: RegisterState) => boolean
): { newRegisters: RegisterState; newMemory: MemoryState; microSteps: MicroStep[] } {
  const [target] = instruction.operands;
  let currentRegisters = registers;

  // Evaluate target address
  let targetAddress: number;
  if (target.type === AddressingMode.DIRECT && target.label) {
    targetAddress = symbolMap.get(target.label) ?? 0;
  } else if (target.type === AddressingMode.RELATIVE) {
    targetAddress = (currentRegisters.PC + (target.offset ?? 0)) >>> 0;
  } else if (target.immediate !== undefined) {
    targetAddress = target.immediate;
  } else {
    const result = evaluateAddress(target, currentRegisters, memory, symbolMap);
    targetAddress = result.ea ?? result.value;
  }

  const conditionMet = condition(currentRegisters);
  const oldPC = currentRegisters.PC;

  microSteps.push({
    id: generateStepId(),
    phase: 'execute',
    description: `Branch condition: ${conditionMet ? 'TRUE' : 'FALSE'}`,
    pseudoRTN: conditionMet 
      ? `Condition met, PC ← ${toHex(targetAddress)}`
      : `Condition not met, continue to next instruction`,
    registerChanges: {},
    memoryChanges: {},
    highlightedRegisters: ['PC'],
    highlightedAddresses: [targetAddress],
  });

  if (conditionMet) {
    currentRegisters = setRegister(currentRegisters, 'PC', targetAddress);
    
    microSteps.push({
      id: generateStepId(),
      phase: 'writeback',
      description: `Jump to ${toHex(targetAddress)}`,
      pseudoRTN: `PC ← ${toHex(targetAddress)} (was ${toHex(oldPC)})`,
      registerChanges: {
        PC: { old: oldPC, new: targetAddress },
      },
      memoryChanges: {},
      highlightedRegisters: ['PC'],
      highlightedAddresses: [targetAddress],
    });
  }

  return { newRegisters: currentRegisters, newMemory: memory, microSteps };
}

/**
 * Create execution snapshot for history
 */
export function createSnapshot(
  registers: RegisterState,
  memory: MemoryState,
  instructionIndex: number,
  microStepIndex: number
): ExecutionSnapshot {
  const memoryChanges = new Map<number, number>();
  for (const [addr, cell] of memory.cells) {
    memoryChanges.set(addr, cell.value);
  }

  return {
    registers: { ...registers },
    memory: memoryChanges,
    instructionIndex,
    microStepIndex,
    timestamp: Date.now(),
  };
}
