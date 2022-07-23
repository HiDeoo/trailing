import path from 'node:path'

import { runTests } from '@vscode/test-web'
import { sync as glob } from 'glob'

async function run() {
  try {
    const fixtures = glob('../../fixtures/**/*', { cwd: __dirname })

    for (const fixture of fixtures) {
      await runTestsWithFixture(fixture)
    }
  } catch (error) {
    console.error('Failed to run tests:', error)
    process.exit(1)
  }
}

async function runTestsWithFixture(fixturePath: string) {
  const fixtureName = path.basename(fixturePath)

  console.log(`Running tests with fixture '${fixtureName}'.`)

  try {
    await runTests({
      browserType: 'chromium',
      extensionDevelopmentPath: path.resolve(__dirname, '../../'),
      extensionTestsPath: path.resolve(__dirname, '../../dist/tests'),
      folderPath: path.resolve(__dirname, fixturePath),
      headless: true,
    })
  } catch (error) {
    console.error(`Failed to run tests with fixture '${fixtureName}': ${error}.`)
    throw error
  }
}

run()
