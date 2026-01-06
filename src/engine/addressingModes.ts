// Addressing Mode Evaluator - Pure functions for computing effective addresses

import {
  AddressingMode,
  Operand,
  RegisterState,
  MemoryState,
  EAResult,
} from '@/types';

const WORD_SIZE = 4; // 32-bit words

/**
 * Get a register value by name
 */
function getRegister(registers: RegisterState, name: string): number {
  const regName = name.toUpperCase();
  if (regName in registers) {
    return registers[regName as keyof RegisterState] as number;
  }
  throw new Error(`Unknown register: ${name}`);
}

/**
 * Read a value from memory
 */
function readMemory(memory: MemoryState, address: number): number {
  const cell = memory.cells.get(address);
  return cell?.value ?? 0;
}

/**
 * Format a number as hex
 */
function toHex(value: number, prefix = true): string {
  const hex = (value >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return prefix ? `0x${hex}` : hex;
}

/**
 * Evaluate the effective address for an operand
 */
export function evaluateAddress(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState,
  symbolTable: Map<string, number>
): EAResult {
  switch (operand.type) {
    case AddressingMode.IMMEDIATE:
      return evaluateImmediate(operand);

    case AddressingMode.REGISTER:
      return evaluateRegister(operand, registers);

    case AddressingMode.DIRECT:
      return evaluateDirect(operand, memory, symbolTable);

    case AddressingMode.INDIRECT_REGISTER:
      return evaluateIndirectRegister(operand, registers, memory);

    case AddressingMode.INDIRECT_MEMORY:
      return evaluateIndirectMemory(operand, memory, symbolTable);

    case AddressingMode.INDEXED:
      return evaluateIndexed(operand, registers, memory);

    case AddressingMode.BASE_INDEX:
      return evaluateBaseIndex(operand, registers, memory);

    case AddressingMode.BASE_INDEX_OFFSET:
      return evaluateBaseIndexOffset(operand, registers, memory);

    case AddressingMode.RELATIVE:
      return evaluateRelative(operand, registers, memory);

    case AddressingMode.AUTOINCREMENT:
      return evaluateAutoincrement(operand, registers, memory);

    case AddressingMode.AUTODECREMENT:
      return evaluateAutodecrement(operand, registers, memory);

    case AddressingMode.IMPLIED:
      return {
        ea: null,
        value: 0,
        mode: AddressingMode.IMPLIED,
        expression: 'Implied',
        substitution: 'No operand',
        steps: ['Implied addressing - no operand needed'],
      };

    default:
      throw new Error(`Unknown addressing mode: ${operand.type}`);
  }
}

/**
 * IMMEDIATE: #value
 * Operand is the constant value itself, encoded in the instruction
 */
function evaluateImmediate(operand: Operand): EAResult {
  const value = operand.immediate ?? 0;
  return {
    ea: null,
    value,
    mode: AddressingMode.IMMEDIATE,
    expression: `#${value}`,
    substitution: `Value = ${value} (${toHex(value)})`,
    steps: [
      `Immediate addressing mode`,
      `Operand value ${value} is encoded directly in the instruction`,
      `No memory access required`,
    ],
  };
}

/**
 * REGISTER: Ri
 * Operand is in the specified register
 */
function evaluateRegister(operand: Operand, registers: RegisterState): EAResult {
  const regName = operand.register!;
  const value = getRegister(registers, regName);
  return {
    ea: null,
    value,
    mode: AddressingMode.REGISTER,
    expression: regName,
    substitution: `${regName} = ${value} (${toHex(value)})`,
    steps: [
      `Register addressing mode`,
      `Read ${regName} = ${value} (${toHex(value)})`,
      `No memory access required - operand is in register`,
    ],
  };
}

/**
 * DIRECT: LOC
 * EA = address of LOC, operand = M[EA]
 */
function evaluateDirect(
  operand: Operand,
  memory: MemoryState,
  symbolTable: Map<string, number>
): EAResult {
  const label = operand.label!;
  const ea = symbolTable.get(label);
  if (ea === undefined) {
    throw new Error(`Unknown label: ${label}`);
  }
  const value = readMemory(memory, ea);
  return {
    ea,
    value,
    mode: AddressingMode.DIRECT,
    expression: `EA = ${label}`,
    substitution: `EA = ${label} = ${toHex(ea)}, M[${toHex(ea)}] = ${value}`,
    steps: [
      `Direct (Absolute) addressing mode`,
      `EA = address of ${label} = ${toHex(ea)}`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
    ],
  };
}

/**
 * INDIRECT_REGISTER: (Ri)
 * EA = [Ri], operand = M[EA]
 */
function evaluateIndirectRegister(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState
): EAResult {
  const regName = operand.register!;
  const ea = getRegister(registers, regName);
  const value = readMemory(memory, ea);
  return {
    ea,
    value,
    mode: AddressingMode.INDIRECT_REGISTER,
    expression: `EA = [${regName}]`,
    substitution: `EA = [${regName}] = ${toHex(ea)}, M[${toHex(ea)}] = ${value}`,
    steps: [
      `Indirect (Register) addressing mode`,
      `Read ${regName} = ${toHex(ea)}`,
      `EA = ${toHex(ea)} (pointer in ${regName})`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
    ],
  };
}

/**
 * INDIRECT_MEMORY: (LOC)
 * EA = M[LOC], operand = M[EA] (two-level indirection)
 */
function evaluateIndirectMemory(
  operand: Operand,
  memory: MemoryState,
  symbolTable: Map<string, number>
): EAResult {
  const label = operand.label!;
  const locAddress = symbolTable.get(label);
  if (locAddress === undefined) {
    throw new Error(`Unknown label: ${label}`);
  }
  const ea = readMemory(memory, locAddress);
  const value = readMemory(memory, ea);
  return {
    ea,
    value,
    mode: AddressingMode.INDIRECT_MEMORY,
    expression: `EA = M[${label}]`,
    substitution: `EA = M[${label}] = M[${toHex(locAddress)}] = ${toHex(ea)}, M[${toHex(ea)}] = ${value}`,
    steps: [
      `Indirect (Memory) addressing mode`,
      `Address of ${label} = ${toHex(locAddress)}`,
      `Read pointer M[${toHex(locAddress)}] = ${toHex(ea)}`,
      `EA = ${toHex(ea)}`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
    ],
  };
}

/**
 * INDEXED: X(Ri)
 * EA = Ri + X, operand = M[EA]
 */
function evaluateIndexed(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState
): EAResult {
  const regName = operand.register!;
  const offset = operand.offset ?? 0;
  const regValue = getRegister(registers, regName);
  const ea = (regValue + offset) >>> 0; // Unsigned 32-bit
  const value = readMemory(memory, ea);
  return {
    ea,
    value,
    mode: AddressingMode.INDEXED,
    expression: `EA = ${regName} + ${offset}`,
    substitution: `EA = ${toHex(regValue)} + ${offset} = ${toHex(ea)}, M[${toHex(ea)}] = ${value}`,
    steps: [
      `Indexed addressing mode`,
      `Read ${regName} = ${toHex(regValue)}`,
      `Offset = ${offset} (${toHex(offset)})`,
      `EA = ${regName} + offset = ${toHex(regValue)} + ${offset} = ${toHex(ea)}`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
    ],
  };
}

/**
 * BASE_INDEX: (Ri, Rj)
 * EA = Ri + Rj, operand = M[EA]
 */
function evaluateBaseIndex(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState
): EAResult {
  const baseReg = operand.register!;
  const indexReg = operand.register2!;
  const baseValue = getRegister(registers, baseReg);
  const indexValue = getRegister(registers, indexReg);
  const ea = (baseValue + indexValue) >>> 0;
  const value = readMemory(memory, ea);
  return {
    ea,
    value,
    mode: AddressingMode.BASE_INDEX,
    expression: `EA = ${baseReg} + ${indexReg}`,
    substitution: `EA = ${toHex(baseValue)} + ${toHex(indexValue)} = ${toHex(ea)}, M[${toHex(ea)}] = ${value}`,
    steps: [
      `Base + Index addressing mode`,
      `Read base register ${baseReg} = ${toHex(baseValue)}`,
      `Read index register ${indexReg} = ${toHex(indexValue)}`,
      `EA = ${baseReg} + ${indexReg} = ${toHex(baseValue)} + ${toHex(indexValue)} = ${toHex(ea)}`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
    ],
  };
}

/**
 * BASE_INDEX_OFFSET: X(Ri, Rj)
 * EA = Ri + Rj + X, operand = M[EA]
 */
function evaluateBaseIndexOffset(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState
): EAResult {
  const baseReg = operand.register!;
  const indexReg = operand.register2!;
  const offset = operand.offset ?? 0;
  const baseValue = getRegister(registers, baseReg);
  const indexValue = getRegister(registers, indexReg);
  const ea = (baseValue + indexValue + offset) >>> 0;
  const value = readMemory(memory, ea);
  return {
    ea,
    value,
    mode: AddressingMode.BASE_INDEX_OFFSET,
    expression: `EA = ${baseReg} + ${indexReg} + ${offset}`,
    substitution: `EA = ${toHex(baseValue)} + ${toHex(indexValue)} + ${offset} = ${toHex(ea)}, M[${toHex(ea)}] = ${value}`,
    steps: [
      `Base + Index + Offset addressing mode`,
      `Read base register ${baseReg} = ${toHex(baseValue)}`,
      `Read index register ${indexReg} = ${toHex(indexValue)}`,
      `Offset = ${offset} (${toHex(offset)})`,
      `EA = ${baseReg} + ${indexReg} + offset = ${toHex(ea)}`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
    ],
  };
}

/**
 * RELATIVE: X(PC)
 * EA = PC + X (signed), used for branches
 */
function evaluateRelative(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState
): EAResult {
  const offset = operand.offset ?? 0;
  const pc = registers.PC;
  const ea = (pc + offset) >>> 0;
  const value = readMemory(memory, ea);
  
  const direction = offset >= 0 ? 'forward' : 'backward';
  return {
    ea,
    value,
    mode: AddressingMode.RELATIVE,
    expression: `EA = PC + ${offset}`,
    substitution: `EA = ${toHex(pc)} + ${offset} = ${toHex(ea)}`,
    steps: [
      `Relative (PC-relative) addressing mode`,
      `Current PC = ${toHex(pc)}`,
      `Signed offset = ${offset} (${direction})`,
      `EA = PC + offset = ${toHex(pc)} + ${offset} = ${toHex(ea)}`,
      `Target address = ${toHex(ea)}`,
    ],
  };
}

/**
 * AUTOINCREMENT: (Ri)+
 * EA = Ri, then Ri = Ri + size
 */
function evaluateAutoincrement(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState
): EAResult {
  const regName = operand.register!;
  const ea = getRegister(registers, regName);
  const value = readMemory(memory, ea);
  const newRegValue = (ea + WORD_SIZE) >>> 0;
  
  return {
    ea,
    value,
    mode: AddressingMode.AUTOINCREMENT,
    expression: `EA = [${regName}], then ${regName} += ${WORD_SIZE}`,
    substitution: `EA = ${toHex(ea)}, M[${toHex(ea)}] = ${value}, ${regName}: ${toHex(ea)} → ${toHex(newRegValue)}`,
    steps: [
      `Autoincrement addressing mode`,
      `Read ${regName} = ${toHex(ea)}`,
      `EA = ${toHex(ea)} (current pointer value)`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
      `Post-increment: ${regName} = ${toHex(ea)} + ${WORD_SIZE} = ${toHex(newRegValue)}`,
    ],
    postUpdate: {
      register: regName,
      oldValue: ea,
      newValue: newRegValue,
    },
  };
}

/**
 * AUTODECREMENT: -(Ri)
 * Ri = Ri - size, then EA = Ri
 */
function evaluateAutodecrement(
  operand: Operand,
  registers: RegisterState,
  memory: MemoryState
): EAResult {
  const regName = operand.register!;
  const oldRegValue = getRegister(registers, regName);
  const ea = (oldRegValue - WORD_SIZE) >>> 0;
  const value = readMemory(memory, ea);
  
  return {
    ea,
    value,
    mode: AddressingMode.AUTODECREMENT,
    expression: `${regName} -= ${WORD_SIZE}, then EA = [${regName}]`,
    substitution: `${regName}: ${toHex(oldRegValue)} → ${toHex(ea)}, EA = ${toHex(ea)}, M[${toHex(ea)}] = ${value}`,
    steps: [
      `Autodecrement addressing mode`,
      `Read ${regName} = ${toHex(oldRegValue)}`,
      `Pre-decrement: ${regName} = ${toHex(oldRegValue)} - ${WORD_SIZE} = ${toHex(ea)}`,
      `EA = ${toHex(ea)} (new pointer value)`,
      `Fetch operand from M[${toHex(ea)}] = ${value} (${toHex(value)})`,
    ],
    postUpdate: {
      register: regName,
      oldValue: oldRegValue,
      newValue: ea,
    },
  };
}

/**
 * Get human-readable description of an addressing mode
 */
export function getAddressingModeDescription(mode: AddressingMode): {
  name: string;
  syntax: string;
  formula: string;
  description: string;
  memoryAccesses: number;
  example: string;
} {
  const descriptions: Record<AddressingMode, ReturnType<typeof getAddressingModeDescription>> = {
    [AddressingMode.IMMEDIATE]: {
      name: 'Immediate',
      syntax: '#value',
      formula: 'Operand = value',
      description: 'The operand is a constant value encoded directly in the instruction. No memory access is required.',
      memoryAccesses: 0,
      example: 'ADD #5, R0  ; R0 = R0 + 5',
    },
    [AddressingMode.REGISTER]: {
      name: 'Register',
      syntax: 'Ri',
      formula: 'Operand = [Ri]',
      description: 'The operand is in a CPU register. Fastest mode - no memory access needed.',
      memoryAccesses: 0,
      example: 'ADD R1, R0  ; R0 = R0 + R1',
    },
    [AddressingMode.DIRECT]: {
      name: 'Direct (Absolute)',
      syntax: 'LOC',
      formula: 'EA = LOC, Operand = M[EA]',
      description: 'The effective address is the label/address specified in the instruction.',
      memoryAccesses: 1,
      example: 'MOVE NUM1, R0  ; R0 = M[NUM1]',
    },
    [AddressingMode.INDIRECT_REGISTER]: {
      name: 'Indirect (Register)',
      syntax: '(Ri)',
      formula: 'EA = [Ri], Operand = M[EA]',
      description: 'Register Ri contains a pointer (address). The operand is at that memory location.',
      memoryAccesses: 1,
      example: 'ADD (R2), R0  ; EA = R2, R0 = R0 + M[R2]',
    },
    [AddressingMode.INDIRECT_MEMORY]: {
      name: 'Indirect (Memory)',
      syntax: '(LOC)',
      formula: 'EA = M[LOC], Operand = M[EA]',
      description: 'Memory location LOC contains a pointer. Two-level indirection.',
      memoryAccesses: 2,
      example: 'ADD (PTR), R0  ; EA = M[PTR], R0 = R0 + M[EA]',
    },
    [AddressingMode.INDEXED]: {
      name: 'Indexed',
      syntax: 'X(Ri)',
      formula: 'EA = [Ri] + X, Operand = M[EA]',
      description: 'EA is computed by adding a constant offset X to register Ri. Useful for array access.',
      memoryAccesses: 1,
      example: 'ADD 4(R0), R1  ; EA = R0 + 4, R1 = R1 + M[EA]',
    },
    [AddressingMode.BASE_INDEX]: {
      name: 'Base + Index',
      syntax: '(Ri, Rj)',
      formula: 'EA = [Ri] + [Rj], Operand = M[EA]',
      description: 'EA is the sum of two registers - typically a base address and an index.',
      memoryAccesses: 1,
      example: 'ADD (R1, R2), R0  ; EA = R1 + R2',
    },
    [AddressingMode.BASE_INDEX_OFFSET]: {
      name: 'Base + Index + Offset',
      syntax: 'X(Ri, Rj)',
      formula: 'EA = [Ri] + [Rj] + X, Operand = M[EA]',
      description: 'EA is base + index + constant offset. Useful for 2D arrays or struct fields.',
      memoryAccesses: 1,
      example: 'ADD 8(R1, R2), R0  ; EA = R1 + R2 + 8',
    },
    [AddressingMode.RELATIVE]: {
      name: 'Relative (PC-Relative)',
      syntax: 'X(PC)',
      formula: 'EA = PC + X, Operand = M[EA]',
      description: 'EA is computed relative to the Program Counter. Used for position-independent code and branches.',
      memoryAccesses: 1,
      example: 'BRANCH LOOP  ; EA = PC + offset_to_LOOP',
    },
    [AddressingMode.AUTOINCREMENT]: {
      name: 'Autoincrement',
      syntax: '(Ri)+',
      formula: 'EA = [Ri], then Ri = Ri + size',
      description: 'Use Ri as pointer, then automatically increment it. Perfect for sequential array traversal.',
      memoryAccesses: 1,
      example: 'ADD (R2)+, R0  ; EA = R2, R0 = R0 + M[R2], R2 = R2 + 4',
    },
    [AddressingMode.AUTODECREMENT]: {
      name: 'Autodecrement',
      syntax: '-(Ri)',
      formula: 'Ri = Ri - size, then EA = [Ri]',
      description: 'Decrement Ri first, then use as pointer. Used for stack operations (push).',
      memoryAccesses: 1,
      example: 'MOVE R0, -(SP)  ; SP = SP - 4, M[SP] = R0 (push)',
    },
    [AddressingMode.IMPLIED]: {
      name: 'Implied',
      syntax: '(none)',
      formula: 'Operand is implicit',
      description: 'The operand is implied by the instruction itself. No explicit operand specified.',
      memoryAccesses: 0,
      example: 'RETURN  ; Pop return address from stack',
    },
  };

  return descriptions[mode];
}
