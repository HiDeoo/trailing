<div align="center">
  <img alt="Trailing icon" src="https://i.imgur.com/c42AkiZ.png" width="128" />
  <h1 align="center">Trailing</h1>
</div>

<div align="center">
  <p><strong>Toggle trailing symbols: commas, semicolons and colons.</strong></p>
  <p>
  <a href="https://github.com/HiDeoo/trailing/actions/workflows/integration.yml">
    <img alt="Integration Status" src="https://github.com/HiDeoo/trailing/workflows/integration/badge.svg" />
  </a>
  <a href="https://github.com/HiDeoo/trailing/blob/main/LICENSE">
    <img alt="License" src="https://badgen.net/github/license/hideoo/trailing" />
  </a>
  </p>
  <p>
  <a href="https://i.imgur.com/H3InZe5.gif" title="Demo of the Trailing Extension">
    <img alt="Demo of the Trailing Extension" src="https://i.imgur.com/H3InZe5.gif" width="671" />
  </a>
  </p>
</div>

## Features

As none of the existing trailing symbols toggling extension were fitting my needs, I decided to write my own with the following features:

- Toggle multiple trailing symbols: _commas_, _semicolons_ and _colons_.
- Alternate keyboard shortcuts to toggle trailing symbols and automatically add a new line after them.
- Option to control whether the cursor(s) should jump to the trailing symbol(s) (or added new line) when toggled.
- Support for code comments.
- Support for multiple cursors.
- Support for multiple selections.

## Usage

Set your cursor(s) on one or multiple line(s) and press one of the [keyboard shortcuts](#shortcuts) provided by the extension.

You can also use the Visual Studio Code [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) and choose one of the `Toggle trailing …` or `Toggle trailing … and add new line` commands.

## Shortcuts

This extension provides various [configurable](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-editor) keyboard shortcuts to toggle trailing symbols.

| Shortcut                 | Description                                 |
| ------------------------ | ------------------------------------------- |
| `Ctrl + ,`               | Toggle trailing comma.                      |
| `Ctrl + Alt + ,`         | Toggle trailing comma and add new line.     |
| `Ctrl + ;`               | Toggle trailing semicolon.                  |
| `Ctrl + Alt + ;`         | Toggle trailing semicolon and add new line. |
| `Ctrl + Shift + ;`       | Toggle trailing colon.                      |
| `Ctrl + Shift + Alt + ;` | Toggle trailing colon and add new line.     |

## Configuration

This extension contributes a language overridable setting to Visual Studio Code to control whether the cursor should automatically jump to the trailing symbol (or added new line) when toggled. This setting defaults to `true` and can be modified in the settings:

```json
{
  "trailing.jumpToSymbol": false
}
```

Additionally, you can [override this setting for specific languages](https://code.visualstudio.com/docs/getstarted/settings#_language-specific-editor-settings):

```json
{
  "[javascript]": {
    "trailing.jumpToSymbol": true
  }
}
```

## License

Licensed under the MIT License, Copyright © HiDeoo.

See [LICENSE](https://github.com/HiDeoo/trailing/blob/main/LICENSE) for more information.
