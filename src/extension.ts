import {
  commands,
  type ExtensionContext,
  Selection,
  type TextEditorEdit,
  type TextLine,
  window,
  workspace,
} from 'vscode'

export enum TrailingSymbol {
  Comma = ',',
}

export const commandWithNewLineSuffix = 'WithNewLine'

export const TrailingDefinitions = new Map<TrailingCommand, TrailingSymbol>([
  ['trailing.toggleComma', TrailingSymbol.Comma],
  [`trailing.toggleComma${commandWithNewLineSuffix}`, TrailingSymbol.Comma],
])

const leadRegExp = /^(?<lead>\s*)/

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

  const jumpToSymbol = workspace
    .getConfiguration('trailing', window.activeTextEditor?.document)
    .get<boolean>('jumpToSymbol', true)

  const edit: Edit = {
    addNewLine,
    jumpToSymbol,
    lastHandledLineIndex: -1,
    newLineCount: 0,
    newSelections: [],
    oldSelections: editor.selections,
    symbol,
  }

  await editor.edit(async (editBuilder) => {
    for (const selection of edit.oldSelections) {
      const lineIndex = selection.active.line

      if (edit.lastHandledLineIndex === lineIndex) {
        if (!jumpToSymbol) {
          // If a selection on this line has already been handled and we're creating a new selection to jum to the new
          // symbol, we need to restore this selection.
          edit.newSelections.push(selection)
        }

        // If a selection on this line has already been handled, we don't need to do anything.
        continue
      }

      edit.lastHandledLineIndex = lineIndex

      const textLine = editor.document.lineAt(selection.active.line)
      const trimmedText = textLine.text.trimEnd()
      const trimmedDelta = -1 * (textLine.text.length - trimmedText.length)

      const line: Line = {
        textLine,
        trimmedDelta,
        trimmedText,
      }

      if (trimmedText.charAt(trimmedText.length - symbol.length) === symbol) {
        removeSymbol(edit, line, selection, editBuilder)
      } else {
        addSymbol(edit, line, selection, editBuilder)
      }
    }
  })

  editor.selections = edit.newSelections
}

function addSymbol(edit: Edit, line: Line, selection: Selection, builder: TextEditorEdit) {
  let lead = ''

  if (edit.addNewLine) {
    const matches = line.trimmedText.match(leadRegExp)

    if (matches?.groups?.lead && matches.groups.lead.length > 0) {
      lead = matches.groups.lead
    }
  }

  if (edit.jumpToSymbol) {
    const newPosition = edit.addNewLine
      ? // If we're jumping to the symbol and adding a new line, we need to position the cursor at the beginning of this
        // new line.
        selection.active.with({
          character: lead.length,
          line: line.textLine.lineNumber + ++edit.newLineCount,
        })
      : // If we're jumping to the symbol and not adding a new line, we need to position the cursor after the added
        // symbol.
        selection.active.with({
          character: line.textLine.range.end.character + edit.symbol.length + line.trimmedDelta,
        })
    edit.newSelections.push(new Selection(newPosition, newPosition))
  } else {
    if (edit.addNewLine) {
      // If we're adding a new line, we need to account for the previously added ones.
      edit.newSelections.push(
        new Selection(
          selection.start.translate({ lineDelta: edit.newLineCount }),
          selection.end.translate({ lineDelta: edit.newLineCount++ })
        )
      )
    } else {
      // Otherwise, we need to restore the selection.
      edit.newSelections.push(selection)
    }
  }

  builder.replace(line.textLine.range.end.translate({ characterDelta: line.trimmedDelta }), edit.symbol)

  if (edit.addNewLine) {
    builder.replace(line.textLine.range.end, `\n${lead}`)
  }
}

function removeSymbol(edit: Edit, line: Line, selection: Selection, builder: TextEditorEdit) {
  const removedSelection = new Selection(
    line.textLine.range.end.translate({ characterDelta: line.trimmedDelta - 1 }),
    line.textLine.range.end.translate({ characterDelta: line.trimmedDelta })
  )

  if (edit.jumpToSymbol) {
    // If we're jumping to the symbol when deleting it, we need to position the cursor at the start of the removed
    // symbol range.
    edit.newSelections.push(
      new Selection(
        removedSelection.start.translate({ lineDelta: edit.newLineCount }),
        removedSelection.start.translate({ lineDelta: edit.newLineCount })
      )
    )
  } else {
    if (selection.end.isEqual(selection.start) && selection.end.character === line.textLine.text.length) {
      // If the selection range is empty and the cursor is at the end of the line, we need to adjust the cursor position
      // to account for the removed symbol.
      const newPosition = selection.end.translate({ characterDelta: -1 * edit.symbol.length })
      edit.newSelections.push(line.trimmedDelta === 0 ? new Selection(newPosition, newPosition) : selection)
    } else if (selection.end.character === line.textLine.text.length) {
      // If the cursor is at the end of the line, we need to adjust the cursor position to account for the removed
      // symbol.
      edit.newSelections.push(
        line.trimmedDelta === 0
          ? new Selection(selection.start, selection.end.translate({ characterDelta: -1 * edit.symbol.length }))
          : selection
      )
    } else {
      if (edit.addNewLine) {
        // If we added a new line, we need to account for the previously added ones.
        edit.newSelections.push(
          new Selection(
            selection.start.translate({ lineDelta: edit.newLineCount }),
            selection.end.translate({ lineDelta: edit.newLineCount })
          )
        )
      } else {
        // Otherwise, we need to restore the selection.
        edit.newSelections.push(selection)
      }
    }
  }

  builder.replace(removedSelection, '')
}

export type TrailingCommand = `trailing.toggle${string}${typeof commandWithNewLineSuffix | ''}`

interface Edit {
  addNewLine: boolean
  jumpToSymbol: boolean
  lastHandledLineIndex: number
  newLineCount: number
  newSelections: Selection[]
  oldSelections: readonly Selection[]
  symbol: string
}

interface Line {
  textLine: TextLine
  trimmedDelta: number
  trimmedText: string
}
