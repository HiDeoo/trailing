import path from 'node:path'

import { runTests } from '@vscode/test-electron'

async function run() {
  try {
    // The folder containing the extension manifest `package.json` passed down to `--extensionDevelopmentPath`.
    const extensionDevelopmentPath = path.resolve(__dirname, '../../')

    // The path to the test runner passed down to `--extensionTestsPath`.
    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    // Download VS Code, unzip it and run the integration tests.
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions'],
    })
  } catch (error) {
    console.error('Failed to run tests:', error)
    process.exit(1)
  }
}

run()
