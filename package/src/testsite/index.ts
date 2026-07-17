import { createEditor } from ".."

// Prism grammars
import "../prism/languages/nasm"

// Editor styles
import "../layout.css"
import "../scrollbar.css"
import "../themes/github-dark.css"
import "../extensions/guides.css"
import "../extensions/search/search.css"
import "./style.css"

// Non critical extensions (could be lazy loaded)
import { indentGuides } from "../extensions/guides"
import { matchBrackets } from "../extensions/matchBrackets"
import { highlightSelectionMatches } from "../extensions/search"
import { defaultKeymap, editHistory, editorCommands } from "../extensions/commands"
import { setIgnoreTab } from "../extensions/commands"

type AssemblerError = {
	/** 1-based line number, matching the index into `editor.lines`. */
	line: number
	error: string
}

const startCode = `section .data
  msg db "Hello, world!", 10
  len equ $ - msg

section .text
  global _start

_start:
  mov rax, 1
  mov rdi, 1
  mov rsi, msg
  mov rdx, len
  syscall

  mov rax, 60
  xor rdi, rdi
  syscall
`

/** Stands in for the assembler output your app feeds the editor. */
const assemblerErrors: AssemblerError[] = [
	{ line: 9, error: "; error: invalid combination of opcode and operands" },
	{ line: 16, error: "; error: symbol `rdi' not defined" },
]

let renderedErrors: HTMLSpanElement[] = []

// Declared before createEditor since onUpdate fires while the editor is created
function removeErrors() {
	for (const error of renderedErrors) error.remove()
	renderedErrors = []
}

const editor = createEditor(
	document.querySelector(".editor"),
	{
		language: "nasm",
		value: startCode,
		onUpdate() {
			removeErrors()
		},
	},
	indentGuides(),
	matchBrackets(),
	highlightSelectionMatches(),
	editorCommands(defaultKeymap),
	editHistory(),
)

// Annoying but required since this editor traps focus, causing a11y issues
setIgnoreTab(true)

const renderErrors = (errors: AssemblerError[]) => {
	removeErrors()

	// lines[0] holds the overlays, so lines[n] is the nth line of code
	const lines = editor.lines

	for (const { line, error } of errors) {
		const lineEl = lines[line]
		if (!lineEl) continue

		const element = document.createElement("span")
		element.className = "editor__lineerror"
		element.textContent = "  " + error
		// Inserted before the line's trailing newline so it stays on the same row
		lineEl.insertBefore(element, lineEl.lastChild)
		renderedErrors.push(element)
	}
}

document.getElementById("render-errors")!.onclick = () => renderErrors(assemblerErrors)
document.getElementById("clear-errors")!.onclick = removeErrors
