import { commands, type ExtensionContext, Selection, window, workspace } from 'vscode'

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
  const newSelections: Selection[] = []
  let lastHandledLineIndex = -1

  const jumpToSymbol = workspace
    .getConfiguration('trailing', window.activeTextEditor?.document)
    .get<boolean>('jumpToSymbol', true)

  // const newCursorPositions: Position[] = []

  await editor.edit(async (editBuilder) => {
    for (const selection of selections) {
      const lineIndex = selection.active.line

      if (lastHandledLineIndex === lineIndex) {
        if (!jumpToSymbol) {
          newSelections.push(selection)
        }

        continue
      }

      lastHandledLineIndex = lineIndex

      const line = editor.document.lineAt(selection.active.line)

      const trimmedText = line.text.trimEnd()
      const trimmedDelta = -1 * (line.text.length - trimmedText.length)

      const lastChar = trimmedText.charAt(trimmedText.length - symbol.length)

      if (lastChar === symbol) {
        const removedSelection = new Selection(
          line.range.end.translate({ characterDelta: trimmedDelta - 1 }),
          line.range.end.translate({ characterDelta: trimmedDelta })
        )

        if (jumpToSymbol) {
          newSelections.push(new Selection(removedSelection.start, removedSelection.start))
        } else {
          if (selection.end.isEqual(selection.start) && selection.end.character === line.text.length) {
            const newPosition = selection.end.translate({ characterDelta: -1 })
            newSelections.push(trimmedDelta === 0 ? new Selection(newPosition, newPosition) : selection)
          } else {
            newSelections.push(selection)
          }
        }

        editBuilder.replace(removedSelection, '')
      } else {
        if (jumpToSymbol) {
          const newPosition = selection.active.with({ character: line.range.end.character + 1 + trimmedDelta })
          newSelections.push(new Selection(newPosition, newPosition))
        } else {
          newSelections.push(selection)
        }

        editBuilder.replace(line.range.end.translate({ characterDelta: trimmedDelta }), symbol)
      }
    }
  })

  editor.selections = newSelections
}

export type TrailingCommand = `trailing.toggle${string}${typeof commandWithNewLineSuffix | ''}`
