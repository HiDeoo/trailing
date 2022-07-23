import { commands } from 'vscode'

import { type TrailingCommand, TrailingDefinitions, type TrailingSymbol } from '../../extension'
import { assertDocumentTextEqual, withEditor } from '../utils'

function runTestsWithCommandAndSymbol(command: TrailingCommand, symbol: TrailingSymbol) {
  suite(`Trailing Symbol '${symbol}'`, () => {
    test(`should add '${symbol}' at the end`, () =>
      withEditor('test', async (document) => {
        await commands.executeCommand(command)

        assertDocumentTextEqual(document, `test${symbol}`)
      }))

    test(`should remove '${symbol}' at the end`, () =>
      withEditor(`test${symbol}`, async (document) => {
        await commands.executeCommand(command)

        assertDocumentTextEqual(document, 'test')
      }))

    test(`should toggle '${symbol}' at the end`, () =>
      withEditor('test', async (document) => {
        await commands.executeCommand(command)

        assertDocumentTextEqual(document, `test${symbol}`)

        await commands.executeCommand(command)

        assertDocumentTextEqual(document, 'test')
      }))
  })
}

for (const [command, symbol] of TrailingDefinitions) {
  runTestsWithCommandAndSymbol(command, symbol)
}
