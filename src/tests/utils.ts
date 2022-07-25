import * as assert from 'assert'

import { commands, type Position, Selection, type TextDocument, type TextEditor, window, workspace } from 'vscode'

export async function withEditor(
  content: string,
  run: (doc: TextDocument, editor: TextEditor) => Promise<void> | void
) {
  const document = await workspace.openTextDocument({ content })
  const editor = await window.showTextDocument(document)

  await run(document, editor)

  return commands.executeCommand('workbench.action.closeAllEditors')
}

export function assertTextEqual(document: TextDocument, expected: string) {
  assert.strictEqual(document.getText(), expected)
}

export function assertPositionEqual(editor: TextEditor, expected: Position) {
  assert.strictEqual(editor.selection.active.isEqual(expected), true)
}

export function assertPositionsEqual(editor: TextEditor, expected: Position[]) {
  assert.deepStrictEqual(
    editor.selections,
    expected.map((expectedPosition) => new Selection(expectedPosition, expectedPosition))
  )
}

export function assertSelectionEqual(editor: TextEditor, expected: Selection) {
  assert.strictEqual(editor.selection.isEqual(expected), true)
}

export function assertSelectionsEqual(editor: TextEditor, expected: Selection[]) {
  assert.deepStrictEqual(editor.selections, expected)
}

export function getTestSettings() {
  const jumpToSymbol = workspace
    .getConfiguration('trailing', window.activeTextEditor?.document)
    .get<boolean>('jumpToSymbol')

  if (typeof jumpToSymbol === 'undefined') {
    throw new TypeError("Setting 'jumpToSymbol' is not defined.")
  }

  return { jumpToSymbol }
}
