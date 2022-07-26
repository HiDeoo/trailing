import { stripIndent } from 'common-tags'
import { commands, Position, Selection } from 'vscode'

import { type TrailingCommand, type TrailingSymbol } from '../extension'

import {
  assertPositionEqual,
  assertPositionsEqual,
  assertSelectionEqual,
  assertSelectionsEqual,
  assertTextEqual,
  getCommands,
  getTestSettings,
  replaceEditorContent,
  withEditor,
} from './utils'

function runTestsWithCommandAndSymbol(command: TrailingCommand, symbol: TrailingSymbol) {
  describe(`Trailing Symbol '${symbol}' with new line`, () => {
    it(`should toggle a trailing '${symbol}'`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor) => {
          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}

              test 2
            `
          )
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(1, 0) : new Position(0, 0))

          await replaceEditorContent(
            editor,
            stripIndent`
              test 1${symbol}
              test 2
            `
          )

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1
              test 2
            `
          )
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(0, 6) : new Position(0, 0))
        }
      ))

    it(`should toggle a trailing '${symbol}' with the cursor at the end of the line`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor) => {
          let position = new Position(0, 6)
          editor.selection = new Selection(position, position)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}

              test 2
            `
          )
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(1, 0) : position)

          await replaceEditorContent(
            editor,
            stripIndent`
              test 1${symbol}
              test 2
            `
          )

          position = new Position(0, 7)
          editor.selection = new Selection(position, position)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1
              test 2
            `
          )
          assertPositionEqual(editor, new Position(0, 6))
        }
      ))

    it(`should toggle a trailing '${symbol}' with a line partially selected`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor) => {
          let selection = new Selection(new Position(0, 1), new Position(0, 3))
          editor.selection = selection

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}

              test 2
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(1, 0))
            : assertSelectionEqual(editor, selection)

          await replaceEditorContent(
            editor,
            stripIndent`
              test 1${symbol}
              test 2
            `
          )

          selection = new Selection(new Position(0, 2), new Position(0, 4))
          editor.selection = selection

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1
              test 2
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(0, 6))
            : assertSelectionEqual(editor, selection)
        }
      ))

    it(`should toggle a trailing '${symbol}' with a line entirely selected`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor) => {
          let selection = new Selection(new Position(0, 0), new Position(0, 6))
          editor.selection = selection

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}

              test 2
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(1, 0))
            : assertSelectionEqual(editor, selection)

          await replaceEditorContent(
            editor,
            stripIndent`
              test 1${symbol}
              test 2
            `
          )

          selection = new Selection(new Position(0, 0), new Position(0, 7))
          editor.selection = selection

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1
              test 2
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(0, 6))
            : assertSelectionEqual(editor, new Selection(new Position(0, 0), new Position(0, 6)))
        }
      ))

    it(`should toggle a trailing '${symbol}' with extra whitespaces at the end`, () =>
      withEditor('test 1   \ntest 2', async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `test 1${symbol}   \n\ntest 2`)
        assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(1, 0) : new Position(0, 0))

        await replaceEditorContent(editor, `test 1${symbol}   \ntest 2`)

        await commands.executeCommand(command)

        assertTextEqual(document, `test 1   \ntest 2`)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 6 : 0))
      }))

    it(`should toggle a trailing '${symbol}' on empty lines`, () =>
      withEditor('', async (document, editor) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `${symbol}\n`)
        assertPositionEqual(editor, new Position(getTestSettings().jumpToSymbol ? 1 : 0, 0))

        const position = new Position(0, 0)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, '\n')
        assertPositionEqual(editor, new Position(0, 0))
      }))

    it(`should toggle a trailing '${symbol}' on multiple lines`, () =>
      withEditor(
        stripIndent`
          test 1
          test test 2
          test 3
          test test 4
          test test 5
        `,
        async (document, editor) => {
          let positions = [new Position(0, 0), new Position(2, 2), new Position(3, 7)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}

              test test 2
              test 3${symbol}

              test test 4${symbol}

              test test 5
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 0), new Position(4, 0), new Position(6, 0)]
              : [new Position(0, 0), new Position(3, 2), new Position(5, 7)]
          )

          positions = [new Position(0, 0), new Position(3, 2), new Position(5, 7)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1

              test test 2
              test 3

              test test 4

              test test 5
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(0, 6), new Position(3, 6), new Position(5, 11)] : positions
          )
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with the cursor at the end of the lines`, () =>
      withEditor(
        stripIndent`
          test 1
          test test 2
          test 3
          test test 4
        `,
        async (document, editor) => {
          let positions = [new Position(0, 6), new Position(1, 11), new Position(2, 6)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}

              test test 2${symbol}

              test 3${symbol}

              test test 4
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 0), new Position(3, 0), new Position(5, 0)]
              : [new Position(0, 6), new Position(2, 11), new Position(4, 6)]
          )

          positions = [new Position(0, 7), new Position(2, 12), new Position(4, 7)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1

              test test 2

              test 3

              test test 4
            `
          )
          assertPositionsEqual(editor, [new Position(0, 6), new Position(2, 11), new Position(4, 6)])
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with some lines partially selected`, () =>
      withEditor(
        stripIndent`
          test test 1
          test 2
          test test 3
          test 4
        `,
        async (document, editor) => {
          let selections = [
            new Selection(new Position(0, 0), new Position(0, 2)),
            new Selection(new Position(1, 1), new Position(1, 1)),
            new Selection(new Position(2, 1), new Position(2, 7)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          selections = [
            new Selection(new Position(0, 0), new Position(0, 2)),
            new Selection(new Position(2, 1), new Position(2, 1)),
            new Selection(new Position(4, 1), new Position(4, 7)),
          ]

          assertTextEqual(
            document,
            stripIndent`
              test test 1${symbol}

              test 2${symbol}

              test test 3${symbol}

              test 4
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 0), new Position(3, 0), new Position(5, 0)])
            : assertSelectionsEqual(editor, selections)

          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1

              test 2

              test test 3

              test 4
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 11), new Position(2, 6), new Position(4, 11)])
            : assertSelectionsEqual(editor, selections)
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with some lines entirely selected`, () =>
      withEditor(
        stripIndent`
          test 1
          test test 2
          test 3
          test test 4
          test test 5
        `,
        async (document, editor) => {
          let selections = [
            new Selection(new Position(0, 0), new Position(0, 6)),
            new Selection(new Position(2, 0), new Position(2, 6)),
            new Selection(new Position(3, 0), new Position(3, 11)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          selections = [
            new Selection(new Position(0, 0), new Position(0, 6)),
            new Selection(new Position(3, 0), new Position(3, 6)),
            new Selection(new Position(5, 0), new Position(5, 11)),
          ]

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}

              test test 2
              test 3${symbol}

              test test 4${symbol}

              test test 5
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 0), new Position(4, 0), new Position(6, 0)])
            : assertSelectionsEqual(editor, selections)

          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1

              test test 2
              test 3

              test test 4

              test test 5
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 6), new Position(3, 6), new Position(5, 11)])
            : assertSelectionsEqual(editor, selections)
        }
      ))

    it(`should add and remove a trailing '${symbol}' at the same time on multiple lines`, () =>
      withEditor(
        stripIndent`
          test test 1
          test 2,
          test test 3
          test 4,
          test test 5,
        `,
        async (document, editor) => {
          let positions = [new Position(0, 0), new Position(1, 2), new Position(2, 7), new Position(3, 3)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          positions = [new Position(0, 0), new Position(2, 2), new Position(3, 7), new Position(5, 3)]

          assertTextEqual(
            document,
            stripIndent`
              test test 1${symbol}

              test 2
              test test 3${symbol}

              test 4
              test test 5,
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 0), new Position(2, 6), new Position(4, 0), new Position(5, 6)]
              : positions
          )

          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1

              test 2${symbol}

              test test 3

              test 4${symbol}

              test test 5,
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(0, 11), new Position(3, 0), new Position(4, 11), new Position(7, 0)]
              : [new Position(0, 0), new Position(2, 2), new Position(4, 7), new Position(6, 3)]
          )
        }
      ))

    it(`should handle multiple selection on the same line when toggling trailing '${symbol}'`, () =>
      withEditor(
        stripIndent`
          test1 test2 test3
          test4 test5 test6
          test7 test8 test9
        `,
        async (document, editor) => {
          let selections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(0, 6), new Position(0, 10)),
            new Selection(new Position(0, 12), new Position(0, 16)),
            new Selection(new Position(1, 2), new Position(1, 4)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          selections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(0, 6), new Position(0, 10)),
            new Selection(new Position(0, 12), new Position(0, 16)),
            new Selection(new Position(2, 2), new Position(2, 4)),
          ]

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3${symbol}

              test4 test5 test6${symbol}

              test7 test8 test9
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 0), new Position(3, 0)])
            : assertSelectionsEqual(editor, selections)

          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3

              test4 test5 test6

              test7 test8 test9
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 17), new Position(2, 17)])
            : assertSelectionsEqual(editor, selections)
        }
      ))

    it(`should handle multiple cursors on the same line when toggling trailing '${symbol}'`, () =>
      withEditor(
        stripIndent`
          test1 test2 test3
          test4 test5 test6
          test7 test8 test9
        `,
        async (document, editor) => {
          let positions = [new Position(0, 0), new Position(0, 6), new Position(0, 12), new Position(1, 2)]
          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          positions = [new Position(0, 0), new Position(0, 6), new Position(0, 12), new Position(2, 2)]

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3${symbol}

              test4 test5 test6${symbol}

              test7 test8 test9
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 0), new Position(3, 0)])
            : assertPositionsEqual(editor, positions)

          editor.selections = positions.map((position) => new Selection(position, position))

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3

              test4 test5 test6

              test7 test8 test9
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 17), new Position(2, 17)])
            : assertPositionsEqual(editor, positions)
        }
      ))
  })
}

for (const [command, symbol] of getCommands(true)) {
  runTestsWithCommandAndSymbol(command, symbol)
}
