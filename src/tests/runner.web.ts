import 'mocha/mocha'

import { getMochaOptions, runTests } from './mocha'

export function run(): Promise<void> {
  return new Promise((resolve, reject) => {
    mocha.setup(getMochaOptions())

    importAll(require.context('.', true, /\.test$/))

    runTests(mocha, resolve, reject)
  })
}

function importAll(requireContext: __WebpackModuleApi.RequireContext) {
  for (const id of requireContext.keys()) {
    requireContext(id)
  }
}
