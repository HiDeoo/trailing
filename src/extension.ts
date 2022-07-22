import { commands, type ExtensionContext, window } from 'vscode'

export function activate(context: ExtensionContext) {
  console.error('Congratulations, your extension "trailing" is now active!')

  const disposable = commands.registerCommand('trailing.helloWorld', () => {
    window.showInformationMessage('Hello World from Trailing!')
  })

  context.subscriptions.push(disposable)
}
