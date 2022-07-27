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
  getEditor,
  getSelectionsFromPositions,
  getTestSettings,
  replaceEditorContent,
  withEditor,
} from './utils'

function runTestsWithCommandAndSymbol(command: TrailingCommand, symbol: TrailingSymbol) {
  describe(`Trailing Symbol '${symbol}'`, () => {
    it(`should toggle a trailing '${symbol}'`, () =>
      withEditor('test', async (document, editor, content) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `${content}${symbol}`)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, content)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 4 : 0))
      }))

    it(`should toggle a trailing '${symbol}' with comments on the line`, async () => {
      const { document, editor } = await getEditor()

      const tests: [before: string, after: string, jumpPosition: number][] = [
        ['test // ignore', `test${symbol} // ignore`, 5],
        ['test     // ignore', `test${symbol}     // ignore`, 5],
        ['\ttest // ignore', `\ttest${symbol} // ignore`, 6],
        ['test // ignore // ignore\t', `test${symbol} // ignore // ignore\t`, 5],
        ['test /* ignore */', `test${symbol} /* ignore */`, 5],
        ['test /* do not ignore */ test', `test /* do not ignore */ test${symbol}`, 30],
        ['test /* do not ignore */ test // ignore', `test /* do not ignore */ test${symbol} // ignore`, 30],
      ]

      for (const [before, after, jumpPosition] of tests) {
        await replaceEditorContent(editor, before)

        await commands.executeCommand(command)

        assertTextEqual(document, after)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? jumpPosition : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, before)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? jumpPosition - 1 : 0))
      }
    })

    it(`should toggle a trailing '${symbol}' with the cursor at the end of the line`, () =>
      withEditor('test', async (document, editor, content) => {
        let position = new Position(0, 4)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, `${content}${symbol}`)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 4))

        position = new Position(0, 5)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, content)
        assertPositionEqual(editor, new Position(0, 4))
      }))

    it(`should toggle a trailing '${symbol}' with a line partially selected`, () =>
      withEditor('test', async (document, editor, content) => {
        let selection = new Selection(new Position(0, 0), new Position(0, 2))
        editor.selection = selection

        await commands.executeCommand(command)

        assertTextEqual(document, `${content}${symbol}`)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 5))
          : assertSelectionEqual(editor, selection)

        selection = new Selection(new Position(0, 2), new Position(0, 4))
        editor.selection = selection

        await commands.executeCommand(command)

        assertTextEqual(document, content)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 4))
          : assertSelectionEqual(editor, selection)
      }))

    it(`should toggle a trailing '${symbol}' with a line entirely selected`, () =>
      withEditor('test', async (document, editor, content) => {
        let selection = new Selection(new Position(0, 0), new Position(0, 4))
        editor.selection = selection

        await commands.executeCommand(command)

        assertTextEqual(document, `${content}${symbol}`)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 5))
          : assertSelectionEqual(editor, selection)

        selection = new Selection(new Position(0, 0), new Position(0, 5))
        editor.selection = selection

        await commands.executeCommand(command)

        assertTextEqual(document, content)
        getTestSettings().jumpToSymbol
          ? assertPositionEqual(editor, new Position(0, 4))
          : assertSelectionEqual(editor, new Selection(new Position(0, 0), new Position(0, 4)))
      }))

    it(`should toggle a trailing '${symbol}' with extra whitespaces at the end`, () =>
      withEditor('test   ', async (document, editor, content) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `test${symbol}   `)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 5 : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, content)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 4 : 0))
      }))

    it(`should toggle a trailing '${symbol}' on empty lines`, () =>
      withEditor('', async (document, editor, content) => {
        await commands.executeCommand(command)

        assertTextEqual(document, symbol)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 1 : 0))

        await commands.executeCommand(command)

        assertTextEqual(document, content)
        assertPositionEqual(editor, new Position(0, 0))
      }))

    it(`should toggle a trailing '${symbol}' on multiple lines`, () =>
      withEditor(
        stripIndent`
          test 1
          test test 2
          test 3
          test test 4
        `,
        async (document, editor, content) => {
          const positions = [new Position(0, 0), new Position(2, 2), new Position(3, 7)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}
              test test 2
              test 3${symbol}
              test test 4${symbol}
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 7 : 12))
              : positions
          )

          await commands.executeCommand(command)

          assertTextEqual(document, content)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 6 : 11))
              : positions
          )
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with comments on the lines`, () =>
      withEditor(
        stripIndent`
          test // ignore
          test     // ignore
            test // ignore
          test // ignore // ignore
          test /* ignore */
          test /* do not ignore */ test
          test /* do not ignore */ test // ignore
        `,
        async (document, editor, content) => {
          const positions = [
            new Position(0, 0),
            new Position(1, 2),
            new Position(2, 7),
            new Position(3, 4),
            new Position(4, 3),
            new Position(5, 0),
            new Position(6, 1),
          ]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test${symbol} // ignore
              test${symbol}     // ignore
                test${symbol} // ignore
              test${symbol} // ignore // ignore
              test${symbol} /* ignore */
              test /* do not ignore */ test${symbol}
              test /* do not ignore */ test${symbol} // ignore
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [
                  new Position(0, 5),
                  new Position(1, 5),
                  new Position(2, 7),
                  new Position(3, 5),
                  new Position(4, 5),
                  new Position(5, 30),
                  new Position(6, 30),
                ]
              : positions
          )

          await commands.executeCommand(command)

          assertTextEqual(document, content)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [
                  new Position(0, 4),
                  new Position(1, 4),
                  new Position(2, 6),
                  new Position(3, 4),
                  new Position(4, 4),
                  new Position(5, 29),
                  new Position(6, 29),
                ]
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
          test test 4
        `,
        async (document, editor, content) => {
          const positions = [new Position(0, 6), new Position(1, 11), new Position(3, 11)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test 1${symbol}
              test test 2${symbol}
              test 3
              test test 4${symbol}
            `
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

          assertTextEqual(document, content)
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
          test 4
        `,
        async (document, editor, content) => {
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
              test 4
            `
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

          assertTextEqual(document, content)
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
          test test 4
        `,
        async (document, editor, content) => {
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
              test test 4${symbol}
            `
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

          assertTextEqual(document, content)
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
          test 4,
        `,
        async (document, editor, content) => {
          const positions = [new Position(0, 0), new Position(1, 2), new Position(2, 7), new Position(3, 3)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1${symbol}
              test 2
              test test 3${symbol}
              test 4
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? positions.map((position) => new Position(position.line, position.line % 2 === 0 ? 12 : 6))
              : positions
          )

          await commands.executeCommand(command)

          assertTextEqual(document, content)
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
          test4 test5 test6
        `,
        async (document, editor, content) => {
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
              test4 test5 test6${symbol}
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 18), new Position(1, 18)])
            : assertSelectionsEqual(editor, selections)

          await commands.executeCommand(command)

          assertTextEqual(document, content)
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 17), new Position(1, 17)])
            : assertSelectionsEqual(editor, selections)
        }
      ))

    it(`should handle multiple cursors on the same line when toggling trailing '${symbol}'`, () =>
      withEditor(
        stripIndent`
          test1 test2 test3
          test4 test5 test6
        `,
        async (document, editor, content) => {
          const positions = [new Position(0, 0), new Position(0, 6), new Position(0, 12), new Position(1, 2)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test1 test2 test3${symbol}
              test4 test5 test6${symbol}
            `
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 18), new Position(1, 18)])
            : assertPositionsEqual(editor, positions)

          await commands.executeCommand(command)

          assertTextEqual(document, content)
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 17), new Position(1, 17)])
            : assertPositionsEqual(editor, positions)
        }
      ))
  })
}

for (const [command, symbol] of getCommands(false)) {
  runTestsWithCommandAndSymbol(command, symbol)
}
