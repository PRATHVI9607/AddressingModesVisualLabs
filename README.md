# ⚡ Addressing Modes Visual Lab

An interactive web-based simulator for learning CPU addressing modes. This educational tool visualizes how different addressing modes work in assembly language, making it easier to understand computer architecture concepts.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)

## 🎯 Features

- **Visual Execution**: Step through assembly code and watch registers, memory, and flags update in real-time
- **10 Addressing Modes**: Immediate, Register, Direct, Indirect, Indexed, Base+Index, Autoincrement, Autodecrement, Relative, and more
- **18 Instructions**: Full support for data movement, arithmetic, logic, branching, and subroutine operations
- **EA Calculation Display**: See how effective addresses are computed for each operand
- **Micro-step Timeline**: Visualize instruction phases (Fetch → Decode → EA → Execute → Writeback)
- **Example Programs**: Pre-built examples demonstrating each addressing mode
- **Custom Code Editor**: Write and execute your own assembly programs

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/PRATHVI9607/AddressingModesVisualLabs.git
cd AddressingModesVisualLabs

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Supported Instructions

| Category | Instructions |
|----------|-------------|
| **Data Movement** | `MOVE`, `CLEAR`, `PUSH`, `POP` |
| **Arithmetic** | `ADD`, `SUB`, `MUL`, `DIV`, `INCREMENT`, `DECREMENT` |
| **Logic** | `AND`, `OR`, `NOT`, `CMP` |
| **Branching** | `BRANCH`, `BEQ`, `BNE`, `BGT`, `BGE`, `BLT`, `BLE` |
| **Subroutines** | `CALL`, `RETURN` |
| **Control** | `NOP`, `HALT` |

## 🎛️ Addressing Modes

| Mode | Syntax | EA Formula | Example |
|------|--------|------------|---------|
| Immediate | `#value` | Operand = value | `ADD #5, R0` |
| Register | `Ri` | Operand = [Ri] | `MOVE R1, R0` |
| Direct | `label` | EA = address | `MOVE NUM, R0` |
| Register Indirect | `(Ri)` | EA = [Ri] | `ADD (R2), R0` |
| Indexed | `X(Ri)` | EA = [Ri] + X | `MOVE 4(R0), R1` |
| Base + Index | `(Ri, Rj)` | EA = [Ri] + [Rj] | `MOVE (R0, R1), R2` |
| Autoincrement | `(Ri)+` | EA = [Ri], Ri += 4 | `ADD (R2)+, R0` |
| Autodecrement | `-(Ri)` | Ri -= 4, EA = [Ri] | `MOVE R0, -(SP)` |
| Relative | `X(PC)` | EA = PC + X | `BRANCH LOOP` |

## 🏗️ Architecture

This simulator uses a **generic RISC-style educational architecture**:

- **Word Size**: 32-bit
- **General Registers**: R0-R7
- **Special Registers**: PC (Program Counter), SP (Stack Pointer), FP (Frame Pointer)
- **Flags**: Z (Zero), N (Negative), C (Carry), V (Overflow)
- **Stack**: Grows downward from high memory

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main application
│   ├── docs/page.tsx     # Documentation page
│   └── layout.tsx        # Root layout
├── components/
│   ├── ControlPanel.tsx  # Execution controls
│   ├── RegisterPanel.tsx # Register display
│   ├── MemoryPanel.tsx   # Memory visualization
│   ├── StackPanel.tsx    # Stack display
│   ├── EAPanel.tsx       # EA calculation
│   ├── ProgramPanel.tsx  # Code editor/examples
│   ├── ExplanationPanel.tsx # Step explanations
│   └── TimelinePanel.tsx # Micro-step timeline
├── engine/
│   ├── parser.ts         # Assembly parser
│   ├── executor.ts       # Instruction execution
│   └── addressingModes.ts # EA evaluation
├── store/
│   └── machineStore.ts   # Zustand state management
├── data/
│   └── examplePrograms.ts # Example programs
└── types/
    └── index.ts          # TypeScript definitions
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📝 Example Code

```asm
; Sum numbers using indirect addressing
        MOVE #0, R0       ; R0 = sum = 0
        MOVE #ARR, R1     ; R1 = pointer to array
        MOVE #4, R2       ; R2 = count

LOOP:   ADD (R1)+, R0     ; sum += *ptr++
        DECREMENT R2
        BNE LOOP          ; repeat if count != 0
        HALT

ARR:    .word 10, 20, 30, 40
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  Acknowledgments

- Inspired by computer architecture courses and the need for better visualization tools
- Built for students learning assembly language and CPU internals

---

Made with ❤️ for Computer Architecture Education
