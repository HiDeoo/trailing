import { commands } from 'vscode'

import { TrailingCommands } from '../../extension'
import { assertDocumentTextEqual, withEditor } from '../utils'

suite('Trailing Test Suite', () => {
  test('should add a comma at the end', () =>
    withEditor('test', async (document) => {
      await commands.executeCommand(TrailingCommands.Toggle)

      assertDocumentTextEqual(document, 'test,')
    }))

  test('should remove a comma at the end', () =>
    withEditor('test,', async (document) => {
      await commands.executeCommand(TrailingCommands.Toggle)

      assertDocumentTextEqual(document, 'test')
    }))

  test('should add and remove a comma at the end', () =>
    withEditor('test', async (document) => {
      await commands.executeCommand(TrailingCommands.Toggle)

      assertDocumentTextEqual(document, 'test,')

      await commands.executeCommand(TrailingCommands.Toggle)

      assertDocumentTextEqual(document, 'test')
    }))
})
