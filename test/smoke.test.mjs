import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

/**
 * Evaluates client.js the way DSH Desktop does: through
 * window.__ModuleLoader__.load({ id, factory }), with a stubbed `react`
 * dependency. Returns the value the factory exports.
 */
function loadClientBundle() {
  let definition
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load: (value) => {
          definition = value
        }
      }
    },
    console
  }
  vm.runInNewContext(source, sandbox, { filename: 'client.js' })
  assert.ok(definition, 'client.js must call window.__ModuleLoader__.load')
  assert.equal(definition.id, 'dsh-open-workspace-folder')
  assert.equal(typeof definition.factory, 'function')

  const react = {
    createElement: () => ({}),
    useState: (value) => [value, () => {}],
    useEffect: () => {},
    useLayoutEffect: () => {},
    useRef: () => ({ current: null }),
    useSyncExternalStore: () => 'light'
  }
  const cache = new Map([['react', react]])
  return definition.factory((id) => {
    if (!cache.has(id)) throw new Error('unexpected dependency: ' + id)
    return cache.get(id)
  })
}

test('bundle registers and exposes the DSH plugin surface', () => {
  const exported = loadClientBundle()
  assert.deepEqual(Array.from(exported.inject), ['remote', 'remote.session'])
  assert.equal(typeof exported.apply, 'function')
})

test('bundle stays offline and self-contained', () => {
  assert.ok(!/\bfetch\s*\(/.test(source), 'client.js must not call fetch')
  assert.ok(!/XMLHttpRequest/.test(source), 'client.js must not use XMLHttpRequest')
  assert.ok(!/https?:\/\//.test(source), 'client.js must not reference remote URLs')
})
