import { stripIndent } from 'common-tags'
import { commands, Position, Selection } from 'vscode'

import { type TrailingCommand, TrailingDefinitions, type TrailingSymbol } from '../extension'

import {
  assertPositionEqual,
  assertPositionsEqual,
  assertSelectionEqual,
  assertSelectionsEqual,
  assertTextEqual,
  getTestSettings,
  withEditor,
} from './utils'

function runTestsWithCommandAndSymbol(command: TrailingCommand, symbol: TrailingSymbol) {
  describe(`Trailing Symbol '${symbol}'`, () => {
    it(`should toggle a trailing '${symbol}'`, () =>
      withEditor('test', async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 4 : 0))
      }))

    it(`should toggle a trailing '${symbol}' with the cursor at the end of the line`, () =>
      withEditor('test', async (document, editor) => {
        let position = new Position(0, 4)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 4))

        position = new Position(0, 5)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        assertPositionEqual(editor, new Position(0, 4))
      }))

    it(`should toggle a trailing '${symbol}' with a line partially selected`, () =>
      withEditor('test', async (document, editor) => {
        let initialSelection = new Selection(new Position(0, 0), new Position(0, 2))
        editor.selection = initialSelection

        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 5))
          : assertSelectionEqual(editor, initialSelection)

        initialSelection = new Selection(new Position(0, 3), new Position(0, 5))
        editor.selection = initialSelection

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 4))
          : assertSelectionEqual(editor, initialSelection)
      }))

    it(`should toggle a trailing '${symbol}' with a line entirely selected`, () =>
      withEditor('test', async (document, editor) => {
        let initialSelection = new Selection(new Position(0, 0), new Position(0, 4))
        editor.selection = initialSelection

        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}`)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 5))
          : assertSelectionEqual(editor, initialSelection)

        initialSelection = new Selection(new Position(0, 0), new Position(0, 5))
        editor.selection = initialSelection

        await commands.executeCommand(command)

        assertTextEqual(document, 'test')
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 4))
          : assertSelectionEqual(editor, initialSelection)
      }))

    it(`should toggle a trailing '${symbol}' with extra whitespaces at the end`, () =>
      withEditor('test   ', async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}   `)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, 'test   ')
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 4 : 0))
      }))

    it(`should toggle a trailing '${symbol}' on empty lines`, () =>
      withEditor('', async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, symbol)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 1 : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, '')
        assertPositionEqual(editor, new Position(0, 0))
      }))

    it(`should toggle a trailing '${symbol}' on multiple lines`, () =>
      withEditor(
        stripIndent`
          test 1
          test test 2
          test 3
          test test 4`,
        async (document, editor) => {
          const positions = [new Position(0, 0), new Position(2, 2), new Position(3, 7)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}
              test test 2
              test 3${symbol}
              test test 4${symbol}`
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 7 : 12))
              : positions
          )

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1
              test test 2
              test 3
              test test 4`
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 6 : 11))
              : positions
          )
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with the cursor at the end of the lines`, () =>
      withEditor(
        stripIndent`
          test 1
          test test 2
          test 3
          test test 4`,
        async (document, editor) => {
          const positions = [new Position(0, 6), new Position(1, 11), new Position(3, 11)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}
              test test 2${symbol}
              test 3
              test test 4${symbol}`
          )
          assertPositionsEqual(
            editor,
            positions.map(
              (position) =>
                new Position(
                  position.line,
                  getTestSettings().jumpToSymbol ? (position.line % 2 === 0 ? 7 : 12) : position.line % 2 === 0 ? 6 : 11
                )
            )
          )

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1
              test test 2
              test 3
              test test 4`
          )
          assertPositionsEqual(
            editor,
            positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 6 : 11))
          )
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with some lines partially selected`, () =>
      withEditor(
        stripIndent`
          test test 1
          test 2
          test test 3
          test 4`,
        async (document, editor) => {
          const selections = [
            new Selection(new Position(0, 0), new Position(0, 2)),
            new Selection(new Position(1, 1), new Position(1, 1)),
            new Selection(new Position(2, 1), new Position(2, 7)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1${symbol}
              test 2${symbol}
              test test 3${symbol}
              test 4`
          )
          assertSelectionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? selections.map((selection) => {
                  const position = new Position(selection.start.line, selection.start.line % 2 === 0 ? 12 : 7)
                  return new Selection(position, position)
                })
              : selections
          )

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1
              test 2
              test test 3
              test 4`
          )
          assertSelectionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? selections.map((selection) => {
                  const position = new Position(selection.start.line, selection.start.line % 2 === 0 ? 11 : 6)
                  return new Selection(position, position)
                })
              : selections
          )
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with some lines entirely selected`, () =>
      withEditor(
        stripIndent`
          test 1
          test test 2
          test 3
          test test 4`,
        async (document, editor) => {
          const selections = [
            new Selection(new Position(0, 0), new Position(0, 6)),
            new Selection(new Position(2, 0), new Position(2, 6)),
            new Selection(new Position(3, 0), new Position(3, 11)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}
              test test 2
              test 3${symbol}
              test test 4${symbol}`
          )
          assertSelectionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? selections.map((selection) => {
                  const position = new Position(selection.start.line, selection.start.line % 2 === 0 ? 7 : 12)
                  return new Selection(position, position)
                })
              : selections
          )

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1
              test test 2
              test 3
              test test 4`
          )
          assertSelectionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? selections.map((selection) => {
                  const position = new Position(selection.start.line, selection.start.line % 2 === 0 ? 6 : 11)
                  return new Selection(position, position)
                })
              : selections
          )
        }
      ))

    it(`should add and remove a trailing '${symbol}' at the same time on multiple lines`, () =>
      withEditor(
        stripIndent`
          test test 1
          test 2,
          test test 3
          test 4,`,
        async (document, editor) => {
          const positions = [new Position(0, 0), new Position(1, 2), new Position(2, 7), new Position(3, 3)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1${symbol}
              test 2
              test test 3${symbol}
              test 4`
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 12 : 6))
              : positions
          )

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1
              test 2,
              test test 3
              test 4,`
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 11 : 7))
              : positions
          )
        }
      ))

    it(`should handle multiple selection on the same line when toggling trailing '${symbol}'`, () =>
      withEditor(
        stripIndent`
          test1 test2 test3
          test4 test5 test6`,
        async (document, editor) => {
          const selections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(0, 6), new Position(0, 10)),
            new Selection(new Position(0, 12), new Position(0, 16)),
            new Selection(new Position(1, 2), new Position(1, 4)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3${symbol}
              test4 test5 test6${symbol}`
          )
          getTestSettings().jumpToSymbol
            ? assertSelectionsEqual(editor, [
                new Selection(new Position(0, 18), new Position(0, 18)),
                new Selection(new Position(1, 18), new Position(1, 18)),
              ])
            : assertSelectionsEqual(editor, selections)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3
              test4 test5 test6`
          )
          getTestSettings().jumpToSymbol
            ? assertSelectionsEqual(editor, [
                new Selection(new Position(0, 17), new Position(0, 17)),
                new Selection(new Position(1, 17), new Position(1, 17)),
              ])
            : assertSelectionsEqual(editor, selections)
        }
      ))

    it(`should handle multiple cursors on the same line when toggling trailing '${symbol}'`, () =>
      withEditor(
        stripIndent`
          test1 test2 test3
          test4 test5 test6`,
        async (document, editor) => {
          const positions = [new Position(0, 0), new Position(0, 6), new Position(0, 12), new Position(1, 2)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3${symbol}
              test4 test5 test6${symbol}`
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 18), new Position(1, 18)])
            : assertPositionsEqual(editor, positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3
              test4 test5 test6`
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 17), new Position(1, 17)])
            : assertPositionsEqual(editor, positions)
        }
      ))
  })
}

for (const [command, symbol] of TrailingDefinitions) {
  if (!command.endsWith('WithNewLine')) {
    runTestsWithCommandAndSymbol(command, symbol)
  }
}
