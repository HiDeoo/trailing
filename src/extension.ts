import { commands, type ExtensionContext, window, type TextLine } from 'vscode'

export enum TrailingSymbol {
  Comma = ',',
}

export const TrailingDefinitions = new Map<TrailingCommand, TrailingSymbol>([
  ['trailing.toggleComma', TrailingSymbol.Comma],
])

export function activate(context: ExtensionContext) {
  for (const [command, symbol] of TrailingDefinitions) {
    context.subscriptions.push(
      commands.registerCommand(command, () => {
        return toggle(symbol)
      })
    )
  }
}

function toggle(symbol: TrailingSymbol) {
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
      const lastChar = line.text.charAt(line.text.length - symbol.length)

      if (lastChar === symbol) {
        editBuilder.delete(
          line.range.with(line.range.end.with({ character: line.text.length - symbol.length }), line.range.end)
        )
      } else {
        editBuilder.insert(line.range.end, symbol)
      }
    }
  })
}

export type TrailingCommand = `trailing.toggle${string}`
