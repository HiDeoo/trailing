import { sync as glob } from 'glob'

export function getFixtures() {
  try {
    return glob('../../fixtures/**/*', { cwd: __dirname })
  } catch (error) {
    console.error('Failed to find test fixtures:', error)
    process.exit(1)
  }
}
