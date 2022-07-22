import { commands, type ExtensionContext, window, type TextLine } from 'vscode'

export const TrailingCommands = {
  Toggle: 'trailing.toggle',
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(TrailingCommands.Toggle, () => {
      return toggle()
    })
  )
}

function toggle() {
  const editor = window.activeTextEditor

  if (!editor) {
    return
  }

  const selections = editor.selections

  const lines: TextLine[] = []

  for (const selection of selections) {
    lines.push(editor.document.lineAt(selection.active.line))
  }

  return editor.edit((editBuilder) => {
    for (const line of lines) {
      const lastChar = line.text.charAt(line.text.length - 1)

      if (lastChar === ',') {
        editBuilder.delete(line.range.with(line.range.end.with({ character: line.text.length - 1 }), line.range.end))
      } else {
        editBuilder.insert(line.range.end, ',')
      }
    }
  })
}
