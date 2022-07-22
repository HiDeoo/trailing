import { commands, type ExtensionContext, window } from "vscode";

export function activate(context: ExtensionContext) {
  console.log('Congratulations, your extension "trailing" is now active!');

  let disposable = commands.registerCommand("trailing.helloWorld", () => {
    window.showInformationMessage("Hello World from Trailing!");
  });

  context.subscriptions.push(disposable);
}
