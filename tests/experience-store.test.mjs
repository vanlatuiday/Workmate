import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import ts from 'typescript'

const source = readFileSync(new URL('../src/context/experienceStore.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })

test('a legacy preference requires a choice, which persists after reopening the site', () => {
  const key = 'workmate-experience'
  const data = new Map([[key, JSON.stringify({ state: { quality: 'high' }, version: 0 })]])
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (name) => data.get(name) ?? null, setItem: (name, value) => data.set(name, value) },
  })
  const load = () => {
    const exports = {}
    new Function('require', 'exports', 'navigator', outputText)(
      (name) => name === 'zustand' ? { create } : { persist }, exports, { hardwareConcurrency: 8 },
    )
    return exports.useExperienceStore
  }
  try {
    const store = load()
    assert.equal(store.getState().hasChosenQuality, false)
    store.getState().setQuality('low')
    assert.equal(load().getState().hasChosenQuality, true)
    assert.equal(load().getState().quality, 'low')
    store.getState().setQuality('high')
    assert.equal(load().getState().quality, 'high')
  } finally {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
    else delete globalThis.localStorage
  }
})
