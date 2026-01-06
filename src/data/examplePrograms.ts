// Example programs demonstrating different addressing modes

import { Program, AddressingMode } from '@/types';

export const examplePrograms: Program[] = [
  // ============================================
  // IMMEDIATE MODE
  // ============================================
  {
    id: 'immediate-basic',
    name: 'Immediate Mode - Basic Operations',
    description: 'Demonstrates immediate addressing where operands are constants encoded in the instruction.',
    addressingModes: [AddressingMode.IMMEDIATE],
    source: `; Immediate Addressing Mode Demo
; Operands are constants directly in the instruction

    MOVE #5, R0      ; Load constant 5 into R0
    MOVE #10, R1     ; Load constant 10 into R1
    ADD #3, R0       ; R0 = R0 + 3 = 8
    ADD #7, R1       ; R1 = R1 + 7 = 17
    ADD R1, R0       ; R0 = R0 + R1 = 25
    HALT
`,
    initialMemory: {},
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // REGISTER MODE
  // ============================================
  {
    id: 'register-basic',
    name: 'Register Mode - Register Operations',
    description: 'Demonstrates register addressing where operands are in CPU registers.',
    addressingModes: [AddressingMode.REGISTER],
    source: `; Register Addressing Mode Demo
; All operands are in registers - no memory access

    MOVE #100, R0    ; Initialize R0
    MOVE #50, R1     ; Initialize R1
    ADD R1, R0       ; R0 = R0 + R1 = 150
    SUB R1, R0       ; R0 = R0 - R1 = 100
    MOVE R0, R2      ; Copy R0 to R2
    HALT
`,
    initialMemory: {},
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // DIRECT (ABSOLUTE) MODE
  // ============================================
  {
    id: 'direct-basic',
    name: 'Direct Mode - Memory Access',
    description: 'Demonstrates direct addressing where EA is the address specified in the instruction.',
    addressingModes: [AddressingMode.DIRECT],
    source: `; Direct (Absolute) Addressing Mode Demo
; EA = address of the label

    MOVE NUM1, R0    ; R0 = M[NUM1] = 25
    MOVE NUM2, R1    ; R1 = M[NUM2] = 37
    ADD R1, R0       ; R0 = R0 + R1 = 62
    MOVE R0, RESULT  ; Store result in memory
    HALT
`,
    initialMemory: {
      0x10000: { value: 25, label: 'NUM1', segment: 'data' },
      0x10004: { value: 37, label: 'NUM2', segment: 'data' },
      0x10008: { value: 0, label: 'RESULT', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // INDIRECT REGISTER MODE
  // ============================================
  {
    id: 'indirect-register',
    name: 'Indirect Register - Pointer Access',
    description: 'Demonstrates indirect register addressing where a register holds a pointer to the operand.',
    addressingModes: [AddressingMode.INDIRECT_REGISTER],
    source: `; Indirect Register Addressing Mode Demo
; EA = [Ri] - register contains address

    MOVE #0x10000, R2  ; R2 = pointer to NUM1
    MOVE (R2), R0      ; R0 = M[R2] = M[0x10000] = 100
    ADD #4, R2         ; Move pointer to NUM2
    MOVE (R2), R1      ; R1 = M[R2] = M[0x10004] = 200
    ADD R1, R0         ; R0 = 100 + 200 = 300
    HALT
`,
    initialMemory: {
      0x10000: { value: 100, label: 'NUM1', segment: 'data' },
      0x10004: { value: 200, label: 'NUM2', segment: 'data' },
      0x10008: { value: 300, label: 'NUM3', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // SUM OF N NUMBERS (Indirect + Manual Increment)
  // ============================================
  {
    id: 'sum-n-indirect',
    name: 'Sum N Numbers - Indirect Mode',
    description: 'Classic sum of N numbers using indirect addressing with manual pointer increment.',
    addressingModes: [AddressingMode.INDIRECT_REGISTER, AddressingMode.DIRECT],
    source: `; Sum of N Numbers using Indirect Addressing
; Uses (R2) to access array elements

    MOVE N, R1       ; R1 = count = 5
    MOVE #0x10004, R2 ; R2 = pointer to NUM1
    CLEAR R0         ; R0 = sum = 0
LOOP:
    ADD (R2), R0     ; R0 = R0 + M[R2]
    ADD #4, R2       ; R2 = R2 + 4 (next element)
    DECREMENT R1     ; R1 = R1 - 1
    BRANCH>0 LOOP    ; if R1 > 0, continue
    MOVE R0, SUM     ; Store result
    HALT
`,
    initialMemory: {
      0x10000: { value: 5, label: 'N', segment: 'data' },
      0x10004: { value: 10, label: 'NUM1', segment: 'data' },
      0x10008: { value: 20, label: 'NUM2', segment: 'data' },
      0x1000C: { value: 30, label: 'NUM3', segment: 'data' },
      0x10010: { value: 40, label: 'NUM4', segment: 'data' },
      0x10014: { value: 50, label: 'NUM5', segment: 'data' },
      0x10018: { value: 0, label: 'SUM', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // INDEXED MODE
  // ============================================
  {
    id: 'indexed-array',
    name: 'Indexed Mode - Array Access',
    description: 'Demonstrates indexed addressing for accessing array elements with base + offset.',
    addressingModes: [AddressingMode.INDEXED],
    source: `; Indexed Addressing Mode Demo
; EA = Ri + offset - perfect for arrays

    MOVE #0x10000, R0  ; R0 = base address of MARKS
    MOVE 0(R0), R1     ; R1 = MARKS[0] = 85
    MOVE 4(R0), R2     ; R2 = MARKS[1] = 90
    MOVE 8(R0), R3     ; R3 = MARKS[2] = 78
    ADD R2, R1         ; R1 = 85 + 90 = 175
    ADD R3, R1         ; R1 = 175 + 78 = 253
    HALT
`,
    initialMemory: {
      0x10000: { value: 85, label: 'MARKS', segment: 'data' },
      0x10004: { value: 90, label: 'MARKS+4', segment: 'data' },
      0x10008: { value: 78, label: 'MARKS+8', segment: 'data' },
      0x1000C: { value: 92, label: 'MARKS+12', segment: 'data' },
      0x10010: { value: 88, label: 'MARKS+16', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // BASE + INDEX MODE
  // ============================================
  {
    id: 'base-index',
    name: 'Base + Index Mode',
    description: 'Demonstrates base + index addressing: EA = Ri + Rj',
    addressingModes: [AddressingMode.BASE_INDEX],
    source: `; Base + Index Addressing Mode Demo
; EA = Ri + Rj - two registers combine

    MOVE #0x10000, R0  ; R0 = base address
    MOVE #0, R1        ; R1 = index = 0
    MOVE (R0, R1), R2  ; R2 = M[R0 + R1] = M[0x10000]
    ADD #4, R1         ; R1 = 4
    MOVE (R0, R1), R3  ; R3 = M[R0 + R1] = M[0x10004]
    ADD #4, R1         ; R1 = 8
    MOVE (R0, R1), R4  ; R4 = M[R0 + R1] = M[0x10008]
    HALT
`,
    initialMemory: {
      0x10000: { value: 111, label: 'DATA', segment: 'data' },
      0x10004: { value: 222, label: 'DATA+4', segment: 'data' },
      0x10008: { value: 333, label: 'DATA+8', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // AUTOINCREMENT MODE
  // ============================================
  {
    id: 'autoincrement-sum',
    name: 'Autoincrement - Sum Array',
    description: 'Demonstrates autoincrement addressing: EA = Ri, then Ri += 4',
    addressingModes: [AddressingMode.AUTOINCREMENT],
    source: `; Autoincrement Addressing Mode Demo
; EA = [Ri], then Ri = Ri + 4

    MOVE N, R1         ; R1 = count = 5
    MOVE #0x10004, R2  ; R2 = pointer to first number
    CLEAR R0           ; R0 = sum = 0
LOOP:
    ADD (R2)+, R0      ; R0 += M[R2], R2 += 4 (auto!)
    DECREMENT R1       ; R1 = R1 - 1
    BRANCH>0 LOOP      ; if R1 > 0, continue
    MOVE R0, SUM       ; Store sum
    HALT
`,
    initialMemory: {
      0x10000: { value: 5, label: 'N', segment: 'data' },
      0x10004: { value: 10, label: 'NUM1', segment: 'data' },
      0x10008: { value: 20, label: 'NUM2', segment: 'data' },
      0x1000C: { value: 30, label: 'NUM3', segment: 'data' },
      0x10010: { value: 40, label: 'NUM4', segment: 'data' },
      0x10014: { value: 50, label: 'NUM5', segment: 'data' },
      0x10018: { value: 0, label: 'SUM', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // AUTODECREMENT MODE (Stack-like)
  // ============================================
  {
    id: 'autodecrement-stack',
    name: 'Autodecrement - Stack Push',
    description: 'Demonstrates autodecrement addressing for stack-like operations.',
    addressingModes: [AddressingMode.AUTODECREMENT],
    source: `; Autodecrement Addressing Mode Demo
; Ri = Ri - 4, then EA = [Ri] (stack push)

    MOVE #0xFFFF0010, SP ; Initialize stack pointer
    MOVE #100, R0        ; Value to push
    MOVE R0, -(SP)       ; Push R0: SP -= 4, M[SP] = R0
    MOVE #200, R1        ; Another value
    MOVE R1, -(SP)       ; Push R1: SP -= 4, M[SP] = R1
    MOVE #300, R2        ; Third value
    MOVE R2, -(SP)       ; Push R2: SP -= 4, M[SP] = R2
    HALT
`,
    initialMemory: {},
    initialRegisters: { PC: 0, SP: 0xFFFF0010 },
  },

  // ============================================
  // RELATIVE (PC-RELATIVE) MODE
  // ============================================
  {
    id: 'relative-branch',
    name: 'Relative Mode - Branch Loop',
    description: 'Demonstrates PC-relative addressing for branch instructions.',
    addressingModes: [AddressingMode.RELATIVE],
    source: `; Relative (PC-Relative) Addressing Mode Demo
; EA = PC + offset (signed) - for branches

    MOVE #10, R0       ; R0 = counter
LOOP:
    DECREMENT R0       ; R0 = R0 - 1
    BRANCH>0 LOOP      ; if R0 > 0, branch back (negative offset)
    MOVE #999, R1      ; This runs after loop
    HALT
`,
    initialMemory: {},
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // MIXED MODES - Array Copy
  // ============================================
  {
    id: 'mixed-array-copy',
    name: 'Mixed Modes - Array Copy',
    description: 'Copy an array using autoincrement for both source and destination.',
    addressingModes: [AddressingMode.AUTOINCREMENT, AddressingMode.DIRECT],
    source: `; Array Copy using Autoincrement
; Copy SRC array to DST array

    MOVE #4, R0        ; R0 = count
    MOVE #0x10000, R1  ; R1 = source pointer
    MOVE #0x10020, R2  ; R2 = destination pointer
LOOP:
    MOVE (R1)+, R3     ; R3 = M[R1], R1 += 4
    MOVE R3, (R2)+     ; M[R2] = R3, R2 += 4
    DECREMENT R0       ; R0 -= 1
    BRANCH>0 LOOP      ; Continue if R0 > 0
    HALT
`,
    initialMemory: {
      0x10000: { value: 11, label: 'SRC', segment: 'data' },
      0x10004: { value: 22, label: 'SRC+4', segment: 'data' },
      0x10008: { value: 33, label: 'SRC+8', segment: 'data' },
      0x1000C: { value: 44, label: 'SRC+12', segment: 'data' },
      0x10020: { value: 0, label: 'DST', segment: 'data' },
      0x10024: { value: 0, label: 'DST+4', segment: 'data' },
      0x10028: { value: 0, label: 'DST+8', segment: 'data' },
      0x1002C: { value: 0, label: 'DST+12', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },

  // ============================================
  // FIND MAXIMUM IN ARRAY
  // ============================================
  {
    id: 'find-max',
    name: 'Find Maximum - Multiple Modes',
    description: 'Find the maximum value in an array using various addressing modes.',
    addressingModes: [AddressingMode.AUTOINCREMENT, AddressingMode.DIRECT, AddressingMode.RELATIVE],
    source: `; Find Maximum Value in Array
; Uses autoincrement for traversal

    MOVE N, R0         ; R0 = count
    MOVE #0x10004, R1  ; R1 = array pointer
    MOVE (R1)+, R2     ; R2 = max = first element
    DECREMENT R0       ; One less to check
LOOP:
    MOVE (R1)+, R3     ; R3 = current element
    SUB R2, R3         ; Compare: R3 - R2
    BRANCH<=0 SKIP     ; if current <= max, skip
    MOVE -4(R1), R2    ; New max (re-read previous)
SKIP:
    DECREMENT R0       ; R0 -= 1
    BRANCH>0 LOOP      ; Continue if more elements
    MOVE R2, MAX       ; Store maximum
    HALT
`,
    initialMemory: {
      0x10000: { value: 6, label: 'N', segment: 'data' },
      0x10004: { value: 34, label: 'ARR', segment: 'data' },
      0x10008: { value: 72, label: 'ARR+4', segment: 'data' },
      0x1000C: { value: 15, label: 'ARR+8', segment: 'data' },
      0x10010: { value: 98, label: 'ARR+12', segment: 'data' },
      0x10014: { value: 41, label: 'ARR+16', segment: 'data' },
      0x10018: { value: 63, label: 'ARR+20', segment: 'data' },
      0x1001C: { value: 0, label: 'MAX', segment: 'data' },
    },
    initialRegisters: { PC: 0 },
  },
];

export function getProgramsByMode(mode: AddressingMode): Program[] {
  return examplePrograms.filter(p => p.addressingModes.includes(mode));
}

export function getProgramById(id: string): Program | undefined {
  return examplePrograms.find(p => p.id === id);
}
