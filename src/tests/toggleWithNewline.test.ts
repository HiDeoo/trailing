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
  describe(`Trailing Symbol '${symbol}' with new line`, () => {
    it(`should toggle a trailing '${symbol}'`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor, content) => {
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

          assertTextEqual(document, content)
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(0, 6) : new Position(0, 0))

          await replaceEditorContent(editor, '\ttest 1\n\ttest 2')

          const position = new Position(0, 1)
          editor.selection = new Selection(position, position)

          await commands.executeCommand(command)

          assertTextEqual(document, `\ttest 1${symbol}\n\t\n\ttest 2`)
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(1, 1) : position)

          editor.selection = new Selection(position, position)

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest 1\n\t\n\ttest 2')
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(0, 7) : position)
        }
      ))

    it(`should toggle a trailing '${symbol}' with comments on the line`, async () => {
      const { document, editor } = await getEditor()

      const tests: [before: string, after: string, firstJumpPosition: number, secondJumpPosition: number][] = [
        ['test // ignore', `test${symbol} // ignore\n`, 0, 4],
        ['test     // ignore', `test${symbol}     // ignore\n`, 0, 4],
        ['\ttest // ignore', `\ttest${symbol} // ignore\n\t`, 1, 5],
        ['test // ignore // ignore\t', `test${symbol} // ignore // ignore\t\n`, 0, 4],
        ['test /* ignore */', `test${symbol} /* ignore */\n`, 0, 4],
        ['test /* do not ignore */ test', `test /* do not ignore */ test${symbol}\n`, 0, 29],
        ['test /* do not ignore */ test // ignore', `test /* do not ignore */ test${symbol} // ignore\n`, 0, 29],
      ]

      for (const [before, after, firstJumpPosition, secondJumpPosition] of tests) {
        await replaceEditorContent(editor, before)

        await commands.executeCommand(command)

        assertTextEqual(document, after)
        assertPositionEqual(
          editor,
          getTestSettings().jumpToSymbol ? new Position(1, firstJumpPosition) : new Position(0, 0)
        )

        const position = new Position(0, 0)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, after.replace(symbol, ''))
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? secondJumpPosition : 0))
      }
    })

    it(`should toggle a trailing '${symbol}' with the cursor at the end of the line`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor, content) => {
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

          assertTextEqual(document, content)
          assertPositionEqual(editor, new Position(0, 6))

          await replaceEditorContent(editor, '  test 1\n  test 2')

          position = new Position(0, 8)
          editor.selection = new Selection(position, position)

          await commands.executeCommand(command)

          assertTextEqual(document, `  test 1${symbol}\n  \n  test 2`)
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(1, 2) : position)

          editor.selection = new Selection(position, position)

          await commands.executeCommand(command)

          assertTextEqual(document, '  test 1\n  \n  test 2')
          assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(0, 8) : position)
        }
      ))

    it(`should toggle a trailing '${symbol}' with a line partially selected`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor, content) => {
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

          assertTextEqual(document, content)
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(0, 6))
            : assertSelectionEqual(editor, selection)

          await replaceEditorContent(editor, '\t\ttest 1\n\t\ttest 2')

          selection = new Selection(new Position(0, 3), new Position(0, 6))
          editor.selection = selection

          await commands.executeCommand(command)

          assertTextEqual(document, `\t\ttest 1${symbol}\n\t\t\n\t\ttest 2`)
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(1, 2))
            : assertSelectionEqual(editor, selection)

          editor.selection = selection
          await commands.executeCommand(command)

          assertTextEqual(document, '\t\ttest 1\n\t\t\n\t\ttest 2')
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(0, 8))
            : assertSelectionEqual(editor, selection)
        }
      ))

    it(`should toggle a trailing '${symbol}' with a line entirely selected`, () =>
      withEditor(
        stripIndent`
          test 1
          test 2
        `,
        async (document, editor, content) => {
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

          assertTextEqual(document, content)
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(0, 6))
            : assertSelectionEqual(editor, new Selection(new Position(0, 0), new Position(0, 6)))

          await replaceEditorContent(editor, '\ttest 1\n\ttest 2')

          selection = new Selection(new Position(0, 0), new Position(0, 7))
          editor.selection = selection

          await commands.executeCommand(command)

          assertTextEqual(document, `\ttest 1${symbol}\n\t\n\ttest 2`)
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(1, 1))
            : assertSelectionEqual(editor, selection)

          selection = new Selection(new Position(0, 0), new Position(0, 8))
          editor.selection = selection

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest 1\n\t\n\ttest 2')
          getTestSettings().jumpToSymbol
            ? assertPositionEqual(editor, new Position(0, 7))
            : assertSelectionEqual(editor, new Selection(new Position(0, 0), new Position(0, 7)))
        }
      ))

    it(`should toggle a trailing '${symbol}' with extra whitespaces at the end`, () =>
      withEditor('test 1   \ntest 2', async (document, editor, content) => {
        await commands.executeCommand(command)

        assertTextEqual(document, `test 1${symbol}   \n\ntest 2`)
        assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(1, 0) : new Position(0, 0))

        await replaceEditorContent(editor, `test 1${symbol}   \ntest 2`)

        await commands.executeCommand(command)

        assertTextEqual(document, content)
        assertPositionEqual(editor, new Position(0, getTestSettings().jumpToSymbol ? 6 : 0))

        await replaceEditorContent(editor, '\ttest 1   \n\ttest 2')

        await commands.executeCommand(command)

        assertTextEqual(document, `\ttest 1${symbol}   \n\t\n\ttest 2`)
        assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(1, 1) : new Position(0, 0))

        const position = new Position(0, 0)
        editor.selection = new Selection(position, position)

        await commands.executeCommand(command)

        assertTextEqual(document, '\ttest 1   \n\t\n\ttest 2')
        assertPositionEqual(editor, getTestSettings().jumpToSymbol ? new Position(0, 7) : position)
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
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          const expectedContent = stripIndent`
            test 1${symbol}

            test test 2
            test 3${symbol}

            test test 4${symbol}

            test test 5
          `

          assertTextEqual(document, expectedContent)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 0), new Position(4, 0), new Position(6, 0)]
              : [new Position(0, 0), new Position(3, 2), new Position(5, 7)]
          )

          positions = [new Position(0, 0), new Position(3, 2), new Position(5, 7)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, expectedContent.replaceAll(symbol, ''))
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(0, 6), new Position(3, 6), new Position(5, 11)] : positions
          )

          await replaceEditorContent(editor, '\ttest 1\n\ttest 2\n\ttest 3\n\ttest 4')

          positions = [new Position(0, 0), new Position(2, 2), new Position(3, 7)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, `\ttest 1${symbol}\n\t\n\ttest 2\n\ttest 3${symbol}\n\t\n\ttest 4${symbol}\n\t`)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 1), new Position(4, 1), new Position(6, 1)]
              : [new Position(0, 0), new Position(3, 2), new Position(5, 7)]
          )

          positions = [new Position(0, 0), new Position(3, 2), new Position(5, 7)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest 1\n\t\n\ttest 2\n\ttest 3\n\t\n\ttest 4\n\t')
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(0, 7), new Position(3, 7), new Position(5, 7)] : positions
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
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          const expectedContent = stripIndent`
            test 1${symbol}

            test test 2${symbol}

            test 3${symbol}

            test test 4
          `

          assertTextEqual(document, expectedContent)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 0), new Position(3, 0), new Position(5, 0)]
              : [new Position(0, 6), new Position(2, 11), new Position(4, 6)]
          )

          positions = [new Position(0, 7), new Position(2, 12), new Position(4, 7)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, expectedContent.replaceAll(symbol, ''))
          assertPositionsEqual(editor, [new Position(0, 6), new Position(2, 11), new Position(4, 6)])

          await replaceEditorContent(editor, '\ttest 1\n\ttest test 2\n\ttest 3\n\ttest test 4')

          positions = [new Position(0, 6), new Position(1, 11), new Position(2, 6)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            `\ttest 1${symbol}\n\t\n\ttest test 2${symbol}\n\t\n\ttest 3${symbol}\n\t\n\ttest test 4`
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 1), new Position(3, 1), new Position(5, 1)]
              : [new Position(0, 6), new Position(2, 11), new Position(4, 6)]
          )

          positions = [new Position(0, 7), new Position(2, 12), new Position(4, 7)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest 1\n\t\n\ttest test 2\n\t\n\ttest 3\n\t\n\ttest test 4')
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(0, 7), new Position(2, 12), new Position(4, 7)] : positions
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
        async (document, editor) => {
          let selections = [
            new Selection(new Position(0, 0), new Position(0, 2)),
            new Selection(new Position(1, 1), new Position(1, 1)),
            new Selection(new Position(2, 1), new Position(2, 7)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          let expectedSelections = [
            new Selection(new Position(0, 0), new Position(0, 2)),
            new Selection(new Position(2, 1), new Position(2, 1)),
            new Selection(new Position(4, 1), new Position(4, 7)),
          ]

          const expectedContent = stripIndent`
            test test 1${symbol}

            test 2${symbol}

            test test 3${symbol}

            test 4
          `

          assertTextEqual(document, expectedContent)
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 0), new Position(3, 0), new Position(5, 0)])
            : assertSelectionsEqual(editor, expectedSelections)

          selections = expectedSelections
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(document, expectedContent.replaceAll(symbol, ''))
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 11), new Position(2, 6), new Position(4, 11)])
            : assertSelectionsEqual(editor, selections)

          await replaceEditorContent(editor, '\ttest 1\n\ttest 2\n\ttest 3\n\ttest 4')

          selections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(1, 1), new Position(1, 1)),
            new Selection(new Position(2, 1), new Position(2, 7)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          expectedSelections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(2, 1), new Position(2, 1)),
            new Selection(new Position(4, 1), new Position(4, 7)),
          ]

          assertTextEqual(document, `\ttest 1${symbol}\n\t\n\ttest 2${symbol}\n\t\n\ttest 3${symbol}\n\t\n\ttest 4`)
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 1), new Position(3, 1), new Position(5, 1)])
            : assertSelectionsEqual(editor, expectedSelections)

          selections = expectedSelections
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest 1\n\t\n\ttest 2\n\t\n\ttest 3\n\t\n\ttest 4')
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 7), new Position(2, 7), new Position(4, 7)])
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

          let expectedSelections = [
            new Selection(new Position(0, 0), new Position(0, 6)),
            new Selection(new Position(3, 0), new Position(3, 6)),
            new Selection(new Position(5, 0), new Position(5, 11)),
          ]

          const expectedContent = stripIndent`
            test 1${symbol}

            test test 2
            test 3${symbol}

            test test 4${symbol}

            test test 5
          `

          assertTextEqual(document, expectedContent)
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 0), new Position(4, 0), new Position(6, 0)])
            : assertSelectionsEqual(editor, expectedSelections)

          selections = expectedSelections
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(document, expectedContent.replaceAll(symbol, ''))
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 6), new Position(3, 6), new Position(5, 11)])
            : assertSelectionsEqual(editor, selections)

          await replaceEditorContent(editor, '\ttest 1\n\ttest test 2\n\ttest 3\n\ttest test 4')

          selections = [
            new Selection(new Position(0, 0), new Position(0, 6)),
            new Selection(new Position(2, 0), new Position(2, 6)),
            new Selection(new Position(3, 0), new Position(3, 11)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          expectedSelections = [
            new Selection(new Position(0, 0), new Position(0, 6)),
            new Selection(new Position(3, 0), new Position(3, 6)),
            new Selection(new Position(5, 0), new Position(5, 11)),
          ]

          assertTextEqual(
            document,
            `\ttest 1${symbol}\n\t\n\ttest test 2\n\ttest 3${symbol}\n\t\n\ttest test 4${symbol}\n\t`
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 1), new Position(4, 1), new Position(6, 1)])
            : assertSelectionsEqual(editor, expectedSelections)

          selections = expectedSelections
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest 1\n\t\n\ttest test 2\n\ttest 3\n\t\n\ttest test 4\n\t')
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 7), new Position(3, 7), new Position(5, 12)])
            : assertSelectionsEqual(editor, selections)
        }
      ))

    it(`should add and remove a trailing '${symbol}' at the same time on multiple lines`, () =>
      withEditor(
        stripIndent`
          test test 1
          test 2${symbol}
          test test 3
          test 4${symbol}
          test test 5${symbol}
        `,
        async (document, editor) => {
          let positions = [new Position(0, 0), new Position(1, 2), new Position(2, 7), new Position(3, 3)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          positions = [new Position(0, 0), new Position(2, 2), new Position(3, 7), new Position(5, 3)]

          assertTextEqual(
            document,
            stripIndent`
              test test 1${symbol}

              test 2
              test test 3${symbol}

              test 4
              test test 5${symbol}
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 0), new Position(2, 6), new Position(4, 0), new Position(5, 6)]
              : positions
          )

          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            stripIndent`
              test test 1

              test 2${symbol}

              test test 3

              test 4${symbol}

              test test 5${symbol}
            `
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(0, 11), new Position(3, 0), new Position(4, 11), new Position(7, 0)]
              : [new Position(0, 0), new Position(2, 2), new Position(4, 7), new Position(6, 3)]
          )

          await replaceEditorContent(editor, `\ttest test 1\n\ttest 2${symbol}\n\t\ttest test 3\n\ttest 4${symbol}`)

          positions = [new Position(0, 0), new Position(1, 2), new Position(2, 7), new Position(3, 3)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          positions = [new Position(0, 0), new Position(2, 2), new Position(3, 7), new Position(5, 3)]

          assertTextEqual(document, `\ttest test 1${symbol}\n\t\n\ttest 2\n\t\ttest test 3${symbol}\n\t\t\n\ttest 4`)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(1, 1), new Position(2, 7), new Position(4, 2), new Position(5, 7)]
              : positions
          )

          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(
            document,
            `\ttest test 1\n\t\n\ttest 2${symbol}\n\t\n\t\ttest test 3\n\t\t\n\ttest 4${symbol}\n\t`
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [new Position(0, 12), new Position(3, 1), new Position(4, 13), new Position(7, 1)]
              : [new Position(0, 0), new Position(2, 2), new Position(4, 7), new Position(6, 3)]
          )
        }
      ))

    it(`should toggle a trailing '${symbol}' on multiple lines with comments on the lines`, () =>
      withEditor(
        stripIndent`
          test // ignore
          test     // ignore
          test // ignore // ignore
          test /* ignore */
          test /* do not ignore */ test
          test /* do not ignore */ test // ignore
          test
        `,
        async (document, editor) => {
          let positions = [
            new Position(0, 0),
            new Position(1, 2),
            new Position(2, 4),
            new Position(3, 3),
            new Position(4, 0),
            new Position(5, 1),
          ]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          positions = positions.map((position, index) => new Position(position.line + 1 * index, position.character))

          const expectedContent = stripIndent`
            test${symbol} // ignore

            test${symbol}     // ignore

            test${symbol} // ignore // ignore

            test${symbol} /* ignore */

            test /* do not ignore */ test${symbol}

            test /* do not ignore */ test${symbol} // ignore

            test
          `

          assertTextEqual(document, expectedContent)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [
                  new Position(1, 0),
                  new Position(3, 0),
                  new Position(5, 0),
                  new Position(7, 0),
                  new Position(9, 0),
                  new Position(11, 0),
                ]
              : positions
          )

          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, expectedContent.replaceAll(symbol, ''))
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol
              ? [
                  new Position(0, 4),
                  new Position(2, 4),
                  new Position(4, 4),
                  new Position(6, 4),
                  new Position(8, 29),
                  new Position(10, 29),
                ]
              : positions
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

          let expectedSelections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(0, 6), new Position(0, 10)),
            new Selection(new Position(0, 12), new Position(0, 16)),
            new Selection(new Position(2, 2), new Position(2, 4)),
          ]

          const expectedContent = stripIndent`
            test1 test2 test3${symbol}

            test4 test5 test6${symbol}

            test7 test8 test9
          `

          assertTextEqual(document, expectedContent)
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 0), new Position(3, 0)])
            : assertSelectionsEqual(editor, expectedSelections)

          selections = expectedSelections
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(document, expectedContent.replaceAll(symbol, ''))
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 17), new Position(2, 17)])
            : assertSelectionsEqual(editor, selections)

          await replaceEditorContent(editor, '\ttest1 test2 test3\n\ttest4 test5 test6\n\ttest 7 test8 test9')

          selections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(0, 6), new Position(0, 10)),
            new Selection(new Position(0, 12), new Position(0, 16)),
            new Selection(new Position(1, 2), new Position(1, 4)),
          ]
          editor.selections = selections

          await commands.executeCommand(command)

          expectedSelections = [
            new Selection(new Position(0, 0), new Position(0, 4)),
            new Selection(new Position(0, 6), new Position(0, 10)),
            new Selection(new Position(0, 12), new Position(0, 16)),
            new Selection(new Position(2, 2), new Position(2, 4)),
          ]

          assertTextEqual(
            document,
            `\ttest1 test2 test3${symbol}\n\t\n\ttest4 test5 test6${symbol}\n\t\n\ttest 7 test8 test9`
          )
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(1, 1), new Position(3, 1)])
            : assertSelectionsEqual(editor, expectedSelections)

          selections = expectedSelections
          editor.selections = selections

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest1 test2 test3\n\t\n\ttest4 test5 test6\n\t\n\ttest 7 test8 test9')
          getTestSettings().jumpToSymbol
            ? assertPositionsEqual(editor, [new Position(0, 18), new Position(2, 18)])
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
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          positions = [new Position(0, 0), new Position(0, 6), new Position(0, 12), new Position(2, 2)]

          const expectedContent = stripIndent`
            test1 test2 test3${symbol}

            test4 test5 test6${symbol}

            test7 test8 test9
          `

          assertTextEqual(document, expectedContent)
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(1, 0), new Position(3, 0)] : positions
          )

          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, expectedContent.replaceAll(symbol, ''))
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(0, 17), new Position(2, 17)] : positions
          )

          await replaceEditorContent(editor, '\ttest1 test2 test3\n\ttest4 test5 test6\n\ttest 7 test8 test9')

          positions = [new Position(0, 0), new Position(0, 6), new Position(0, 12), new Position(1, 2)]
          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          positions = [new Position(0, 0), new Position(0, 6), new Position(0, 12), new Position(2, 2)]

          assertTextEqual(
            document,
            `\ttest1 test2 test3${symbol}\n\t\n\ttest4 test5 test6${symbol}\n\t\n\ttest 7 test8 test9`
          )
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(1, 1), new Position(3, 1)] : positions
          )

          editor.selections = getSelectionsFromPositions(positions)

          await commands.executeCommand(command)

          assertTextEqual(document, '\ttest1 test2 test3\n\t\n\ttest4 test5 test6\n\t\n\ttest 7 test8 test9')
          assertPositionsEqual(
            editor,
            getTestSettings().jumpToSymbol ? [new Position(0, 18), new Position(2, 18)] : positions
          )
        }
      ))
  })
}

for (const [command, symbol] of getCommands(true)) {
  runTestsWithCommandAndSymbol(command, symbol)
}
