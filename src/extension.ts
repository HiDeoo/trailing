import { commands, type ExtensionContext, type Position, Selection, type TextLine, window, workspace } from 'vscode'

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
  let lastLineIndex = -1

  for (const selection of selections) {
    if (lastLineIndex !== selection.active.line) {
      lines.push(editor.document.lineAt(selection.active.line))
      lastLineIndex = selection.active.line
    }
  }

  const jumpToSymbol = workspace
    .getConfiguration('trailing', window.activeTextEditor?.document)
    .get<boolean>('jumpToSymbol', true)

  const newCursorPositions: Position[] = []

  await editor.edit((editBuilder) => {
    for (const line of lines) {
      const trimmedText = line.text.trimEnd()
      const trimmedDelta = -1 * (line.text.length - trimmedText.length)

      const lastChar = trimmedText.charAt(trimmedText.length - symbol.length)

      let newCursorPosition: Position

      if (lastChar === symbol) {
        newCursorPosition = line.range.end.with({ character: trimmedText.length - symbol.length })

        editBuilder.delete(
          line.range.with(newCursorPosition, line.range.end.translate({ characterDelta: trimmedDelta }))
        )
      } else {
        newCursorPosition = line.range.end.translate({ characterDelta: trimmedDelta + 1 })

        editBuilder.insert(line.range.end.translate({ characterDelta: trimmedDelta }), symbol)
      }

      if (jumpToSymbol) {
        newCursorPositions.push(newCursorPosition)
      }
    }
  })

  if (jumpToSymbol) {
    editor.selections = newCursorPositions.map((cursorPosition) => new Selection(cursorPosition, cursorPosition))
  }
}

export type TrailingCommand = `trailing.toggle${string}`
