import { commands, type ExtensionContext, window, type TextLine, workspace } from 'vscode'

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

async function toggle(symbol: TrailingSymbol) {
  const editor = window.activeTextEditor

  if (!editor) {
    return
  }

  const selections = editor.selections

  const lines: TextLine[] = []

  for (const selection of selections) {
    lines.push(editor.document.lineAt(selection.active.line))
  }

  await editor.edit((editBuilder) => {
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

  const jumpToSymbol = workspace
    .getConfiguration('trailing', window.activeTextEditor?.document)
    .get<boolean>('jumpToSymbol', true)

  if (jumpToSymbol) {
    await commands.executeCommand('cursorEnd')
  }
}

export type TrailingCommand = `trailing.toggle${string}`
