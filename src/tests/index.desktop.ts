import path from 'node:path'

import { runTests } from '@vscode/test-electron'

import { getFixtures } from './fixtures'

async function run() {
  try {
    const fixtures = getFixtures()

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
      extensionDevelopmentPath: path.resolve(__dirname, '../../'),
      extensionTestsPath: path.resolve(__dirname, './runner.desktop'),
      launchArgs: [path.resolve(__dirname, fixturePath), '--disable-extensions'],
    })
  } catch (error) {
    console.error(`Failed to run tests with fixture '${fixtureName}': ${error}.`)
    throw error
  }
}

run()
