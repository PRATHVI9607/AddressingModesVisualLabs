// Assembly Parser - Parses assembly source code into structured instructions

import {
  AddressingMode,
  Operand,
  Opcode,
  Instruction,
  SymbolTable,
} from '@/types';

const INSTRUCTION_SIZE = 4; // 4 bytes per instruction

/**
 * Parse an operand string and determine its addressing mode
 */
function parseOperand(text: string, symbolTable: SymbolTable): Operand {
  const trimmed = text.trim();

  // Immediate: #value or #label
  if (trimmed.startsWith('#')) {
    const valueStr = trimmed.slice(1);
    const value = parseNumber(valueStr);
    if (!isNaN(value)) {
      return {
        type: AddressingMode.IMMEDIATE,
        immediate: value,
        rawText: trimmed,
      };
    }
    // Could be a label reference
    const labelAddr = symbolTable.labels.get(valueStr) ?? symbolTable.variables.get(valueStr);
    if (labelAddr !== undefined) {
      return {
        type: AddressingMode.IMMEDIATE,
        immediate: labelAddr,
        label: valueStr,
        rawText: trimmed,
      };
    }
    throw new Error(`Unknown immediate value or label: ${valueStr}`);
  }

  // Autoincrement: (Ri)+
  const autoincMatch = trimmed.match(/^\(([A-Za-z]+\d*)\)\+$/);
  if (autoincMatch) {
    return {
      type: AddressingMode.AUTOINCREMENT,
      register: autoincMatch[1].toUpperCase(),
      rawText: trimmed,
    };
  }

  // Autodecrement: -(Ri)
  const autodecMatch = trimmed.match(/^-\(([A-Za-z]+\d*)\)$/);
  if (autodecMatch) {
    return {
      type: AddressingMode.AUTODECREMENT,
      register: autodecMatch[1].toUpperCase(),
      rawText: trimmed,
    };
  }

  // Base + Index + Offset: X(Ri, Rj)
  const bioMatch = trimmed.match(/^(-?\d+)\(([A-Za-z]+\d*),\s*([A-Za-z]+\d*)\)$/);
  if (bioMatch) {
    return {
      type: AddressingMode.BASE_INDEX_OFFSET,
      offset: parseInt(bioMatch[1], 10),
      register: bioMatch[2].toUpperCase(),
      register2: bioMatch[3].toUpperCase(),
      rawText: trimmed,
    };
  }

  // Base + Index: (Ri, Rj)
  const biMatch = trimmed.match(/^\(([A-Za-z]+\d*),\s*([A-Za-z]+\d*)\)$/);
  if (biMatch) {
    return {
      type: AddressingMode.BASE_INDEX,
      register: biMatch[1].toUpperCase(),
      register2: biMatch[2].toUpperCase(),
      rawText: trimmed,
    };
  }

  // Indexed: X(Ri) or label(Ri)
  const indexedMatch = trimmed.match(/^(-?\w+)\(([A-Za-z]+\d*)\)$/);
  if (indexedMatch) {
    const offsetStr = indexedMatch[1];
    const regName = indexedMatch[2].toUpperCase();
    
    // Check if offset is a number
    const offsetNum = parseNumber(offsetStr);
    if (!isNaN(offsetNum)) {
      // Check if it's PC-relative
      if (regName === 'PC') {
        return {
          type: AddressingMode.RELATIVE,
          offset: offsetNum,
          register: 'PC',
          rawText: trimmed,
        };
      }
      return {
        type: AddressingMode.INDEXED,
        offset: offsetNum,
        register: regName,
        rawText: trimmed,
      };
    }
    
    // Offset is a label - resolve it
    const labelAddr = symbolTable.labels.get(offsetStr) ?? symbolTable.variables.get(offsetStr);
    if (labelAddr !== undefined) {
      return {
        type: AddressingMode.INDEXED,
        offset: labelAddr,
        label: offsetStr,
        register: regName,
        rawText: trimmed,
      };
    }
  }

  // Indirect via register: (Ri)
  const indirectRegMatch = trimmed.match(/^\(([A-Za-z]+\d*)\)$/);
  if (indirectRegMatch) {
    return {
      type: AddressingMode.INDIRECT_REGISTER,
      register: indirectRegMatch[1].toUpperCase(),
      rawText: trimmed,
    };
  }

  // Register: R0, R1, ..., PC, SP, FP
  const registerMatch = trimmed.match(/^([A-Za-z]+\d*)$/);
  if (registerMatch) {
    const name = registerMatch[1].toUpperCase();
    if (isRegister(name)) {
      return {
        type: AddressingMode.REGISTER,
        register: name,
        rawText: trimmed,
      };
    }
    
    // It's a label (direct addressing)
    const labelAddr = symbolTable.labels.get(trimmed) ?? symbolTable.variables.get(trimmed);
    if (labelAddr !== undefined) {
      return {
        type: AddressingMode.DIRECT,
        label: trimmed,
        rawText: trimmed,
      };
    }
  }

  // Direct addressing with a numeric address
  const numAddr = parseNumber(trimmed);
  if (!isNaN(numAddr)) {
    return {
      type: AddressingMode.DIRECT,
      immediate: numAddr,
      rawText: trimmed,
    };
  }

  throw new Error(`Cannot parse operand: ${trimmed}`);
}

/**
 * Check if a string is a valid register name
 */
function isRegister(name: string): boolean {
  const registers = [
    'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
    'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15',
    'PC', 'SP', 'FP', 'AC',
  ];
  return registers.includes(name.toUpperCase());
}

/**
 * Parse a number (decimal or hex)
 */
function parseNumber(str: string): number {
  const trimmed = str.trim();
  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
    return parseInt(trimmed, 16);
  }
  if (trimmed.endsWith('H') || trimmed.endsWith('h')) {
    return parseInt(trimmed.slice(0, -1), 16);
  }
  return parseInt(trimmed, 10);
}

/**
 * Parse opcode string to enum
 */
function parseOpcode(text: string): Opcode {
  const opcodeMap: Record<string, Opcode> = {
    'MOVE': Opcode.MOVE,
    'MOV': Opcode.MOVE,
    'LD': Opcode.MOVE,
    'LOAD': Opcode.MOVE,
    'ST': Opcode.MOVE,
    'STORE': Opcode.MOVE,
    'ADD': Opcode.ADD,
    'SUB': Opcode.SUB,
    'MUL': Opcode.MUL,
    'DIV': Opcode.DIV,
    'AND': Opcode.AND,
    'OR': Opcode.OR,
    'NOT': Opcode.NOT,
    'CMP': Opcode.CMP,
    'COMPARE': Opcode.CMP,
    'CLR': Opcode.CLEAR,
    'CLEAR': Opcode.CLEAR,
    'INC': Opcode.INCREMENT,
    'INCREMENT': Opcode.INCREMENT,
    'DEC': Opcode.DECREMENT,
    'DECREMENT': Opcode.DECREMENT,
    'BR': Opcode.BRANCH,
    'BRANCH': Opcode.BRANCH,
    'JMP': Opcode.BRANCH,
    'JUMP': Opcode.BRANCH,
    'BEQ': Opcode.BRANCH_EQ,
    'BRANCH=0': Opcode.BRANCH_EQ,
    'BNE': Opcode.BRANCH_NE,
    'BRANCH≠0': Opcode.BRANCH_NE,
    'BGT': Opcode.BRANCH_GT,
    'BRANCH>0': Opcode.BRANCH_GT,
    'BGE': Opcode.BRANCH_GE,
    'BRANCH>=0': Opcode.BRANCH_GE,
    'BLT': Opcode.BRANCH_LT,
    'BRANCH<0': Opcode.BRANCH_LT,
    'BLE': Opcode.BRANCH_LE,
    'BRANCH<=0': Opcode.BRANCH_LE,
    'CALL': Opcode.CALL,
    'JSR': Opcode.CALL,
    'RET': Opcode.RETURN,
    'RETURN': Opcode.RETURN,
    'RTS': Opcode.RETURN,
    'PUSH': Opcode.PUSH,
    'POP': Opcode.POP,
    'NOP': Opcode.NOP,
    'HALT': Opcode.HALT,
    'HLT': Opcode.HALT,
    'STOP': Opcode.HALT,
  };

  const upper = text.toUpperCase().replace(/[^A-Z0-9>=<≠]/g, '');
  const opcode = opcodeMap[upper];
  if (opcode === undefined) {
    throw new Error(`Unknown opcode: ${text}`);
  }
  return opcode;
}

/**
 * First pass: collect all labels and their addresses
 */
function collectLabels(lines: string[]): SymbolTable {
  const symbolTable: SymbolTable = {
    labels: new Map(),
    variables: new Map(),
  };

  let address = 0;
  let inDataSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and pure comments
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) {
      continue;
    }

    // Check for section directives
    if (trimmed.toUpperCase().startsWith('.DATA') || trimmed.toUpperCase().startsWith('.DATASECTION')) {
      inDataSection = true;
      continue;
    }
    if (trimmed.toUpperCase().startsWith('.CODE') || trimmed.toUpperCase().startsWith('.TEXT')) {
      inDataSection = false;
      continue;
    }
    if (trimmed.toUpperCase().startsWith('.ORG')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        address = parseNumber(parts[1]);
      }
      continue;
    }

    // Check for label definition
    const labelMatch = trimmed.match(/^(\w+):/);
    if (labelMatch) {
      const labelName = labelMatch[1];
      if (inDataSection) {
        symbolTable.variables.set(labelName, address);
      } else {
        symbolTable.labels.set(labelName, address);
      }
      
      // Check if there's an instruction on the same line
      const rest = trimmed.slice(labelMatch[0].length).trim();
      if (rest && !rest.startsWith(';')) {
        address += INSTRUCTION_SIZE;
      }
      continue;
    }

    // Data definitions
    if (trimmed.toUpperCase().startsWith('.WORD') || trimmed.toUpperCase().startsWith('DW')) {
      address += INSTRUCTION_SIZE;
      continue;
    }

    // Regular instruction
    address += INSTRUCTION_SIZE;
  }

  return symbolTable;
}

/**
 * Second pass: parse instructions
 */
function parseInstructions(lines: string[], symbolTable: SymbolTable): Instruction[] {
  const instructions: Instruction[] = [];
  let address = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines, comments, and directives
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) {
      continue;
    }
    if (trimmed.startsWith('.')) {
      if (trimmed.toUpperCase().startsWith('.ORG')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          address = parseNumber(parts[1]);
        }
      }
      continue;
    }

    // Remove label prefix if present
    let instructionText = trimmed;
    let label: string | undefined;
    const labelMatch = trimmed.match(/^(\w+):\s*/);
    if (labelMatch) {
      label = labelMatch[1];
      instructionText = trimmed.slice(labelMatch[0].length).trim();
    }

    // Skip if only a label
    if (!instructionText || instructionText.startsWith(';')) {
      continue;
    }

    // Remove inline comment
    const commentIdx = instructionText.indexOf(';');
    let comment: string | undefined;
    if (commentIdx !== -1) {
      comment = instructionText.slice(commentIdx + 1).trim();
      instructionText = instructionText.slice(0, commentIdx).trim();
    }

    // Parse opcode and operands
    const parts = instructionText.split(/[\s,]+/).filter(p => p);
    if (parts.length === 0) continue;

    const opcodeStr = parts[0];
    const opcode = parseOpcode(opcodeStr);

    // Parse operands
    const operandStrings = instructionText.slice(opcodeStr.length).trim();
    const operands: Operand[] = [];
    
    if (operandStrings) {
      // Split by comma, but preserve content inside parentheses
      const operandParts = splitOperands(operandStrings);
      for (const op of operandParts) {
        if (op.trim()) {
          operands.push(parseOperand(op.trim(), symbolTable));
        }
      }
    }

    instructions.push({
      address,
      opcode,
      operands,
      rawText: line,
      label,
      comment,
      size: INSTRUCTION_SIZE,
    });

    address += INSTRUCTION_SIZE;
  }

  return instructions;
}

/**
 * Split operand string by comma, preserving parenthesized content
 */
function splitOperands(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (const char of str) {
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Main parser function
 * @param source - Assembly source code
 * @param predefinedVariables - Optional map of variable names to addresses (from initialMemory)
 */
export function parseProgram(
  source: string,
  predefinedVariables?: Map<string, number>
): {
  instructions: Instruction[];
  symbolTable: SymbolTable;
} {
  const lines = source.split('\n');
  const symbolTable = collectLabels(lines);
  
  // Add predefined variables from initialMemory
  if (predefinedVariables) {
    for (const [name, address] of predefinedVariables) {
      // Only add if not already defined in source
      if (!symbolTable.variables.has(name) && !symbolTable.labels.has(name)) {
        symbolTable.variables.set(name, address);
      }
    }
  }
  
  const instructions = parseInstructions(lines, symbolTable);
  
  return { instructions, symbolTable };
}

/**
 * Parse data section and return initial memory values
 */
export function parseDataSection(source: string): Map<number, { value: number; label?: string }> {
  const memory = new Map<number, { value: number; label?: string }>();
  const lines = source.split('\n');
  let address = 0x10000; // Default data section start
  let currentLabel: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toUpperCase().startsWith('.ORG')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        address = parseNumber(parts[1]);
      }
      continue;
    }

    // Check for label
    const labelMatch = trimmed.match(/^(\w+):/);
    if (labelMatch) {
      currentLabel = labelMatch[1];
    }

    // Check for data definition
    const wordMatch = trimmed.match(/(?:\.WORD|DW)\s+(.+)/i);
    if (wordMatch) {
      const values = wordMatch[1].split(',').map(v => parseNumber(v.trim()));
      for (let i = 0; i < values.length; i++) {
        memory.set(address, {
          value: values[i],
          label: i === 0 ? currentLabel : undefined,
        });
        address += INSTRUCTION_SIZE;
        currentLabel = undefined;
      }
    }
  }

  return memory;
}
