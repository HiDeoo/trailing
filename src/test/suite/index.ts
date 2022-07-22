import path from 'node:path'

import { glob } from 'glob'
import Mocha from 'mocha'

import { getMochaOptions, runTests } from '../mocha'

export function run(): Promise<void> {
  return new Promise((resolve, reject) => {
    const mocha = new Mocha(getMochaOptions())

    const testsRoot = path.resolve(__dirname, '..')

    glob('**/**.test.js', { cwd: testsRoot }, (error, files) => {
      if (error) {
        return reject(error)
      }

      for (const file of files) {
        mocha.addFile(path.resolve(testsRoot, file))
      }

      runTests(mocha, resolve, reject)
    })
  })
}
