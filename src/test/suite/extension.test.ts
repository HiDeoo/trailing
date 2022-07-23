import { commands, Position, Selection } from 'vscode'

import { type TrailingCommand, TrailingDefinitions, type TrailingSymbol } from '../../extension'
import { assertDocumentTextEqual, withEditor } from '../utils'

function runTestsWithCommandAndSymbol(command: TrailingCommand, symbol: TrailingSymbol) {
  suite(`Trailing Symbol '${symbol}'`, () => {
    test(`should add trailing '${symbol}'`, () =>
      withEditor('test', async (document) => {
        await commands.executeCommand(command)

        assertDocumentTextEqual(document, `test${symbol}`)
      }))

    test(`should remove trailing '${symbol}'`, () =>
      withEditor(`test${symbol}`, async (document) => {
        await commands.executeCommand(command)

        assertDocumentTextEqual(document, 'test')
      }))

    test(`should toggle trailing '${symbol}'`, () =>
      withEditor('test', async (document) => {
        await commands.executeCommand(command)

        assertDocumentTextEqual(document, `test${symbol}`)

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, 'test')
      }))

    test(`should toggle trailing '${symbol}' with the cursor at the end of the line`, () =>
      withEditor('test', async (document, editor) => {
        let position = new Position(0, 4)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, `test${symbol}`)

        position = new Position(0, 5)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, 'test')
      }))

    test(`should toggle trailing '${symbol}' with a line partially selected`, () =>
      withEditor('test', async (document, editor) => {
        editor.selection = new Selection(new Position(0, 0), new Position(0, 2))

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, `test${symbol}`)

        editor.selection = new Selection(new Position(0, 3), new Position(0, 5))

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, 'test')
      }))

    test(`should toggle trailing '${symbol}' with a line entirely selected`, () =>
      withEditor('test', async (document, editor) => {
        editor.selection = new Selection(new Position(0, 0), new Position(0, 4))

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, `test${symbol}`)

        editor.selection = new Selection(new Position(0, 0), new Position(0, 5))

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, 'test')
      }))
  })
}

for (const [command, symbol] of TrailingDefinitions) {
  runTestsWithCommandAndSymbol(command, symbol)
}
