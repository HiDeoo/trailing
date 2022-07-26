import { commands, type ExtensionContext, Selection, window, workspace } from 'vscode'

export enum TrailingSymbol {
  Comma = ',',
}

export const commandWithNewLineSuffix = 'WithNewLine'

export const TrailingDefinitions = new Map<TrailingCommand, TrailingSymbol>([
  ['trailing.toggleComma', TrailingSymbol.Comma],
  [`trailing.toggleComma${commandWithNewLineSuffix}`, TrailingSymbol.Comma],
])

export function activate(context: ExtensionContext) {
  for (const [command, symbol] of TrailingDefinitions) {
    context.subscriptions.push(
      commands.registerCommand(command, () => {
        return toggle(symbol, command.endsWith(commandWithNewLineSuffix))
      })
    )
  }
}

async function toggle(symbol: TrailingSymbol, addNewLine: boolean) {
  const editor = window.activeTextEditor

  if (!editor) {
    return
  }

  const selections = editor.selections
  const newSelections: Selection[] = []
  let lastHandledLineIndex = -1
  let newLineCount = 0

  const jumpToSymbol = workspace
    .getConfiguration('trailing', window.activeTextEditor?.document)
    .get<boolean>('jumpToSymbol', true)

  await editor.edit(async (editBuilder) => {
    for (const selection of selections) {
      const lineIndex = selection.active.line

      if (lastHandledLineIndex === lineIndex) {
        if (!jumpToSymbol) {
          // If a selection on this line has already been handled and we're creating a new selection to jum to the new
          // symbol, we need to restore this selection.
          newSelections.push(selection)
        }

        // If a selection on this line has already been handled, we don't need to do anything.
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
          // If we're jumping to the symbol when deleting it, we need to position the cursor at the start of the
          // removed symbol range.
          newSelections.push(
            new Selection(
              removedSelection.start.translate({ lineDelta: newLineCount }),
              removedSelection.start.translate({ lineDelta: newLineCount })
            )
          )
        } else {
          if (selection.end.isEqual(selection.start) && selection.end.character === line.text.length) {
            // If the selection range is empty and the cursor is at the end of the line, we need to adjust the cursor
            // position to account for the removed symbol.
            const newPosition = selection.end.translate({ characterDelta: -1 * symbol.length })
            newSelections.push(trimmedDelta === 0 ? new Selection(newPosition, newPosition) : selection)
          } else if (selection.end.character === line.text.length) {
            // If the cursor is at the end of the line, we need to adjust the cursor position to account for the removed
            // symbol.
            newSelections.push(
              trimmedDelta === 0
                ? new Selection(selection.start, selection.end.translate({ characterDelta: -1 * symbol.length }))
                : selection
            )
          } else {
            if (addNewLine) {
              // If we added a new line, we need to account for the previously added ones.
              newSelections.push(
                new Selection(
                  selection.start.translate({ lineDelta: newLineCount }),
                  selection.end.translate({ lineDelta: newLineCount })
                )
              )
            } else {
              // Otherwise, we need to restore the selection.
              newSelections.push(selection)
            }
          }
        }

        editBuilder.replace(removedSelection, '')
      } else {
        let lead = ''

        if (addNewLine) {
          const matches = trimmedText.match(/^(?<lead>\s*)/)

          if (matches?.groups?.lead && matches.groups.lead.length > 0) {
            lead = matches.groups.lead
          }
        }

        if (jumpToSymbol) {
          const newPosition = addNewLine
            ? // If we're jumping to the symbol and adding a new line, we need to position the cursor at the beginning
              // of this new line.
              selection.active.with({
                character: lead.length,
                line: line.lineNumber + ++newLineCount,
              })
            : // If we're jumping to the symbol and not adding a new line, we need to position the cursor after the
              // added symbol.
              selection.active.with({
                character: line.range.end.character + symbol.length + trimmedDelta,
              })
          newSelections.push(new Selection(newPosition, newPosition))
        } else {
          if (addNewLine) {
            // If we're adding a new line, we need to account for the previously added ones.
            newSelections.push(
              new Selection(
                selection.start.translate({ lineDelta: newLineCount }),
                selection.end.translate({ lineDelta: newLineCount++ })
              )
            )
          } else {
            // Otherwise, we need to restore the selection.
            newSelections.push(selection)
          }
        }

        editBuilder.replace(line.range.end.translate({ characterDelta: trimmedDelta }), symbol)

        if (addNewLine) {
          editBuilder.replace(line.range.end, `\n${lead}`)
        }
      }
    }
  })

  editor.selections = newSelections
}

export type TrailingCommand = `trailing.toggle${string}${typeof commandWithNewLineSuffix | ''}`
