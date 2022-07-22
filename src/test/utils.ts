import * as assert from 'assert'

import { commands, Position, type TextDocument, type TextEditor, Uri, window, workspace } from 'vscode'

export async function withEditor(
  content: string,
  run: (doc: TextDocument, editor: TextEditor) => Promise<void> | void
) {
  const document = await workspace.openTextDocument(Uri.parse('untitled:Trailing'))
  const editor = await window.showTextDocument(document)

  await editor.edit((editBuilder) => {
    editBuilder.insert(new Position(0, 0), content)
  })

  await run(document, editor)

  return commands.executeCommand('workbench.action.closeAllEditors')
}

export function assertDocumentTextEqual(document: TextDocument, expected: string) {
  assert.strictEqual(document.getText(), expected)
}
