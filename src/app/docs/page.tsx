'use client';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">📖 Addressing Modes Lab - User Manual</h1>
        <p className="text-gray-400 mb-8">A visual simulator for learning CPU addressing modes</p>

        {/* Instructions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
            Supported Instructions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Data Movement */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-green-400 mb-3">Data Movement</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="py-1 font-mono text-cyan-400">MOVE src, dst</td><td className="text-gray-400">Copy src to dst</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">CLEAR dst</td><td className="text-gray-400">Set dst to 0</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">PUSH src</td><td className="text-gray-400">Push src onto stack</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">POP dst</td><td className="text-gray-400">Pop from stack to dst</td></tr>
                </tbody>
              </table>
            </div>

            {/* Arithmetic */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-green-400 mb-3">Arithmetic</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="py-1 font-mono text-cyan-400">ADD src, dst</td><td className="text-gray-400">dst = dst + src</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">SUB src, dst</td><td className="text-gray-400">dst = dst - src</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">MUL src, dst</td><td className="text-gray-400">dst = dst × src</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">DIV src, dst</td><td className="text-gray-400">dst = dst ÷ src</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">INCREMENT dst</td><td className="text-gray-400">dst = dst + 1</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">DECREMENT dst</td><td className="text-gray-400">dst = dst - 1</td></tr>
                </tbody>
              </table>
            </div>

            {/* Logic */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-green-400 mb-3">Logic & Comparison</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="py-1 font-mono text-cyan-400">AND src, dst</td><td className="text-gray-400">dst = dst AND src</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">OR src, dst</td><td className="text-gray-400">dst = dst OR src</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">NOT dst</td><td className="text-gray-400">dst = NOT dst</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">CMP src, dst</td><td className="text-gray-400">Compare (dst - src), set flags only</td></tr>
                </tbody>
              </table>
            </div>

            {/* Branching */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-green-400 mb-3">Branching</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="py-1 font-mono text-cyan-400">BRANCH label</td><td className="text-gray-400">Unconditional jump</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">BEQ label</td><td className="text-gray-400">Branch if equal (Z=1)</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">BNE label</td><td className="text-gray-400">Branch if not equal</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">BGT label</td><td className="text-gray-400">Branch if greater</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">BGE label</td><td className="text-gray-400">Branch if greater/equal</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">BLT label</td><td className="text-gray-400">Branch if less</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">BLE label</td><td className="text-gray-400">Branch if less/equal</td></tr>
                </tbody>
              </table>
            </div>

            {/* Subroutines */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-green-400 mb-3">Subroutines & Control</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="py-1 font-mono text-cyan-400">CALL label</td><td className="text-gray-400">Call subroutine</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">RETURN</td><td className="text-gray-400">Return from subroutine</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">NOP</td><td className="text-gray-400">No operation</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">HALT</td><td className="text-gray-400">Stop execution</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Addressing Modes */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
            Addressing Modes
          </h2>
          
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Mode</th>
                  <th className="px-4 py-2 text-left">Syntax</th>
                  <th className="px-4 py-2 text-left">EA Formula</th>
                  <th className="px-4 py-2 text-left">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-purple-400">Immediate</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">#value</td>
                  <td className="px-4 py-3 text-gray-400">Operand = value</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">ADD #5, R0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Register</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">Ri</td>
                  <td className="px-4 py-3 text-gray-400">Operand = [Ri]</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">MOVE R1, R0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Direct</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">label</td>
                  <td className="px-4 py-3 text-gray-400">EA = address of label</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">MOVE NUM, R0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Register Indirect</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">(Ri)</td>
                  <td className="px-4 py-3 text-gray-400">EA = [Ri]</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">ADD (R2), R0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Indexed</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">X(Ri)</td>
                  <td className="px-4 py-3 text-gray-400">EA = [Ri] + X</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">MOVE 4(R0), R1</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Base + Index</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">(Ri, Rj)</td>
                  <td className="px-4 py-3 text-gray-400">EA = [Ri] + [Rj]</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">MOVE (R0, R1), R2</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Base + Index + Offset</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">X(Ri, Rj)</td>
                  <td className="px-4 py-3 text-gray-400">EA = [Ri] + [Rj] + X</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">MOVE 8(R0, R1), R2</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Autoincrement</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">(Ri)+</td>
                  <td className="px-4 py-3 text-gray-400">EA = [Ri], then Ri += 4</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">ADD (R2)+, R0</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Autodecrement</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">-(Ri)</td>
                  <td className="px-4 py-3 text-gray-400">Ri -= 4, then EA = [Ri]</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">MOVE R0, -(SP)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-purple-400">Relative</td>
                  <td className="px-4 py-3 font-mono text-cyan-400">X(PC)</td>
                  <td className="px-4 py-3 text-gray-400">EA = PC + X</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">BRANCH LOOP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Registers */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
            Registers
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-green-400 mb-3">General Purpose</h3>
              <p className="text-gray-400 text-sm mb-2">8 registers for data storage and computation:</p>
              <div className="font-mono text-cyan-400">R0, R1, R2, R3, R4, R5, R6, R7</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-green-400 mb-3">Special Purpose</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                  <tr><td className="py-1 font-mono text-cyan-400">PC</td><td className="text-gray-400">Program Counter - next instruction</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">SP</td><td className="text-gray-400">Stack Pointer - top of stack</td></tr>
                  <tr><td className="py-1 font-mono text-cyan-400">FP</td><td className="text-gray-400">Frame Pointer - stack frame base</td></tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
              <h3 className="font-medium text-green-400 mb-3">Condition Flags</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="font-mono text-cyan-400">Z</span> <span className="text-gray-400">- Zero (result = 0)</span></div>
                <div><span className="font-mono text-cyan-400">N</span> <span className="text-gray-400">- Negative (result &lt; 0)</span></div>
                <div><span className="font-mono text-cyan-400">C</span> <span className="text-gray-400">- Carry (unsigned overflow)</span></div>
                <div><span className="font-mono text-cyan-400">V</span> <span className="text-gray-400">- Overflow (signed overflow)</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Syntax */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
            Syntax Rules
          </h2>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
              <code>{`; This is a comment
LABEL:  MOVE #10, R0      ; Label with instruction
        ADD R1, R2         ; Source, Destination order (src → dst)
        
; Data definitions
NUM:    .word 100          ; Define a 32-bit word with value 100
ARR:    .word 1, 2, 3, 4   ; Define multiple words

; Branching
LOOP:   DECREMENT R0
        BNE LOOP           ; Branch if R0 != 0
        
; Stack operations
        MOVE R0, -(SP)     ; Push R0 (autodecrement)
        MOVE (SP)+, R1     ; Pop to R1 (autoincrement)`}</code>
            </pre>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
            Using the Simulator
          </h2>
          
          <div className="bg-gray-800 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-green-400">•</span>
              <span><strong>Step</strong> - Execute one micro-step (fetch, decode, execute phases)</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400">•</span>
              <span><strong>Run</strong> - Auto-execute until HALT or breakpoint</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400">•</span>
              <span><strong>Reset</strong> - Restart from beginning</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400">•</span>
              <span><strong>EA Panel</strong> - Shows effective address calculation for current operand</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-400">•</span>
              <span><strong>Timeline</strong> - Shows instruction phases (F=Fetch, D=Decode, EA=Address, EX=Execute, WB=Writeback)</span>
            </div>
          </div>
        </section>

        <footer className="text-center text-gray-500 text-sm pt-8 border-t border-gray-700">
          Addressing Modes Visual Lab - Educational Tool for Computer Architecture
        </footer>
      </div>
    </div>
  );
}
