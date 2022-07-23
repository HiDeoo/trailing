import { commands, Position, Selection } from 'vscode'

import { type TrailingCommand, TrailingDefinitions, type TrailingSymbol } from '../extension'

import { assertPositionEqual, assertTextEqual, assertSelectionsEqual, getTestSettings, withEditor } from './utils'

function runTestsWithCommandAndSymbol(command: TrailingCommand, symbol: TrailingSymbol) {
  describe(`Trailing Symbol '${symbol}'`, () => {
    it(`should add trailing '${symbol}'`, () =>
      withEditor('test', async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 0))
      }))

    it(`should remove trailing '${symbol}'`, () =>
      withEditor(`test${symbol}`, async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 4 : 0))
      }))

    it(`should toggle trailing '${symbol}'`, () =>
      withEditor('test', async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 4 : 0))
      }))

    it(`should toggle trailing '${symbol}' with the cursor at the end of the line`, () =>
      withEditor('test', async (document, editor) => {
        let position = new Position(0, 4)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        // When adding a trailing symbol with the cursor at the end of the line, the cursor will be automatically
        // moved to the end of the line.
        // https://github.com/microsoft/vscode/issues/141946
        assertPositionEqual(editor, new Position(0, 5))

        position = new Position(0, 5)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        assertPositionEqual(editor, new Position(0, 4))
      }))

    it(`should toggle trailing '${symbol}' with a line partially selected`, () =>
      withEditor('test', async (document, editor) => {
        const initialSelection = new Selection(new Position(0, 0), new Position(0, 2))
        editor.selection = initialSelection

        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 5))
          : assertSelectionsEqual(editor, initialSelection)

        editor.selection = new Selection(new Position(0, 3), new Position(0, 5))

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 4))
          : assertSelectionsEqual(editor, new Selection(new Position(0, 3), new Position(0, 4)))
      }))

    it(`should toggle trailing '${symbol}' with a line entirely selected`, () =>
      withEditor('test', async (document, editor) => {
        const initialSelection = new Selection(new Position(0, 0), new Position(0, 4))
        editor.selection = initialSelection

        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 5))
          : // When adding a trailing symbol with the entire line is selected, the selection will be automatically
            // expanded.
            // https://github.com/microsoft/vscode/issues/141946
            assertSelectionsEqual(editor, new Selection(new Position(0, 0), new Position(0, 5)))

        editor.selection = new Selection(new Position(0, 0), new Position(0, 5))

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 4))
          : assertSelectionsEqual(editor, new Selection(new Position(0, 0), new Position(0, 4)))
      }))
  })
}

for (const [command, symbol] of TrailingDefinitions) {
  runTestsWithCommandAndSymbol(command, symbol)
}
