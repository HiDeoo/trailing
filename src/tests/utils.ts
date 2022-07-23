import * as assert from 'assert'

import { commands, type TextDocument, type TextEditor, window, workspace } from 'vscode'

export async function withEditor(
  content: string,
  run: (doc: TextDocument, editor: TextEditor) => Promise<void> | void
) {
  const document = await workspace.openTextDocument({ content })
  const editor = await window.showTextDocument(document)

  await run(document, editor)

  return commands.executeCommand('workbench.action.closeAllEditors')
}

export function assertDocumentTextEqual(document: TextDocument, expected: string) {
  assert.strictEqual(document.getText(), expected)
}
