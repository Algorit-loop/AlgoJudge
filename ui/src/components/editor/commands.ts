// Text-editing commands behind the Markdown toolbar and keyboard shortcuts.
// Each one acts on the current selection(s) of a CodeMirror view and records a single undo step.

import { EditorSelection, type SelectionRange } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

/** Wrap each selection in `before`/`after`; with an empty selection insert `placeholder` and select it. */
export function wrap(view: EditorView, before: string, after: string, placeholder: string) {
  const { state } = view
  view.dispatch(
    state.changeByRange((range) => {
      const text = state.sliceDoc(range.from, range.to)
      // Toggle off when the selection is already wrapped.
      const outerFrom = range.from - before.length
      const outerTo = range.to + after.length
      if (
        outerFrom >= 0 &&
        state.sliceDoc(outerFrom, range.from) === before &&
        state.sliceDoc(range.to, outerTo) === after
      ) {
        return {
          changes: [
            { from: outerFrom, to: range.from, insert: '' },
            { from: range.to, to: outerTo, insert: '' },
          ],
          range: EditorSelection.range(outerFrom, range.to - before.length),
        }
      }
      const inner = text || placeholder
      return {
        changes: { from: range.from, to: range.to, insert: before + inner + after },
        range: EditorSelection.range(range.from + before.length, range.from + before.length + inner.length),
      }
    }),
    { scrollIntoView: true, userEvent: 'input' },
  )
  view.focus()
}

function linesOf(view: EditorView, range: SelectionRange) {
  const { doc } = view.state
  const first = doc.lineAt(range.from).number
  const last = doc.lineAt(range.to).number
  return Array.from({ length: last - first + 1 }, (_, i) => doc.line(first + i))
}

/**
 * Add `prefix` to the start of every selected line, or remove it when all lines already have it.
 * `prefix` may be a function of the line index (for numbered lists). `strip` recognises existing prefixes
 * of the same kind (e.g. any heading level), which are replaced instead of stacked.
 */
export function prefixLines(view: EditorView, prefix: string | ((i: number) => string), strip: RegExp) {
  const { state } = view
  const ranges = state.selection.ranges
  const lines = ranges.flatMap((r) => linesOf(view, r))
  const make = (i: number) => (typeof prefix === 'function' ? prefix(i) : prefix)
  const allHave = lines.every((line, i) => line.text.startsWith(make(i)))
  const changes = lines.map((line, i) => {
    const existing = strip.exec(line.text)?.[0] ?? ''
    return allHave
      ? { from: line.from, to: line.from + make(i).length, insert: '' }
      : { from: line.from, to: line.from + existing.length, insert: make(i) }
  })
  view.dispatch({ changes, scrollIntoView: true, userEvent: 'input' })
  view.focus()
}

/** Insert a block on its own lines at the cursor, selecting `select` inside it if given. */
export function insertBlock(view: EditorView, block: string, select?: string) {
  const { state } = view
  const range = state.selection.main
  const line = state.doc.lineAt(range.from)
  const atLineStart = range.from === line.from
  const before = atLineStart ? (line.number > 1 && state.doc.line(line.number - 1).text.trim() ? '\n' : '') : '\n\n'
  const after = '\n'
  const text = before + block + after
  const selStart = select ? range.from + before.length + block.indexOf(select) : range.from + text.length
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: text },
    selection: EditorSelection.range(selStart, select ? selStart + select.length : selStart),
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}

/** Insert plain text at the cursor (replacing the selection). */
export function insertText(view: EditorView, text: string) {
  view.dispatch(view.state.replaceSelection(text), { scrollIntoView: true, userEvent: 'input' })
  view.focus()
}

/** Wrap the selection as a link: [text](url) with "url" selected for typing. */
export function link(view: EditorView, placeholderText: string) {
  const { state } = view
  const range = state.selection.main
  const text = state.sliceDoc(range.from, range.to) || placeholderText
  const isUrl = /^https?:\/\/\S+$/.test(text)
  const insert = isUrl ? `[${placeholderText}](${text})` : `[${text}](https://)`
  const urlStart = range.from + insert.indexOf('(') + 1
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: isUrl
      ? EditorSelection.range(range.from + 1, range.from + 1 + placeholderText.length)
      : EditorSelection.range(urlStart, urlStart + 'https://'.length),
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}

export const HEADING_PREFIX = /^#{1,6}\s+/
export const QUOTE_PREFIX = /^>\s?/
export const BULLET_PREFIX = /^(\s*)([-*+]|\d+\.)\s+/
